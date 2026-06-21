const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database...');
  const recipes = await prisma.recipe.findMany({
    orderBy: { name: 'asc' }
  });
  console.log(`Retrieved ${recipes.length} recipes from the database.`);

  // Group recipes by name
  const nameGroups = {};
  recipes.forEach((recipe) => {
    const normalized = recipe.name.trim().toLowerCase();
    if (!nameGroups[normalized]) {
      nameGroups[normalized] = [];
    }
    nameGroups[normalized].push(recipe);
  });

  let duplicateGroupCount = 0;
  let deletedRecipeCount = 0;

  for (const [name, list] of Object.entries(nameGroups)) {
    if (list.length > 1) {
      duplicateGroupCount++;
      console.log(`\nDuplicate group found for: "${list[0].name}" (${list.length} recipes)`);

      // Determine which one to keep (prioritise having a URL)
      let keepIndex = -1;
      for (let i = 0; i < list.length; i++) {
        if (list[i].url && list[i].url.trim() !== '') {
          keepIndex = i;
          break;
        }
      }

      // Default to keeping the first one if none have a url
      if (keepIndex === -1) {
        keepIndex = 0;
      }

      const keptRecipe = list[keepIndex];
      console.log(`  KEEP -> ID: ${keptRecipe.id}, URL: ${keptRecipe.url || 'None'}`);

      // Process duplicates to delete
      for (let i = 0; i < list.length; i++) {
        if (i === keepIndex) continue;
        const duplicate = list[i];
        console.log(`  DELETE -> ID: ${duplicate.id}, URL: ${duplicate.url || 'None'}`);

        // 1. Redirect WeeklyPlan references
        const updatedPlans = await prisma.weeklyPlan.updateMany({
          where: { recipeId: duplicate.id },
          data: { recipeId: keptRecipe.id }
        });
        if (updatedPlans.count > 0) {
          console.log(`    Redirected ${updatedPlans.count} WeeklyPlan entries to kept ID.`);
        }

        // 2. Redirect ShoppingList references
        const shoppingList = await prisma.shoppingList.findUnique({
          where: { id: 'current' }
        });
        if (shoppingList && shoppingList.recipes) {
          let recipesList = [];
          try {
            recipesList = typeof shoppingList.recipes === 'string'
              ? JSON.parse(shoppingList.recipes)
              : (shoppingList.recipes || []);
          } catch (e) {
            recipesList = shoppingList.recipes || [];
          }

          let listUpdated = false;
          recipesList = recipesList.map((r) => {
            if (r.id === duplicate.id) {
              listUpdated = true;
              return { ...r, id: keptRecipe.id, name: keptRecipe.name };
            }
            return r;
          });

          if (listUpdated) {
            await prisma.shoppingList.update({
              where: { id: 'current' },
              data: { recipes: recipesList }
            });
            console.log(`    Updated ShoppingList references.`);
          }
        }

        // 3. Delete the recipe
        await prisma.recipe.delete({
          where: { id: duplicate.id }
        });
        deletedRecipeCount++;
      }
    }
  }

  console.log(`\nCleanup finished.`);
  console.log(`Processed ${duplicateGroupCount} duplicate groups.`);
  console.log(`Deleted ${deletedRecipeCount} duplicate recipes from the database.`);
}

main()
  .catch((e) => {
    console.error('Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
