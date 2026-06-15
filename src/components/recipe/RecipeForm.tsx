'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, ChevronLeft, AlertCircle, ChefHat } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { createRecipe, updateRecipe } from '@/app/actions/recipes';

interface Ingredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  optional: boolean;
}

interface Nutrition {
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

interface Recipe {
  id?: string;
  name: string;
  url: string | null;
  description: string | null;
  image: string | null;
  preparationTime: number;
  cookingTime: number;
  servings: number;
  difficulty: string;
  cuisine: string;
  countryOfOrigin: string | null;
  region: string | null;
  mealType: string;
  occasions: string[];
  flavorProfile: string[];
  moodTags: string[];
  spiceLevel: number;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: Nutrition;
}

interface RecipeFormProps {
  recipe?: Recipe; // If provided, we are in Edit mode
}

const CUISINES = ['Vietnamese', 'Thai', 'Japanese', 'Swedish', 'Italian', 'Mexican', 'American', 'French', 'Indian', 'Greek', 'Spanish', 'Chinese', 'International'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const cuisineLabels: Record<string, string> = {
  'Vietnamese': 'Vietnamesiskt',
  'Thai': 'Thailändskt',
  'Japanese': 'Japanskt',
  'Swedish': 'Svenskt',
  'Italian': 'Italienskt',
  'Mexican': 'Mexikanskt',
  'American': 'Amerikanskt',
  'French': 'Franskt',
  'Indian': 'Indiskt',
  'Greek': 'Grekiskt',
  'Spanish': 'Spanskt',
  'Chinese': 'Kinesiskt',
  'International': 'Internationellt'
};

const difficultyLabels: Record<string, string> = {
  'Easy': 'Enkel',
  'Medium': 'Medelsvår',
  'Hard': 'Svår',
  'easy': 'Enkel',
  'medium': 'Medelsvår',
  'hard': 'Svår'
};

const mealTypeLabels: Record<string, string> = {
  'breakfast': 'Frukost',
  'lunch': 'Lunch',
  'dinner': 'Middag',
  'snack': 'Mellanmål'
};

export default function RecipeForm({ recipe }: RecipeFormProps) {
  const router = useRouter();
  const isEdit = !!recipe;

  // Form State
  const [name, setName] = useState(recipe?.name || '');
  const [description, setDescription] = useState(recipe?.description || '');
  const [image, setImage] = useState(recipe?.image || '');
  const [url, setUrl] = useState(recipe?.url || '');
  const [preparationTime, setPreparationTime] = useState(recipe?.preparationTime || 15);
  const [cookingTime, setCookingTime] = useState(recipe?.cookingTime || 20);
  const [servings, setServings] = useState(recipe?.servings || 4);
  const [difficulty, setDifficulty] = useState(recipe?.difficulty || 'Medium');
  const [cuisine, setCuisine] = useState(recipe?.cuisine || 'International');
  const [countryOfOrigin, setCountryOfOrigin] = useState(recipe?.countryOfOrigin || 'Unknown');
  const [region, setRegion] = useState(recipe?.region || 'Unknown');
  const [mealType, setMealType] = useState(recipe?.mealType || 'dinner');
  const [spiceLevel, setSpiceLevel] = useState(recipe?.spiceLevel || 0);

  // Arrays
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients || [{ name: '', quantity: null, unit: '', optional: false }]
  );
  const [instructions, setInstructions] = useState<string[]>(
    recipe?.instructions || ['']
  );
  
  const [occasions, setOccasions] = useState<string[]>(recipe?.occasions || []);
  const [flavorProfile, setFlavorProfile] = useState<string[]>(recipe?.flavorProfile || []);
  const [moodTags, setMoodTags] = useState<string[]>(recipe?.moodTags || []);

  // Nutrition
  const [nutrition, setNutrition] = useState<Nutrition>({
    calories: recipe?.nutrition?.calories || 0,
    protein: recipe?.nutrition?.protein || 0,
    carbohydrates: recipe?.nutrition?.carbohydrates || 0,
    fat: recipe?.nutrition?.fat || 0,
    fiber: recipe?.nutrition?.fiber || 0,
    sugar: recipe?.nutrition?.sugar || 0,
    sodium: recipe?.nutrition?.sodium || 0,
    iron: recipe?.nutrition?.iron || 0,
    calcium: recipe?.nutrition?.calcium || 0,
    potassium: recipe?.nutrition?.potassium || 0,
    magnesium: recipe?.nutrition?.magnesium || 0,
    vitaminA: recipe?.nutrition?.vitaminA || 0,
    vitaminC: recipe?.nutrition?.vitaminC || 0,
    vitaminD: recipe?.nutrition?.vitaminD || 0,
    vitaminB12: recipe?.nutrition?.vitaminB12 || 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Array Handlers
  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: null, unit: '', optional: false }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: any) => {
    const updated = [...ingredients];
    if (field === 'quantity') {
      updated[index].quantity = value === '' ? null : Number(value);
    } else if (field === 'optional') {
      updated[index].optional = !!value;
    } else {
      updated[index][field] = value as any;
    }
    setIngredients(updated);
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const handleRemoveInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const handleInstructionChange = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const handleNutritionChange = (field: keyof Nutrition, value: string) => {
    setNutrition({
      ...nutrition,
      [field]: Number(value) || 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Basic Validation
    if (!name.trim()) {
      setError('Receptnamn är obligatoriskt');
      setIsSubmitting(false);
      window.scrollTo(0, 0);
      return;
    }

    const filteredIngredients = ingredients.filter(i => i.name.trim() !== '');
    if (filteredIngredients.length === 0) {
      setError('Minst en ingrediens krävs');
      setIsSubmitting(false);
      window.scrollTo(0, 0);
      return;
    }

    const filteredInstructions = instructions.filter(step => step.trim() !== '');
    if (filteredInstructions.length === 0) {
      setError('Minst ett tillagningssteg krävs');
      setIsSubmitting(false);
      window.scrollTo(0, 0);
      return;
    }

    const formData = {
      name: name.trim(),
      description: description.trim() || null,
      image: image.trim() || null,
      url: url.trim() || null,
      preparationTime,
      cookingTime,
      servings,
      difficulty,
      cuisine,
      countryOfOrigin: countryOfOrigin.trim() || null,
      region: region.trim() || null,
      mealType,
      occasions,
      flavorProfile,
      moodTags,
      spiceLevel,
      ingredients: filteredIngredients,
      instructions: filteredInstructions,
      nutrition
    };

    try {
      if (isEdit && recipe?.id) {
        await updateRecipe(recipe.id, formData);
        router.push(`/recipes/${recipe.id}`);
      } else {
        const newRecipe = await createRecipe(formData);
        router.push(`/recipes/${newRecipe.id}`);
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Ett fel uppstod när receptet skulle sparas');
      window.scrollTo(0, 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <Link
          href={isEdit ? `/recipes/${recipe?.id}` : '/recipes'}
          className="px-4 py-2.5 bg-secondary text-foreground hover:bg-secondary/80 font-bold rounded-xl flex items-center gap-2 text-xs transition-colors shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Avbryt</span>
        </Link>

        <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
          <ChefHat className="h-5.5 w-5.5 text-primary" />
          <span>{isEdit ? `Redigera ${recipe?.name}` : 'Skapa nytt recept'}</span>
        </h2>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-semibold">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Basic Information */}
        <section className="bg-card border border-border/40 p-6 md:p-8 rounded-[2rem] shadow-sm space-y-4">
          <h3 className="font-extrabold text-md text-foreground">Grundläggande information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Receptets namn *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="t.ex. Autentisk vietnamesisk pho"
                className="w-full p-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Beskrivning</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beskriv maträtten kortfattat..."
                rows={3}
                className="w-full p-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bild-URL</label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://example.com/bild.jpg"
                className="w-full p-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ursprunglig recept-URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/originalrecept"
                className="w-full p-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Metadata & Scaling Info */}
        <section className="bg-card border border-border/40 p-6 md:p-8 rounded-[2rem] shadow-sm space-y-4">
          <h3 className="font-extrabold text-md text-foreground">Kategorisering & Portioner</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Kök</label>
              <select
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="w-full p-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {CUISINES.map(c => <option key={c} value={c}>{cuisineLabels[c] || c}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Måltidstyp</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full p-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {MEAL_TYPES.map(t => <option key={t} value={t}>{mealTypeLabels[t] || t}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Svårighetsgrad</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {DIFFICULTIES.map(d => <option key={d} value={d}>{difficultyLabels[d] || d}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Antal portioner (bas)</label>
              <input
                type="number"
                min="1"
                max="40"
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                className="w-full p-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Kryddstyrka (0-5)</label>
              <input
                type="number"
                min="0"
                max="5"
                value={spiceLevel}
                onChange={(e) => setSpiceLevel(Number(e.target.value))}
                className="w-full p-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Förberedelsetid (min)</label>
              <input
                type="number"
                min="1"
                value={preparationTime}
                onChange={(e) => setPreparationTime(Number(e.target.value))}
                className="w-full p-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tillagningstid (min)</label>
              <input
                type="number"
                min="1"
                value={cookingTime}
                onChange={(e) => setCookingTime(Number(e.target.value))}
                className="w-full p-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ursprungsland</label>
              <input
                type="text"
                value={countryOfOrigin}
                onChange={(e) => setCountryOfOrigin(e.target.value)}
                placeholder="t.ex. Vietnam"
                className="w-full p-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Region</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="t.ex. Sydostasien"
                className="w-full p-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </section>

        {/* Section 3: Ingredients */}
        <section className="bg-card border border-border/40 p-6 md:p-8 rounded-[2rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-md text-foreground">Ingredienser *</h3>
            <button
              type="button"
              onClick={handleAddIngredient}
              className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary text-xs font-bold rounded-lg flex items-center gap-1 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Lägg till ingrediens</span>
            </button>
          </div>

          <div className="space-y-3">
            {ingredients.map((ing, index) => (
              <div key={index} className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                <input
                  type="text"
                  placeholder="Ingrediensnamn (t.ex. Kycklingfilé)"
                  value={ing.name}
                  onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                  className="flex-1 p-2.5 bg-secondary/50 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                
                <input
                  type="number"
                  step="any"
                  placeholder="Mängd (t.ex. 500)"
                  value={ing.quantity !== null ? ing.quantity : ''}
                  onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                  className="w-24 p-2.5 bg-secondary/50 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />

                <input
                  type="text"
                  placeholder="Enhet (t.ex. g)"
                  value={ing.unit || ''}
                  onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                  className="w-20 p-2.5 bg-secondary/50 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />

                <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] uppercase font-bold text-muted-foreground shrink-0 border border-border rounded-xl p-2.5">
                  <input
                    type="checkbox"
                    checked={ing.optional}
                    onChange={(e) => handleIngredientChange(index, 'optional', e.target.checked)}
                    className="accent-primary h-3.5 w-3.5 rounded"
                  />
                  <span>Valfri</span>
                </label>

                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(index)}
                    className="p-2.5 bg-red-500/10 text-red-700 hover:bg-red-500/20 rounded-xl transition-all"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Instructions */}
        <section className="bg-card border border-border/40 p-6 md:p-8 rounded-[2rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-md text-foreground">Instruktioner *</h3>
            <button
              type="button"
              onClick={handleAddInstruction}
              className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary text-xs font-bold rounded-lg flex items-center gap-1 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Lägg till steg</span>
            </button>
          </div>

          <div className="space-y-3">
            {instructions.map((step, index) => (
              <div key={index} className="flex gap-3 items-start">
                <span className="h-6 w-6 rounded-full bg-secondary text-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-2">
                  {index + 1}
                </span>
                
                <textarea
                  placeholder="Beskriv detta steg..."
                  value={step}
                  onChange={(e) => handleInstructionChange(index, e.target.value)}
                  rows={2}
                  className="flex-1 p-2.5 bg-secondary/50 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />

                {instructions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveInstruction(index)}
                    className="p-2.5 bg-red-500/10 text-red-700 hover:bg-red-500/20 rounded-xl transition-all mt-1"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Nutrition Information */}
        <section className="bg-card border border-border/40 p-6 md:p-8 rounded-[2rem] shadow-sm space-y-4">
          <h3 className="font-extrabold text-md text-foreground">Näringsvärde (per portion)</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Kalorier</span>
              <input
                type="number"
                value={nutrition.calories}
                onChange={(e) => handleNutritionChange('calories', e.target.value)}
                className="w-full p-2 bg-secondary/50 border border-border rounded-lg text-xs"
              />
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-primary uppercase">Protein (g)</span>
              <input
                type="number"
                step="any"
                value={nutrition.protein}
                onChange={(e) => handleNutritionChange('protein', e.target.value)}
                className="w-full p-2 bg-secondary/50 border border-border rounded-lg text-xs font-bold text-primary"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-amber-700 uppercase">Kolhydrater (g)</span>
              <input
                type="number"
                step="any"
                value={nutrition.carbohydrates}
                onChange={(e) => handleNutritionChange('carbohydrates', e.target.value)}
                className="w-full p-2 bg-secondary/50 border border-border rounded-lg text-xs"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-sky-700 uppercase">Fett (g)</span>
              <input
                type="number"
                step="any"
                value={nutrition.fat}
                onChange={(e) => handleNutritionChange('fat', e.target.value)}
                className="w-full p-2 bg-secondary/50 border border-border rounded-lg text-xs"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Fiber (g)</span>
              <input
                type="number"
                step="any"
                value={nutrition.fiber}
                onChange={(e) => handleNutritionChange('fiber', e.target.value)}
                className="w-full p-2 bg-secondary/50 border border-border rounded-lg text-xs"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Socker (g)</span>
              <input
                type="number"
                step="any"
                value={nutrition.sugar}
                onChange={(e) => handleNutritionChange('sugar', e.target.value)}
                className="w-full p-2 bg-secondary/50 border border-border rounded-lg text-xs"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Natrium (mg)</span>
              <input
                type="number"
                value={nutrition.sodium}
                onChange={(e) => handleNutritionChange('sodium', e.target.value)}
                className="w-full p-2 bg-secondary/50 border border-border rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Micronutrients */}
          <div className="border-t border-border/40 pt-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">Vitaminer & Mineraler (Valfritt)</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Järn (mg)</span>
                <input
                  type="number"
                  step="any"
                  value={nutrition.iron}
                  onChange={(e) => handleNutritionChange('iron', e.target.value)}
                  className="w-full p-2 bg-secondary/50 border border-border rounded-lg text-[10px]"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Kalcium (mg)</span>
                <input
                  type="number"
                  step="any"
                  value={nutrition.calcium}
                  onChange={(e) => handleNutritionChange('calcium', e.target.value)}
                  className="w-full p-2 bg-secondary/50 border border-border rounded-lg text-[10px]"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Kalium (mg)</span>
                <input
                  type="number"
                  step="any"
                  value={nutrition.potassium}
                  onChange={(e) => handleNutritionChange('potassium', e.target.value)}
                  className="w-full p-2 bg-secondary/50 border border-border rounded-lg text-[10px]"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Magnesium (mg)</span>
                <input
                  type="number"
                  step="any"
                  value={nutrition.magnesium}
                  onChange={(e) => handleNutritionChange('magnesium', e.target.value)}
                  className="w-full p-2 bg-secondary/50 border border-border rounded-lg text-[10px]"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Vitamin A (mcg)</span>
                <input
                  type="number"
                  step="any"
                  value={nutrition.vitaminA}
                  onChange={(e) => handleNutritionChange('vitaminA', e.target.value)}
                  className="w-full p-2 bg-secondary/50 border border-border rounded-lg text-[10px]"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Vitamin C (mg)</span>
                <input
                  type="number"
                  step="any"
                  value={nutrition.vitaminC}
                  onChange={(e) => handleNutritionChange('vitaminC', e.target.value)}
                  className="w-full p-2 bg-secondary/50 border border-border rounded-lg text-[10px]"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Vitamin D (mcg)</span>
                <input
                  type="number"
                  step="any"
                  value={nutrition.vitaminD}
                  onChange={(e) => handleNutritionChange('vitaminD', e.target.value)}
                  className="w-full p-2 bg-secondary/50 border border-border rounded-lg text-[10px]"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Vitamin B12 (mcg)</span>
                <input
                  type="number"
                  step="any"
                  value={nutrition.vitaminB12}
                  onChange={(e) => handleNutritionChange('vitaminB12', e.target.value)}
                  className="w-full p-2 bg-secondary/50 border border-border rounded-lg text-[10px]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href={isEdit ? `/recipes/${recipe?.id}` : '/recipes'}
            className="px-6 py-3.5 bg-secondary text-foreground hover:bg-secondary/80 font-bold rounded-2xl transition-colors text-sm"
          >
            Avbryt
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3.5 bg-primary text-primary-foreground hover:scale-105 font-bold rounded-2xl shadow-md shadow-primary/10 transition-all text-sm flex items-center gap-2"
          >
            <Save className="h-4.5 w-4.5" />
            <span>{isSubmitting ? 'Sparar...' : 'Spara recept'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
