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
  RotateCcw
} from 'lucide-react';
import { deleteRecipe } from '@/app/actions/recipes';
import { cn, getDifficultyColor, formatTime } from '@/lib/utils';
import PortionScaler from './PortionScaler';
import IngredientList from './IngredientList';
import NutritionBadge from './NutritionBadge';

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
  countryOfOrigin: string | null;
  region: string | null;
  mealType: string;
  occasions: string[];
  flavorProfile: string[];
  moodTags: string[];
  spiceLevel: number;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: any;
}

interface RecipeDetailsContainerProps {
  recipe: Recipe;
}

export default function RecipeDetailsContainer({ recipe }: RecipeDetailsContainerProps) {
  const router = useRouter();
  const [servings, setServings] = useState(recipe.servings || 4);
  const [isDeleting, setIsDeleting] = useState(false);

  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [checkedInstructions, setCheckedInstructions] = useState<Record<number, boolean>>({});

  // Load checklist state on mount
  useEffect(() => {
    const savedIngs = localStorage.getItem(`recipe-checked-ings-${recipe.id}`);
    const savedInsts = localStorage.getItem(`recipe-checked-insts-${recipe.id}`);
    if (savedIngs) {
      try { setCheckedIngredients(JSON.parse(savedIngs)); } catch (e) { console.error(e); }
    }
    if (savedInsts) {
      try { setCheckedInstructions(JSON.parse(savedInsts)); } catch (e) { console.error(e); }
    }
  }, [recipe.id]);

  const toggleIngredient = (idx: number) => {
    setCheckedIngredients(prev => {
      const next = { ...prev, [idx]: !prev[idx] };
      localStorage.setItem(`recipe-checked-ings-${recipe.id}`, JSON.stringify(next));
      return next;
    });
  };

  const toggleInstruction = (idx: number) => {
    setCheckedInstructions(prev => {
      const next = { ...prev, [idx]: !prev[idx] };
      localStorage.setItem(`recipe-checked-insts-${recipe.id}`, JSON.stringify(next));
      return next;
    });
  };

  const clearIngredients = () => {
    setCheckedIngredients({});
    localStorage.removeItem(`recipe-checked-ings-${recipe.id}`);
  };

  const clearInstructions = () => {
    setCheckedInstructions({});
    localStorage.removeItem(`recipe-checked-insts-${recipe.id}`);
  };

  const handleDelete = async () => {
    if (confirm(`Är du säker på att du vill ta bort ${recipe.name}?`)) {
      setIsDeleting(true);
      try {
        await deleteRecipe(recipe.id);
        router.push('/');
        router.refresh();
      } catch (error) {
        console.error('Failed to delete recipe:', error);
        alert('Det gick inte att ta bort receptet.');
        setIsDeleting(false);
      }
    }
  };

  const scaleFactor = servings / recipe.servings;

  return (
    <div className="space-y-8">
      
      {/* Back navigation & Edit/Delete actions */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <Link
          href="/"
          className="px-5 py-3 bg-amber-100 hover:bg-amber-200 text-foreground border-3 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <ChevronLeft className="h-4.5 w-4.5 text-foreground" />
          <span>Tillbaka till recept</span>
        </Link>

        <div className="flex items-center gap-3">

          <Link
            href={`/recipes/${recipe.id}/edit`}
            className="px-5 py-3 bg-cyan-100 hover:bg-cyan-200 text-foreground border-3 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Edit3 className="h-4.5 w-4.5" />
            <span>Redigera</span>
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-3 bg-red-100 hover:bg-red-200 text-red-800 border-3 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="h-4.5 w-4.5" />
            <span>{isDeleting ? 'Tar bort...' : 'Ta bort'}</span>
          </button>
        </div>
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
              Bild saknas
            </div>
          )}
        </div>

        {/* Title & Stats */}
        <div className="p-6 md:p-8 space-y-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-100 text-amber-850 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {recipe.cuisine}
            </span>
            
            {recipe.nutrition?.protein >= 30 && (
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                💪 Högprotein
              </span>
            )}

            <span className={cn(
              "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-blue-100 text-blue-900"
            )}>
              {recipe.difficulty?.toLowerCase() === 'easy' ? 'Enkel' : recipe.difficulty?.toLowerCase() === 'medium' ? 'Medelsvår' : 'Svår'}
            </span>
            
            {recipe.url && (
              <a
                href={recipe.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-black uppercase tracking-wider bg-secondary hover:bg-amber-100/50 text-foreground px-2.5 py-1 rounded-md border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 transition-all"
              >
                <LinkIcon className="h-3.5 w-3.5" /> Originalkälla
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
                <span className="text-[10px] uppercase font-black text-foreground/60 tracking-wider block mt-1">Förberedelse</span>
              </div>
            </div>

            <div className="border-l-3 border-foreground pl-6 flex items-center gap-2.5">
              <Clock className="h-5 w-5 text-foreground" />
              <div>
                <span className="text-foreground font-black block text-sm leading-none">{formatTime(recipe.cookingTime)}</span>
                <span className="text-[10px] uppercase font-black text-foreground/60 tracking-wider block mt-1">Tillagning</span>
              </div>
            </div>

            <div className="border-l-3 border-foreground pl-6 flex items-center gap-2.5">
              <Clock className="h-5 w-5 text-foreground animate-pulse" />
              <div>
                <span className="text-foreground font-black block text-sm leading-none">{formatTime(recipe.totalTime)}</span>
                <span className="text-[10px] uppercase font-black text-foreground/60 tracking-wider block mt-1">Total tid</span>
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

          {/* Ingredients list */}
          <IngredientList
            ingredients={recipe.ingredients}
            servings={servings}
            originalServings={recipe.servings}
            spiceLevel={recipe.spiceLevel}
            originalSpiceLevel={recipe.spiceLevel}
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
              <span>Näringsanalys</span>
            </h3>
            <NutritionBadge nutrition={recipe.nutrition} scale={scaleFactor} servings={servings} />
          </section>

          {/* Step-by-step Instructions */}
          <section className="bg-card border-3 border-foreground p-6 md:p-8 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="font-black text-lg text-foreground uppercase tracking-tight">Instruktioner</h3>
              {Object.values(checkedInstructions).some(Boolean) && (
                <button
                  onClick={clearInstructions}
                  type="button"
                  className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 border-2 border-foreground font-black text-[9px] uppercase tracking-wider rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Rensa</span>
                </button>
              )}
            </div>

            <ol className="space-y-4">
              {recipe.instructions.map((step, idx) => {
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
      
    </div>
  );
}
