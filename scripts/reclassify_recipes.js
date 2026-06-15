const fs = require('fs');
const path = require('path');

const RECIPES_JSON_PATH = path.join(__dirname, '../recipes.json');
const RECIPES_TS_PATH = path.join(__dirname, '../recipes.ts');

// Load JSON data
if (!fs.existsSync(RECIPES_JSON_PATH)) {
  console.error('recipes.json not found!');
  process.exit(1);
}

const recipes = JSON.parse(fs.readFileSync(RECIPES_JSON_PATH, 'utf8'));

// Reclassify recipes
recipes.forEach((r) => {
  const name = r.name.toLowerCase();
  
  // 1. Identify desserts and sweets
  const isDessert = 
    name.includes('posset') || 
    name.includes('pannacotta') || 
    name.includes('cheesecake') || 
    name.includes('kladdkaka') || 
    name.includes('tart') || 
    name.includes('smulpaj');
  
  if (isDessert) {
    r.mealType = 'dessert';
    
    // Ensure 'sweet' is in flavor profile
    if (!r.flavorProfile.includes('sweet')) {
      r.flavorProfile.push('sweet');
    }
  }

  // 2. Identify snacks (mellanmål - smaller, quick things)
  const isSnack = 
    name.includes('omelett på två olika sätt') || 
    name.includes('quesadilla med skinka och mjukost med jalapeño') || 
    name.includes('äppel- och kanelmuffins med crumble');

  if (isSnack) {
    r.mealType = 'snack';
    
    if (name.includes('muffins') && !r.flavorProfile.includes('sweet')) {
      r.flavorProfile.push('sweet');
    }
  }

  // 3. Redefine 'quick and easy' mood tags
  // Condition: total time <= 30 minutes and <= 10 ingredients, or total time <= 15 minutes
  const ingCount = Array.isArray(r.ingredients) ? r.ingredients.length : 0;
  const isQuickAndEasy = (r.totalTime <= 30 && ingCount <= 10) || r.totalTime <= 15;

  if (isQuickAndEasy) {
    if (!r.moodTags.includes('quick and easy')) {
      r.moodTags.push('quick and easy');
    }
  } else {
    // Remove if it doesn't fit the strict definition
    r.moodTags = r.moodTags.filter(t => t !== 'quick and easy');
  }
});

// Save updated recipes.json
fs.writeFileSync(RECIPES_JSON_PATH, JSON.stringify(recipes, null, 2), 'utf8');
console.log('Successfully updated recipes.json');

// Generate updated recipes.ts
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
  url: string;
  description: string;
  image: string;
  preparationTime: number;
  cookingTime: number;
  totalTime: number;
  servings: number;
  difficulty: string;
  cuisine: string;
  countryOfOrigin: string;
  region: string;
  mealType: string;
  occasions: string[];
  flavorProfile: string[];
  moodTags: string[];
  spiceLevel: number;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: Nutrition;
}

export const recipes: Recipe[] = ${JSON.stringify(recipes, null, 2)};
`;

fs.writeFileSync(RECIPES_TS_PATH, tsContent, 'utf8');
console.log('Successfully updated recipes.ts');
