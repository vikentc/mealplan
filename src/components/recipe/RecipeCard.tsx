import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import { getTranslatedRecipe } from '@/lib/recipeTranslations';

interface RecipeCardProps {
  recipe: {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    totalTime: number;
    difficulty: string;
    cuisine: string;
    spiceLevel?: number;
    nutrition: any;
    moodTags?: string[];
  };
}

export default function RecipeCard({ recipe: originalRecipe }: RecipeCardProps) {
  const { language, t } = useLanguage();
  const recipe = getTranslatedRecipe(originalRecipe, language);

  
  return (
    <Link href={`/recipes/${recipe.id}`} className="block h-full group">
      <div className="bg-card border-3 border-foreground rounded-[2rem] overflow-hidden flex flex-col h-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all duration-300 hover:bg-amber-100/5">
        {/* Recipe Image with hovering tags */}
        <div className="relative h-48 w-full bg-secondary overflow-hidden border-b-3 border-foreground">
          {recipe.image ? (
            <Image
              src={recipe.image}
              alt={recipe.name}
              fill
              className="object-cover group-hover:scale-102 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-foreground font-black uppercase text-xs tracking-wider bg-secondary/50">
              {t('card.no_image')}
            </div>
          )}
          
          {/* Absolute Badges on Image */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 z-10">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-100 text-amber-850 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {t(`cuisine.${recipe.cuisine}`) || recipe.cuisine}
            </span>
          </div>



        </div>

        {/* Card Body */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            {/* Title and metadata */}
            <div className="flex items-center gap-2 mb-3">
              {recipe.nutrition?.protein >= 30 && (
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border-2 border-foreground bg-emerald-100 text-emerald-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {t('details.high_protein')}
                </span>
              )}
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-foreground bg-secondary/50 border-2 border-foreground px-2 py-0.5 rounded-md">
                <Clock className="h-3.5 w-3.5 text-foreground" />
                <span>{formatTime(recipe.totalTime)}</span>
              </div>
            </div>

            <h3 className="font-black text-base leading-snug text-foreground mb-1.5 group-hover:text-primary transition-colors line-clamp-1 uppercase tracking-tight">
              {recipe.name}
            </h3>

            <p className="text-xs text-foreground/80 font-medium line-clamp-2 mb-4">
              {recipe.description || t('card.no_desc')}
            </p>
          </div>

          {/* Bottom Nutrition Bar */}
          <div className="border-t-3 border-foreground pt-4 flex items-center justify-between">
            <div className="flex gap-3 text-[10px] font-black uppercase text-foreground/85">
              <div>
                <span className="font-black text-foreground block text-xs leading-none mb-0.5">{recipe.nutrition?.calories || 0}</span>
                <span>{t('card.kcal')}</span>
              </div>
              <div className="border-l-2 border-foreground pl-3">
                <span className="font-black text-emerald-800 block text-xs leading-none mb-0.5">{recipe.nutrition?.protein || 0}g</span>
                <span>{t('card.prot')}</span>
              </div>
              <div className="border-l-2 border-foreground pl-3">
                <span className="font-black text-foreground block text-xs leading-none mb-0.5">{recipe.nutrition?.carbohydrates || 0}g</span>
                <span>{t('card.carb')}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Link>
  );
}
