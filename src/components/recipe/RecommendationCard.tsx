import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Clock, Flame, Award, ChevronRight } from 'lucide-react';
import { getDifficultyColor, formatTime } from '@/lib/utils';

interface RecommendedRecipe {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  totalTime: number;
  difficulty: string;
  cuisine: string;
  spiceLevel: number;
  nutrition: any;
}

interface RecommendationCardProps {
  recipe: RecommendedRecipe;
  category: string; // e.g., "High Protein Pick", "Healthy Pick", "Quick Dinner", "Family Favorite", "Meal Prep Choice", "New Recipe Suggestion"
  description: string;
  onAddToPlanner?: (recipeId: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'High Protein Pick': 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  'Healthy Pick': 'bg-green-500/10 text-green-700 border-green-500/20',
  'Quick Dinner': 'bg-sky-500/10 text-sky-700 border-sky-500/20',
  'Family Favorite': 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
  'Meal Prep Choice': 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  'New Recipe Suggestion': 'bg-purple-500/10 text-purple-700 border-purple-500/20',
};

const categoryLabels: Record<string, string> = {
  'High Protein Pick': 'Proteinrikt val',
  'Healthy Pick': 'Hälsosamt val',
  'Quick Dinner': 'Snabb middag',
  'Family Favorite': 'Familjefavorit',
  'Meal Prep Choice': 'Bra för matlådan',
  'New Recipe Suggestion': 'Nytt receptförslag',
};

export default function RecommendationCard({
  recipe,
  category,
  description,
  onAddToPlanner
}: RecommendationCardProps) {
  return (
    <div className="group bg-card border-3 border-foreground rounded-[2rem] overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all duration-300 flex flex-col md:flex-row h-full">
      {/* Recipe Image (Left on desktop, Top on mobile) */}
      <div className="relative w-full md:w-56 h-48 md:h-auto min-h-[180px] bg-secondary shrink-0 overflow-hidden border-b-3 md:border-b-0 md:border-r-3 border-foreground">
        {recipe.image ? (
          <Image
            src={recipe.image}
            alt={recipe.name}
            fill
            className="object-cover group-hover:scale-102 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 250px"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-foreground font-black uppercase text-xs tracking-wider bg-secondary/50">
            Bild saknas
          </div>
        )}
        
        {/* Absolute Recommendation Category Tag on Image */}
        <div className="absolute top-4 left-4 z-10 md:hidden">
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-100 text-amber-850 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {categoryLabels[category] || category}
          </span>
        </div>
      </div>

      {/* Recipe Content (Right on desktop, Bottom on mobile) */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Top category label & stats */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="hidden md:inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-100 text-amber-850 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {categoryLabels[category] || category}
            </span>

            <div className="flex items-center gap-3 text-[10px] font-black uppercase text-foreground/80">
              <span className="px-2 py-0.5 rounded-md border-2 border-foreground bg-blue-100 text-blue-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                {recipe.difficulty.toLowerCase() === 'easy' ? 'Enkel' : recipe.difficulty.toLowerCase() === 'medium' ? 'Medelsvår' : 'Svår'}
              </span>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-foreground" />
                <span>{formatTime(recipe.totalTime)}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-black text-base md:text-lg text-foreground group-hover:text-primary transition-colors leading-tight mb-2.5 uppercase tracking-tight line-clamp-1">
              {recipe.name}
            </h3>
            {/* Recommendation Description */}
            <p className="text-[10px] font-black text-foreground bg-cyan-100 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-2.5 py-1 rounded-md flex items-center gap-1.5 mb-3.5 w-fit">
              <Sparkles className="h-3.5 w-3.5 fill-current" />
              <span>{description}</span>
            </p>
            <p className="text-xs text-foreground/85 font-medium line-clamp-2">
              {recipe.description || "Ett utsökt val utvalt för din hälsosamma veckoplanering."}
            </p>
          </div>
        </div>

        {/* Bottom Nutrition Bar & Actions */}
        <div className="border-t-3 border-foreground pt-4 mt-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-4 text-[10px] font-black uppercase text-foreground/85">
            <div>
              <span className="font-black text-foreground block text-xs leading-none mb-0.5">{recipe.nutrition?.protein || 0}g</span>
              <span>Protein</span>
            </div>
            <div className="border-l-2 border-foreground pl-4">
              <span className="font-black text-foreground block text-xs leading-none mb-0.5">{recipe.nutrition?.calories || 0}</span>
              <span>kcal</span>
            </div>
            <div className="border-l-2 border-foreground pl-4">
              <span className="font-black text-foreground block text-xs leading-none mb-0.5">{recipe.nutrition?.carbohydrates || 0}g</span>
              <span>kolh</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onAddToPlanner && (
              <button
                onClick={() => onAddToPlanner(recipe.id)}
                className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-2 border-foreground font-black text-[10px] uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              >
                Planera
              </button>
            )}
            <Link
              href={`/recipes/${recipe.id}`}
              className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-foreground border-2 border-foreground font-black text-[10px] uppercase tracking-wider rounded-xl flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            >
              <span>Recept</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
