const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  const recipesJsonPath = path.join(__dirname, '../recipes.json');
  const recipesTsPath = path.join(__dirname, '../recipes.ts');
  const cookbookParsedPath = path.join(__dirname, '../cookbook_parsed.json');

  if (!fs.existsSync(recipesJsonPath)) {
    throw new Error('recipes.json not found!');
  }
  if (!fs.existsSync(cookbookParsedPath)) {
    throw new Error('cookbook_parsed.json not found! Parse it first.');
  }

  const existingRecipes = JSON.parse(fs.readFileSync(recipesJsonPath, 'utf8'));
  const newRecipes = JSON.parse(fs.readFileSync(cookbookParsedPath, 'utf8'));

  console.log(`Loaded ${existingRecipes.length} existing recipes.`);
  console.log(`Loaded ${newRecipes.length} new recipes from cookbook.`);

  // Find max ID number
  let maxIdNum = 0;
  existingRecipes.forEach(r => {
    if (r.id && r.id.startsWith('recipe_')) {
      const num = parseInt(r.id.replace('recipe_', ''), 10);
      if (!isNaN(num) && num > maxIdNum) {
        maxIdNum = num;
      }
    }
  });

  console.log(`Current maximum ID number: ${maxIdNum}`);

  const processedNewRecipes = newRecipes.map((r, index) => {
    const nextIdNum = maxIdNum + 1 + index;
    const mealType = r.mealType || (Array.isArray(r.mealTypes) && r.mealTypes[0]) || 'dinner';
    
    // Ensure all standard fields exist
    return {
      name: r.name || 'Cookbook Recipe',
      url: r.url || null,
      description: r.description || null,
      image: r.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
      preparationTime: Number(r.preparationTime) || 15,
      cookingTime: Number(r.cookingTime) || 20,
      totalTime: Number(r.totalTime) || ((Number(r.preparationTime) || 15) + (Number(r.cookingTime) || 20)),
      servings: Number(r.servings) || 4,
      difficulty: r.difficulty || 'Medium',
      cuisine: r.cuisine || 'International',
      countryOfOrigin: r.countryOfOrigin || null,
      region: r.region || null,
      mealType: mealType,
      occasions: r.occasions || [],
      flavorProfile: r.flavorProfile || [],
      moodTags: r.moodTags || [],
      spiceLevel: r.spiceLevel !== undefined ? Number(r.spiceLevel) : 0,
      ingredients: (r.ingredients || []).map(ing => ({
        name: ing.name || '',
        quantity: ing.quantity !== undefined ? ing.quantity : null,
        unit: ing.unit || '',
        optional: !!ing.optional
      })),
      instructions: r.instructions || [],
      nutrition: {
        calories: Number(r.nutrition?.calories) || 0,
        protein: Number(r.nutrition?.protein) || 0,
        carbohydrates: Number(r.nutrition?.carbohydrates) || 0,
        fat: Number(r.nutrition?.fat) || 0,
        fiber: Number(r.nutrition?.fiber) || 0,
        sugar: Number(r.nutrition?.sugar) || 0,
        sodium: Number(r.nutrition?.sodium) || 0,
        iron: Number(r.nutrition?.iron) || 0,
        calcium: Number(r.nutrition?.calcium) || 0,
        potassium: Number(r.nutrition?.potassium) || 0,
        magnesium: Number(r.nutrition?.magnesium) || 0,
        vitaminA: Number(r.nutrition?.vitaminA) || 0,
        vitaminC: Number(r.nutrition?.vitaminC) || 0,
        vitaminD: Number(r.nutrition?.vitaminD) || 0,
        vitaminB12: Number(r.nutrition?.vitaminB12) || 0,
      },
      id: `recipe_${nextIdNum}`
    };
  });

  const updatedRecipes = [...existingRecipes, ...processedNewRecipes];
  
  // Write to recipes.json
  fs.writeFileSync(recipesJsonPath, JSON.stringify(updatedRecipes, null, 2), 'utf8');
  console.log(`Saved ${updatedRecipes.length} recipes to recipes.json`);

  // Write to recipes.ts
  const tsContent = `export interface Ingredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  optional: boolean;
}

export interface Nutrition {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  iron: number;
  calcium: number;
  potassium: number;
  magnesium: number;
  vitaminA: number;
  vitaminC: number;
  vitaminD: number;
  vitaminB12: number;
}

export interface Recipe {
  id: string;
  name: string;
  url: string | null;
  description: string | null;
  image: string | null;
  images?: string[];
  preparationTime: number;
  cookingTime: number;
  totalTime: number;
  servings: number;
  difficulty: string;
  cuisine: string;
  countryOfOrigin?: string | null;
  region?: string | null;
  mealType?: string;
  mealTypes?: string[];
  occasions: string[];
  flavorProfile: string[];
  moodTags: string[];
  spiceLevel?: number;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: Nutrition;
  createdAt?: string;
  updatedAt?: string;
}

export const recipes: Recipe[] = ${JSON.stringify(updatedRecipes, null, 2)};
`;

  fs.writeFileSync(recipesTsPath, tsContent, 'utf8');
  console.log('Saved recipes to recipes.ts');

  // Seed Firestore
  console.log('Seeding to Firestore...');
  try {
    execSync('node scripts/seed-firestore.js', { stdio: 'inherit' });
    console.log('Firestore seeded successfully!');
  } catch (error) {
    console.error('Failed to seed to Firestore:', error);
  }
}

main().catch(console.error);
