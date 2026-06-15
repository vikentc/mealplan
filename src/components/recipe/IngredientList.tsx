import React from 'react';

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
  spiceLevel: number;
  originalSpiceLevel: number;
  checkedIngredients?: Record<number, boolean>;
  onToggleIngredient?: (idx: number) => void;
}

// Check if ingredient is spicy
const SPICY_KEYWORDS = [
  'chili', 'chiliflakes', 'chili flakes', 'cayenne', 'jalapeño', 'jalapeno', 
  'habanero', 'hot sauce', 'sambal', 'sriracha', 'chilipeppar', 'chilipulver'
];

function isSpicyIngredient(name: string): boolean {
  const lowercaseName = name.toLowerCase();
  return SPICY_KEYWORDS.some(keyword => lowercaseName.includes(keyword));
}

export default function IngredientList({
  ingredients,
  servings,
  originalServings,
  spiceLevel,
  originalSpiceLevel,
  checkedIngredients = {},
  onToggleIngredient
}: IngredientListProps) {
  const portionFactor = servings / originalServings;
  
  // Calculate spicy factor
  let spiceFactor = 1;
  if (originalSpiceLevel > 0) {
    spiceFactor = spiceLevel / originalSpiceLevel;
  } else if (spiceLevel > 0) {
    // If original was 0, but user selected spice level, baseline is spiceLevel
    spiceFactor = spiceLevel;
  } else {
    // spiceLevel = 0
    spiceFactor = 0;
  }

  const formatQuantity = (val: number) => {
    if (val === 0) return '0';
    // Round to max 2 decimal places
    return Math.round(val * 100) / 100;
  };

  return (
    <div className="bg-card border-3 border-foreground p-6 rounded-[2rem] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="font-black text-lg text-foreground mb-4 uppercase tracking-tight">Ingredienser</h3>
      
      <ul className="divide-y-2 divide-foreground/20 space-y-0.5">
        {ingredients.map((ing, idx) => {
          const isSpicy = isSpicyIngredient(ing.name);
          
          // Original quantity scaled by portions
          const baseQty = ing.quantity !== null ? ing.quantity * portionFactor : null;
          
          // Final quantity (incorporating spice scaling if spicy)
          let finalQty = baseQty;
          let showSpiceAlert = false;
          let isRemoved = false;

          if (isSpicy && ing.quantity !== null) {
            if (spiceLevel === 0) {
              finalQty = 0;
              isRemoved = true;
            } else if (originalSpiceLevel === 0) {
              // If it's a spicy ingredient but recipe was level 0,
              // we add a baseline quantity scaled by portion and spice level
              const baseline = 0.5; // default unit amount (e.g. 0.5 tsp or 0.5 pcs)
              finalQty = baseline * portionFactor * spiceLevel;
              showSpiceAlert = true;
            } else {
              finalQty = baseQty !== null ? baseQty * (spiceLevel / originalSpiceLevel) : null;
            }
          }

          // Visual change indicators
          const portionChanged = servings !== originalServings;
          const spiceChanged = isSpicy && spiceLevel !== originalSpiceLevel;
          const hasChanged = (portionChanged && ing.quantity !== null) || spiceChanged;

          const isChecked = !!checkedIngredients[idx];

          return (
            <li 
              key={idx} 
              className={`py-3.5 flex items-center justify-between gap-4 transition-all duration-200 ${
                isRemoved ? "opacity-45 line-through decoration-red-500/50 bg-red-100/20 rounded-xl px-2" : ""
              } ${isChecked ? "opacity-60 bg-emerald-50/10" : ""}`}
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
                      isChecked ? "line-through text-foreground/50" : isSpicy ? "text-red-850" : "text-foreground"
                    }`}>
                      {ing.name}
                    </span>
                    {ing.optional && (
                      <span className="text-[9px] text-foreground ml-1.5 font-black uppercase tracking-wider bg-amber-100 px-1.5 py-0.5 rounded-md border-2 border-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        Valfri
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity scaling Display */}
              <div className="text-right flex items-center gap-1.5 font-black text-xs">
                {hasChanged && ing.quantity !== null && (
                  <span className="text-[10px] text-foreground/60 line-through mr-1">
                    {formatQuantity(ing.quantity * (isSpicy && originalSpiceLevel > 0 ? 1 : 1))} {ing.unit || ''}
                  </span>
                )}
                
                {finalQty !== null ? (
                  <span className={`font-black ${
                    isRemoved 
                      ? "text-red-850 bg-red-100 px-2 py-0.5 rounded-md border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase text-[10px]" 
                      : spiceChanged 
                        ? "text-red-850 bg-red-100 px-2 py-0.5 rounded-md border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px]" 
                        : portionChanged 
                          ? "text-foreground bg-cyan-100 px-2 py-0.5 rounded-md border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px]" 
                          : "text-foreground"
                  }`}>
                    {isRemoved ? 'Borttagen' : `${formatQuantity(finalQty)} ${ing.unit || ''}`}
                  </span>
                ) : (
                  <span className="text-foreground/75 text-[10px] font-black uppercase tracking-wider italic">efter smak</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
