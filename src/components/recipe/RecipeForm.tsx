'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, ChevronLeft, AlertCircle, ChefHat, GripVertical, Sparkles, Link2, Image as ImageIcon, Loader2, Check, FileText, Camera } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { createRecipe, updateRecipe, autofillFromUrl, parseRecipeImageAction } from '@/app/actions/recipes';
import { useLanguage } from '@/lib/i18n';
import Tesseract from 'tesseract.js';
import { classifyOcrText } from '@/lib/recipeParser';

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
  const { t, language } = useLanguage();
  const lang = language === 'en' ? 'en' : 'sv';
  const isEdit = !!recipe;

  const [backUrl, setBackUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const referrer = document.referrer;
      if (referrer && referrer.includes(window.location.host)) {
        const urlObj = new URL(referrer);
        if (!urlObj.pathname.includes('/login') && 
            !urlObj.pathname.includes('/recipes/add') && 
            !urlObj.pathname.endsWith('/edit')) {
          setBackUrl(urlObj.pathname + urlObj.search);
        }
      }
    }
  }, []);

  // Autofill states
  const [autofillTab, setAutofillTab] = useState<'url' | 'image'>('url');
  const [autofillUrlInput, setAutofillUrlInput] = useState('');
  const [autofillLoading, setAutofillLoading] = useState(false);
  const [autofillProgress, setAutofillProgress] = useState(0);
  const [autofillStatus, setAutofillStatus] = useState('');
  const [autofillError, setAutofillError] = useState<string | null>(null);

  // Scraped/Parsed Preview state
  const [previewData, setPreviewData] = useState<{
    name?: string;
    description?: string | null;
    image?: string | null;
    url?: string | null;
    preparationTime?: number;
    cookingTime?: number;
    servings?: number;
    cuisine?: string;
    ingredients: Ingredient[];
    instructions: string[];
    nutrition?: Nutrition;
  } | null>(null);

  const texts = {
    sv: {
      autofillTitle: 'Autofyll Recept (Smart)',
      autofillDesc: 'Hämta information automatiskt från en receptlänk eller läs av ingredienser och instruktioner direkt från en bild.',
      tabLink: 'Klistra in länk',
      tabImage: 'Läs från bild (OCR)',
      urlPlaceholder: 'Klistra in länk till receptet (t.ex. köket.se, etc.)',
      btnFetch: 'Hämta',
      imageZone: 'Dra och släpp en receptbild här, eller klicka för att bläddra',
      imageZoneSub: 'Stöder JPG, PNG. Använder AI-avläsning (kräver GEMINI_API_KEY i .env) med lokal fallback.',
      applying: 'Applicerar...',
      appliedSuccess: 'Receptdata har hämtats! Kontrollera och redigera informationen nedan.',
      previewTitle: 'Identifierad receptinformation',
      btnApply: 'Applicera till formulär',
      btnDiscard: 'Släng',
      ingredients: 'Ingredienser',
      instructions: 'Instruktioner',
      generalInfo: 'Allmän info',
      noTextFound: 'Kunde inte hitta eller tolka text i bilden. Kontrollera bildens kvalitet.',
      scannedImage: 'Skannar bild...',
      optional: 'valfri'
    },
    en: {
      autofillTitle: 'Autofill Recipe (Smart)',
      autofillDesc: 'Automatically fetch information from a recipe link, or extract ingredients and instructions directly from an image.',
      tabLink: 'Paste link',
      tabImage: 'Read from image (OCR)',
      urlPlaceholder: 'Paste recipe link (e.g. foodnetwork.com, etc.)',
      btnFetch: 'Fetch',
      imageZone: 'Drag and drop a recipe image here, or click to browse',
      imageZoneSub: 'Supports JPG, PNG. Uses AI scanning (requires GEMINI_API_KEY in .env) with local fallback.',
      applying: 'Applying...',
      appliedSuccess: 'Recipe data extracted! Review and edit the details below.',
      previewTitle: 'Identified Recipe Information',
      btnApply: 'Apply to Form',
      btnDiscard: 'Discard',
      ingredients: 'Ingredients',
      instructions: 'Instructions',
      generalInfo: 'General info',
      noTextFound: 'Could not find or parse text in the image. Please check image quality.',
      scannedImage: 'Scanning image...',
      optional: 'optional'
    }
  };

  const handleUrlAutofill = async () => {
    if (!autofillUrlInput.trim()) return;
    setAutofillLoading(true);
    setAutofillError(null);
    setPreviewData(null);
    setAutofillStatus(lang === 'sv' ? 'Hämtar recept från länk...' : 'Fetching recipe from link...');

    try {
      const result = await autofillFromUrl(autofillUrlInput.trim());
      if (result) {
        setPreviewData({
          name: result.name,
          description: result.description,
          image: result.image,
          url: result.url,
          preparationTime: result.preparationTime,
          cookingTime: result.cookingTime,
          servings: result.servings,
          cuisine: result.cuisine,
          ingredients: result.ingredients as Ingredient[],
          instructions: result.instructions,
          nutrition: result.nutrition as Nutrition
        });
        setAutofillStatus(lang === 'sv' ? 'Receptet hämtat framgångsrikt!' : 'Recipe fetched successfully!');
      } else {
        throw new Error('No data returned');
      }
    } catch (err: any) {
      console.error(err);
      setAutofillError(
        lang === 'sv'
          ? 'Kunde inte hämta receptet från länken. Kontrollera URL:en eller fyll i manuellt.'
          : 'Could not fetch the recipe from the link. Check the URL or fill manually.'
      );
    } finally {
      setAutofillLoading(false);
    }
  };

  const handleImageAutofill = async (file: File) => {
    if (!file) return;
    setAutofillLoading(true);
    setAutofillError(null);
    setPreviewData(null);
    setAutofillProgress(0);
    setAutofillStatus(lang === 'sv' ? 'Läser av bild med AI...' : 'Analyzing image with AI...');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await parseRecipeImageAction(formData);

      if (res.success && res.recipe) {
        setPreviewData(res.recipe);
        setAutofillStatus(lang === 'sv' ? 'Bilden har lästs med AI!' : 'Image read successfully with AI!');
        return;
      }

      // Check if it's an API key missing error
      if (res.error === 'API_KEY_MISSING') {
        console.warn('Gemini API key missing, falling back to local OCR.');
      } else {
        console.error('AI OCR error:', res.message);
      }

      // Fallback to local Tesseract OCR
      setAutofillStatus(lang === 'sv' ? 'Laddar lokal OCR-motor...' : 'Loading local OCR engine...');
      const imageUrl = URL.createObjectURL(file);

      const { data: { text } } = await Tesseract.recognize(
        imageUrl,
        'swe+eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setAutofillStatus(lang === 'sv' ? `Läser av text lokalt... (${Math.round(m.progress * 100)}%)` : `Recognizing text locally... (${Math.round(m.progress * 100)}%)`);
              setAutofillProgress(m.progress);
            } else if (m.status === 'loading tesseract core') {
              setAutofillStatus(lang === 'sv' ? 'Laddar lokal core...' : 'Loading local core...');
            } else if (m.status === 'initializing api') {
              setAutofillStatus(lang === 'sv' ? 'Initierar lokal api...' : 'Initializing local api...');
            }
          }
        }
      );

      URL.revokeObjectURL(imageUrl);

      if (!text || !text.trim()) {
        throw new Error(lang === 'sv' ? 'Ingen text hittades i bilden.' : 'No text found in the image.');
      }

      setAutofillStatus(lang === 'sv' ? 'Klassificerar text...' : 'Classifying text...');

      const classified = classifyOcrText(text);

      if (classified.ingredients.length === 0 && classified.instructions.length === 0) {
        throw new Error(
          lang === 'sv'
            ? 'Kunde inte identifiera några ingredienser eller instruktioner.'
            : 'Could not identify any ingredients or instructions.'
        );
      }

      setPreviewData({
        ingredients: classified.ingredients as Ingredient[],
        instructions: classified.instructions
      });
      setAutofillStatus(
        lang === 'sv' 
          ? 'Texten har lästs lokalt! Tips: Lägg till GEMINI_API_KEY i .env för bättre resultat.' 
          : 'Text read locally! Tip: Add GEMINI_API_KEY in .env for better results.'
      );
    } catch (err: any) {
      console.error(err);
      setAutofillError(err.message || (lang === 'sv' ? 'Misslyckades med att läsa bilden.' : 'Failed to read the image.'));
    } finally {
      setAutofillLoading(false);
      setAutofillProgress(0);
    }
  };

  const handleApplyPreview = () => {
    if (!previewData) return;

    if (previewData.name) setName(previewData.name);
    if (previewData.description) setDescription(previewData.description);
    if (previewData.image) setImage(previewData.image);
    if (previewData.url) setUrl(previewData.url);
    if (previewData.preparationTime !== undefined) setPreparationTime(previewData.preparationTime);
    if (previewData.cookingTime !== undefined) setCookingTime(previewData.cookingTime);
    if (previewData.servings !== undefined) setServings(previewData.servings);
    if (previewData.cuisine) setCuisine(previewData.cuisine);

    if (previewData.ingredients && previewData.ingredients.length > 0) {
      setIngredients(previewData.ingredients);
    }

    if (previewData.instructions && previewData.instructions.length > 0) {
      setInstructions(previewData.instructions);
    }

    if (previewData.nutrition) {
      setNutrition({
        calories: previewData.nutrition.calories || 0,
        protein: previewData.nutrition.protein || 0,
        carbohydrates: previewData.nutrition.carbohydrates || 0,
        fat: previewData.nutrition.fat || 0,
        fiber: previewData.nutrition.fiber || 0,
        sugar: previewData.nutrition.sugar || 0,
        sodium: previewData.nutrition.sodium || 0,
        iron: previewData.nutrition.iron || 0,
        calcium: previewData.nutrition.calcium || 0,
        potassium: previewData.nutrition.potassium || 0,
        magnesium: previewData.nutrition.magnesium || 0,
        vitaminA: previewData.nutrition.vitaminA || 0,
        vitaminC: previewData.nutrition.vitaminC || 0,
        vitaminD: previewData.nutrition.vitaminD || 0,
        vitaminB12: previewData.nutrition.vitaminB12 || 0,
      });
    }

    setPreviewData(null);

    const targetElement = document.getElementById('recipe-form-title');
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [submitStatusMsg, setSubmitStatusMsg] = useState('');

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

  // Drag and drop state
  const [draggedIngredientIndex, setDraggedIngredientIndex] = useState<number | null>(null);
  const [draggedInstructionIndex, setDraggedInstructionIndex] = useState<number | null>(null);

  const handleIngredientDragStart = (index: number) => {
    setDraggedIngredientIndex(index);
  };

  const handleIngredientDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIngredientIndex === null || draggedIngredientIndex === index) return;
    
    const updated = [...ingredients];
    const item = updated.splice(draggedIngredientIndex, 1)[0];
    updated.splice(index, 0, item);
    setIngredients(updated);
    setDraggedIngredientIndex(index);
  };

  const handleIngredientDragEnd = () => {
    setDraggedIngredientIndex(null);
  };

  const handleInstructionDragStart = (index: number) => {
    setDraggedInstructionIndex(index);
  };

  const handleInstructionDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedInstructionIndex === null || draggedInstructionIndex === index) return;
    
    const updated = [...instructions];
    const item = updated.splice(draggedInstructionIndex, 1)[0];
    updated.splice(index, 0, item);
    setInstructions(updated);
    setDraggedInstructionIndex(index);
  };

  const handleInstructionDragEnd = () => {
    setDraggedInstructionIndex(null);
  };

  const handleNutritionChange = (field: keyof Nutrition, value: string) => {
    setNutrition({
      ...nutrition,
      [field]: Number(value) || 0
    });
  };

  const hasChanges = () => {
    if (name !== (recipe?.name || '')) return true;
    if (description !== (recipe?.description || '')) return true;
    if (image !== (recipe?.image || '')) return true;
    if (url !== (recipe?.url || '')) return true;
    if (preparationTime !== (recipe?.preparationTime || 15)) return true;
    if (cookingTime !== (recipe?.cookingTime || 20)) return true;
    if (servings !== (recipe?.servings || 4)) return true;
    if (difficulty !== (recipe?.difficulty || 'Medium')) return true;
    if (cuisine !== (recipe?.cuisine || 'International')) return true;
    if (countryOfOrigin !== (recipe?.countryOfOrigin || 'Unknown')) return true;
    if (region !== (recipe?.region || 'Unknown')) return true;
    if (mealType !== (recipe?.mealType || 'dinner')) return true;
    if (spiceLevel !== (recipe?.spiceLevel || 0)) return true;

    // Check ingredients
    const initialIngs = recipe?.ingredients || [{ name: '', quantity: null, unit: '', optional: false }];
    if (ingredients.length !== initialIngs.length) return true;
    for (let i = 0; i < ingredients.length; i++) {
      if (ingredients[i].name !== initialIngs[i].name) return true;
      if (ingredients[i].quantity !== initialIngs[i].quantity) return true;
      if (ingredients[i].unit !== initialIngs[i].unit) return true;
      if (ingredients[i].optional !== initialIngs[i].optional) return true;
    }

    // Check instructions
    const initialInsts = recipe?.instructions || [''];
    if (instructions.length !== initialInsts.length) return true;
    for (let i = 0; i < instructions.length; i++) {
      if (instructions[i] !== initialInsts[i]) return true;
    }

    // Check nutrition
    const initialNut = recipe?.nutrition || {
      calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0,
      iron: 0, calcium: 0, potassium: 0, magnesium: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB12: 0
    };
    if (nutrition.calories !== (initialNut.calories || 0)) return true;
    if (nutrition.protein !== (initialNut.protein || 0)) return true;
    if (nutrition.carbohydrates !== (initialNut.carbohydrates || 0)) return true;
    if (nutrition.fat !== (initialNut.fat || 0)) return true;
    if (nutrition.fiber !== (initialNut.fiber || 0)) return true;
    if (nutrition.sugar !== (initialNut.sugar || 0)) return true;
    if (nutrition.sodium !== (initialNut.sodium || 0)) return true;
    if (nutrition.iron !== (initialNut.iron || 0)) return true;
    if (nutrition.calcium !== (initialNut.calcium || 0)) return true;
    if (nutrition.potassium !== (initialNut.potassium || 0)) return true;
    if (nutrition.magnesium !== (initialNut.magnesium || 0)) return true;
    if (nutrition.vitaminA !== (initialNut.vitaminA || 0)) return true;
    if (nutrition.vitaminC !== (initialNut.vitaminC || 0)) return true;
    if (nutrition.vitaminD !== (initialNut.vitaminD || 0)) return true;
    if (nutrition.vitaminB12 !== (initialNut.vitaminB12 || 0)) return true;

    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // If no changes have been made, treat Save and Done as Close/Cancel redirecting back
    if (!hasChanges()) {
      router.push(backUrl || (isEdit && recipe?.id ? `/recipes/${recipe.id}` : '/'));
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('saving');
    setSubmitStatusMsg(lang === 'sv' ? 'Validerar receptuppgifter...' : 'Validating recipe details...');

    // Basic Validation
    if (!name.trim()) {
      setError(t('form.error_name_required'));
      setIsSubmitting(false);
      setSubmitStatus('idle');
      window.scrollTo(0, 0);
      return;
    }

    const filteredIngredients = ingredients.filter(i => i.name.trim() !== '');
    if (filteredIngredients.length === 0) {
      setError(t('form.error_ingredient_required'));
      setIsSubmitting(false);
      setSubmitStatus('idle');
      window.scrollTo(0, 0);
      return;
    }

    const filteredInstructions = instructions.filter(step => step.trim() !== '');
    if (filteredInstructions.length === 0) {
      setError(t('form.error_instruction_required'));
      setIsSubmitting(false);
      setSubmitStatus('idle');
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
        setSubmitStatusMsg(lang === 'sv' ? 'Sparar uppdateringar i databasen...' : 'Saving updates to database...');
        await updateRecipe(recipe.id, formData);
        setSubmitStatus('success');
        setSubmitStatusMsg(lang === 'sv' ? 'Receptet uppdaterat! Omdirigerar...' : 'Recipe updated! Redirecting...');
        setTimeout(() => {
          router.push(backUrl || `/recipes/${recipe.id}`);
          router.refresh();
        }, 1000);
      } else {
        setSubmitStatusMsg(lang === 'sv' ? 'Skapar och sparar receptet...' : 'Creating and saving recipe...');
        const newRecipe = await createRecipe(formData);
        setSubmitStatus('success');
        setSubmitStatusMsg(lang === 'sv' ? 'Receptet skapat! Omdirigerar...' : 'Recipe created! Redirecting...');
        setTimeout(() => {
          router.push(backUrl || `/recipes/${newRecipe.id}`);
          router.refresh();
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || t('form.error_save_generic'));
      setSubmitStatus('idle');
      window.scrollTo(0, 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4">
      
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={backUrl || (isEdit ? `/recipes/${recipe?.id}` : '/')}
          className="px-5 py-3 bg-amber-100 hover:bg-amber-200 text-foreground border-3 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <ChevronLeft className="h-4.5 w-4.5 text-foreground" />
          <span>{t('form.cancel')}</span>
        </Link>

        <h2 id="recipe-form-title" className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
          <ChefHat className="h-6 w-6 text-foreground animate-pulse" />
          <span>{isEdit ? t('form.edit_title', { name: recipe?.name || '' }) : t('form.create_title')}</span>
        </h2>
      </div>

      {error && (
        <div className="bg-red-100 border-3 border-foreground p-4 rounded-2xl flex items-center gap-3 text-red-800 text-xs font-black uppercase tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Autofill Panel */}
      {!isEdit && (
        <section className="bg-amber-50 border-3 border-foreground p-6 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-yellow-300 border-2 border-foreground rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Sparkles className="h-5 w-5 text-foreground animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-foreground">{texts[lang].autofillTitle}</h3>
              <p className="text-[11px] text-foreground/70 font-medium">{texts[lang].autofillDesc}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-3 border-foreground rounded-2xl overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <button
              type="button"
              onClick={() => { setAutofillTab('url'); setAutofillError(null); setPreviewData(null); }}
              className={cn(
                "flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all border-r-3 border-foreground cursor-pointer flex items-center justify-center gap-2",
                autofillTab === 'url' ? "bg-yellow-300 text-foreground" : "bg-white text-foreground/60 hover:text-foreground hover:bg-yellow-50/50"
              )}
            >
              <Link2 className="h-4.5 w-4.5" />
              <span>{texts[lang].tabLink}</span>
            </button>
            <button
              type="button"
              onClick={() => { setAutofillTab('image'); setAutofillError(null); setPreviewData(null); }}
              className={cn(
                "flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2",
                autofillTab === 'image' ? "bg-yellow-300 text-foreground" : "bg-white text-foreground/60 hover:text-foreground hover:bg-yellow-50/50"
              )}
            >
              <ImageIcon className="h-4.5 w-4.5" />
              <span>{texts[lang].tabImage}</span>
            </button>
          </div>

          {/* Tab Content: URL */}
          {autofillTab === 'url' && (
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <input
                type="url"
                placeholder={texts[lang].urlPlaceholder}
                value={autofillUrlInput}
                onChange={(e) => setAutofillUrlInput(e.target.value)}
                className="flex-1 p-3 bg-white border-3 border-foreground rounded-xl text-xs font-semibold placeholder:text-foreground/50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all min-w-[200px]"
              />
              <button
                type="button"
                onClick={handleUrlAutofill}
                disabled={autofillLoading || !autofillUrlInput.trim()}
                className="w-full sm:w-auto px-6 py-3 bg-cyan-100 hover:bg-cyan-200 disabled:bg-gray-150 disabled:opacity-50 text-foreground border-3 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                {autofillLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>{texts[lang].btnFetch}</span>
              </button>
            </div>
          )}

          {/* Tab Content: OCR Image */}
          {autofillTab === 'image' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Gallery Select */}
                <label 
                  className="relative flex flex-col items-center justify-center p-6 border-3 border-dashed border-foreground/50 hover:border-foreground rounded-2xl bg-white hover:bg-yellow-50/10 transition-all cursor-pointer group shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleImageAutofill(file);
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageAutofill(file);
                    }}
                    className="hidden"
                    disabled={autofillLoading}
                  />
                  <ImageIcon className="h-8 w-8 text-foreground/45 group-hover:text-foreground transition-colors mb-2" />
                  <span className="text-xs font-black uppercase tracking-wider text-foreground">
                    {lang === 'sv' ? 'Ladda upp en bild' : 'Upload an Image'}
                  </span>
                  <span className="text-[9px] text-foreground/60 mt-1">
                    {texts[lang].imageZoneSub}
                  </span>
                </label>

                {/* Camera Capture */}
                <label 
                  className="relative flex flex-col items-center justify-center p-6 border-3 border-dashed border-foreground/50 hover:border-foreground rounded-2xl bg-white hover:bg-yellow-50/10 transition-all cursor-pointer group shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center"
                >
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageAutofill(file);
                    }}
                    className="hidden"
                    disabled={autofillLoading}
                  />
                  <Camera className="h-8 w-8 text-foreground/45 group-hover:text-foreground transition-colors mb-2" />
                  <span className="text-xs font-black uppercase tracking-wider text-foreground">
                    {lang === 'sv' ? 'Ta ett foto' : 'Take a Photo'}
                  </span>
                  <span className="text-[9px] text-foreground/60 mt-1">
                    {lang === 'sv' ? 'Fota receptet direkt med din kamera' : 'Take a photo of the recipe with your camera'}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {autofillError && (
            <div className="bg-red-100 border-3 border-foreground p-4 rounded-xl flex items-start gap-2.5 text-red-950 text-xs font-semibold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <AlertCircle className="h-4.5 w-4.5 text-red-800 shrink-0 mt-0.5" />
              <span>{autofillError}</span>
            </div>
          )}

          {/* Loading / OCR progress bar */}
          {autofillLoading && (
            <div className="bg-white border-3 border-foreground p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
              <div className="flex items-center gap-2.5">
                <Loader2 className="h-4.5 w-4.5 animate-spin text-foreground shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                  {autofillStatus}
                </span>
              </div>
              {autofillTab === 'image' && autofillProgress > 0 && (
                <div className="w-full bg-yellow-100 border-2 border-foreground rounded-full h-4 overflow-hidden relative">
                  <div 
                    className="bg-yellow-300 h-full border-r-2 border-foreground transition-all duration-300" 
                    style={{ width: `${Math.round(autofillProgress * 100)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-foreground">
                    {Math.round(autofillProgress * 100)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Preview / Review Area */}
          {previewData && (
            <div className="bg-white border-3 border-foreground p-5 rounded-[1.5rem] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <div className="flex justify-between items-center border-b-2 border-foreground/10 pb-3 flex-wrap gap-2">
                <h4 className="font-black text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4.5 w-4.5 text-yellow-600" />
                  <span>{texts[lang].previewTitle}</span>
                </h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewData(null)}
                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 border-2 border-foreground font-black text-[10px] uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                  >
                    {texts[lang].btnDiscard}
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyPreview}
                    className="px-4 py-1.5 bg-emerald-300 hover:bg-emerald-400 text-foreground border-2 border-foreground font-black text-[10px] uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>{texts[lang].btnApply}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {previewData.name && (
                  <div className="p-3 bg-yellow-50/50 border-2 border-foreground/20 rounded-xl">
                    <span className="text-[9px] font-black text-foreground/50 uppercase tracking-widest block">{texts[lang].generalInfo}</span>
                    <p className="text-xs font-black uppercase text-foreground">{previewData.name}</p>
                    {previewData.description && (
                      <p className="text-[11px] text-foreground/70 italic mt-1">{previewData.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {previewData.cuisine && (
                        <span className="text-[9px] font-black uppercase bg-amber-100 border border-foreground/35 px-2 py-0.5 rounded-md">
                          {previewData.cuisine}
                        </span>
                      )}
                      {previewData.servings && (
                        <span className="text-[9px] font-black uppercase bg-cyan-100 border border-foreground/35 px-2 py-0.5 rounded-md">
                          {previewData.servings} port
                        </span>
                      )}
                      {(previewData.preparationTime !== undefined || previewData.cookingTime !== undefined) && (
                        <span className="text-[9px] font-black uppercase bg-emerald-100 border border-foreground/35 px-2 py-0.5 rounded-md">
                          {((previewData.preparationTime || 0) + (previewData.cookingTime || 0))} min
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ingredients Column */}
                  <div className="border-2 border-foreground/15 rounded-xl p-3 bg-yellow-50/20">
                    <h5 className="font-black text-[10px] uppercase tracking-wider text-foreground mb-2 border-b border-foreground/10 pb-1">
                      {texts[lang].ingredients} ({previewData.ingredients.length})
                    </h5>
                    <ul className="space-y-1 text-[11px] font-semibold text-foreground/85 list-disc list-inside">
                      {previewData.ingredients.map((ing, idx) => (
                        <li key={idx} className="truncate">
                          {ing.quantity ? `${ing.quantity} ` : ''}
                          {ing.unit ? `${ing.unit} ` : ''}
                          <span className="font-black text-foreground">{ing.name}</span>
                          {ing.optional && <span className="text-foreground/50 ml-1">({texts[lang].optional})</span>}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Instructions Column */}
                  <div className="border-2 border-foreground/15 rounded-xl p-3 bg-cyan-50/20">
                    <h5 className="font-black text-[10px] uppercase tracking-wider text-foreground mb-2 border-b border-foreground/10 pb-1">
                      {texts[lang].instructions} ({previewData.instructions.length})
                    </h5>
                    <ol className="space-y-1.5 text-[11px] leading-relaxed text-foreground/85 list-decimal list-inside">
                      {previewData.instructions.map((step, idx) => (
                        <li key={idx} className="pl-1 text-foreground/90">
                          <span className="font-medium">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Basic Information */}
        <section className="bg-card border-3 border-foreground p-6 md:p-8 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5 bg-[radial-gradient(rgba(0,0,0,0.02)_1.5px,transparent_1.5px)] [background-size:16px_16px]">
          <h3 className="font-black text-lg text-foreground uppercase tracking-tight">{t('form.basic_info')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] font-black text-foreground/80 uppercase tracking-widest leading-none block mb-1.5">{t('form.recipe_name')} *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('form.recipe_name_placeholder')}
                className="w-full p-3 bg-white border-3 border-foreground rounded-xl text-xs font-black uppercase placeholder:text-foreground/50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                required
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] font-black text-foreground/80 uppercase tracking-widest leading-none block mb-1.5">{t('form.description')}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('form.description_placeholder')}
                rows={3}
                className="w-full p-3 bg-white border-3 border-foreground rounded-xl text-xs font-semibold placeholder:text-foreground/50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-foreground/80 uppercase tracking-widest leading-none block mb-1.5">{t('form.image_url')}</label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full p-3 bg-white border-3 border-foreground rounded-xl text-xs font-medium placeholder:text-foreground/50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-foreground/80 uppercase tracking-widest leading-none block mb-1.5">{t('form.original_url')}</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/recipe"
                className="w-full p-3 bg-white border-3 border-foreground rounded-xl text-xs font-medium placeholder:text-foreground/50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Metadata & Scaling Info */}
        <section className="bg-card border-3 border-foreground p-6 md:p-8 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5 bg-[radial-gradient(rgba(0,0,0,0.02)_1.5px,transparent_1.5px)] [background-size:16px_16px]">
          <h3 className="font-black text-lg text-foreground uppercase tracking-tight">{t('form.categorization_servings')}</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-foreground/80 uppercase tracking-widest leading-none block mb-1.5">{t('form.cuisine')}</label>
              <select
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="w-full p-3 bg-white border-3 border-foreground rounded-xl text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              >
                {CUISINES.map(c => <option key={c} value={c}>{t(`cuisine.${c}`)}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-foreground/80 uppercase tracking-widest leading-none block mb-1.5">{t('form.meal_type')}</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full p-3 bg-white border-3 border-foreground rounded-xl text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              >
                {MEAL_TYPES.map(mt => <option key={mt} value={mt}>{t(`meal.${mt}`)}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-foreground/80 uppercase tracking-widest leading-none block mb-1.5">{t('form.difficulty')}</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-3 bg-white border-3 border-foreground rounded-xl text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              >
                {DIFFICULTIES.map(diff => <option key={diff} value={diff}>{t(`details.${diff.toLowerCase()}`)}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-foreground/80 uppercase tracking-widest leading-none block mb-1.5">{t('form.servings')}</label>
              <input
                type="number"
                min="1"
                max="40"
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                className="w-full p-3 bg-white border-3 border-foreground rounded-xl text-xs font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-foreground/80 uppercase tracking-widest leading-none block mb-1.5">{t('form.spice_level')}</label>
              <input
                type="number"
                min="0"
                max="5"
                value={spiceLevel}
                onChange={(e) => setSpiceLevel(Number(e.target.value))}
                className="w-full p-3 bg-white border-3 border-foreground rounded-xl text-xs font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-foreground/80 uppercase tracking-widest leading-none block mb-1.5">{t('form.prep_time')}</label>
              <input
                type="number"
                min="1"
                value={preparationTime}
                onChange={(e) => setPreparationTime(Number(e.target.value))}
                className="w-full p-3 bg-white border-3 border-foreground rounded-xl text-xs font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-foreground/80 uppercase tracking-widest leading-none block mb-1.5">{t('form.cook_time')}</label>
              <input
                type="number"
                min="1"
                value={cookingTime}
                onChange={(e) => setCookingTime(Number(e.target.value))}
                className="w-full p-3 bg-white border-3 border-foreground rounded-xl text-xs font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-foreground/80 uppercase tracking-widest block mb-1.5">{t('form.country')}</label>
              <input
                type="text"
                value={countryOfOrigin}
                onChange={(e) => setCountryOfOrigin(e.target.value)}
                placeholder="t.ex. Vietnam"
                className="w-full p-3 bg-white border-3 border-foreground rounded-xl text-xs font-semibold placeholder:text-foreground/50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-foreground/80 uppercase tracking-widest block mb-1.5">{t('form.region')}</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="t.ex. Sydostasien"
                className="w-full p-3 bg-white border-3 border-foreground rounded-xl text-xs font-semibold placeholder:text-foreground/50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>
          </div>
        </section>

        {/* Section 3: Ingredients */}
        <section className="bg-card border-3 border-foreground p-6 md:p-8 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5 bg-[radial-gradient(rgba(0,0,0,0.02)_1.5px,transparent_1.5px)] [background-size:16px_16px]">
          <div className="flex justify-between items-center gap-2">
            <h3 className="font-black text-lg text-foreground uppercase tracking-tight">{t('form.ingredients')}</h3>
            <button
              type="button"
              onClick={handleAddIngredient}
              className="px-4 py-2 bg-cyan-100 hover:bg-cyan-200 text-foreground border-2 border-foreground font-black text-[10px] uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              <span>{t('form.add_ingredient')}</span>
            </button>
          </div>

          <div className="space-y-3">
            {ingredients.map((ing, index) => (
              <div 
                key={index} 
                draggable
                onDragStart={() => handleIngredientDragStart(index)}
                onDragOver={(e) => handleIngredientDragOver(e, index)}
                onDragEnd={handleIngredientDragEnd}
                className={cn(
                  "flex gap-2 items-center flex-wrap sm:flex-nowrap p-1 rounded-xl transition-all duration-200",
                  draggedIngredientIndex === index ? "opacity-45 bg-secondary border-2 border-dashed border-muted-foreground/30" : ""
                )}
              >
                {/* Drag Handle */}
                <div className="cursor-grab active:cursor-grabbing text-foreground shrink-0 p-1">
                  <GripVertical className="h-4.5 w-4.5" />
                </div>

                <input
                  type="text"
                  placeholder={t('form.ingredient_placeholder')}
                  value={ing.name}
                  onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                  className="flex-1 p-2.5 bg-white border-2 border-foreground rounded-xl text-xs font-semibold placeholder:text-foreground/50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                />
                
                <input
                  type="number"
                  step="any"
                  placeholder={t('form.quantity_placeholder')}
                  value={ing.quantity !== null ? ing.quantity : ''}
                  onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                  className="w-24 p-2.5 bg-white border-2 border-foreground rounded-xl text-xs font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                />

                <input
                  type="text"
                  placeholder={t('form.unit_placeholder')}
                  value={ing.unit || ''}
                  onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                  className="w-20 p-2.5 bg-white border-2 border-foreground rounded-xl text-xs font-bold uppercase placeholder:text-foreground/50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                />

                <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] font-black uppercase text-foreground shrink-0 border-2 border-foreground rounded-xl p-2.5 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-secondary/10 active:translate-y-[1px] active:shadow-none transition-all">
                  <input
                    type="checkbox"
                    checked={ing.optional}
                    onChange={(e) => handleIngredientChange(index, 'optional', e.target.checked)}
                    className="h-4.5 w-4.5 accent-foreground border-2 border-foreground rounded cursor-pointer"
                  />
                  <span>{t('form.optional')}</span>
                </label>

                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(index)}
                    className="p-2.5 bg-red-100 hover:bg-red-200 border-2 border-foreground text-red-800 rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Instructions */}
        <section className="bg-card border-3 border-foreground p-6 md:p-8 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5 bg-[radial-gradient(rgba(0,0,0,0.02)_1.5px,transparent_1.5px)] [background-size:16px_16px]">
          <div className="flex justify-between items-center gap-2">
            <h3 className="font-black text-lg text-foreground uppercase tracking-tight">{t('form.instructions')}</h3>
            <button
              type="button"
              onClick={handleAddInstruction}
              className="px-4 py-2 bg-cyan-100 hover:bg-cyan-200 text-foreground border-2 border-foreground font-black text-[10px] uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              <span>{t('form.add_step')}</span>
            </button>
          </div>

          <div className="space-y-3">
            {instructions.map((step, index) => (
              <div 
                key={index} 
                draggable
                onDragStart={() => handleInstructionDragStart(index)}
                onDragOver={(e) => handleInstructionDragOver(e, index)}
                onDragEnd={handleInstructionDragEnd}
                className={cn(
                  "flex gap-3 items-start p-1.5 rounded-xl transition-all duration-200",
                  draggedInstructionIndex === index ? "opacity-45 bg-secondary border-2 border-dashed border-muted-foreground/30" : ""
                )}
              >
                {/* Drag Handle */}
                <div className="cursor-grab active:cursor-grabbing text-foreground shrink-0 p-1.5 mt-1">
                  <GripVertical className="h-4.5 w-4.5" />
                </div>

                <span className="h-6 w-6 rounded-full bg-foreground text-background text-xs font-black flex items-center justify-center shrink-0 mt-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {index + 1}
                </span>
                
                <textarea
                  placeholder={t('form.step_placeholder')}
                  value={step}
                  onChange={(e) => handleInstructionChange(index, e.target.value)}
                  rows={2}
                  className="flex-1 p-2.5 bg-white border-2 border-foreground rounded-xl text-xs font-semibold placeholder:text-foreground/50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                />

                {instructions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveInstruction(index)}
                    className="p-2.5 bg-red-100 hover:bg-red-200 border-2 border-foreground text-red-800 rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer mt-1"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Nutrition Information */}
        <section className="bg-card border-3 border-foreground p-6 md:p-8 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5 bg-[radial-gradient(rgba(0,0,0,0.02)_1.5px,transparent_1.5px)] [background-size:16px_16px]">
          <h3 className="font-black text-lg text-foreground uppercase tracking-tight">{t('form.nutrition')}</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
            <div className="space-y-1.5">
              <span className="text-[9px] font-black text-foreground/80 uppercase tracking-wide block mb-1">{t('form.calories')}</span>
              <input
                type="number"
                value={nutrition.calories}
                onChange={(e) => handleNutritionChange('calories', e.target.value)}
                className="w-full p-2 bg-white border-2 border-foreground rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>
            
            <div className="space-y-1.5">
              <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wide block mb-1">{t('dashboard.protein')} (g)</span>
              <input
                type="number"
                step="any"
                value={nutrition.protein}
                onChange={(e) => handleNutritionChange('protein', e.target.value)}
                className="w-full p-2 bg-white border-2 border-foreground rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-emerald-800 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] font-black text-amber-700 uppercase tracking-wide block mb-1">{t('dashboard.carbs')} (g)</span>
              <input
                type="number"
                step="any"
                value={nutrition.carbohydrates}
                onChange={(e) => handleNutritionChange('carbohydrates', e.target.value)}
                className="w-full p-2 bg-white border-2 border-foreground rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-amber-750 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] font-black text-rose-800 uppercase tracking-wide block mb-1">{t('dashboard.fat')} (g)</span>
              <input
                type="number"
                step="any"
                value={nutrition.fat}
                onChange={(e) => handleNutritionChange('fat', e.target.value)}
                className="w-full p-2 bg-white border-2 border-foreground rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-rose-800 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] font-black text-foreground/80 uppercase tracking-wide block mb-1">{t('nutrition.fiber')} (g)</span>
              <input
                type="number"
                step="any"
                value={nutrition.fiber}
                onChange={(e) => handleNutritionChange('fiber', e.target.value)}
                className="w-full p-2 bg-white border-2 border-foreground rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] font-black text-foreground/80 uppercase tracking-wide block mb-1">{t('nutrition.sugar')} (g)</span>
              <input
                type="number"
                step="any"
                value={nutrition.sugar}
                onChange={(e) => handleNutritionChange('sugar', e.target.value)}
                className="w-full p-2 bg-white border-2 border-foreground rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] font-black text-foreground/80 uppercase tracking-wide block mb-1">{t('nutrition.sodium')} (mg)</span>
              <input
                type="number"
                value={nutrition.sodium}
                onChange={(e) => handleNutritionChange('sodium', e.target.value)}
                className="w-full p-2 bg-white border-2 border-foreground rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>
          </div>

          {/* Micronutrients */}
          <div className="border-t-3 border-foreground/30 pt-5">
            <span className="text-[10px] font-black text-foreground/80 uppercase tracking-widest block mb-4">{t('form.micronutrients')}</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-foreground/80 uppercase block mb-1">{t('nutrition.iron')} (mg)</span>
                <input
                  type="number"
                  step="any"
                  value={nutrition.iron}
                  onChange={(e) => handleNutritionChange('iron', e.target.value)}
                  className="w-full p-2 bg-white border-2 border-foreground rounded-xl text-[10px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-foreground/80 uppercase block mb-1">{t('nutrition.calcium')} (mg)</span>
                <input
                  type="number"
                  step="any"
                  value={nutrition.calcium}
                  onChange={(e) => handleNutritionChange('calcium', e.target.value)}
                  className="w-full p-2 bg-white border-2 border-foreground rounded-xl text-[10px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-foreground/80 uppercase block mb-1">{t('nutrition.potassium')} (mg)</span>
                <input
                  type="number"
                  step="any"
                  value={nutrition.potassium}
                  onChange={(e) => handleNutritionChange('potassium', e.target.value)}
                  className="w-full p-2 bg-white border-2 border-foreground rounded-xl text-[10px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-foreground/80 uppercase block mb-1">{t('nutrition.magnesium')} (mg)</span>
                <input
                  type="number"
                  step="any"
                  value={nutrition.magnesium}
                  onChange={(e) => handleNutritionChange('magnesium', e.target.value)}
                  className="w-full p-2 bg-white border-2 border-foreground rounded-xl text-[10px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-foreground/80 uppercase block mb-1">{t('nutrition.vitaminA')} (mcg)</span>
                <input
                  type="number"
                  step="any"
                  value={nutrition.vitaminA}
                  onChange={(e) => handleNutritionChange('vitaminA', e.target.value)}
                  className="w-full p-2 bg-white border-2 border-foreground rounded-xl text-[10px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-foreground/80 uppercase block mb-1">{t('nutrition.vitaminC')} (mg)</span>
                <input
                  type="number"
                  step="any"
                  value={nutrition.vitaminC}
                  onChange={(e) => handleNutritionChange('vitaminC', e.target.value)}
                  className="w-full p-2 bg-white border-2 border-foreground rounded-xl text-[10px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-foreground/80 uppercase block mb-1">{t('nutrition.vitaminD')} (mcg)</span>
                <input
                  type="number"
                  step="any"
                  value={nutrition.vitaminD}
                  onChange={(e) => handleNutritionChange('vitaminD', e.target.value)}
                  className="w-full p-2 bg-white border-2 border-foreground rounded-xl text-[10px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-foreground/80 uppercase block mb-1">{t('nutrition.vitaminB12')} (mcg)</span>
                <input
                  type="number"
                  step="any"
                  value={nutrition.vitaminB12}
                  onChange={(e) => handleNutritionChange('vitaminB12', e.target.value)}
                  className="w-full p-2 bg-white border-2 border-foreground rounded-xl text-[10px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4">
          <Link
            href={backUrl || (isEdit ? `/recipes/${recipe?.id}` : '/')}
            className="px-5 py-3 bg-amber-100 hover:bg-amber-200 text-foreground border-3 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 cursor-pointer"
          >
            {t('form.cancel')}
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-foreground border-3 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            <Save className="h-4.5 w-4.5" />
            <span>{isSubmitting ? t('form.saving') : t('form.save')}</span>
          </button>
        </div>

      </form>

      {/* Status Overlay Modal */}
      {submitStatus !== 'idle' && submitStatus !== 'error' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white border-3 border-foreground p-8 rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-200">
            {submitStatus === 'saving' && (
              <div className="flex flex-col items-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-cyan-100 border-3 border-foreground flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                  <Loader2 className="h-8 w-8 text-foreground animate-spin" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-wider text-foreground">
                  {lang === 'sv' ? 'Sparar recept' : 'Saving Recipe'}
                </h3>
                <p className="text-xs font-semibold text-foreground/70 animate-pulse">
                  {submitStatusMsg}
                </p>
              </div>
            )}

            {submitStatus === 'success' && (
              <div className="flex flex-col items-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-emerald-300 border-3 border-foreground flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Check className="h-8 w-8 text-foreground stroke-[3]" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-wider text-foreground">
                  {lang === 'sv' ? 'Klart!' : 'Success!'}
                </h3>
                <p className="text-xs font-black uppercase text-emerald-800">
                  {lang === 'sv' ? 'Receptet sparades' : 'Recipe Saved'}
                </p>
                <p className="text-[11px] font-semibold text-foreground/70">
                  {submitStatusMsg}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
