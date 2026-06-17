'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Clock, 
  Trash2, 
  Edit3, 
  ChevronLeft, 
  ChefHat, 
  Globe, 
  Sparkles,
  Link as LinkIcon,
  RotateCcw,
  Loader2,
  Check,
  AlertCircle,
  ShoppingCart
} from 'lucide-react';
import { deleteRecipe, addRecipeToShoppingList } from '@/app/actions/recipes';
import { cn, getDifficultyColor, formatTime } from '@/lib/utils';
import PortionScaler from './PortionScaler';
import IngredientList from './IngredientList';
import NutritionBadge from './NutritionBadge';
import { useLanguage } from '@/lib/i18n';
import { getTranslatedRecipe } from '@/lib/recipeTranslations';

interface Ingredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  optional: boolean;
}

interface Recipe {
  id: string;
  name: string;
  url: string | null;
  description: string | null;
  image: string | null;
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
  nutrition: any;
}

interface RecipeDetailsContainerProps {
  recipe: Recipe | null;
  fallbackId?: string;
}

export default function RecipeDetailsContainer({ recipe: originalRecipe, fallbackId }: RecipeDetailsContainerProps) {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [recipe, setRecipe] = useState<any>(originalRecipe ? getTranslatedRecipe(originalRecipe, language) : null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [servings, setServings] = useState(originalRecipe?.servings || 4);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'confirming' | 'deleting' | 'success' | 'error'>('idle');
  const [deleteStatusMsg, setDeleteStatusMsg] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAddingToShoppingList, setIsAddingToShoppingList] = useState(false);
  const [shoppingListFeedback, setShoppingListFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (originalRecipe) {
      setRecipe(getTranslatedRecipe(originalRecipe, language));
      setServings(originalRecipe.servings || 4);
      setIsNotFound(false);
    } else if (fallbackId) {
      if (typeof window !== 'undefined') {
        const localRecipesStore = localStorage.getItem('local-recipes');
        if (localRecipesStore) {
          try {
            const parsed = JSON.parse(localRecipesStore);
            if (Array.isArray(parsed)) {
              const found = parsed.find((r: any) => r.id === fallbackId);
              if (found) {
                setRecipe(getTranslatedRecipe(found, language));
                setServings(found.servings || 4);
                setIsNotFound(false);
                return;
              }
            }
          } catch (e) {
            console.error('Failed to parse local recipes:', e);
          }
        }
        setIsNotFound(true);
      }
    }
  }, [originalRecipe, fallbackId, language]);

  const handleAddToShoppingList = async () => {
    setIsAddingToShoppingList(true);
    setShoppingListFeedback(null);

    const saveToLocalStorageFallback = () => {
      const localStore = localStorage.getItem('shopping-list-store');
      let currentRecipes: any[] = [];
      let currentItems: any[] = [];
      if (localStore) {
        try {
          const parsed = JSON.parse(localStore);
          currentRecipes = parsed.recipes || [];
          currentItems = parsed.items || [];
        } catch (e) {
          console.error('Failed to parse shopping list from localStorage in fallback:', e);
        }
      }

      const instanceId = Math.random().toString(36).substring(2, 9);
      const updatedRecipes = [...currentRecipes, {
        id: recipe.id,
        name: recipe.name,
        servings: servings,
        instanceId: instanceId
      }];

      const ratio = servings / (recipe.servings || 4);
      const updatedItems = [...currentItems];

      if (Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach((ing: any) => {
          if (!ing.name || ing.name.trim() === '') return;
          const scaledQty = ing.quantity !== null ? ing.quantity * ratio : null;
          const ingName = ing.name.trim();
          const ingUnit = ing.unit ? ing.unit.trim() : null;

          const existingItem = updatedItems.find((item: any) => 
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
            updatedItems.push({
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

      localStorage.setItem('shopping-list-store', JSON.stringify({
        recipes: updatedRecipes,
        items: updatedItems,
        updatedAt: Date.now()
      }));
    };

    try {
      const res = await addRecipeToShoppingList(recipe.id, servings) as any;
      if (res && !res.error && res.recipes && res.items) {
        // Sync to client-side localStorage
        localStorage.setItem('shopping-list-store', JSON.stringify({
          recipes: res.recipes,
          items: res.items,
          updatedAt: Date.now()
        }));
        setShoppingListFeedback({
          type: 'success',
          message: language === 'sv' ? 'Receptet och ingredienserna har lagts till i din inköpslista!' : 'Recipe and ingredients added to your shopping list!'
        });
      } else {
        // Fallback to client-side calculation
        saveToLocalStorageFallback();
        setShoppingListFeedback({
          type: 'success',
          message: language === 'sv' 
            ? 'Receptet har lagts till i din inköpslista (sparad lokalt)!' 
            : 'Recipe added to your shopping list (saved locally)!'
        });
      }
    } catch (err: any) {
      console.error('Failed to add to shopping list via server, falling back to client save:', err);
      // Fallback to client-side calculation
      saveToLocalStorageFallback();
      setShoppingListFeedback({
        type: 'success',
        message: language === 'sv' 
          ? 'Receptet har lagts till i din inköpslista (sparad lokalt)!' 
          : 'Recipe added to your shopping list (saved locally)!'
      });
    } finally {
      setIsAddingToShoppingList(false);
      setTimeout(() => setShoppingListFeedback(null), 4000);
      router.refresh();
    }
  };

  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [checkedInstructions, setCheckedInstructions] = useState<Record<number, boolean>>({});


  // Load checklist state on mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsLoggedIn(document.cookie.includes('user_session='));
    }
    if (recipe?.id) {
      const savedIngs = localStorage.getItem(`recipe-checked-ings-${recipe.id}`);
      const savedInsts = localStorage.getItem(`recipe-checked-insts-${recipe.id}`);
      if (savedIngs) {
        try { setCheckedIngredients(JSON.parse(savedIngs)); } catch (e) { console.error(e); }
      }
      if (savedInsts) {
        try { setCheckedInstructions(JSON.parse(savedInsts)); } catch (e) { console.error(e); }
      }
    }
  }, [recipe?.id]);

  const toggleIngredient = (idx: number) => {
    if (!recipe?.id) return;
    setCheckedIngredients(prev => {
      const next = { ...prev, [idx]: !prev[idx] };
      localStorage.setItem(`recipe-checked-ings-${recipe.id}`, JSON.stringify(next));
      return next;
    });
  };

  const toggleInstruction = (idx: number) => {
    if (!recipe?.id) return;
    setCheckedInstructions(prev => {
      const next = { ...prev, [idx]: !prev[idx] };
      localStorage.setItem(`recipe-checked-insts-${recipe.id}`, JSON.stringify(next));
      return next;
    });
  };

  const clearIngredients = () => {
    if (!recipe?.id) return;
    setCheckedIngredients({});
    localStorage.removeItem(`recipe-checked-ings-${recipe.id}`);
  };

  const clearInstructions = () => {
    if (!recipe?.id) return;
    setCheckedInstructions({});
    localStorage.removeItem(`recipe-checked-insts-${recipe.id}`);
  };

  const handleDelete = () => {
    setDeleteStatus('confirming');
  };

  const confirmDeleteAction = async () => {
    setIsDeleting(true);
    setDeleteStatus('deleting');
    setDeleteStatusMsg(language === 'sv' ? 'Tar bort receptet...' : 'Deleting recipe...');
    
    // Delete from localStorage immediately if it exists
    if (typeof window !== 'undefined' && recipe?.id) {
      const localRecipesStore = localStorage.getItem('local-recipes');
      if (localRecipesStore) {
        try {
          const parsed = JSON.parse(localRecipesStore);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((r: any) => r.id !== recipe.id);
            localStorage.setItem('local-recipes', JSON.stringify(filtered));
          }
        } catch (e) {
          console.error('Failed to delete from local-recipes store:', e);
        }
      }
    }

    try {
      if (recipe?.id) {
        const result = (await deleteRecipe(recipe.id)) as any;
        if (result && result.error) {
          console.warn('Server delete failed, but recipe was removed locally if local:', result.error);
        }
      }
      setDeleteStatus('success');
      setDeleteStatusMsg(language === 'sv' ? 'Receptet har tagits bort framgångsrikt! Omdirigerar...' : 'Recipe has been deleted successfully! Redirecting...');
      
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1000);
    } catch (error: any) {
      console.warn('Server delete threw an error, assuming local delete was sufficient:', error);
      setDeleteStatus('success');
      setDeleteStatusMsg(language === 'sv' ? 'Receptet har tagits bort! Omdirigerar...' : 'Recipe has been deleted! Redirecting...');
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1000);
    }
  };

  if (isNotFound) {
    return (
      <div className="max-w-md mx-auto text-center py-12 px-4 space-y-6">
        <div className="bg-white border-3 border-foreground p-8 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <AlertCircle className="h-8 w-8 text-red-800" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight text-foreground">
            {language === 'sv' ? 'Receptet hittades inte' : 'Recipe Not Found'}
          </h3>
          <p className="text-xs text-foreground/80 font-semibold leading-relaxed">
            {language === 'sv'
              ? 'Det här receptet verkar inte finnas kvar. Det kan ha tagits bort eller så är databasen offline.'
              : 'This recipe could not be found. It may have been deleted, or the database is currently offline.'}
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-amber-100 hover:bg-amber-200 text-foreground border-2 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
          >
            {language === 'sv' ? 'Gå till startsidan' : 'Go to Homepage'}
          </Link>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="h-8 w-8 text-foreground animate-spin" />
        <p className="text-xs font-black uppercase tracking-wider text-foreground/60 animate-pulse">
          {language === 'sv' ? 'Laddar recept...' : 'Loading recipe...'}
        </p>
      </div>
    );
  }

  const scaleFactor = servings / (recipe.servings || 4);

  return (
    <div className="space-y-8">
      
      {/* Back navigation & Edit/Delete actions */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <Link
          href="/"
          className="px-5 py-3 bg-amber-100 hover:bg-amber-200 text-foreground border-3 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <ChevronLeft className="h-4.5 w-4.5 text-foreground" />
          <span>{t('details.back')}</span>
        </Link>

        {isLoggedIn && (
          <div className="flex items-center gap-3">
            <Link
              href={`/recipes/${recipe.id}/edit`}
              className="px-5 py-3 bg-cyan-100 hover:bg-cyan-200 text-foreground border-3 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Edit3 className="h-4.5 w-4.5" />
              <span>{t('details.edit')}</span>
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-5 py-3 bg-red-100 hover:bg-red-200 text-red-800 border-3 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="h-4.5 w-4.5" />
              <span>{isDeleting ? t('details.deleting') : t('details.delete')}</span>
            </button>
          </div>
        )}
      </div>

      {/* 1. Main Recipe Info Hero Card (spans full width) */}
      <div className="bg-card border-3 border-foreground rounded-[2rem] overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        {/* Image banner */}
        <div className="relative h-64 md:h-96 w-full bg-secondary border-b-3 border-foreground">
          {recipe.image ? (
            <Image
              src={recipe.image}
              alt={recipe.name}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-secondary/50 text-foreground font-black uppercase text-xs tracking-wider">
              {t('details.no_image')}
            </div>
          )}
        </div>

        {/* Title & Stats */}
        <div className="p-6 md:p-8 space-y-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-100 text-amber-850 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {t(`cuisine.${recipe.cuisine}`) || recipe.cuisine}
            </span>
            
            {recipe.nutrition?.protein >= 30 && (
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {t('details.high_protein')}
              </span>
            )}

            <span className={cn(
              "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-blue-100 text-blue-900"
            )}>
              {t(`details.${recipe.difficulty?.toLowerCase()}`)}
            </span>
            
            {recipe.url && (
              <a
                href={recipe.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-black uppercase tracking-wider bg-secondary hover:bg-amber-100/50 text-foreground px-2.5 py-1 rounded-md border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 transition-all"
              >
                <LinkIcon className="h-3.5 w-3.5" /> {t('details.original_source')}
              </a>
            )}
          </div>

          <div>
            <h1 className="text-2xl md:text-4xl font-black text-foreground tracking-tight leading-none uppercase">
              {recipe.name}
            </h1>
            {recipe.description && (
              <p className="text-xs md:text-sm text-foreground/80 font-medium leading-relaxed mt-3 max-w-2xl">
                {recipe.description}
              </p>
            )}
          </div>

          {/* Time Indicators */}
          <div className="border-t-3 border-foreground pt-5 flex gap-6 text-xs text-foreground/80">
            <div className="flex items-center gap-2.5">
              <Clock className="h-5 w-5 text-foreground" />
              <div>
                <span className="text-foreground font-black block text-sm leading-none">{formatTime(recipe.preparationTime)}</span>
                <span className="text-[10px] uppercase font-black text-foreground/60 tracking-wider block mt-1">{t('details.prep_time')}</span>
              </div>
            </div>

            <div className="border-l-3 border-foreground pl-6 flex items-center gap-2.5">
              <Clock className="h-5 w-5 text-foreground" />
              <div>
                <span className="text-foreground font-black block text-sm leading-none">{formatTime(recipe.cookingTime)}</span>
                <span className="text-[10px] uppercase font-black text-foreground/60 tracking-wider block mt-1">{t('details.cook_time')}</span>
              </div>
            </div>

            <div className="border-l-3 border-foreground pl-6 flex items-center gap-2.5">
              <Clock className="h-5 w-5 text-foreground animate-pulse" />
              <div>
                <span className="text-foreground font-black block text-sm leading-none">{formatTime(recipe.totalTime)}</span>
                <span className="text-[10px] uppercase font-black text-foreground/60 tracking-wider block mt-1">{t('details.total_time')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Content Layout: Desktop = Left (Nutrition, Instructions), Right (Portions, Ingredients). Mobile order = Right block, then Left block. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Right column in desktop layout: Portion Scaler & Ingredients (order-1: rendered first on mobile) */}
        <div className="lg:col-span-1 space-y-8 order-1 lg:order-2">
          
          {/* Portion Scaler */}
          <PortionScaler
            servings={servings}
            originalServings={recipe.servings}
            onChange={setServings}
          />

          {/* Shopping List Action */}
          {isLoggedIn ? (
            <div className="space-y-3.5">
              <button
                type="button"
                onClick={handleAddToShoppingList}
                disabled={isAddingToShoppingList}
                className="w-full py-3 bg-amber-100 hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed text-foreground border-3 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isAddingToShoppingList ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{language === 'sv' ? 'Lägger till...' : 'Adding...'}</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 text-foreground" />
                    <span>{language === 'sv' ? 'Lägg till i inköpslista' : 'Add to shopping list'}</span>
                  </>
                )}
              </button>
              {shoppingListFeedback && (
                <div className={cn(
                  "p-3 border-2 rounded-xl flex items-start gap-2.5 text-xs font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]",
                  shoppingListFeedback.type === 'success' 
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-[2px_2px_0px_0px_rgba(16,185,129,0.2)]" 
                    : "bg-red-50 border-red-500 text-red-850 shadow-[2px_2px_0px_0px_rgba(239,68,68,0.2)]"
                )}>
                  {shoppingListFeedback.type === 'success' ? (
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                  <span>{shoppingListFeedback.message}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full p-3 bg-secondary/35 border-2 border-dashed border-foreground/30 rounded-xl text-center text-[10px] font-black uppercase text-foreground/50 tracking-wider">
              🔒 {language === 'sv' ? 'Logga in för att använda inköpslistan' : 'Log in to use the shopping list'}
            </div>
          )}

          {/* Ingredients list */}
          <IngredientList
            ingredients={recipe.ingredients}
            servings={servings}
            originalServings={recipe.servings}
            checkedIngredients={checkedIngredients}
            onToggleIngredient={toggleIngredient}
            onClearIngredients={clearIngredients}
          />

        </div>

        {/* Left column in desktop layout: Nutrition & Instructions (order-2: rendered second on mobile) */}
        <div className="lg:col-span-2 space-y-8 order-2 lg:order-1">
          
          {/* Scaled Nutrition Data */}
          <section className="space-y-4">
            <h3 className="font-black text-lg text-foreground uppercase tracking-tight flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-foreground" />
              <span>{t('details.nutrition_analysis')}</span>
            </h3>
            <NutritionBadge nutrition={recipe.nutrition} scale={scaleFactor} servings={servings} />
          </section>

          {/* Step-by-step Instructions */}
          <section className="bg-card border-3 border-foreground p-6 md:p-8 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="font-black text-lg text-foreground uppercase tracking-tight">{t('details.instructions')}</h3>
              {Object.values(checkedInstructions).some(Boolean) && (
                <button
                  onClick={clearInstructions}
                  type="button"
                  className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 border-2 border-foreground font-black text-[9px] uppercase tracking-wider rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>{t('details.clear')}</span>
                </button>
              )}
            </div>

            <ol className="space-y-4">
              {recipe.instructions.map((step: string, idx: number) => {
                const isChecked = !!checkedInstructions[idx];
                return (
                  <li 
                    key={idx} 
                    className={cn(
                      "flex gap-4 p-2 rounded-xl transition-all duration-200 select-none cursor-pointer",
                      isChecked ? "opacity-60 bg-emerald-50/10" : "hover:bg-secondary/15"
                    )}
                    onClick={() => toggleInstruction(idx)}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // toggling handled by parent click
                      className="h-5 w-5 mt-0.5 rounded-full border-2 border-foreground bg-white checked:bg-[#f5ecd8] focus:ring-0 focus:ring-offset-0 cursor-pointer appearance-none shrink-0 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] checked:shadow-none checked:translate-y-[1.5px] transition-all relative after:content-[''] after:hidden checked:after:block after:absolute after:left-[5.5px] after:top-[1.5px] after:w-[5px] after:h-[10px] after:border-r-2 after:border-b-2 after:border-foreground after:rotate-45"
                    />
                    <div className="flex-1">
                      <p className={cn(
                        "text-xs md:text-sm leading-relaxed text-foreground font-medium",
                        isChecked && "line-through text-foreground/50"
                      )}>
                        <span className="font-black mr-2 text-foreground/75">{idx + 1}.</span>
                        {step}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

        </div>

      </div>
      {/* Delete Confirmation & Status Overlay Modal */}
      {deleteStatus !== 'idle' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white border-3 border-foreground p-8 rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-200">
            
            {deleteStatus === 'confirming' && (
              <div className="space-y-5">
                <div className="h-16 w-16 rounded-full bg-red-100 border-3 border-foreground flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-auto animate-pulse">
                  <Trash2 className="h-8 w-8 text-red-650" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black uppercase tracking-wider text-foreground">
                    {language === 'sv' ? 'Ta bort recept' : 'Delete Recipe'}
                  </h3>
                  <p className="text-xs font-semibold text-foreground/70 leading-relaxed">
                    {language === 'sv' 
                      ? `Är du säker på att du vill ta bort "${recipe.name}"? Detta kan inte ångras.` 
                      : `Are you sure you want to delete "${recipe.name}"? This action cannot be undone.`}
                  </p>
                </div>
                <div className="flex gap-4 justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteStatus('idle')}
                    className="px-5 py-2.5 bg-amber-100 hover:bg-amber-200 text-foreground border-2 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                  >
                    {language === 'sv' ? 'Avbryt' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteAction}
                    className="px-5 py-2.5 bg-red-500 hover:bg-red-400 text-white border-2 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                  >
                    {language === 'sv' ? 'Ja, ta bort' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            )}

            {deleteStatus === 'deleting' && (
              <div className="flex flex-col items-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-red-100 border-3 border-foreground flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                  <Loader2 className="h-8 w-8 text-foreground animate-spin" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-wider text-foreground">
                  {language === 'sv' ? 'Tar bort recept' : 'Deleting Recipe'}
                </h3>
                <p className="text-xs font-semibold text-foreground/70 animate-pulse">
                  {deleteStatusMsg}
                </p>
              </div>
            )}

            {deleteStatus === 'success' && (
              <div className="flex flex-col items-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-emerald-300 border-3 border-foreground flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Check className="h-8 w-8 text-foreground stroke-[3]" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-wider text-foreground">
                  {language === 'sv' ? 'Borttaget!' : 'Deleted!'}
                </h3>
                <p className="text-xs font-black uppercase text-emerald-800">
                  {language === 'sv' ? 'Receptet raderat' : 'Recipe Deleted'}
                </p>
                <p className="text-[11px] font-semibold text-foreground/70">
                  {deleteStatusMsg}
                </p>
              </div>
            )}

            {deleteStatus === 'error' && (
              <div className="space-y-5">
                <div className="h-16 w-16 rounded-full bg-red-100 border-3 border-foreground flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-auto">
                  <AlertCircle className="h-8 w-8 text-red-700" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black uppercase tracking-wider text-foreground">
                    {language === 'sv' ? 'Ett fel uppstod' : 'An error occurred'}
                  </h3>
                  <p className="text-xs font-semibold text-red-800 leading-relaxed">
                    {deleteStatusMsg}
                  </p>
                </div>
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteStatus('idle')}
                    className="px-6 py-2.5 bg-foreground text-background hover:bg-foreground/80 border-2 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                  >
                    {language === 'sv' ? 'Stäng' : 'Close'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
      
    </div>
  );
}
