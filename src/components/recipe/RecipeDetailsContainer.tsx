'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Clock, 
  Flame, 
  Trash2, 
  Edit3, 
  ChevronLeft, 
  ChefHat, 
  Globe, 
  Sparkles,
  Link as LinkIcon
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

  const handleDelete = async () => {
    if (confirm(`Är du säker på att du vill ta bort ${recipe.name}?`)) {
      setIsDeleting(true);
      try {
        await deleteRecipe(recipe.id);
        router.push('/recipes');
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
          href="/recipes"
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

      {/* Main Recipe Info Hero Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Large Image & Main Details (Left 2 columns on desktop) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main Recipe Card Header */}
          <div className="bg-card border-3 border-foreground rounded-[2rem] overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            {/* Image banner */}
            <div className="relative h-64 md:h-80 bg-secondary border-b-3 border-foreground">
              {recipe.image ? (
                <Image
                  src={recipe.image}
                  alt={recipe.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 750px"
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
            <h3 className="font-black text-lg text-foreground uppercase tracking-tight">Instruktioner</h3>
            <ol className="space-y-4">
              {recipe.instructions.map((step, idx) => (
                <li key={idx} className="flex gap-4">
                  <span className="h-6 w-6 rounded-full bg-amber-100 text-foreground border-2 border-foreground font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    {idx + 1}
                  </span>
                  <p className="text-xs md:text-sm leading-relaxed text-foreground font-medium">{step}</p>
                </li>
              ))}
            </ol>
          </section>

        </div>

        {/* Scalers & Ingredients (Right 1 column on desktop) */}
        <div className="space-y-8">
          
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
          />

        </div>

      </div>
      
    </div>
  );
}
