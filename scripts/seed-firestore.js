const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

const firebaseConfig = {
  apiKey: "AIzaSyDoRqrKhaRTygwiRwULx2evX_LfDQT2v_s",
  authDomain: "mealplanner-eff8d.firebaseapp.com",
  projectId: "mealplanner-eff8d",
  storageBucket: "mealplanner-eff8d.firebasestorage.app",
  messagingSenderId: "268457883169",
  appId: "1:268457883169:web:3bdf70f1b6787393e69560"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    const recipesPath = path.join(__dirname, '../recipes.json');
    if (!fs.existsSync(recipesPath)) {
      throw new Error('recipes.json not found in root directory.');
    }
    const recipes = JSON.parse(fs.readFileSync(recipesPath, 'utf8'));
    console.log(`Read ${recipes.length} recipes from recipes.json. Seeding to Firestore...`);
    
    for (const r of recipes) {
      const mealTypes = r.mealTypes || (r.mealType ? [r.mealType] : []);
      await setDoc(doc(db, 'recipes', r.id), {
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
        mealTypes: mealTypes,
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
    console.log("Firestore seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Firestore seeding failed:", err);
    process.exit(1);
  }
}

run();
