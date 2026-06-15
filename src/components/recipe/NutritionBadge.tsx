import React from 'react';
import { Award, Zap, Wheat, Droplets } from 'lucide-react';

interface Nutrition {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  iron?: number;
  calcium?: number;
  potassium?: number;
  magnesium?: number;
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminB12?: number;
}

interface NutritionBadgeProps {
  nutrition: Nutrition;
  scale?: number; // scale portion multiplier
  servings?: number; // active servings count
}

export default function NutritionBadge({ nutrition, scale = 1, servings }: NutritionBadgeProps) {
  // Determine servings count (passed directly or calculated from scale)
  const currentServings = servings || Math.round(scale * 4);

  const perPortion = {
    calories: Math.round(nutrition.calories),
    protein: Math.round((nutrition.protein || 0) * 10) / 10,
    carbs: Math.round((nutrition.carbohydrates || 0) * 10) / 10,
    fat: Math.round((nutrition.fat || 0) * 10) / 10,
    fiber: Math.round((nutrition.fiber || 0) * 10) / 10,
    sugar: Math.round((nutrition.sugar || 0) * 10) / 10,
    sodium: Math.round(nutrition.sodium || 0),
    iron: nutrition.iron ? Math.round(nutrition.iron * 10) / 10 : 0,
    calcium: nutrition.calcium ? Math.round(nutrition.calcium) : 0,
    potassium: nutrition.potassium ? Math.round(nutrition.potassium) : 0,
    magnesium: nutrition.magnesium ? Math.round(nutrition.magnesium) : 0,
    vitaminA: nutrition.vitaminA ? Math.round(nutrition.vitaminA) : 0,
    vitaminC: nutrition.vitaminC ? Math.round(nutrition.vitaminC) : 0,
    vitaminD: nutrition.vitaminD ? Math.round(nutrition.vitaminD * 10) / 10 : 0,
    vitaminB12: nutrition.vitaminB12 ? Math.round(nutrition.vitaminB12 * 10) / 10 : 0,
  };

  const wholeMeal = {
    calories: Math.round(nutrition.calories * currentServings),
    protein: Math.round((nutrition.protein || 0) * currentServings * 10) / 10,
    carbs: Math.round((nutrition.carbohydrates || 0) * currentServings * 10) / 10,
    fat: Math.round((nutrition.fat || 0) * currentServings * 10) / 10,
    fiber: Math.round((nutrition.fiber || 0) * currentServings * 10) / 10,
    sugar: Math.round((nutrition.sugar || 0) * currentServings * 10) / 10,
    sodium: Math.round((nutrition.sodium || 0) * currentServings),
    iron: nutrition.iron ? Math.round(nutrition.iron * currentServings * 10) / 10 : 0,
    calcium: nutrition.calcium ? Math.round(nutrition.calcium * currentServings) : 0,
    potassium: nutrition.potassium ? Math.round(nutrition.potassium * currentServings) : 0,
    magnesium: nutrition.magnesium ? Math.round(nutrition.magnesium * currentServings) : 0,
    vitaminA: nutrition.vitaminA ? Math.round(nutrition.vitaminA * currentServings) : 0,
    vitaminC: nutrition.vitaminC ? Math.round(nutrition.vitaminC * currentServings) : 0,
    vitaminD: nutrition.vitaminD ? Math.round(nutrition.vitaminD * currentServings * 10) / 10 : 0,
    vitaminB12: nutrition.vitaminB12 ? Math.round(nutrition.vitaminB12 * currentServings * 10) / 10 : 0,
  };

  const isHighProtein = perPortion.protein >= 30;

  return (
    <div className="space-y-6">
      {/* Primary Macronutrient Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calories Card */}
        <div className="bg-amber-100 border-2 border-foreground p-4 rounded-[2rem] flex items-center gap-3.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-800 border-2 border-foreground flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 fill-current" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl md:text-2xl font-black text-foreground tracking-tight">{perPortion.calories}</span>
              <span className="text-[10px] text-foreground/80 font-black uppercase tracking-wider">kcal / port</span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xs md:text-sm font-extrabold text-foreground/70 tracking-tight">{wholeMeal.calories}</span>
              <span className="text-[8px] text-foreground/50 font-black uppercase tracking-wider">kcal / hela ({currentServings}p)</span>
            </div>
          </div>
        </div>

        {/* Protein Card (Prioritized with primary color) */}
        <div className={`p-4 rounded-[2rem] border-2 border-foreground flex items-center gap-3.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
          isHighProtein 
            ? "bg-emerald-100 text-emerald-800" 
            : "bg-orange-100 text-foreground"
        }`}>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center border-2 border-foreground shrink-0 ${
            isHighProtein ? "bg-emerald-200 text-emerald-800" : "bg-orange-200 text-foreground"
          }`}>
            <Award className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl md:text-2xl font-black tracking-tight">{perPortion.protein}g</span>
              <span className={`text-[10px] font-black uppercase tracking-wider ${isHighProtein ? "text-emerald-800/80" : "text-foreground/80"}`}>/ port</span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-xs md:text-sm font-extrabold tracking-tight ${isHighProtein ? "text-emerald-800/70" : "text-foreground/70"}`}>{wholeMeal.protein}g</span>
              <span className={`text-[8px] font-black uppercase tracking-wider ${isHighProtein ? "text-emerald-800/50" : "text-foreground/50"}`}>/ hela ({currentServings}p)</span>
            </div>
          </div>
        </div>

        {/* Carbs Card */}
        <div className="bg-cyan-100 border-2 border-foreground p-4 rounded-[2rem] flex items-center gap-3.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="h-10 w-10 rounded-xl bg-cyan-200 text-cyan-800 border-2 border-foreground flex items-center justify-center shrink-0">
            <Wheat className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl md:text-2xl font-black text-foreground tracking-tight">{perPortion.carbs}g</span>
              <span className="text-[10px] text-cyan-800 font-black uppercase tracking-wider">/ port</span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xs md:text-sm font-extrabold text-cyan-800/70 tracking-tight">{wholeMeal.carbs}g</span>
              <span className="text-[8px] text-cyan-800/50 font-black uppercase tracking-wider">/ hela ({currentServings}p)</span>
            </div>
          </div>
        </div>

        {/* Fat Card */}
        <div className="bg-red-100 border-2 border-foreground p-4 rounded-[2rem] flex items-center gap-3.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="h-10 w-10 rounded-xl bg-red-200 text-red-800 border-2 border-foreground flex items-center justify-center shrink-0">
            <Droplets className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl md:text-2xl font-black text-foreground tracking-tight">{perPortion.fat}g</span>
              <span className="text-[10px] text-red-800 font-black uppercase tracking-wider">/ port</span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xs md:text-sm font-extrabold text-red-800/70 tracking-tight">{wholeMeal.fat}g</span>
              <span className="text-[8px] text-red-800/50 font-black uppercase tracking-wider">/ hela ({currentServings}p)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Micronutrient Section */}
      <div className="bg-card border-3 border-foreground rounded-[2rem] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h4 className="font-black text-xs text-foreground mb-4 uppercase tracking-wider">
          Näringsdeklaration (Portion vs Hela måltiden)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6">
          <div>
            <span className="text-[10px] font-black uppercase text-foreground/60 block">Fiber</span>
            <div className="font-black text-sm text-foreground flex flex-col">
              <span>{perPortion.fiber} g <span className="text-[9px] text-foreground/50 font-black">/ port</span></span>
              <span className="text-[10px] text-foreground/65 font-bold">Hela: {wholeMeal.fiber} g</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-foreground/60 block">Socker</span>
            <div className="font-black text-sm text-foreground flex flex-col">
              <span>{perPortion.sugar} g <span className="text-[9px] text-foreground/50 font-black">/ port</span></span>
              <span className="text-[10px] text-foreground/65 font-bold">Hela: {wholeMeal.sugar} g</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-foreground/60 block">Natrium</span>
            <div className="font-black text-sm text-foreground flex flex-col">
              <span>{perPortion.sodium} mg <span className="text-[9px] text-foreground/50 font-black">/ port</span></span>
              <span className="text-[10px] text-foreground/65 font-bold">Hela: {wholeMeal.sodium} mg</span>
            </div>
          </div>
          {perPortion.iron > 0 && (
            <div>
              <span className="text-[10px] font-black uppercase text-foreground/60 block">Järn</span>
              <div className="font-black text-sm text-foreground flex flex-col">
                <span>{perPortion.iron} mg <span className="text-[9px] text-foreground/50 font-black">/ port</span></span>
                <span className="text-[10px] text-foreground/65 font-bold">Hela: {wholeMeal.iron} mg</span>
              </div>
            </div>
          )}
          {perPortion.calcium > 0 && (
            <div>
              <span className="text-[10px] font-black uppercase text-foreground/60 block">Kalcium</span>
              <div className="font-black text-sm text-foreground flex flex-col">
                <span>{perPortion.calcium} mg <span className="text-[9px] text-foreground/50 font-black">/ port</span></span>
                <span className="text-[10px] text-foreground/65 font-bold">Hela: {wholeMeal.calcium} mg</span>
              </div>
            </div>
          )}
          {perPortion.potassium > 0 && (
            <div>
              <span className="text-[10px] font-black uppercase text-foreground/60 block">Kalium</span>
              <div className="font-black text-sm text-foreground flex flex-col">
                <span>{perPortion.potassium} mg <span className="text-[9px] text-foreground/50 font-black">/ port</span></span>
                <span className="text-[10px] text-foreground/65 font-bold">Hela: {wholeMeal.potassium} mg</span>
              </div>
            </div>
          )}
          {perPortion.magnesium > 0 && (
            <div>
              <span className="text-[10px] font-black uppercase text-foreground/60 block">Magnesium</span>
              <div className="font-black text-sm text-foreground flex flex-col">
                <span>{perPortion.magnesium} mg <span className="text-[9px] text-foreground/50 font-black">/ port</span></span>
                <span className="text-[10px] text-foreground/65 font-bold">Hela: {wholeMeal.magnesium} mg</span>
              </div>
            </div>
          )}
          {perPortion.vitaminA > 0 && (
            <div>
              <span className="text-[10px] font-black uppercase text-foreground/60 block">Vitamin A</span>
              <div className="font-black text-sm text-foreground flex flex-col">
                <span>{perPortion.vitaminA} mcg <span className="text-[9px] text-foreground/50 font-black">/ port</span></span>
                <span className="text-[10px] text-foreground/65 font-bold">Hela: {wholeMeal.vitaminA} mcg</span>
              </div>
            </div>
          )}
          {perPortion.vitaminC > 0 && (
            <div>
              <span className="text-[10px] font-black uppercase text-foreground/60 block">Vitamin C</span>
              <div className="font-black text-sm text-foreground flex flex-col">
                <span>{perPortion.vitaminC} mg <span className="text-[9px] text-foreground/50 font-black">/ port</span></span>
                <span className="text-[10px] text-foreground/65 font-bold">Hela: {wholeMeal.vitaminC} mg</span>
              </div>
            </div>
          )}
          {perPortion.vitaminD > 0 && (
            <div>
              <span className="text-[10px] font-black uppercase text-foreground/60 block">Vitamin D</span>
              <div className="font-black text-sm text-foreground flex flex-col">
                <span>{perPortion.vitaminD} mcg <span className="text-[9px] text-foreground/50 font-black">/ port</span></span>
                <span className="text-[10px] text-foreground/65 font-bold">Hela: {wholeMeal.vitaminD} mcg</span>
              </div>
            </div>
          )}
          {perPortion.vitaminB12 > 0 && (
            <div>
              <span className="text-[10px] font-black uppercase text-foreground/60 block">Vitamin B12</span>
              <div className="font-black text-sm text-foreground flex flex-col">
                <span>{perPortion.vitaminB12} mcg <span className="text-[9px] text-foreground/50 font-black">/ port</span></span>
                <span className="text-[10px] text-foreground/65 font-bold">Hela: {wholeMeal.vitaminB12} mcg</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
