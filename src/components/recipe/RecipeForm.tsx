'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, ChevronLeft, AlertCircle, ChefHat, GripVertical, Sparkles, Link2, Image as ImageIcon, Loader2, Check, FileText, Camera, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { createRecipe, updateRecipe, autofillFromUrl, parseRecipeImageAction, estimateNutritionAction } from '@/app/actions/recipes';
import { useLanguage } from '@/lib/i18n';
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
  images?: string[];
  preparationTime: number;
  cookingTime: number;
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
}

interface RecipeFormProps {
  recipe?: Recipe | null; // If provided, we are in Edit mode
  fallbackId?: string;
}

const CUISINES = ['Vietnamese', 'Thai', 'Korean', 'Japanese', 'Swedish', 'Italian', 'Mexican', 'American', 'French', 'Indian', 'Greek', 'Spanish', 'Chinese', 'International'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const cuisineLabels: Record<string, string> = {
  'Vietnamese': 'Vietnamesiskt',
  'Thai': 'Thailändskt',
  'Korean': 'Koreanskt',
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

export default function RecipeForm({ recipe: initialRecipe, fallbackId }: RecipeFormProps) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const lang = language === 'en' ? 'en' : 'sv';
  const isEdit = !!initialRecipe || !!fallbackId;

  const [backUrl, setBackUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const referrer = document.referrer;
      if (referrer && referrer.includes(window.location.host)) {
        try {
          const urlObj = new URL(referrer);
          if (!urlObj.pathname.includes('/login') && 
              !urlObj.pathname.includes('/recipes/add') && 
              !urlObj.pathname.endsWith('/edit')) {
            setBackUrl(urlObj.pathname + urlObj.search);
          }
        } catch (e) {
          console.error('Failed to parse referrer URL:', e);
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

  interface AutofillImage {
    file: File;
    previewUrl: string;
  }
  const [autofillImages, setAutofillImages] = useState<AutofillImage[]>([]);

  const addAutofillFiles = (files: File[]) => {
    const newImages = files.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));
    setAutofillImages(prev => [...prev, ...newImages]);
  };

  const removeAutofillImage = (index: number) => {
    setAutofillImages(prev => {
      const updated = [...prev];
      const removed = updated.splice(index, 1)[0];
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return updated;
    });
  };

  const autofillImagesRef = useRef<AutofillImage[]>([]);
  useEffect(() => {
    autofillImagesRef.current = autofillImages;
  }, [autofillImages]);

  useEffect(() => {
    return () => {
      autofillImagesRef.current.forEach(img => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

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
    mealType?: string;
    mealTypes?: string[];
    ingredients: Ingredient[];
    instructions: string[];
    nutrition?: Nutrition;
  } | null>(null);

  const texts = {
    sv: {
      autofillTitle: 'Autofyll Recept (Smart)',
      autofillDesc: 'Hämta information automatiskt från en receptlänk eller läs av ingredienser och instruktioner direkt från bilder.',
      tabLink: 'Klistra in länk',
      tabImage: 'Läs från bilder',
      urlPlaceholder: 'Klistra in länk till receptet (t.ex. köket.se, etc.)',
      btnFetch: 'Hämta',
      imageZone: 'Dra och släpp en eller flera receptbilder här, eller välj nedan',
      imageZoneSub: 'Stöder flera JPG/PNG-bilder samtidigt. Tolkas med AI (eller lokal fallback).',
      applying: 'Applicerar...',
      appliedSuccess: 'Receptdata har hämtats! Kontrollera och redigera informationen nedan.',
      previewTitle: 'Identifierad receptinformation',
      btnApply: 'Applicera till formulär',
      btnDiscard: 'Släng',
      ingredients: 'Ingredienser',
      instructions: 'Instruktioner',
      generalInfo: 'Allmän info',
      noTextFound: 'Kunde inte hitta eller tolka text i bilderna. Kontrollera bildernas kvalitet.',
      scannedImage: 'Skannar bilder...',
      optional: 'valfri',
      btnAnalyze: 'Analysera receptbilder',
      btnSelectImages: 'Välj bilder',
      btnTakePhotos: 'Ta ett foto',
      uploadedImages: 'Valda bilder',
      removeImage: 'Ta bort bild'
    },
    en: {
      autofillTitle: 'Autofill Recipe (Smart)',
      autofillDesc: 'Automatically fetch information from a recipe link, or extract ingredients and instructions directly from images.',
      tabLink: 'Paste link',
      tabImage: 'Read from images',
      urlPlaceholder: 'Paste recipe link (e.g. foodnetwork.com, etc.)',
      btnFetch: 'Fetch',
      imageZone: 'Drag and drop one or more recipe images here, or choose below',
      imageZoneSub: 'Supports multiple JPG/PNG images. Parsed with AI (or local fallback).',
      applying: 'Applying...',
      appliedSuccess: 'Recipe data extracted! Review and edit the details below.',
      previewTitle: 'Identified Recipe Information',
      btnApply: 'Apply to Form',
      btnDiscard: 'Discard',
      ingredients: 'Ingredients',
      instructions: 'Instructions',
      generalInfo: 'General info',
      noTextFound: 'Could not find or parse text in the images. Please check image quality.',
      scannedImage: 'Scanning images...',
      optional: 'optional',
      btnAnalyze: 'Analyze Recipe Images',
      btnSelectImages: 'Choose Images',
      btnTakePhotos: 'Take a Photo',
      uploadedImages: 'Selected Images',
      removeImage: 'Remove Image'
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

  const handleImageAutofill = async () => {
    if (autofillImages.length === 0) return;
    setAutofillLoading(true);
    setAutofillError(null);
    setPreviewData(null);
    setAutofillProgress(0);
    setAutofillStatus(lang === 'sv' ? 'Läser av bilder med AI...' : 'Analyzing images with AI...');

    try {
      const formData = new FormData();
      autofillImages.forEach((img) => {
        formData.append('images', img.file);
      });

      const res = await parseRecipeImageAction(formData);

      if (res.success && res.recipe) {
        setPreviewData(res.recipe);
        setAutofillStatus(lang === 'sv' ? 'Bilderna har lästs med AI!' : 'Images read successfully with AI!');
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
      const Tesseract = (await import('tesseract.js')).default;
      
      let combinedText = '';
      for (let i = 0; i < autofillImages.length; i++) {
        const img = autofillImages[i];
        setAutofillStatus(
          lang === 'sv' 
            ? `Läser av bild ${i + 1} av ${autofillImages.length} lokalt...` 
            : `Reading image ${i + 1} of ${autofillImages.length} locally...`
        );
        const { data: { text } } = await Tesseract.recognize(
          img.previewUrl,
          'swe+eng',
          {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                setAutofillStatus(
                  lang === 'sv' 
                    ? `Läser av bild ${i + 1} av ${autofillImages.length} lokalt... (${Math.round(m.progress * 100)}%)` 
                    : `Reading image ${i + 1} of ${autofillImages.length} locally... (${Math.round(m.progress * 100)}%)`
                );
                const overallProgress = (i + m.progress) / autofillImages.length;
                setAutofillProgress(overallProgress);
              }
            }
          }
        );
        combinedText += '\n' + text;
      }

      if (!combinedText || !combinedText.trim()) {
        throw new Error(lang === 'sv' ? 'Ingen text hittades i bilderna.' : 'No text found in the images.');
      }

      setAutofillStatus(lang === 'sv' ? 'Klassificerar text...' : 'Classifying text...');

      const classified = classifyOcrText(combinedText);

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
      setAutofillError(err.message || (lang === 'sv' ? 'Misslyckades med att läsa bilderna.' : 'Failed to read the images.'));
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
    if (previewData.mealTypes && previewData.mealTypes.length > 0) {
      setMealTypes(previewData.mealTypes);
    } else if (previewData.mealType) {
      setMealTypes([previewData.mealType]);
    }

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
    autofillImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setAutofillImages([]);

    const targetElement = document.getElementById('recipe-form-title');
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Form State
  const [recipeState, setRecipeState] = useState<any>(initialRecipe);
  const recipe = recipeState || initialRecipe;

  const [name, setName] = useState(initialRecipe?.name || '');
  const [description, setDescription] = useState(initialRecipe?.description || '');
  const [image, setImage] = useState(initialRecipe?.image || '');
  const [images, setImages] = useState<string[]>(
    initialRecipe?.images || (initialRecipe?.image ? [initialRecipe.image] : [])
  );
  const [url, setUrl] = useState(initialRecipe?.url || '');

  // Drag and Drop States & Ref
  const [isDraggingAutofill, setIsDraggingAutofill] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  // Drag & Drop for Autofill
  const handleDragOverAutofill = (e: React.DragEvent) => {
    e.preventDefault();
    if (!autofillLoading) {
      setIsDraggingAutofill(true);
    }
  };

  const handleDragLeaveAutofill = () => {
    setIsDraggingAutofill(false);
  };

  const handleDropAutofill = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAutofill(false);
    if (autofillLoading) return;
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (droppedFiles.length > 0) {
      addAutofillFiles(droppedFiles);
    }
  };

  // Drag & Drop for Main Recipe Image
  const handleDragOverImage = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(true);
  };

  const handleDragLeaveImage = () => {
    setIsDraggingImage(false);
  };

  const processImageFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64 = event.target.result as string;
          setImages((prev) => {
            if (prev.includes(base64)) return prev;
            const updated = [...prev, base64];
            // If no primary image is set, use the first uploaded image
            if (!image) {
              setImage(base64);
            }
            return updated;
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDropImage = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImageFiles(files);
    }
  };

  const handleImageUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processImageFiles(files);
    }
  };
  const [preparationTime, setPreparationTime] = useState(initialRecipe?.preparationTime || 15);
  const [cookingTime, setCookingTime] = useState(initialRecipe?.cookingTime || 20);
  const [servings, setServings] = useState(initialRecipe?.servings || 4);
  const [difficulty, setDifficulty] = useState(initialRecipe?.difficulty || 'Medium');
  const [cuisine, setCuisine] = useState(initialRecipe?.cuisine || 'International');
  const [mealTypes, setMealTypes] = useState<string[]>(
    initialRecipe?.mealTypes || (initialRecipe?.mealType ? [initialRecipe.mealType] : ['dinner'])
  );

  // Arrays
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialRecipe?.ingredients || [{ name: '', quantity: null, unit: '', optional: false }]
  );
  const [instructions, setInstructions] = useState<string[]>(
    initialRecipe?.instructions || ['']
  );
  
  const [occasions, setOccasions] = useState<string[]>(initialRecipe?.occasions || []);
  const [flavorProfile, setFlavorProfile] = useState<string[]>(initialRecipe?.flavorProfile || []);
  const [moodTags, setMoodTags] = useState<string[]>(initialRecipe?.moodTags || []);

  // Nutrition
  const [nutrition, setNutrition] = useState<Nutrition>({
    calories: initialRecipe?.nutrition?.calories || 0,
    protein: initialRecipe?.nutrition?.protein || 0,
    carbohydrates: initialRecipe?.nutrition?.carbohydrates || 0,
    fat: initialRecipe?.nutrition?.fat || 0,
    fiber: initialRecipe?.nutrition?.fiber || 0,
    sugar: initialRecipe?.nutrition?.sugar || 0,
    sodium: initialRecipe?.nutrition?.sodium || 0,
    iron: initialRecipe?.nutrition?.iron || 0,
    calcium: initialRecipe?.nutrition?.calcium || 0,
    potassium: initialRecipe?.nutrition?.potassium || 0,
    magnesium: initialRecipe?.nutrition?.magnesium || 0,
    vitaminA: initialRecipe?.nutrition?.vitaminA || 0,
    vitaminC: initialRecipe?.nutrition?.vitaminC || 0,
    vitaminD: initialRecipe?.nutrition?.vitaminD || 0,
    vitaminB12: initialRecipe?.nutrition?.vitaminB12 || 0,
  });

  // Load from local-recipes if fallbackId is provided and initialRecipe is null
  useEffect(() => {
    if (initialRecipe) {
      setName(initialRecipe.name || '');
      setDescription(initialRecipe.description || '');
      setImage(initialRecipe.image || '');
      setImages(initialRecipe.images || (initialRecipe.image ? [initialRecipe.image] : []));
      setUrl(initialRecipe.url || '');
      setPreparationTime(initialRecipe.preparationTime || 15);
      setCookingTime(initialRecipe.cookingTime || 20);
      setServings(initialRecipe.servings || 4);
      setDifficulty(initialRecipe.difficulty || 'Medium');
      setCuisine(initialRecipe.cuisine || 'International');
      setMealTypes(initialRecipe.mealTypes || (initialRecipe.mealType ? [initialRecipe.mealType] : ['dinner']));
      setOccasions(initialRecipe.occasions || []);
      setFlavorProfile(initialRecipe.flavorProfile || []);
      setMoodTags(initialRecipe.moodTags || []);
      setIngredients(initialRecipe.ingredients || [{ name: '', quantity: null, unit: '', optional: false }]);
      setInstructions(initialRecipe.instructions || ['']);
      if (initialRecipe.nutrition) {
        setNutrition(initialRecipe.nutrition);
      }
    } else if (fallbackId) {
      if (typeof window !== 'undefined') {
        const localRecipesStore = localStorage.getItem('local-recipes');
        if (localRecipesStore) {
          try {
            const parsed = JSON.parse(localRecipesStore);
            if (Array.isArray(parsed)) {
              const found = parsed.find((r: any) => r.id === fallbackId);
              if (found) {
                setRecipeState(found);
                setName(found.name || '');
                setDescription(found.description || '');
                setImage(found.image || '');
                setImages(found.images || (found.image ? [found.image] : []));
                setUrl(found.url || '');
                setPreparationTime(found.preparationTime || 15);
                setCookingTime(found.cookingTime || 20);
                setServings(found.servings || 4);
                setDifficulty(found.difficulty || 'Medium');
                setCuisine(found.cuisine || 'International');
                setMealTypes(found.mealTypes || (found.mealType ? [found.mealType] : ['dinner']));
                setOccasions(found.occasions || []);
                setFlavorProfile(found.flavorProfile || []);
                setMoodTags(found.moodTags || []);
                setIngredients(found.ingredients || [{ name: '', quantity: null, unit: '', optional: false }]);
                setInstructions(found.instructions || ['']);
                if (found.nutrition) {
                  setNutrition(found.nutrition);
                }
              }
            }
          } catch (e) {
            console.error('Failed to parse local recipes for editing in RecipeForm:', e);
          }
        }
      }
    }
  }, [initialRecipe, fallbackId]);

  const [isEstimatingNutrition, setIsEstimatingNutrition] = useState(false);
  const [nutritionError, setNutritionError] = useState<string | null>(null);

  const handleEstimateNutrition = async () => {
    setIsEstimatingNutrition(true);
    setNutritionError(null);
    try {
      const cleanIngredients = ingredients.filter(i => i.name && i.name.trim() !== '');
      if (cleanIngredients.length === 0) {
        setNutritionError(language === 'sv' ? 'Lägg till minst en ingrediens först.' : 'Please add at least one ingredient first.');
        setIsEstimatingNutrition(false);
        return;
      }

      const res = await estimateNutritionAction(cleanIngredients, servings);
      if (res.error) {
        setNutritionError(res.message || 'Error calculating nutrition');
      } else if (res.success && res.nutrition) {
        setNutrition({
          calories: Number(res.nutrition.calories) || 0,
          protein: Number(res.nutrition.protein) || 0,
          carbohydrates: Number(res.nutrition.carbohydrates) || 0,
          fat: Number(res.nutrition.fat) || 0,
          fiber: Number(res.nutrition.fiber) || 0,
          sugar: Number(res.nutrition.sugar) || 0,
          sodium: Number(res.nutrition.sodium) || 0,
          iron: Number(res.nutrition.iron) || 0,
          calcium: Number(res.nutrition.calcium) || 0,
          potassium: Number(res.nutrition.potassium) || 0,
          magnesium: Number(res.nutrition.magnesium) || 0,
          vitaminA: Number(res.nutrition.vitaminA) || 0,
          vitaminC: Number(res.nutrition.vitaminC) || 0,
          vitaminD: Number(res.nutrition.vitaminD) || 0,
          vitaminB12: Number(res.nutrition.vitaminB12) || 0,
        });
      }
    } catch (err: any) {
      console.error(err);
      setNutritionError(err.message || 'An error occurred during nutrition calculation.');
    } finally {
      setIsEstimatingNutrition(false);
    }
  };

  const handleClearNutrition = () => {
    setNutrition({
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      iron: 0,
      calcium: 0,
      potassium: 0,
      magnesium: 0,
      vitaminA: 0,
      vitaminC: 0,
      vitaminD: 0,
      vitaminB12: 0,
    });
    setNutritionError(null);
  };

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
    const initialImages = recipe?.images || (recipe?.image ? [recipe.image] : []);
    if (images.length !== initialImages.length || !images.every((img, idx) => img === initialImages[idx])) return true;
    if (preparationTime !== (recipe?.preparationTime || 15)) return true;
    if (cookingTime !== (recipe?.cookingTime || 20)) return true;
    if (servings !== (recipe?.servings || 4)) return true;
    if (difficulty !== (recipe?.difficulty || 'Medium')) return true;
    if (cuisine !== (recipe?.cuisine || 'International')) return true;
    const initialMealTypes = recipe?.mealTypes || (recipe?.mealType ? [recipe.mealType] : ['dinner']);
    if (mealTypes.length !== initialMealTypes.length || !mealTypes.every(mt => initialMealTypes.includes(mt))) return true;

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
      images: images,
      url: url.trim() || null,
      preparationTime,
      cookingTime,
      servings,
      difficulty,
      cuisine,
      mealTypes,
      occasions,
      flavorProfile,
      moodTags,
      ingredients: filteredIngredients,
      instructions: filteredInstructions,
      nutrition
    };

    // Helper to save recipe locally
    const saveLocalRecipe = (recipeObj: any) => {
      if (typeof window !== 'undefined') {
        const localRecipesStore = localStorage.getItem('local-recipes');
        let localRecipes: any[] = [];
        if (localRecipesStore) {
          try {
            localRecipes = JSON.parse(localRecipesStore) || [];
          } catch (e) {
            console.error(e);
          }
        }
        localRecipes = localRecipes.filter((r: any) => r.id !== recipeObj.id);
        localRecipes.push(recipeObj);
        localStorage.setItem('local-recipes', JSON.stringify(localRecipes));
      }
    };

    try {
      const targetId = initialRecipe?.id || fallbackId;
      
      if (isEdit && targetId) {
        setSubmitStatusMsg(lang === 'sv' ? 'Sparar uppdateringar...' : 'Saving updates...');
        
        try {
          const res = await updateRecipe(targetId, formData);
          if (res && !(res as any).error) {
            saveLocalRecipe(res);
            setSubmitStatus('success');
            setSubmitStatusMsg(lang === 'sv' ? 'Receptet uppdaterat! Omdirigerar...' : 'Recipe updated! Redirecting...');
          } else {
            // Server error fallback
            const fallbackUpdated = {
              id: targetId,
              ...formData,
              updatedAt: new Date().toISOString()
            };
            saveLocalRecipe(fallbackUpdated);
            setSubmitStatus('success');
            setSubmitStatusMsg(lang === 'sv' ? 'Receptet uppdaterat lokalt! Omdirigerar...' : 'Recipe updated locally! Redirecting...');
          }
        } catch (serverErr) {
          console.warn('Server update failed, falling back to local update:', serverErr);
          const fallbackUpdated = {
            id: targetId,
            ...formData,
            updatedAt: new Date().toISOString()
          };
          saveLocalRecipe(fallbackUpdated);
          setSubmitStatus('success');
          setSubmitStatusMsg(lang === 'sv' ? 'Receptet uppdaterat lokalt! Omdirigerar...' : 'Recipe updated locally! Redirecting...');
        }

        setTimeout(() => {
          router.push(backUrl || `/recipes/${targetId}`);
          router.refresh();
        }, 1000);
      } else {
        setSubmitStatusMsg(lang === 'sv' ? 'Skapar och sparar receptet...' : 'Creating and saving recipe...');
        
        try {
          const newRecipe = await createRecipe(formData);
          if (newRecipe && !(newRecipe as any).error) {
            saveLocalRecipe(newRecipe);
            setSubmitStatus('success');
            setSubmitStatusMsg(lang === 'sv' ? 'Receptet skapat! Omdirigerar...' : 'Recipe created! Redirecting...');
            setTimeout(() => {
              router.push(backUrl || `/recipes/${newRecipe.id}`);
              router.refresh();
            }, 1000);
          } else {
            // Server error fallback
            const localId = `recipe_${Date.now()}`;
            const fallbackNew = {
              id: localId,
              ...formData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            saveLocalRecipe(fallbackNew);
            setSubmitStatus('success');
            setSubmitStatusMsg(lang === 'sv' ? 'Receptet skapat lokalt! Omdirigerar...' : 'Recipe created locally! Redirecting...');
            setTimeout(() => {
              router.push(backUrl || `/recipes/${localId}`);
              router.refresh();
            }, 1000);
          }
        } catch (serverErr) {
          console.warn('Server create failed, falling back to local create:', serverErr);
          const localId = `recipe_${Date.now()}`;
          const fallbackNew = {
            id: localId,
            ...formData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          saveLocalRecipe(fallbackNew);
          setSubmitStatus('success');
          setSubmitStatusMsg(lang === 'sv' ? 'Receptet skapat lokalt! Omdirigerar...' : 'Recipe created locally! Redirecting...');
          setTimeout(() => {
            router.push(backUrl || `/recipes/${localId}`);
            router.refresh();
          }, 1000);
        }
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
        <h2 id="recipe-form-title" className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
          <ChefHat className="h-6 w-6 text-foreground animate-pulse" />
          <span>{isEdit ? t('form.edit_title', { name: recipe?.name || '' }) : t('form.create_title')}</span>
        </h2>

        <Link
          href={backUrl || (isEdit ? `/recipes/${recipe?.id}` : '/')}
          className="px-5 py-3 bg-amber-100 hover:bg-amber-200 text-foreground border-3 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <ChevronLeft className="h-4.5 w-4.5 text-foreground" />
          <span>{t('form.cancel')}</span>
        </Link>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => { setAutofillTab('url'); setAutofillError(null); setPreviewData(null); }}
              className={cn(
                "w-full py-3.5 px-5 text-xs font-black uppercase tracking-wider transition-all border-3 border-foreground rounded-2xl cursor-pointer flex items-center justify-center gap-2.5",
                autofillTab === 'url' 
                  ? "bg-yellow-300 text-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-y-[-1px]" 
                  : "bg-white text-foreground/60 hover:text-foreground hover:bg-yellow-50/50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              )}
            >
              <Link2 className="h-4.5 w-4.5" />
              <span>{texts[lang].tabLink}</span>
            </button>
            <button
              type="button"
              onClick={() => { setAutofillTab('image'); setAutofillError(null); setPreviewData(null); }}
              className={cn(
                "w-full py-3.5 px-5 text-xs font-black uppercase tracking-wider transition-all border-3 border-foreground rounded-2xl cursor-pointer flex items-center justify-center gap-2.5",
                autofillTab === 'image' 
                  ? "bg-yellow-300 text-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-y-[-1px]" 
                  : "bg-white text-foreground/60 hover:text-foreground hover:bg-yellow-50/50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
              <div 
                className={cn(
                  "border-3 border-dashed rounded-2xl p-5 md:p-6 transition-all text-center space-y-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
                  isDraggingAutofill 
                    ? "border-primary bg-primary/5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" 
                    : "border-foreground/30 hover:border-foreground/80 bg-white"
                )}
                onDragOver={handleDragOverAutofill}
                onDragLeave={handleDragLeaveAutofill}
                onDrop={handleDropAutofill}
              >
                {autofillImages.length === 0 ? (
                  <div className="space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-yellow-100 border-2 border-foreground flex items-center justify-center text-foreground mb-1">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-xs uppercase tracking-wider text-foreground">
                        {texts[lang].imageZone}
                      </h4>
                      <p className="text-[10px] text-foreground/65 max-w-xs mx-auto mt-1 leading-normal font-semibold">
                        {texts[lang].imageZoneSub}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                      {/* Gallery Select Button */}
                      <label className="flex items-center justify-center gap-2 px-5 py-3 bg-cyan-100 hover:bg-cyan-200 text-foreground border-2 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer select-none">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            if (e.target.files) {
                              const selectedFiles = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
                              if (selectedFiles.length > 0) {
                                addAutofillFiles(selectedFiles);
                              }
                            }
                          }}
                          className="hidden"
                          disabled={autofillLoading}
                        />
                        <ImageIcon className="h-4.5 w-4.5" />
                        <span>{texts[lang].btnSelectImages}</span>
                      </label>

                      {/* Camera Capture Button */}
                      <label className="flex items-center justify-center gap-2 px-5 py-3 bg-yellow-300 hover:bg-yellow-400 text-foreground border-2 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer select-none">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              addAutofillFiles([file]);
                            }
                          }}
                          className="hidden"
                          disabled={autofillLoading}
                        />
                        <Camera className="h-4.5 w-4.5" />
                        <span>{texts[lang].btnTakePhotos}</span>
                      </label>
                    </div>
                    
                    <p className="text-[9px] text-foreground/45 font-semibold pt-1 uppercase tracking-wider">
                      {lang === 'sv' ? 'Stöder JPG, PNG • Lokalt OCR fallbacks' : 'Supports JPG, PNG • Local OCR fallback'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-foreground">
                        {texts[lang].uploadedImages} ({autofillImages.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          autofillImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
                          setAutofillImages([]);
                        }}
                        disabled={autofillLoading}
                        className="text-[9px] font-black uppercase text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {lang === 'sv' ? 'Rensa alla' : 'Clear all'}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {autofillImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg border-2 border-foreground overflow-hidden bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <img 
                            src={img.previewUrl} 
                            alt={`Selected page ${idx + 1}`} 
                            className="w-full h-full object-cover" 
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAutofillImage(idx);
                            }}
                            disabled={autofillLoading}
                            className="absolute top-1 right-1 p-1 bg-red-400 hover:bg-red-500 border-2 border-foreground rounded-md text-foreground cursor-pointer transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none"
                            title={texts[lang].removeImage}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}

                      {/* "+" Add slot/placeholder inside the grid */}
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-foreground/30 hover:border-foreground/80 aspect-square rounded-lg bg-gray-50/50 hover:bg-white transition-all cursor-pointer group">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            if (e.target.files) {
                              const selectedFiles = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
                              if (selectedFiles.length > 0) {
                                addAutofillFiles(selectedFiles);
                              }
                            }
                          }}
                          className="hidden"
                          disabled={autofillLoading}
                        />
                        <Plus className="h-5 w-5 text-foreground/45 group-hover:text-foreground transition-colors" />
                        <span className="text-[8px] font-black uppercase text-foreground/45 group-hover:text-foreground mt-1 transition-colors">
                          {lang === 'sv' ? 'Lägg till' : 'Add file'}
                        </span>
                      </label>
                    </div>

                    <p className="text-[9px] text-foreground/50 font-semibold italic text-center">
                      {lang === 'sv' 
                        ? 'Dra fler bilder hit eller klicka på Lägg till för att lägga till fler sidor' 
                        : 'Drag more images here or click Add file to add more pages'}
                    </p>

                    <div className="pt-2 flex justify-center">
                      <button
                        type="button"
                        onClick={handleImageAutofill}
                        disabled={autofillLoading}
                        className="flex items-center gap-2 px-6 py-3.5 bg-yellow-300 hover:bg-yellow-400 disabled:opacity-50 text-foreground border-3 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer select-none"
                      >
                        {autofillLoading ? (
                          <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-4.5 w-4.5" />
                        )}
                        <span>{texts[lang].btnAnalyze}</span>
                      </button>
                    </div>
                  </div>
                )}
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
                    onClick={() => {
                      setPreviewData(null);
                      autofillImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
                      setAutofillImages([]);
                    }}
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

            <div className="space-y-3 col-span-2 md:col-span-1">
              <label className="text-[10px] font-black text-foreground/80 uppercase tracking-widest leading-none block mb-1.5">
                {lang === 'sv' ? 'Receptbilder' : 'Recipe Images'}
              </label>
              
              {/* Drag and Drop Zone */}
              <div 
                className={cn(
                  "border-3 border-dashed rounded-xl p-4 bg-white transition-all text-center flex flex-col items-center justify-center min-h-[120px] cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
                  isDraggingImage 
                    ? "border-primary bg-primary/5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" 
                    : "border-foreground/30 hover:border-foreground/80"
                )}
                onDragOver={handleDragOverImage}
                onDragLeave={handleDragLeaveImage}
                onDrop={handleDropImage}
                onClick={() => imageFileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={imageFileInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleImageUploadChange}
                  className="hidden"
                />
                
                <div className="space-y-2">
                  <div className="mx-auto w-8 h-8 rounded-full bg-cyan-50 border-2 border-foreground flex items-center justify-center text-foreground">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <div className="text-[10px] font-bold text-foreground/75 leading-normal max-w-[240px] mx-auto">
                    {lang === 'sv' 
                      ? 'Släpp bildfiler här (flera går bra), eller klicka för att bläddra' 
                      : 'Drop image files here (multiple allowed), or click to browse'}
                  </div>
                </div>
              </div>

              {/* Thumbnails Gallery */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1.5">
                  {images.map((imgSrc, idx) => {
                    const isCover = imgSrc === image;
                    return (
                      <div 
                        key={idx} 
                        className={cn(
                          "relative group aspect-square rounded-lg border-2 overflow-hidden bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-all",
                          isCover ? "border-primary ring-2 ring-primary/20" : "border-foreground"
                        )}
                      >
                        <img 
                          src={imgSrc} 
                          alt={`Thumbnail ${idx + 1}`} 
                          className="w-full h-full object-cover" 
                        />
                        
                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                          {/* Delete Button */}
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newImages = images.filter((_, i) => i !== idx);
                                setImages(newImages);
                                // If we deleted the cover image, pick another one or set to empty
                                if (isCover) {
                                  setImage(newImages.length > 0 ? newImages[0] : '');
                                }
                              }}
                              className="p-1 bg-red-100 hover:bg-red-200 text-red-700 border border-foreground rounded shadow transition-all"
                              title={lang === 'sv' ? 'Ta bort bild' : 'Delete image'}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Set Cover Button */}
                          {!isCover && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setImage(imgSrc);
                              }}
                              className="w-full py-0.5 text-[8px] font-black uppercase text-foreground bg-cyan-100 hover:bg-cyan-200 border border-foreground rounded text-center transition-all"
                            >
                              {lang === 'sv' ? 'Sätt som omslag' : 'Set as cover'}
                            </button>
                          )}
                        </div>

                        {/* Cover Badge */}
                        {isCover && (
                          <div className="absolute top-1 left-1 bg-primary text-[7px] text-white font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-white leading-none shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)]">
                            {lang === 'sv' ? 'Omslag' : 'Cover'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-4">
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

            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label className="text-[10px] font-black text-foreground/80 uppercase tracking-widest leading-none block mb-1.5">{t('form.meal_type')} *</label>
              <div className="flex flex-wrap gap-2.5 pt-1.5">
                {MEAL_TYPES.map(mt => {
                  const isChecked = mealTypes.includes(mt);
                  return (
                    <label
                      key={mt}
                      className={cn(
                        "flex items-center gap-2 px-3.5 py-2.5 border-2 border-foreground rounded-xl text-xs font-black uppercase cursor-pointer select-none transition-all",
                        isChecked 
                          ? "bg-amber-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[-1px]" 
                          : "bg-white hover:bg-amber-50/30"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setMealTypes(mealTypes.filter(x => x !== mt));
                          } else {
                            setMealTypes([...mealTypes, mt]);
                          }
                        }}
                        className="sr-only"
                      />
                      <span>{t(`meal.${mt}`)}</span>
                    </label>
                  );
                })}
              </div>
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
          </div>
        </section>

        {/* Section 3: Ingredients */}
        <section className="bg-card border-3 border-foreground p-5 md:p-8 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5 bg-[radial-gradient(rgba(0,0,0,0.02)_1.5px,transparent_1.5px)] [background-size:16px_16px]">
          <div className="border-b-2 border-foreground/15 pb-2">
            <h3 className="font-black text-lg text-foreground uppercase tracking-tight">{t('form.ingredients')}</h3>
          </div>

          <div className="space-y-4">
            {ingredients.map((ing, index) => (
              <div 
                key={index} 
                draggable
                onDragStart={() => handleIngredientDragStart(index)}
                onDragOver={(e) => handleIngredientDragOver(e, index)}
                onDragEnd={handleIngredientDragEnd}
                className={cn(
                  "flex flex-col sm:flex-row gap-3 sm:gap-2 items-center p-3 sm:p-1 border-2 border-foreground/15 sm:border-none rounded-2xl sm:rounded-none bg-[#faf8f5]/40 sm:bg-transparent shadow-[2px_2px_0px_0px_rgba(0,0,0,0.03)] sm:shadow-none transition-all duration-200",
                  draggedIngredientIndex === index ? "opacity-45 bg-secondary border-2 border-dashed border-muted-foreground/30" : ""
                )}
              >
                {/* Row 1 on Mobile: Drag Handle + Name + Delete button */}
                <div className="flex items-center gap-2 w-full">
                  {/* Drag Handle */}
                  <div className="cursor-grab active:cursor-grabbing text-foreground/50 hover:text-foreground shrink-0 p-1">
                    <GripVertical className="h-4.5 w-4.5" />
                  </div>

                  <input
                    type="text"
                    placeholder={t('form.ingredient_placeholder')}
                    value={ing.name}
                    onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                    className="flex-1 p-2.5 bg-white border-2 border-foreground rounded-xl text-xs font-semibold placeholder:text-foreground/50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                  />

                  {/* Delete button (only visible in row 1 on mobile) */}
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(index)}
                      className="sm:hidden p-2.5 bg-red-100 hover:bg-red-200 border-2 border-foreground text-red-800 rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] cursor-pointer"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>

                {/* Row 2 on Mobile: Quantity + Unit + Optional toggle grid */}
                <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <div className="col-span-1">
                    <input
                      type="number"
                      step="any"
                      placeholder={t('form.quantity_placeholder')}
                      value={ing.quantity !== null ? ing.quantity : ''}
                      onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                      className="w-full sm:w-20 p-2.5 bg-white border-2 border-foreground rounded-xl text-xs font-mono text-center placeholder:text-foreground/50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                    />
                  </div>

                  <div className="col-span-1">
                    <input
                      type="text"
                      placeholder={t('form.unit_placeholder')}
                      value={ing.unit || ''}
                      onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                      className="w-full sm:w-16 p-2.5 bg-white border-2 border-foreground rounded-xl text-xs font-bold uppercase text-center placeholder:text-foreground/50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                    />
                  </div>

                  <label className="col-span-1 flex items-center justify-center gap-1 cursor-pointer select-none text-[9px] font-black uppercase text-foreground border-2 border-foreground rounded-xl p-2.5 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-secondary/10 active:translate-y-[1px] transition-all h-full text-center">
                    <input
                      type="checkbox"
                      checked={ing.optional}
                      onChange={(e) => handleIngredientChange(index, 'optional', e.target.checked)}
                      className="h-4 w-4 accent-foreground border-2 border-foreground rounded cursor-pointer"
                    />
                    <span className="truncate">{t('form.optional')}</span>
                  </label>
                </div>

                {/* Delete button (only visible on desktop, far right) */}
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(index)}
                    className="hidden sm:block p-2.5 bg-red-100 hover:bg-red-200 border-2 border-foreground text-red-800 rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] cursor-pointer"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddIngredient}
            className="w-full py-3 bg-cyan-100 hover:bg-cyan-200 text-foreground border-3 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>{t('form.add_ingredient')}</span>
          </button>
        </section>

        {/* Section 4: Instructions */}
        <section className="bg-card border-3 border-foreground p-5 md:p-8 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5 bg-[radial-gradient(rgba(0,0,0,0.02)_1.5px,transparent_1.5px)] [background-size:16px_16px]">
          <div className="border-b-2 border-foreground/15 pb-2">
            <h3 className="font-black text-lg text-foreground uppercase tracking-tight">{t('form.instructions')}</h3>
          </div>

          <div className="space-y-4">
            {instructions.map((step, index) => (
              <div 
                key={index} 
                draggable
                onDragStart={() => handleInstructionDragStart(index)}
                onDragOver={(e) => handleInstructionDragOver(e, index)}
                onDragEnd={handleInstructionDragEnd}
                className={cn(
                  "flex flex-col sm:flex-row gap-2.5 sm:gap-3 p-3 sm:p-1.5 border-2 border-foreground/15 sm:border-none rounded-2xl sm:rounded-none bg-[#faf8f5]/40 sm:bg-transparent transition-all duration-200",
                  draggedInstructionIndex === index ? "opacity-45 bg-secondary border-2 border-dashed border-muted-foreground/30" : ""
                )}
              >
                {/* Row 1 on Mobile: Drag Handle + Step badge + Delete Button */}
                <div className="flex items-center justify-between w-full sm:w-auto gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    {/* Drag Handle */}
                    <div className="cursor-grab active:cursor-grabbing text-foreground/50 hover:text-foreground shrink-0 p-1">
                      <GripVertical className="h-4.5 w-4.5" />
                    </div>
                    
                    {/* Step badge */}
                    <span className="h-6 px-2.5 sm:px-0 sm:w-6 rounded-full bg-foreground text-background text-[10px] sm:text-xs font-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase sm:normal-case shrink-0">
                      <span className="sm:hidden mr-1">Steg</span>{index + 1}
                    </span>
                  </div>

                  {/* Delete button (only visible in row 1 on mobile) */}
                  {instructions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveInstruction(index)}
                      className="sm:hidden p-2.5 bg-red-100 hover:bg-red-200 border-2 border-foreground text-red-800 rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {/* Textarea (takes full width on mobile) */}
                <textarea
                  placeholder={t('form.step_placeholder')}
                  value={step}
                  onChange={(e) => handleInstructionChange(index, e.target.value)}
                  rows={2}
                  className="w-full flex-1 p-2.5 bg-white border-2 border-foreground rounded-xl text-xs font-semibold placeholder:text-foreground/50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                />

                {/* Delete button (only visible on desktop, far right) */}
                {instructions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveInstruction(index)}
                    className="hidden sm:block p-2.5 bg-red-100 hover:bg-red-200 border-2 border-foreground text-red-800 rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] cursor-pointer mt-1"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddInstruction}
            className="w-full py-3 bg-cyan-100 hover:bg-cyan-200 text-foreground border-3 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>{t('form.add_step')}</span>
          </button>
        </section>

        {/* Section 5: Nutrition Information */}
        <section className="bg-card border-3 border-foreground p-6 md:p-8 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5 bg-[radial-gradient(rgba(0,0,0,0.02)_1.5px,transparent_1.5px)] [background-size:16px_16px]">
          <div className="flex justify-between items-center gap-2 flex-wrap">
            <h3 className="font-black text-lg text-foreground uppercase tracking-tight">{t('form.nutrition')}</h3>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleEstimateNutrition}
                disabled={isEstimatingNutrition}
                className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-foreground border-2 border-foreground font-black text-[10px] uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEstimatingNutrition ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{language === 'sv' ? 'Beräknar...' : 'Estimating...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 fill-current" />
                    <span>{language === 'sv' ? 'Beräkna med AI' : 'Estimate with AI'}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleClearNutrition}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 border-2 border-foreground font-black text-[10px] uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                <span>{language === 'sv' ? 'Rensa alla' : 'Clear all'}</span>
              </button>
            </div>
          </div>

          {nutritionError && (
            <div className="p-3.5 bg-red-50 border-2 border-red-500 rounded-xl flex items-start gap-2.5 text-xs text-red-850 font-semibold shadow-[2px_2px_0px_0px_rgba(239,68,68,0.2)]">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <span>{nutritionError}</span>
            </div>
          )}
          
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
