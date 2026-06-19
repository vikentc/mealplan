const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // 1. Clean existing database
  console.log('Cleaning existing records...');
  await prisma.weeklyPlan.deleteMany({});
  await prisma.recipe.deleteMany({});
  console.log('Database cleaned.');

  // 2. Read recipes.json
  const recipesPath = path.join(__dirname, '../recipes.json');
  if (!fs.existsSync(recipesPath)) {
    throw new Error('recipes.json not found in workspace root. Run scraper first.');
  }

  const recipes = JSON.parse(fs.readFileSync(recipesPath, 'utf8'));
  console.log(`Loaded ${recipes.length} recipes from recipes.json`);

  // 3. Seed recipes
  let count = 0;
  for (const r of recipes) {
    // Exclude JSON keys not in the DB schema if any (id will be regenerated or we can use it, but Prisma will generate Cuids if we don't supply one, let's preserve the custom IDs from json to keep things consistent!)
    await prisma.recipe.create({
      data: {
        id: r.id,
        name: r.name,
        url: r.url,
        description: r.description,
        image: r.image,
        images: r.images || [],
        preparationTime: r.preparationTime || 15,
        cookingTime: r.cookingTime || 20,
        totalTime: r.totalTime || 35,
        servings: r.servings || 4,
        difficulty: r.difficulty || 'Medium',
        cuisine: r.cuisine || 'International',
        mealTypes: r.mealTypes || (r.mealType ? [r.mealType] : []),
        occasions: r.occasions || [],
        flavorProfile: r.flavorProfile || [],
        moodTags: r.moodTags || [],
        ingredients: r.ingredients || [],
        instructions: r.instructions || [],
        nutrition: r.nutrition || {}
      }
    });
    count++;
  }

  console.log(`Seeding completed. Successfully seeded ${count} recipes.`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
