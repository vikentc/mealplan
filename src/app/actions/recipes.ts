'use server';

import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { getTranslatedRecipe } from '@/lib/recipeTranslations';
import { 
  Ingredient,
  capitalizeWord, 
  decodeHtmlEntities, 
  parseIngredientLineHeuristic, 
  scrapeHtmlFallback 
} from '@/lib/recipeParser';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db as firestoreDb, isFirebaseConfigured } from '@/lib/firebase';

async function checkAuth() {
  const cookieStore = await cookies();
  const sessionUser = cookieStore.get('user_session')?.value;
  if (!sessionUser) {
    throw new Error('Ej behörig. Vänligen logga in.');
  }
  return sessionUser;
}

// Caching layer variables & helper functions
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL in production

let allRecipesCache: any[] | null = null;
let allRecipesCacheTime = 0;

let recipeCache: Record<string, { data: any; timestamp: number }> = {};
let weeklyPlanCache: Record<number, { data: any[]; timestamp: number }> = {};

function invalidateRecipesCache() {
  allRecipesCache = null;
  allRecipesCacheTime = 0;
  recipeCache = {};
}

function invalidateWeeklyPlanCache(weekOffset?: number) {
  if (weekOffset !== undefined) {
    delete weeklyPlanCache[weekOffset];
  } else {
    weeklyPlanCache = {};
  }
}

async function getAllRecipesInternal(): Promise<any[]> {
  const now = Date.now();
  if (allRecipesCache && (now - allRecipesCacheTime < CACHE_TTL_MS)) {
    return allRecipesCache;
  }

  const recipes = await runWithFallback(
    async () => {
      const results = await db.recipe.findMany({
        orderBy: { name: 'asc' },
      });
      return JSON.parse(JSON.stringify(results));
    },
    () => getFallbackRecipes()
  );

  allRecipesCache = recipes;
  allRecipesCacheTime = now;
  return recipes;
}

// Local paths for fallback files
const RECIPES_FILE = path.join(process.cwd(), 'recipes.json');
const PLANS_FILE = path.join(process.cwd(), 'plans.json');
const SHOPPING_LIST_FILE = path.join(process.cwd(), 'shopping-list.json');

// Helper to get fallback shopping list
function getLocalJSONShoppingList(): any {
  try {
    if (fs.existsSync(SHOPPING_LIST_FILE)) {
      const data = fs.readFileSync(SHOPPING_LIST_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading local JSON shopping list:', error);
  }
  return { recipes: [], items: [] };
}

// Helper to save fallback shopping list
function saveLocalJSONShoppingList(list: any) {
  try {
    fs.writeFileSync(SHOPPING_LIST_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving local JSON shopping list:', error);
  }
}

// Helper to get fallback recipes
function getLocalJSONRecipes(): any[] {
  try {
    if (fs.existsSync(RECIPES_FILE)) {
      const data = fs.readFileSync(RECIPES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading local JSON recipes:', error);
  }
  return [];
}

// Helper to get fallback plans
function getLocalJSONPlans(): any[] {
  try {
    if (fs.existsSync(PLANS_FILE)) {
      const data = fs.readFileSync(PLANS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    // Return empty if file doesn't exist
  }
  return [];
}

// Helper to save fallback plans
function saveLocalJSONPlans(plans: any[]) {
  try {
    fs.writeFileSync(PLANS_FILE, JSON.stringify(plans, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving local JSON plans:', error);
  }
}

// Helper to save fallback recipes
function saveLocalJSONRecipes(recipes: any[]) {
  try {
    fs.writeFileSync(RECIPES_FILE, JSON.stringify(recipes, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving local JSON recipes:', error);
  }
}

// --- Firebase Firestore Helpers (Internal) ---
async function getFirebaseRecipes(): Promise<any[]> {
  if (!isFirebaseConfigured() || !firestoreDb) return [];
  try {
    const qSnapshot = await getDocs(collection(firestoreDb, 'recipes'));
    const list: any[] = [];
    qSnapshot.forEach((doc) => {
      const data = doc.data();
      const mealTypes = Array.isArray(data.mealTypes) && data.mealTypes.length > 0
        ? data.mealTypes
        : (typeof data.mealType === 'string' && data.mealType ? [data.mealType] : []);
      list.push({ id: doc.id, ...data, mealTypes });
    });
    
    // Seed Firestore if empty
    if (list.length === 0) {
      console.log('Firestore recipes collection is empty. Seeding from recipes.json...');
      const local = getLocalJSONRecipes();
      if (local.length > 0) {
        for (const recipe of local) {
          await setDoc(doc(firestoreDb, 'recipes', recipe.id), {
            name: recipe.name || '',
            url: recipe.url || null,
            description: recipe.description || null,
            image: recipe.image || null,
            images: recipe.images || [],
            preparationTime: Number(recipe.preparationTime) || 15,
            cookingTime: Number(recipe.cookingTime) || 20,
            totalTime: Number(recipe.totalTime) || 35,
            servings: Number(recipe.servings) || 4,
            difficulty: recipe.difficulty || 'Medium',
            cuisine: recipe.cuisine || 'International',
            mealTypes: recipe.mealTypes || (recipe.mealType ? [recipe.mealType] : []),
            occasions: recipe.occasions || [],
            flavorProfile: recipe.flavorProfile || [],
            moodTags: recipe.moodTags || [],
            ingredients: recipe.ingredients || [],
            instructions: recipe.instructions || [],
            nutrition: recipe.nutrition || {},
            createdAt: recipe.createdAt || new Date().toISOString(),
            updatedAt: recipe.updatedAt || new Date().toISOString()
          });
        }
        return local;
      }
    }
    return list;
  } catch (err) {
    console.error('Error fetching recipes from Firestore:', err);
    return [];
  }
}

async function saveFirebaseRecipes(recipes: any[]) {
  if (!isFirebaseConfigured() || !firestoreDb) return;
  try {
    for (const r of recipes) {
      await setDoc(doc(firestoreDb, 'recipes', r.id), {
        name: r.name || '',
        url: r.url || null,
        description: r.description || null,
        image: r.image || null,
        images: r.images || [],
        preparationTime: Number(r.preparationTime) || 15,
        cookingTime: Number(r.cookingTime) || 20,
        totalTime: Number(r.totalTime) || 35,
        servings: Number(r.servings) || 4,
        difficulty: r.difficulty || 'Medium',
        cuisine: r.cuisine || 'International',
        mealTypes: r.mealTypes || (r.mealType ? [r.mealType] : []),
        occasions: r.occasions || [],
        flavorProfile: r.flavorProfile || [],
        moodTags: r.moodTags || [],
        ingredients: r.ingredients || [],
        instructions: r.instructions || [],
        nutrition: r.nutrition || {},
        createdAt: r.createdAt || new Date().toISOString(),
        updatedAt: r.updatedAt || new Date().toISOString()
      }, { merge: true });
    }
  } catch (err) {
    console.error('Error writing recipes to Firestore:', err);
  }
}

async function getFirebasePlans(): Promise<any[]> {
  if (!isFirebaseConfigured() || !firestoreDb) return [];
  try {
    const qSnapshot = await getDocs(collection(firestoreDb, 'plans'));
    const list: any[] = [];
    qSnapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    return list;
  } catch (err) {
    console.error('Error fetching plans from Firestore:', err);
    return [];
  }
}

async function saveFirebasePlan(plan: any) {
  if (!isFirebaseConfigured() || !firestoreDb) return;
  try {
    const docId = `${plan.weekOffset}_${plan.dayOfWeek}_${plan.mealSlot}`;
    await setDoc(doc(firestoreDb, 'plans', docId), {
      weekOffset: plan.weekOffset,
      dayOfWeek: plan.dayOfWeek,
      mealSlot: plan.mealSlot,
      recipeId: plan.recipeId,
      createdAt: plan.createdAt || new Date().toISOString()
    });
  } catch (err) {
    console.error('Error saving individual plan to Firestore:', err);
  }
}

async function deleteFirebasePlanForWeek(weekOffset: number) {
  if (!isFirebaseConfigured() || !firestoreDb) return;
  try {
    const plansRef = collection(firestoreDb, 'plans');
    const q = query(plansRef, where('weekOffset', '==', weekOffset));
    const qSnapshot = await getDocs(q);
    for (const d of qSnapshot.docs) {
      await deleteDoc(doc(firestoreDb, 'plans', d.id));
    }
  } catch (err) {
    console.error('Error deleting plans for week offset in Firestore:', err);
  }
}

async function getFirebaseShoppingList(): Promise<any> {
  if (!isFirebaseConfigured() || !firestoreDb) return null;
  try {
    const dSnapshot = await getDoc(doc(firestoreDb, 'shopping_lists', 'current'));
    if (dSnapshot.exists()) {
      return dSnapshot.data();
    }
  } catch (err) {
    console.error('Error fetching shopping list from Firestore:', err);
  }
  return null;
}

async function saveFirebaseShoppingList(list: any) {
  if (!isFirebaseConfigured() || !firestoreDb) return;
  try {
    await setDoc(doc(firestoreDb, 'shopping_lists', 'current'), {
      recipes: list.recipes || [],
      items: list.items || [],
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error saving shopping list to Firestore:', err);
  }
}

// --- Public Combined Fallback Wrappers (Async) ---
async function getFallbackShoppingList(): Promise<any> {
  if (isFirebaseConfigured()) {
    const fbList = await getFirebaseShoppingList();
    if (fbList) return fbList;
  }
  return getLocalJSONShoppingList();
}

async function saveFallbackShoppingList(list: any) {
  if (isFirebaseConfigured()) {
    await saveFirebaseShoppingList(list);
  }
  saveLocalJSONShoppingList(list);
}

async function getFallbackRecipes(): Promise<any[]> {
  if (isFirebaseConfigured()) {
    const fbRecipes = await getFirebaseRecipes();
    if (fbRecipes && fbRecipes.length > 0) return fbRecipes;
  }
  return getLocalJSONRecipes();
}

async function getFallbackPlans(): Promise<any[]> {
  if (isFirebaseConfigured()) {
    return await getFirebasePlans();
  }
  return getLocalJSONPlans();
}

async function saveFallbackPlans(plans: any[]) {
  if (isFirebaseConfigured()) {
    if (plans.length > 0) {
      const weekOffset = plans[0].weekOffset;
      await deleteFirebasePlanForWeek(weekOffset);
      for (const p of plans) {
        await saveFirebasePlan(p);
      }
    }
  }
  saveLocalJSONPlans(plans);
}

async function saveFallbackRecipes(recipes: any[]) {
  if (isFirebaseConfigured()) {
    await saveFirebaseRecipes(recipes);
  }
  saveLocalJSONRecipes(recipes);
}

let isDbOffline = false;
let lastDbCheckTime = 0;
const DB_RETRY_INTERVAL_MS = 30000; // Retry DB connection after 30 seconds

// Try-catch wrappers for db queries with fallback to local JSON/Firestore if database is offline
async function runWithFallback<T>(
  dbQuery: () => Promise<T>, 
  fallbackQuery: () => T | Promise<T>,
  isWrite: boolean = false
): Promise<T> {
  const now = Date.now();
  if (isDbOffline && (now - lastDbCheckTime < DB_RETRY_INTERVAL_MS)) {
    return await fallbackQuery();
  }

  try {
    // Attempt database call
    const result = await dbQuery();
    if (isDbOffline) {
      console.log('Database connection restored.');
      isDbOffline = false;
    }
    return result;
  } catch (error: any) {
    const isConnectionError = 
      error.code === 'P1001' || 
      error.name === 'PrismaClientInitializationError' || 
      (error.message && (
        error.message.includes('Can\'t reach database') ||
        error.message.includes('localhost:5432') ||
        error.message.includes('PrismaClientInitializationError')
      ));

    if (isConnectionError) {
      if (!isDbOffline) {
        console.warn('Database is offline, switching to fallback mode (JSON/Firestore).');
        isDbOffline = true;
      }
      lastDbCheckTime = Date.now();
    }

    if (isWrite && process.env.NODE_ENV === 'production') {
      console.error('Database mutation failed in production, attempting fallback:', error.message || error);
      try {
        return await fallbackQuery();
      } catch (fallbackError: any) {
        console.error('Fallback write operation also failed in production:', fallbackError.message || fallbackError);
        return {
          error: 'DATABASE_MUTATION_FAILED',
          message: error.message || String(error)
        } as any;
      }
    }
    // Fall back to local file state if DB fails
    console.warn('Database access failed, falling back to local file state:', error.message || error);
    return await fallbackQuery();
  }
}


// Helper to extract clean word tokens from text
function tokenizeText(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'']/g, "")
    .split(/\s+/)
    .filter(w => w.length >= 3);
}

// Sørensen-Dice coefficient similarity
function getStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return 0.0;

  const getBigrams = (s: string) => {
    const bigrams = [];
    for (let i = 0; i < s.length - 1; i++) {
      bigrams.push(s.slice(i, i + 2));
    }
    return bigrams;
  };

  const bigrams1 = getBigrams(s1);
  const bigrams2 = getBigrams(s2);
  const set2 = new Set(bigrams2);
  
  let intersection = 0;
  for (const b of bigrams1) {
    if (set2.has(b)) {
      intersection++;
    }
  }

  return (2.0 * intersection) / (bigrams1.length + bigrams2.length);
}

function filterRecipesList(recipes: any[], query: string, filters: any) {
  let results = recipes;

  if (query) {
    const q = query.toLowerCase();
    results = results.filter((r) => {
      const transR = getTranslatedRecipe(r, 'en');
      const name = (r.name || '').toLowerCase();
      const transName = (transR?.name || '').toLowerCase();
      const description = (r.description || '').toLowerCase();
      const transDesc = (transR?.description || '').toLowerCase();
      const cuisine = (r.cuisine || '').toLowerCase();

      // Check name or cuisine matches
      if (name.includes(q) || transName.includes(q) || cuisine.includes(q)) return true;

      // Check description matches
      if (description.includes(q) || transDesc.includes(q)) {
        if (q === 'pasta') {
          // If query is "pasta", verify it's not just "bönpasta", "chilipasta", "currypasta"
          const cleanDesc = description.replace(/(chili|bön|curry|miso|wasa|tomat|vitlök)pasta/g, '');
          const cleanTransDesc = transDesc.replace(/(chili|bean|curry|miso|wasa|tomato|garlic)pasta/g, '');
          if (!cleanDesc.includes('pasta') && !cleanTransDesc.includes('pasta')) return false;
        }
        return true;
      }

      // Check ingredients matches
      if (Array.isArray(r.ingredients)) {
        return r.ingredients.some((i: any, idx: number) => {
          const ingName = (i.name || '').toLowerCase();
          const transIngName = (transR?.ingredients?.[idx]?.name || '').toLowerCase();
          if (ingName.includes(q) || transIngName.includes(q)) {
            if (q === 'pasta') {
              // Exclude condiment pastes (chilipasta, currypasta, bönpasta, etc.)
              if (/(chili|bön|curry|miso|wasa|tomat|vitlök)pasta/.test(ingName)) return false;
              // Exclude generic side dishes unless the recipe itself is a pasta dish
              const isPastaDish = name.includes('pasta') || name.includes('carbonara') || name.includes('spaghetti') || name.includes('lasagne') || name.includes('ravioli') || name.includes('makaroner') || transName.includes('pasta');
              if (ingName === 'pasta, ris eller potatis' && !isPastaDish) return false;
            }
            if (q === 'ris') {
              // Exclude generic side dishes unless the recipe itself is a rice dish
              const isRiceDish = name.includes('ris') || name.includes('risotto') || name.includes('paella') || transName.includes('rice') || transName.includes('risotto');
              if (ingName === 'pasta, ris eller potatis' && !isRiceDish) return false;
            }
            return true;
          }
          return false;
        });
      }

      return false;
    });
  }

  if (filters) {
    if (filters.cuisine) {
      results = results.filter((r) => (r.cuisine || '').toLowerCase() === filters.cuisine.toLowerCase());
    }
    if (filters.occasion) {
      results = results.filter((r) => Array.isArray(r.occasions) && r.occasions.map((o: string) => o.toLowerCase()).includes(filters.occasion.toLowerCase()));
    }
    if (filters.mealType) {
      const mt = filters.mealType.toLowerCase();
      results = results.filter((r) => {
        const mealTypes = Array.isArray(r.mealTypes)
          ? r.mealTypes
          : (typeof r.mealType === 'string' && r.mealType ? [r.mealType] : []);
        return mealTypes.map((m: string) => m.toLowerCase()).includes(mt);
      });
    }
    if (filters.craving) {
      const c = filters.craving.toLowerCase();
      switch (c) {
        case 'high-protein':
          results = results.filter((r) => 
            (r.nutrition?.protein || 0) >= 30 || 
            (r.moodTags || []).map((t: string) => t.toLowerCase()).includes('high protein')
          );
          break;
        case 'comfort-food':
          results = results.filter((r) => 
            (r.moodTags || []).map((t: string) => t.toLowerCase()).includes('comfort food') ||
            (r.occasions || []).map((t: string) => t.toLowerCase()).includes('helgmys')
          );
          break;
        case 'spicy':
          results = results.filter((r) => 
            (r.flavorProfile || []).map((t: string) => t.toLowerCase()).includes('spicy')
          );
          break;
        case 'sweet':
          results = results.filter((r) => 
            (r.flavorProfile || []).map((t: string) => t.toLowerCase()).includes('sweet')
          );
          break;
        case 'cheesy':
          results = results.filter((r) => 
            (r.flavorProfile || []).map((t: string) => t.toLowerCase()).includes('cheesy') ||
            (r.ingredients || []).some((ing: any) => 
              (ing.name || '').toLowerCase().includes('ost') || 
              (ing.name || '').toLowerCase().includes('parmesan') ||
              (ing.name || '').toLowerCase().includes('feta') ||
              (ing.name || '').toLowerCase().includes('mozzarella')
            )
          );
          break;
        case 'fresh-light':
          results = results.filter((r) => 
            (r.flavorProfile || []).map((t: string) => t.toLowerCase()).includes('fresh') ||
            (r.moodTags || []).map((t: string) => t.toLowerCase()).includes('healthy') ||
            (r.nutrition?.calories || 0) <= 500
          );
          break;
        case 'warm-hearty':
          results = results.filter((r) => 
            (r.moodTags || []).map((t: string) => t.toLowerCase()).includes('cozy') ||
            (r.name || '').toLowerCase().includes('gryta') ||
            (r.name || '').toLowerCase().includes('soppa') ||
            (r.name || '').toLowerCase().includes('stuvning')
          );
          break;
        case 'quick-easy':
          results = results.filter((r) => {
            const ingCount = Array.isArray(r.ingredients) ? r.ingredients.length : 0;
            return (r.totalTime <= 30 && ingCount <= 10) || r.totalTime <= 15;
          });
          break;
        case 'rich-creamy':
          results = results.filter((r) => 
            (r.flavorProfile || []).map((t: string) => t.toLowerCase()).includes('rich') ||
            (r.flavorProfile || []).map((t: string) => t.toLowerCase()).includes('creamy') ||
            (r.ingredients || []).some((ing: any) => 
              (ing.name || '').toLowerCase().includes('grädde') || 
              (ing.name || '').toLowerCase().includes('smör') || 
              (ing.name || '').toLowerCase().includes('kokosmjölk')
            )
          );
          break;
        default:
          break;
      }
    }
    if (filters.flavor) {
      results = results.filter((r) => Array.isArray(r.flavorProfile) && r.flavorProfile.map((f: string) => f.toLowerCase()).includes(filters.flavor.toLowerCase()));
    }
    if (filters.mood) {
      results = results.filter((r) => Array.isArray(r.moodTags) && r.moodTags.map((m: string) => m.toLowerCase()).includes(filters.mood.toLowerCase()));
    }
    if (filters.nutritionGoal) {
      results = results.filter((r: any) => {
        const nut = r.nutrition as any;
        if (!nut) return false;
        if (filters.nutritionGoal === 'high-protein') return nut.protein >= 30;
        if (filters.nutritionGoal === 'low-carb') return nut.carbohydrates <= 30;
        if (filters.nutritionGoal === 'low-calorie') return nut.calories <= 400;
        if (filters.nutritionGoal === 'high-fiber') return nut.fiber >= 5;
        return true;
      });
    }
  }

  return results;
}

export async function getRecipes(filters?: {
  query?: string;
  cuisine?: string;
  flavor?: string;
  mood?: string;
  occasion?: string;
  nutritionGoal?: string;
  mealType?: string;
  craving?: string;
}) {
  // Fetch all recipes from DB / Fallback
  // Fetch all recipes from cache / DB / Fallback
  const allRecipes = await getAllRecipesInternal();

  let originalQuery = filters?.query || '';
  let correctedQuery = originalQuery;
  let suggestions: string[] = [];
  let isCorrected = false;

  // 1. Build dictionary of vocabulary words from recipe names, descriptions, cuisines, and ingredients
  const vocabSet = new Set<string>();
  allRecipes.forEach((r: any) => {
    const transR = getTranslatedRecipe(r, 'en');
    tokenizeText(r.name || '').forEach(w => vocabSet.add(w));
    tokenizeText(transR?.name || '').forEach(w => vocabSet.add(w));
    tokenizeText(r.description || '').forEach(w => vocabSet.add(w));
    tokenizeText(transR?.description || '').forEach(w => vocabSet.add(w));
    tokenizeText(r.cuisine || '').forEach(w => vocabSet.add(w));
    if (Array.isArray(r.ingredients)) {
      r.ingredients.forEach((ing: any, idx: number) => {
        tokenizeText(ing.name || '').forEach(w => vocabSet.add(w));
        const transIng = transR?.ingredients?.[idx];
        if (transIng) {
          tokenizeText(transIng.name || '').forEach(w => vocabSet.add(w));
        }
      });
    }
  });
  const vocabulary = Array.from(vocabSet);

  // 2. Perform spelling correction if we have a query
  if (originalQuery) {
    const queryWords = originalQuery.split(/\s+/);
    const correctedWords = queryWords.map((word) => {
      const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'']/g, "").toLowerCase();
      if (cleanWord.length < 3) return word;

      // If word is already in vocabulary, keep it
      if (vocabulary.includes(cleanWord)) return word;

      // Find closest spelling match in our recipe vocabulary
      let bestMatch = '';
      let bestScore = 0;
      for (const vocabWord of vocabulary) {
        const score = getStringSimilarity(cleanWord, vocabWord);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = vocabWord;
        }
      }

      // If score is high enough, replace the word with the predicted vocabulary word
      if (bestScore >= 0.55 && bestMatch !== cleanWord) {
        suggestions.push(bestMatch);
        return word.replace(new RegExp(cleanWord, 'i'), bestMatch);
      }
      return word;
    });

    correctedQuery = correctedWords.join(' ');
  }

  // 3. Search database matches
  let matches = filterRecipesList(allRecipes, originalQuery, filters);

  // 4. If original query yields 0 results, check if we can fallback to the corrected query
  if (originalQuery && matches.length === 0 && correctedQuery !== originalQuery) {
    const fallbackMatches = filterRecipesList(allRecipes, correctedQuery, filters);
    if (fallbackMatches.length > 0) {
      matches = fallbackMatches;
      isCorrected = true;
    }
  }

  return {
    recipes: matches,
    originalQuery,
    correctedQuery,
    suggestions: Array.from(new Set(suggestions)),
    isCorrected
  };
}

export async function getRecipeById(id: string) {
  const now = Date.now();
  const cached = recipeCache[id];
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  const recipe = await runWithFallback(
    async () => {
      const result = await db.recipe.findUnique({
        where: { id }
      });
      return result ? JSON.parse(JSON.stringify(result)) : null;
    },
    async () => {
      const recipes = await getFallbackRecipes();
      return recipes.find((r) => r.id === id) || null;
    }
  );

  recipeCache[id] = { data: recipe, timestamp: now };
  return recipe;
}

export async function createRecipe(data: any) {
  await checkAuth();
  invalidateRecipesCache();
  return runWithFallback(
    async () => {
      const recipe = await db.recipe.create({
        data: {
          name: data.name,
          url: data.url,
          description: data.description,
          image: data.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
          images: data.images || [],
          preparationTime: Number(data.preparationTime) || 15,
          cookingTime: Number(data.cookingTime) || 20,
          totalTime: (Number(data.preparationTime) || 15) + (Number(data.cookingTime) || 20),
          servings: Number(data.servings) || 4,
          difficulty: data.difficulty || 'Medium',
          cuisine: data.cuisine || 'International',
          mealTypes: Array.isArray(data.mealTypes) ? data.mealTypes : (data.mealType ? [data.mealType] : ['dinner']),
          occasions: data.occasions || [],
          flavorProfile: data.flavorProfile || [],
          moodTags: data.moodTags || [],
          ingredients: data.ingredients || [],
          instructions: data.instructions || [],
          nutrition: data.nutrition || {}
        }
      });
      return JSON.parse(JSON.stringify(recipe));
    },
    async () => {
      const recipes = await getFallbackRecipes();
      const newRecipe = {
        id: `recipe_${Date.now()}`,
        name: data.name,
        url: data.url,
        description: data.description,
        image: data.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        images: data.images || [],
        preparationTime: Number(data.preparationTime) || 15,
        cookingTime: Number(data.cookingTime) || 20,
        totalTime: (Number(data.preparationTime) || 15) + (Number(data.cookingTime) || 20),
        servings: Number(data.servings) || 4,
        difficulty: data.difficulty || 'Medium',
        cuisine: data.cuisine || 'International',
        mealTypes: Array.isArray(data.mealTypes) ? data.mealTypes : (data.mealType ? [data.mealType] : ['dinner']),
        occasions: data.occasions || [],
        flavorProfile: data.flavorProfile || [],
        moodTags: data.moodTags || [],
        ingredients: data.ingredients || [],
        instructions: data.instructions || [],
        nutrition: data.nutrition || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      recipes.push(newRecipe);
      await saveFallbackRecipes(recipes);
      return newRecipe;
    },
    true
  );
}

export async function updateRecipe(id: string, data: any) {
  await checkAuth();
  invalidateRecipesCache();
  return runWithFallback(
    async () => {
      const recipe = await db.recipe.update({
        where: { id },
        data: {
          name: data.name,
          url: data.url,
          description: data.description,
          image: data.image,
          images: data.images || [],
          preparationTime: Number(data.preparationTime) || 15,
          cookingTime: Number(data.cookingTime) || 20,
          totalTime: (Number(data.preparationTime) || 15) + (Number(data.cookingTime) || 20),
          servings: Number(data.servings) || 4,
          difficulty: data.difficulty || 'Medium',
          cuisine: data.cuisine || 'International',
          mealTypes: Array.isArray(data.mealTypes) ? data.mealTypes : (data.mealType ? [data.mealType] : ['dinner']),
          occasions: data.occasions || [],
          flavorProfile: data.flavorProfile || [],
          moodTags: data.moodTags || [],
          ingredients: data.ingredients || [],
          instructions: data.instructions || [],
          nutrition: data.nutrition || {}
        }
      });
      return JSON.parse(JSON.stringify(recipe));
    },
    async () => {
      const recipes = await getFallbackRecipes();
      const index = recipes.findIndex((r) => r.id === id);
      if (index === -1) throw new Error('Recipe not found');
      
      const updatedRecipe = {
        ...recipes[index],
        name: data.name,
        url: data.url,
        description: data.description,
        image: data.image || recipes[index].image,
        images: data.images || recipes[index].images || [],
        preparationTime: Number(data.preparationTime) || 15,
        cookingTime: Number(data.cookingTime) || 20,
        totalTime: (Number(data.preparationTime) || 15) + (Number(data.cookingTime) || 20),
        servings: Number(data.servings) || 4,
        difficulty: data.difficulty || 'Medium',
        cuisine: data.cuisine || 'International',
        mealTypes: Array.isArray(data.mealTypes) ? data.mealTypes : (data.mealType ? [data.mealType] : ['dinner']),
        occasions: data.occasions || [],
        flavorProfile: data.flavorProfile || [],
        moodTags: data.moodTags || [],
        ingredients: data.ingredients || [],
        instructions: data.instructions || [],
        nutrition: data.nutrition || {},
        updatedAt: new Date().toISOString()
      };
      recipes[index] = updatedRecipe;
      await saveFallbackRecipes(recipes);
      return updatedRecipe;
    },
    true
  );
}

export async function deleteRecipe(id: string) {
  try {
    await checkAuth();
    invalidateRecipesCache();
    
    let deletedFromDb = false;
    let deletedFromFb = false;
    let deletedFromLocal = false;

    // 1. Delete from PostgreSQL database
    try {
      await db.recipe.delete({
        where: { id }
      });
      deletedFromDb = true;
    } catch (error: any) {
      const isConnectionError = 
        error.code === 'P1001' || 
        error.name === 'PrismaClientInitializationError' || 
        (error.message && (
          error.message.includes("Can't reach database") ||
          error.message.includes('localhost:5432') ||
          error.message.includes('PrismaClientInitializationError')
        ));

      if (error.code === 'P2025') {
        console.warn(`Recipe with id ${id} not found in database, might be a fallback/local recipe.`);
      } else if (isConnectionError) {
        console.warn(`Database is offline, skipping DB deletion for recipe ${id}.`);
      } else {
        console.error(`Database deletion error for recipe ${id}:`, error);
        throw error;
      }
    }

    // 2. Delete from Firebase Firestore if configured
    if (isFirebaseConfigured() && firestoreDb) {
      try {
        await deleteDoc(doc(firestoreDb, 'recipes', id));
        deletedFromFb = true;
      } catch (fbError) {
        console.error(`Failed to delete recipe ${id} from Firestore:`, fbError);
      }
    }

    // 3. Delete from local recipes.json file
    try {
      const RECIPES_FILE = path.join(process.cwd(), 'recipes.json');
      if (fs.existsSync(RECIPES_FILE)) {
        const data = fs.readFileSync(RECIPES_FILE, 'utf8');
        let recipes = JSON.parse(data);
        if (Array.isArray(recipes)) {
          const initialLen = recipes.length;
          recipes = recipes.filter((r: any) => r.id !== id);
          if (recipes.length < initialLen) {
            fs.writeFileSync(RECIPES_FILE, JSON.stringify(recipes, null, 2), 'utf8');
            deletedFromLocal = true;
          }
        }
      }
    } catch (fsError) {
      console.error(`Failed to delete recipe ${id} from recipes.json:`, fsError);
    }

    console.log(`Recipe deletion results for id ${id} -> DB: ${deletedFromDb}, FB: ${deletedFromFb}, Local: ${deletedFromLocal}`);
    return { success: true };
  } catch (err: any) {
    console.error(`deleteRecipe action error for id ${id}:`, err);
    return { error: 'DELETE_FAILED', message: err.message || 'Kunde inte ta bort receptet.' };
  }
}


export async function getWeeklyPlan(weekOffset: number = 0) {
  const now = Date.now();
  const cached = weeklyPlanCache[weekOffset];
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  const data = await runWithFallback(
    async () => {
      const plans = await db.weeklyPlan.findMany({
        where: { weekOffset },
        include: { recipe: true }
      });
      return JSON.parse(JSON.stringify(plans));
    },
    async () => {
      const plans = await getFallbackPlans();
      const recipes = await getFallbackRecipes();
      
      // Filter plans by weekOffset and join with recipes
      return plans
        .filter((p) => p.weekOffset === weekOffset)
        .map((p) => ({
          ...p,
          recipe: recipes.find((r) => r.id === p.recipeId) || null
        }))
        .filter((p) => p.recipe !== null); // Filter out orphans
    }
  );

  weeklyPlanCache[weekOffset] = { data, timestamp: now };
  return data;
}

export async function saveWeeklyPlan(plans: Array<{
  weekOffset: number;
  dayOfWeek: string;
  mealSlot: string;
  recipeId: string;
}>) {
  await checkAuth();
  const weekOffset = plans.length > 0 ? plans[0].weekOffset : 0;
  invalidateWeeklyPlanCache(weekOffset);
  return runWithFallback(
    async () => {
      // Use a transaction to update plan records in database
      const weekOffset = plans.length > 0 ? plans[0].weekOffset : 0;
      
      await db.$transaction(async (tx) => {
        // Delete all plans for this week offset first
        await tx.weeklyPlan.deleteMany({
          where: { weekOffset }
        });
        
        // Insert new plans
        if (plans.length > 0) {
          await tx.weeklyPlan.createMany({
            data: plans.map((p) => ({
              weekOffset: p.weekOffset,
              dayOfWeek: p.dayOfWeek,
              mealSlot: p.mealSlot,
              recipeId: p.recipeId
            }))
          });
        }
      });
      
      return { success: true };
    },
    async () => {
      const weekOffset = plans.length > 0 ? plans[0].weekOffset : 0;
      let allPlans = await getFallbackPlans();
      
      // Remove previous plans for this weekOffset
      allPlans = allPlans.filter((p) => p.weekOffset !== weekOffset);
      
      // Add new ones
      plans.forEach((p) => {
        allPlans.push({
          id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          weekOffset: p.weekOffset,
          dayOfWeek: p.dayOfWeek,
          mealSlot: p.mealSlot,
          recipeId: p.recipeId,
          createdAt: new Date().toISOString()
        });
      });
      
      await saveFallbackPlans(allPlans);
      return { success: true };
    },
    true
  );
}

// Simple Recommendation logic
export async function getRecommendations(criteria: {
  category: "high-protein" | "healthy" | "quick" | "family-favorite" | "meal-prep" | "new-recipe";
  currentWeekRecipeIds?: string[];
}) {
  const { recipes } = await getRecipes();
  
  if (!recipes || recipes.length === 0) return [];
  
  // Filter out meals already planned for the current week to ensure variety
  const excludeIds = criteria.currentWeekRecipeIds || [];
  let available = recipes.filter((r: any) => !excludeIds.includes(r.id));
  
  // If we excluded everything, relax the constraint
  if (available.length === 0) {
    available = recipes;
  }
  
  let recommended: any[] = [];
  
  switch (criteria.category) {
    case 'high-protein':
      // Sorted by protein desc
      recommended = available
        .filter((r: any) => r.nutrition?.protein >= 30 || r.moodTags?.includes('high protein'))
        .sort((a: any, b: any) => (b.nutrition?.protein || 0) - (a.nutrition?.protein || 0));
      break;
      
    case 'healthy':
      // Low calories, low sugar, good fiber
      recommended = available
        .filter((r: any) => r.moodTags?.includes('healthy') || (r.nutrition?.calories <= 500 && r.nutrition?.sugar <= 10))
        .sort((a: any, b: any) => (b.nutrition?.fiber || 0) - (a.nutrition?.fiber || 0));
      break;
      
    case 'quick':
      // Total time <= 30 mins
      recommended = available
        .filter((r: any) => r.totalTime <= 30 || r.moodTags?.includes('quick and easy'))
        .sort((a: any, b: any) => a.totalTime - b.totalTime);
      break;
      
    case 'family-favorite':
      // Italian, Swedish, Mexican comfort foods
      recommended = available
        .filter((r: any) => ['Italian', 'Swedish', 'Mexican'].includes(r.cuisine) && r.moodTags?.includes('comfort food'));
      break;
      
    case 'meal-prep':
      // Suitable for weekday, long shelf life, e.g. lasagne, curry, paj, piroger
      recommended = available.filter((r: any) => 
        r.occasions?.includes('meal prep') || 
        r.name.toLowerCase().includes('paj') || 
        r.name.toLowerCase().includes('lasagne') || 
        r.name.toLowerCase().includes('curry') || 
        r.name.toLowerCase().includes('gryta')
      );
      break;
      
    case 'new-recipe':
    default:
      // Random pick
      recommended = [...available].sort(() => 0.5 - Math.random());
      break;
  }
  
  // Return top 5 recommendations
  return recommended.slice(0, 5);
}

export async function getRecommendationsByCraving(criteria: {
  mealType?: string;
  craving?: string;
  currentWeekRecipeIds?: string[];
}) {
  const { recipes } = await getRecipes();
  if (!recipes || recipes.length === 0) return [];

  const excludeIds = criteria.currentWeekRecipeIds || [];
  let available = recipes.filter((r: any) => !excludeIds.includes(r.id));
  if (available.length === 0) {
    available = recipes;
  }

  // 1. Filter by mealType if provided
  if (criteria.mealType) {
    const mt = criteria.mealType.toLowerCase();
    
    available = available.filter((r: any) => {
      const mealTypes = Array.isArray(r.mealTypes)
        ? r.mealTypes
        : (typeof r.mealType === 'string' && r.mealType ? [r.mealType] : []);
      const lowerMealTypes = mealTypes.map((m: string) => m.toLowerCase());
      
      if (mt === 'dessert') {
        return (
          lowerMealTypes.includes('dessert') ||
          r.name.toLowerCase().includes('dessert') ||
          r.name.toLowerCase().includes('efterrätt') ||
          r.name.toLowerCase().includes('kaka') ||
          r.name.toLowerCase().includes('tårta') ||
          r.name.toLowerCase().includes('paj') && r.flavorProfile?.includes('sweet')
        );
      }
      return lowerMealTypes.includes(mt);
    });
  }

  // 2. Filter by craving if provided
  if (criteria.craving) {
    const c = criteria.craving.toLowerCase();
    switch (c) {
      case 'high-protein':
        available = available.filter((r: any) => 
          r.nutrition?.protein >= 30 || 
          r.moodTags?.map((t: string) => t.toLowerCase()).includes('high protein')
        );
        break;
      case 'comfort-food':
        available = available.filter((r: any) => 
          r.moodTags?.map((t: string) => t.toLowerCase()).includes('comfort food') ||
          r.occasions?.map((t: string) => t.toLowerCase()).includes('helgmys')
        );
        break;
      case 'spicy':
        available = available.filter((r: any) => 
          r.flavorProfile?.map((t: string) => t.toLowerCase()).includes('spicy')
        );
        break;
      case 'sweet':
        available = available.filter((r: any) => 
          r.flavorProfile?.map((t: string) => t.toLowerCase()).includes('sweet')
        );
        break;
      case 'cheesy':
        available = available.filter((r: any) => 
          r.flavorProfile?.map((t: string) => t.toLowerCase()).includes('cheesy') ||
          r.ingredients?.some((ing: any) => 
            ing.name.toLowerCase().includes('ost') || 
            ing.name.toLowerCase().includes('ostg') || 
            ing.name.toLowerCase().includes('parmesan') ||
            ing.name.toLowerCase().includes('feta') ||
            ing.name.toLowerCase().includes('mozzarella')
          )
        );
        break;
      case 'fresh-light':
        available = available.filter((r: any) => 
          r.flavorProfile?.map((t: string) => t.toLowerCase()).includes('fresh') ||
          r.moodTags?.map((t: string) => t.toLowerCase()).includes('healthy') ||
          r.nutrition?.calories <= 500
        );
        break;
      case 'warm-hearty':
        available = available.filter((r: any) => 
          r.moodTags?.map((t: string) => t.toLowerCase()).includes('cozy') ||
          r.name.toLowerCase().includes('gryta') ||
          r.name.toLowerCase().includes('soppa') ||
          r.name.toLowerCase().includes('stuvning')
        );
        break;
      case 'quick-easy':
        available = available.filter((r: any) => {
          const ingCount = Array.isArray(r.ingredients) ? r.ingredients.length : 0;
          return (r.totalTime <= 30 && ingCount <= 10) || r.totalTime <= 15;
        });
        break;
      case 'rich-creamy':
        available = available.filter((r: any) => 
          r.flavorProfile?.map((t: string) => t.toLowerCase()).includes('rich') ||
          r.flavorProfile?.map((t: string) => t.toLowerCase()).includes('creamy') ||
          r.ingredients?.some((ing: any) => 
            ing.name.toLowerCase().includes('grädde') || 
            ing.name.toLowerCase().includes('smör') || 
            ing.name.toLowerCase().includes('kokosmjölk')
          )
        );
        break;
      default:
        break;
    }
  }

  // Shuffle or sort so we get varied recommendations
  return available.sort(() => 0.5 - Math.random()).slice(0, 6);
}

export async function autofillFromUrl(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      next: { revalidate: 0 }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    const html = await response.text();

    // Look for JSON-LD
    const jsonLdRegex = /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let recipeData: any = null;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const content = match[1].trim();
        const parsed = JSON.parse(content);
        
        // JSON-LD can be an object, array, or @graph
        const findRecipe = (obj: any): any => {
          if (!obj) return null;
          if (Array.isArray(obj)) {
            for (const item of obj) {
              const res = findRecipe(item);
              if (res) return res;
            }
          }
          if (obj['@type'] === 'Recipe' || obj['type'] === 'Recipe') {
            return obj;
          }
          if (obj['@graph']) {
            return findRecipe(obj['@graph']);
          }
          // Recursively look for embedded recipe object
          if (typeof obj === 'object') {
            for (const key of Object.keys(obj)) {
              if (typeof obj[key] === 'object') {
                const res = findRecipe(obj[key]);
                if (res) return res;
              }
            }
          }
          return null;
        };

        const recipeObj = findRecipe(parsed);
        if (recipeObj) {
          recipeData = recipeObj;
          break;
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }

    if (!recipeData) {
      return scrapeHtmlFallback(html, url);
    }

    return parseJsonLdRecipe(recipeData, url);
  } catch (error: any) {
    console.error('Error autofilling from URL:', error);
    throw new Error(error.message || 'Failed to parse recipe from URL');
  }
}

function parseJsonLdRecipe(data: any, originalUrl: string) {
  const name = decodeHtmlEntities(data.name || '');
  const description = decodeHtmlEntities(data.description || '');
  
  let servings = 4;
  if (data.recipeYield) {
    const yieldStr = String(Array.isArray(data.recipeYield) ? data.recipeYield[0] : data.recipeYield);
    const servingsMatch = yieldStr.match(/\d+/);
    if (servingsMatch) {
      servings = Number(servingsMatch[0]);
    }
  }

  const parseDuration = (isoStr: string) => {
    if (!isoStr) return 0;
    const match = isoStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return 0;
    const hours = Number(match[1] || 0);
    const minutes = Number(match[2] || 0);
    return hours * 60 + minutes;
  };

  const preparationTime = parseDuration(data.prepTime) || 15;
  const cookingTime = parseDuration(data.cookTime) || 20;

  const cuisine = Array.isArray(data.recipeCuisine) ? data.recipeCuisine[0] : (data.recipeCuisine || 'International');

  let image = null;
  if (data.image) {
    if (typeof data.image === 'string') image = data.image;
    else if (Array.isArray(data.image)) image = data.image[0];
    else if (data.image.url) image = data.image.url;
  }

  const rawIngredients = data.recipeIngredient || data.ingredients || [];
  const ingredients = rawIngredients.map((ingStr: string) => {
    return parseIngredientLineHeuristic(decodeHtmlEntities(ingStr));
  });

  const parseInstructionsList = (instructionsData: any): string[] => {
    if (!instructionsData) return [];
    if (typeof instructionsData === 'string') {
      return instructionsData.split('\n').map(s => s.trim()).filter(Boolean);
    }
    if (Array.isArray(instructionsData)) {
      let steps: string[] = [];
      for (const item of instructionsData) {
        if (typeof item === 'string') {
          steps.push(item);
        } else if (typeof item === 'object' && item !== null) {
          if (item['@type'] === 'HowToStep' || item['type'] === 'HowToStep' || item.text) {
            if (item.text) steps.push(item.text);
            else if (item.name) steps.push(item.name);
          } else if (item['@type'] === 'HowToSection' || item['type'] === 'HowToSection' || item.itemListElement) {
            if (item.itemListElement) {
              steps = steps.concat(parseInstructionsList(item.itemListElement));
            }
          } else if (item.text) {
            steps.push(item.text);
          } else if (item.name) {
            steps.push(item.name);
          }
        }
      }
      return steps;
    }
    if (typeof instructionsData === 'object' && instructionsData !== null) {
      if (instructionsData.text) return [instructionsData.text];
      if (instructionsData.itemListElement) return parseInstructionsList(instructionsData.itemListElement);
    }
    return [];
  };

  let instructions = parseInstructionsList(data.recipeInstructions).map(step => decodeHtmlEntities(step).trim());

  const rawNut = data.nutrition || {};
  const calories = parseInt(rawNut.calories) || 0;
  const protein = parseFloat(rawNut.proteinContent) || 0;
  const carbohydrates = parseFloat(rawNut.carbohydrateContent) || 0;
  const fat = parseFloat(rawNut.fatContent) || 0;
  const fiber = parseFloat(rawNut.fiberContent) || 0;
  const sugar = parseFloat(rawNut.sugarContent) || 0;
  const sodium = parseInt(rawNut.sodiumContent) || 0;

  return {
    name: name.trim() || 'Scraped Recipe',
    description: description.trim() || null,
    image,
    url: originalUrl,
    preparationTime,
    cookingTime,
    servings,
    cuisine: capitalizeWord(cuisine),
    ingredients,
    instructions,
    nutrition: {
      calories,
      protein,
      carbohydrates,
      fat,
      fiber,
      sugar,
      sodium,
      iron: 0, calcium: 0, potassium: 0, magnesium: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB12: 0
    }
  };
}

export async function parseRecipeImageAction(formData: FormData) {
  try {
    let files = formData.getAll('images') as File[];
    if (files.length === 0) {
      const singleFile = formData.get('image') as File | null;
      if (singleFile) {
        files = [singleFile];
      }
    }

    if (files.length === 0) {
      return { error: 'NO_FILE', message: 'Ingen bild skickades.' };
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return { 
        error: 'API_KEY_MISSING',
        message: 'GEMINI_API_KEY saknas i .env-filen. Lägg till din API-nyckel för exakt AI-avläsning.' 
      };
    }

    const imageParts: any[] = [];
    for (const file of files) {
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString('base64');
        const mimeType = file.type || 'image/jpeg';
        imageParts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Image,
          },
        });
      }
    }

    if (imageParts.length === 0) {
      return { error: 'NO_FILE', message: 'Ingen bild skickades.' };
    }

    const prompt = `Du är en expert på matlagning och recepttolkning. Läs den här bilden eller bilderna och extrahera receptet.
Extrahera namnet på receptet, ingredienserna (med namn, mängd, enhet, samt om de är valfria) och tillagningsstegen.
Receptets text ska extraheras på originalspråket (svenska om texten är på svenska).
Säkerställ att mängder är siffror där det är möjligt (t.ex. 0.5 eller 1.5 istället för bråk som 1/2), och enheter är korrekta förkortningar (t.ex. "dl", "g", "st", "msk", "tsk").
Om en ingrediens inte har någon mängd, sätt quantity till null.
Om en ingrediens är valfri (t.ex. "valfritt" eller "till servering" under ingredienslistan), sätt optional till true.

Returnera resultatet som en JSON-struktur med exakt detta format:
{
  "name": "Receptets namn",
  "ingredients": [
    { "name": "ingrediensens namn", "quantity": 3, "unit": "dl", "optional": false }
  ],
  "instructions": [
    "Steg 1...",
    "Steg 2..."
  ]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                ...imageParts,
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return { error: 'GEMINI_API_ERROR', message: `Fel vid anrop till Gemini API: ${response.statusText}` };
    }

    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
      return { error: 'NO_TEXT_RETURNED', message: 'Inget svar returnerades från AI-modellen.' };
    }

    const parsedRecipe = JSON.parse(textResult.trim());
    return { success: true, recipe: parsedRecipe };
  } catch (error: any) {
    console.error('parseRecipeImageAction error:', error);
    return { error: 'INTERNAL_ERROR', message: error.message || 'Ett oväntat fel inträffade vid AI-avläsning.' };
  }
}

export async function estimateNutritionAction(ingredients: Array<{ name: string; quantity: number | null; unit: string | null }>, servings: number) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return { 
        error: 'API_KEY_MISSING',
        message: 'GEMINI_API_KEY saknas i .env-filen. Lägg till din API-nyckel för AI-beräkning.' 
      };
    }

    if (!ingredients || ingredients.length === 0) {
      return { error: 'NO_INGREDIENTS', message: 'Inga ingredienser angivna.' };
    }

    const ingredientLines = ingredients
      .map(i => `${i.quantity !== null ? i.quantity : ''} ${i.unit || ''} ${i.name || ''}`.trim())
      .filter(Boolean)
      .join('\n');

    const prompt = `Du är en expert på näringslära och dietetik. Beräkna ett uppskattat näringsvärde per portion för följande ingredienslista för ett recept som ger ${servings || 4} portioner.
Ingredienser:
${ingredientLines}

Beräkna följande värden PER PORTION (per serving). Värdena ska vara realistiska, vetenskapligt rimliga uppskattningar baserade på ingredienserna.
Returnera svaret i följande JSON-format med enbart siffror (inga enheter som "g" eller "mg" i värdena):
{
  "calories": 0,
  "protein": 0,
  "carbohydrates": 0,
  "fat": 0,
  "fiber": 0,
  "sugar": 0,
  "sodium": 0,
  "iron": 0,
  "calcium": 0,
  "potassium": 0,
  "magnesium": 0,
  "vitaminA": 0,
  "vitaminC": 0,
  "vitaminD": 0,
  "vitaminB12": 0
}

Viktigt:
- Returnera ENBART JSON-objektet. Inga förklarande texter.
- Alla värden ska vara för en (1) portion.
- Använd 0 om näringsämnet inte finns i receptet.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error in estimateNutritionAction:', errorText);
      return { error: 'GEMINI_API_ERROR', message: `Fel vid anrop till Gemini API: ${response.statusText}` };
    }

    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
      return { error: 'NO_TEXT_RETURNED', message: 'Inget svar returnerades från AI-modellen.' };
    }

    const nutrition = JSON.parse(textResult.trim());
    return { success: true, nutrition };
  } catch (error: any) {
    console.error('estimateNutritionAction error:', error);
    return { error: 'INTERNAL_ERROR', message: error.message || 'Ett oväntat fel inträffade vid AI-beräkning.' };
  }
}

let isTableChecked = false;

async function ensureShoppingListTableExists() {
  if (isDbOffline || isTableChecked) return;
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ShoppingList" (
        "id" TEXT NOT NULL,
        "recipes" JSONB NOT NULL,
        "items" JSONB NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("id")
      );
    `);
    isTableChecked = true;
  } catch (error: any) {
    const isConnectionError = 
      error.code === 'P1001' || 
      error.name === 'PrismaClientInitializationError' || 
      (error.message && (
        error.message.includes('Can\'t reach database') ||
        error.message.includes('localhost:5432') ||
        error.message.includes('PrismaClientInitializationError')
      ));
    if (isConnectionError) {
      isDbOffline = true;
      lastDbCheckTime = Date.now();
    }
    console.error('Failed to auto-create ShoppingList table:', error.message || error);
  }
}

export async function getShoppingList() {
  const result = await runWithFallback(
    async () => {
      await ensureShoppingListTableExists();
      const row = await db.shoppingList.findUnique({
        where: { id: 'current' }
      });
      if (!row) {
        return { recipes: [], items: [] };
      }
      return {
        recipes: typeof row.recipes === 'string' ? JSON.parse(row.recipes) : (row.recipes || []),
        items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || [])
      };
    },
    async () => await getFallbackShoppingList()
  );
  return result;
}

export async function saveShoppingList(recipes: any[], items: any[]) {
  return await runWithFallback(
    async () => {
      await ensureShoppingListTableExists();
      await db.shoppingList.upsert({
        where: { id: 'current' },
        update: {
          recipes: recipes as any,
          items: items as any
        },
        create: {
          id: 'current',
          recipes: recipes as any,
          items: items as any
        }
      });
      return { success: true };
    },
    async () => {
      await saveFallbackShoppingList({ recipes, items });
      return { success: true };
    },
    true
  );
}

export async function addRecipeToShoppingList(recipeId: string, servings: number) {
  try {
    const allRecipes = await getAllRecipesInternal();
    const recipe = allRecipes.find((r: any) => r.id === recipeId);
    if (!recipe) {
      return { error: 'RECIPE_NOT_FOUND', message: 'Receptet hittades inte.' };
    }

    const list = await getShoppingList();
    const recipes = Array.isArray(list.recipes) ? list.recipes : [];
    const items = Array.isArray(list.items) ? list.items : [];

    const instanceId = Math.random().toString(36).substring(2, 9);
    recipes.push({
      id: recipe.id,
      name: recipe.name,
      servings: servings,
      instanceId: instanceId
    });

    const ratio = servings / recipe.servings;
    if (Array.isArray(recipe.ingredients)) {
      recipe.ingredients.forEach((ing: any) => {
        if (!ing.name || ing.name.trim() === '') return;
        
        const scaledQty = ing.quantity !== null ? ing.quantity * ratio : null;
        const ingName = ing.name.trim();
        const ingUnit = ing.unit ? ing.unit.trim() : null;

        const existingItem = items.find((item: any) => 
          item.name.toLowerCase() === ingName.toLowerCase() && 
          (item.unit || '').toLowerCase() === (ingUnit || '').toLowerCase() &&
          !item.isCustom
        );

        if (existingItem) {
          existingItem.recipeAmounts = existingItem.recipeAmounts || [];
          existingItem.recipeAmounts.push({
            recipeId: recipe.id,
            recipeName: recipe.name,
            instanceId: instanceId,
            quantity: scaledQty,
            unit: ingUnit
          });
          if (existingItem.quantity !== null && scaledQty !== null) {
            existingItem.quantity = Math.round((existingItem.quantity + scaledQty) * 100) / 100;
          } else {
            existingItem.quantity = null;
          }
        } else {
          items.push({
            name: ingName,
            quantity: scaledQty,
            unit: ingUnit,
            checked: false,
            isCustom: false,
            recipeAmounts: [{
              recipeId: recipe.id,
              recipeName: recipe.name,
              instanceId: instanceId,
              quantity: scaledQty,
              unit: ingUnit
            }]
          });
        }
      });
    }

    const saveResult = await saveShoppingList(recipes, items);
    if (saveResult && (saveResult as any).error) {
      return saveResult;
    }
    return { success: true, recipes, items };
  } catch (error: any) {
    console.error('addRecipeToShoppingList error:', error);
    return { error: 'SAVE_FAILED', message: error.message || 'Kunde inte lägga till i inköpslistan.' };
  }
}

export async function removeRecipeFromShoppingList(instanceId: string) {
  try {
    const list = await getShoppingList();
    const recipes = Array.isArray(list.recipes) ? list.recipes : [];
    const items = Array.isArray(list.items) ? list.items : [];

    const updatedRecipes = recipes.filter((r: any) => r.instanceId !== instanceId);

    const updatedItems = items
      .map((item: any) => {
        if (item.isCustom) return item;

        const remainingAmounts = (item.recipeAmounts || []).filter((ra: any) => ra.instanceId !== instanceId);
        if (remainingAmounts.length === 0) {
          return null;
        }

        let newQty: number | null = 0;
        let hasNull = false;
        remainingAmounts.forEach((ra: any) => {
          if (ra.quantity === null) hasNull = true;
          else if (newQty !== null) newQty += ra.quantity;
        });

        return {
          ...item,
          recipeAmounts: remainingAmounts,
          quantity: hasNull ? null : (newQty !== null ? Math.round(newQty * 100) / 100 : null)
        };
      })
      .filter(Boolean);

    const saveResult = await saveShoppingList(updatedRecipes, updatedItems);
    if (saveResult && (saveResult as any).error) {
      return saveResult;
    }
    return { success: true, recipes: updatedRecipes, items: updatedItems };
  } catch (error: any) {
    console.error('removeRecipeFromShoppingList error:', error);
    return { error: 'DELETE_FAILED', message: error.message || 'Kunde inte ta bort receptet.' };
  }
}

