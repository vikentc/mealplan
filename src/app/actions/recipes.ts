'use server';

import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// Local paths for fallback files
const RECIPES_FILE = path.join(process.cwd(), 'recipes.json');
const PLANS_FILE = path.join(process.cwd(), 'plans.json');

// Helper to get fallback recipes
function getFallbackRecipes(): any[] {
  try {
    if (fs.existsSync(RECIPES_FILE)) {
      const data = fs.readFileSync(RECIPES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading fallback recipes:', error);
  }
  return [];
}

// Helper to get fallback plans
function getFallbackPlans(): any[] {
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
function saveFallbackPlans(plans: any[]) {
  try {
    fs.writeFileSync(PLANS_FILE, JSON.stringify(plans, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving fallback plans:', error);
  }
}

// Helper to save fallback recipes
function saveFallbackRecipes(recipes: any[]) {
  try {
    fs.writeFileSync(RECIPES_FILE, JSON.stringify(recipes, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving fallback recipes:', error);
  }
}

// Try-catch wrappers for db queries
async function runWithFallback<T>(dbQuery: () => Promise<T>, fallbackQuery: () => T | Promise<T>): Promise<T> {
  try {
    // Attempt database call
    return await dbQuery();
  } catch (error: any) {
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
      const name = (r.name || '').toLowerCase();
      const description = (r.description || '').toLowerCase();
      const cuisine = (r.cuisine || '').toLowerCase();

      // Check name or cuisine matches
      if (name.includes(q) || cuisine.includes(q)) return true;

      // Check description matches
      if (description.includes(q)) {
        if (q === 'pasta') {
          // If query is "pasta", verify it's not just "bönpasta", "chilipasta", "currypasta"
          const cleanDesc = description.replace(/(chili|bön|curry|miso|wasa|tomat|vitlök)pasta/g, '');
          if (!cleanDesc.includes('pasta')) return false;
        }
        return true;
      }

      // Check ingredients matches
      if (Array.isArray(r.ingredients)) {
        return r.ingredients.some((i: any) => {
          const ingName = (i.name || '').toLowerCase();
          if (ingName.includes(q)) {
            if (q === 'pasta') {
              // Exclude condiment pastes (chilipasta, currypasta, bönpasta, etc.)
              if (/(chili|bön|curry|miso|wasa|tomat|vitlök)pasta/.test(ingName)) return false;
              // Exclude generic side dishes unless the recipe itself is a pasta dish
              const isPastaDish = name.includes('pasta') || name.includes('carbonara') || name.includes('spaghetti') || name.includes('lasagne') || name.includes('ravioli') || name.includes('makaroner');
              if (ingName === 'pasta, ris eller potatis' && !isPastaDish) return false;
            }
            if (q === 'ris') {
              // Exclude generic side dishes unless the recipe itself is a rice dish
              const isRiceDish = name.includes('ris') || name.includes('risotto') || name.includes('paella');
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
    if (filters.spiceLevel !== undefined) {
      results = results.filter((r) => r.spiceLevel === filters.spiceLevel);
    }
    if (filters.occasion) {
      results = results.filter((r) => Array.isArray(r.occasions) && r.occasions.map((o: string) => o.toLowerCase()).includes(filters.occasion.toLowerCase()));
    }
    if (filters.mealType) {
      results = results.filter((r) => (r.mealType || '').toLowerCase() === filters.mealType.toLowerCase());
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
  spiceLevel?: number;
  nutritionGoal?: string;
  mealType?: string;
}) {
  // Fetch all recipes from DB / Fallback
  const allRecipes = await runWithFallback(
    async () => {
      const results = await db.recipe.findMany({
        orderBy: { name: 'asc' },
      });
      return JSON.parse(JSON.stringify(results));
    },
    () => getFallbackRecipes()
  );

  let originalQuery = filters?.query || '';
  let correctedQuery = originalQuery;
  let suggestions: string[] = [];
  let isCorrected = false;

  // 1. Build dictionary of vocabulary words from recipe names, descriptions, cuisines, and ingredients
  const vocabSet = new Set<string>();
  allRecipes.forEach((r: any) => {
    tokenizeText(r.name || '').forEach(w => vocabSet.add(w));
    tokenizeText(r.description || '').forEach(w => vocabSet.add(w));
    tokenizeText(r.cuisine || '').forEach(w => vocabSet.add(w));
    if (Array.isArray(r.ingredients)) {
      r.ingredients.forEach((ing: any) => {
        tokenizeText(ing.name || '').forEach(w => vocabSet.add(w));
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
  return runWithFallback(
    async () => {
      const recipe = await db.recipe.findUnique({
        where: { id }
      });
      return recipe ? JSON.parse(JSON.stringify(recipe)) : null;
    },
    () => {
      const recipes = getFallbackRecipes();
      return recipes.find((r) => r.id === id) || null;
    }
  );
}

export async function createRecipe(data: any) {
  return runWithFallback(
    async () => {
      const recipe = await db.recipe.create({
        data: {
          name: data.name,
          url: data.url,
          description: data.description,
          image: data.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
          preparationTime: Number(data.preparationTime) || 15,
          cookingTime: Number(data.cookingTime) || 20,
          totalTime: (Number(data.preparationTime) || 15) + (Number(data.cookingTime) || 20),
          servings: Number(data.servings) || 4,
          difficulty: data.difficulty || 'Medium',
          cuisine: data.cuisine || 'International',
          countryOfOrigin: data.countryOfOrigin || 'Unknown',
          region: data.region || 'Unknown',
          mealType: data.mealType || 'dinner',
          occasions: data.occasions || [],
          flavorProfile: data.flavorProfile || [],
          moodTags: data.moodTags || [],
          spiceLevel: Number(data.spiceLevel) || 0,
          ingredients: data.ingredients || [],
          instructions: data.instructions || [],
          nutrition: data.nutrition || {}
        }
      });
      return JSON.parse(JSON.stringify(recipe));
    },
    () => {
      const recipes = getFallbackRecipes();
      const newRecipe = {
        id: `recipe_${Date.now()}`,
        name: data.name,
        url: data.url,
        description: data.description,
        image: data.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        preparationTime: Number(data.preparationTime) || 15,
        cookingTime: Number(data.cookingTime) || 20,
        totalTime: (Number(data.preparationTime) || 15) + (Number(data.cookingTime) || 20),
        servings: Number(data.servings) || 4,
        difficulty: data.difficulty || 'Medium',
        cuisine: data.cuisine || 'International',
        countryOfOrigin: data.countryOfOrigin || 'Unknown',
        region: data.region || 'Unknown',
        mealType: data.mealType || 'dinner',
        occasions: data.occasions || [],
        flavorProfile: data.flavorProfile || [],
        moodTags: data.moodTags || [],
        spiceLevel: Number(data.spiceLevel) || 0,
        ingredients: data.ingredients || [],
        instructions: data.instructions || [],
        nutrition: data.nutrition || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      recipes.push(newRecipe);
      saveFallbackRecipes(recipes);
      return newRecipe;
    }
  );
}

export async function updateRecipe(id: string, data: any) {
  return runWithFallback(
    async () => {
      const recipe = await db.recipe.update({
        where: { id },
        data: {
          name: data.name,
          url: data.url,
          description: data.description,
          image: data.image,
          preparationTime: Number(data.preparationTime) || 15,
          cookingTime: Number(data.cookingTime) || 20,
          totalTime: (Number(data.preparationTime) || 15) + (Number(data.cookingTime) || 20),
          servings: Number(data.servings) || 4,
          difficulty: data.difficulty || 'Medium',
          cuisine: data.cuisine || 'International',
          countryOfOrigin: data.countryOfOrigin || 'Unknown',
          region: data.region || 'Unknown',
          mealType: data.mealType || 'dinner',
          occasions: data.occasions || [],
          flavorProfile: data.flavorProfile || [],
          moodTags: data.moodTags || [],
          spiceLevel: Number(data.spiceLevel) || 0,
          ingredients: data.ingredients || [],
          instructions: data.instructions || [],
          nutrition: data.nutrition || {}
        }
      });
      return JSON.parse(JSON.stringify(recipe));
    },
    () => {
      const recipes = getFallbackRecipes();
      const index = recipes.findIndex((r) => r.id === id);
      if (index === -1) throw new Error('Recipe not found');
      
      const updatedRecipe = {
        ...recipes[index],
        name: data.name,
        url: data.url,
        description: data.description,
        image: data.image || recipes[index].image,
        preparationTime: Number(data.preparationTime) || 15,
        cookingTime: Number(data.cookingTime) || 20,
        totalTime: (Number(data.preparationTime) || 15) + (Number(data.cookingTime) || 20),
        servings: Number(data.servings) || 4,
        difficulty: data.difficulty || 'Medium',
        cuisine: data.cuisine || 'International',
        countryOfOrigin: data.countryOfOrigin || 'Unknown',
        region: data.region || 'Unknown',
        mealType: data.mealType || 'dinner',
        occasions: data.occasions || [],
        flavorProfile: data.flavorProfile || [],
        moodTags: data.moodTags || [],
        spiceLevel: Number(data.spiceLevel) || 0,
        ingredients: data.ingredients || [],
        instructions: data.instructions || [],
        nutrition: data.nutrition || {},
        updatedAt: new Date().toISOString()
      };
      recipes[index] = updatedRecipe;
      saveFallbackRecipes(recipes);
      return updatedRecipe;
    }
  );
}

export async function deleteRecipe(id: string) {
  return runWithFallback(
    async () => {
      await db.recipe.delete({
        where: { id }
      });
      return { success: true };
    },
    () => {
      let recipes = getFallbackRecipes();
      recipes = recipes.filter((r) => r.id !== id);
      saveFallbackRecipes(recipes);
      return { success: true };
    }
  );
}

export async function getWeeklyPlan(weekOffset: number = 0) {
  return runWithFallback(
    async () => {
      const plans = await db.weeklyPlan.findMany({
        where: { weekOffset },
        include: { recipe: true }
      });
      return JSON.parse(JSON.stringify(plans));
    },
    () => {
      const plans = getFallbackPlans();
      const recipes = getFallbackRecipes();
      
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
}

export async function saveWeeklyPlan(plans: Array<{
  weekOffset: number;
  dayOfWeek: string;
  mealSlot: string;
  recipeId: string;
}>) {
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
    () => {
      const weekOffset = plans.length > 0 ? plans[0].weekOffset : 0;
      let allPlans = getFallbackPlans();
      
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
      
      saveFallbackPlans(allPlans);
      return { success: true };
    }
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
      const rMealType = (r.mealType || '').toLowerCase();
      // Match exactly, or if user requests 'dessert' and recipe contains dessert keywords
      if (mt === 'dessert') {
        return (
          rMealType === 'dessert' ||
          r.name.toLowerCase().includes('dessert') ||
          r.name.toLowerCase().includes('efterrätt') ||
          r.name.toLowerCase().includes('kaka') ||
          r.name.toLowerCase().includes('tårta') ||
          r.name.toLowerCase().includes('paj') && r.flavorProfile?.includes('sweet')
        );
      }
      return rMealType === mt;
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
          r.spiceLevel > 0 || 
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
