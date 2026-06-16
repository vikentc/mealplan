import React from 'react';
import { RotateCcw } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface Ingredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  optional: boolean;
}

interface IngredientListProps {
  ingredients: Ingredient[];
  servings: number;
  originalServings: number;
  checkedIngredients?: Record<number, boolean>;
  onToggleIngredient?: (idx: number) => void;
  onClearIngredients?: () => void;
}

export default function IngredientList({
  ingredients,
  servings,
  originalServings,
  checkedIngredients = {},
  onToggleIngredient,
  onClearIngredients
}: IngredientListProps) {
  const portionFactor = servings / originalServings;
  const { t } = useLanguage();

  const formatQuantity = (val: number) => {
    if (val === 0) return '0';
    // Round to max 2 decimal places
    return Math.round(val * 100) / 100;
  };

  return (
    <div className="bg-card border-3 border-foreground p-6 rounded-[2rem] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex justify-between items-center gap-2 mb-4 flex-wrap">
        <h3 className="font-black text-lg text-foreground uppercase tracking-tight">{t('details.ingredients')}</h3>
        {Object.values(checkedIngredients).some(Boolean) && onClearIngredients && (
          <button
            onClick={onClearIngredients}
            type="button"
            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 border-2 border-foreground font-black text-[9px] uppercase tracking-wider rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-1 shrink-0"
          >
            <RotateCcw className="h-3 w-3" />
            <span>{t('details.clear')}</span>
          </button>
        )}
      </div>
      
      <ul className="divide-y-2 divide-foreground/20 space-y-0.5">
        {ingredients.map((ing, idx) => {
          // Original quantity scaled by portions
          const baseQty = ing.quantity !== null ? ing.quantity * portionFactor : null;
          
          // Final quantity (incorporating portion scaling)
          const finalQty = baseQty;

          // Visual change indicators
          const portionChanged = servings !== originalServings;
          const isChecked = !!checkedIngredients[idx];

          return (
            <li 
              key={idx} 
              className={`py-3.5 flex items-center justify-between gap-4 transition-all duration-200 ${
                isChecked ? "opacity-60 bg-emerald-50/10" : ""
              }`}
            >
              {/* Ingredient Name with Checkbox click-handler */}
              <div 
                className="flex items-center gap-3 select-none cursor-pointer"
                onClick={() => onToggleIngredient && onToggleIngredient(idx)}
              >
                {onToggleIngredient && (
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // toggling handled by parent div click
                    className="h-5 w-5 rounded-full border-2 border-foreground bg-white checked:bg-[#f5ecd8] focus:ring-0 focus:ring-offset-0 cursor-pointer appearance-none shrink-0 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] checked:shadow-none checked:translate-y-[1.5px] transition-all relative after:content-[''] after:hidden checked:after:block after:absolute after:left-[5.5px] after:top-[1.5px] after:w-[5px] after:h-[10px] after:border-r-2 after:border-b-2 after:border-foreground after:rotate-45"
                  />
                )}
                <div className="flex items-center gap-2.5">
                  <div>
                    <span className={`text-xs font-black uppercase tracking-tight ${
                      isChecked ? "line-through text-foreground/50" : "text-foreground"
                    }`}>
                      {ing.name}
                    </span>
                    {ing.optional && (
                      <span className="text-[9px] text-foreground ml-1.5 font-black uppercase tracking-wider bg-amber-100 px-1.5 py-0.5 rounded-md border-2 border-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        {t('details.optional')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity scaling Display */}
              <div className="text-right flex items-center gap-1.5 font-black text-xs">
                {portionChanged && ing.quantity !== null && (
                  <span className="text-[10px] text-foreground/60 line-through mr-1">
                    {formatQuantity(ing.quantity)} {ing.unit || ''}
                  </span>
                )}
                
                {finalQty !== null ? (
                  <span className={`font-black ${
                    portionChanged 
                      ? "text-foreground bg-cyan-100 px-2 py-0.5 rounded-md border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px]" 
                      : "text-foreground"
                  }`}>
                    {`${formatQuantity(finalQty)} ${ing.unit || ''}`}
                  </span>
                ) : (
                  <span className="text-foreground/75 text-[10px] font-black uppercase tracking-wider italic">{t('details.to_taste')}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
