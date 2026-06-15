'use client';

import React from 'react';
import { Award, ShieldAlert, Sparkles, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Recipe {
  id: string;
  name: string;
  nutrition: {
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
  };
}

interface WeeklyPlan {
  id: string;
  dayOfWeek: string;
  mealSlot: string;
  recipe: Recipe;
}

interface NutritionDashboardProps {
  plans: WeeklyPlan[];
}

// Target Daily values per person
const DAILY_TARGET = {
  calories: 2000,
  protein: 130, // Prioritized target
  carbs: 220,
  fat: 70,
  fiber: 28,
  sodium: 2000, // upper limit
  iron: 15,
  calcium: 1000,
  potassium: 3500,
  magnesium: 350,
  vitaminA: 800,
  vitaminC: 80,
  vitaminD: 10,
  vitaminB12: 2.4
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function NutritionDashboard({ plans }: NutritionDashboardProps) {
  // 1. Calculate weekly aggregates
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;
  let totalSugar = 0;
  let totalSodium = 0;
  let totalIron = 0;
  let totalCalcium = 0;
  let totalPotassium = 0;
  let totalMagnesium = 0;
  let totalVitaminA = 0;
  let totalVitaminC = 0;
  let totalVitaminD = 0;
  let totalVitaminB12 = 0;

  // Track per-day protein for daily warnings
  const dailyProtein: Record<string, number> = {};
  DAYS.forEach(d => { dailyProtein[d] = 0; });

  plans.forEach(p => {
    const nut = p.recipe?.nutrition;
    if (nut) {
      totalCalories += nut.calories || 0;
      totalProtein += nut.protein || 0;
      totalCarbs += nut.carbohydrates || 0;
      totalFat += nut.fat || 0;
      totalFiber += nut.fiber || 0;
      totalSugar += nut.sugar || 0;
      totalSodium += nut.sodium || 0;
      totalIron += nut.iron || 0;
      totalCalcium += nut.calcium || 0;
      totalPotassium += nut.potassium || 0;
      totalMagnesium += nut.magnesium || 0;
      totalVitaminA += nut.vitaminA || 0;
      totalVitaminC += nut.vitaminC || 0;
      totalVitaminD += nut.vitaminD || 0;
      totalVitaminB12 += nut.vitaminB12 || 0;

      if (p.dayOfWeek) {
        dailyProtein[p.dayOfWeek] = (dailyProtein[p.dayOfWeek] || 0) + (nut.protein || 0);
      }
    }
  });

  // Number of active days planned (days with at least 1 meal)
  const activeDaysCount = DAYS.filter(day => 
    plans.some(p => p.dayOfWeek === day)
  ).length || 1;

  // Weekly targets based on active days
  const weeklyTarget = {
    calories: DAILY_TARGET.calories * activeDaysCount,
    protein: DAILY_TARGET.protein * activeDaysCount,
    carbs: DAILY_TARGET.carbs * activeDaysCount,
    fat: DAILY_TARGET.fat * activeDaysCount,
    fiber: DAILY_TARGET.fiber * activeDaysCount,
    sodium: DAILY_TARGET.sodium * activeDaysCount,
    iron: DAILY_TARGET.iron * activeDaysCount,
    calcium: DAILY_TARGET.calcium * activeDaysCount,
    potassium: DAILY_TARGET.potassium * activeDaysCount,
    magnesium: DAILY_TARGET.magnesium * activeDaysCount,
    vitaminA: DAILY_TARGET.vitaminA * activeDaysCount,
    vitaminC: DAILY_TARGET.vitaminC * activeDaysCount,
    vitaminD: DAILY_TARGET.vitaminD * activeDaysCount,
    vitaminB12: DAILY_TARGET.vitaminB12 * activeDaysCount
  };

  // Percent coverages
  const getPercent = (total: number, target: number) => {
    if (target === 0) return 0;
    return Math.min(100, Math.round((total / target) * 100));
  };

  const proteinPct = getPercent(totalProtein, weeklyTarget.protein);
  const carbsPct = getPercent(totalCarbs, weeklyTarget.carbs);
  const fatPct = getPercent(totalFat, weeklyTarget.fat);
  const fiberPct = getPercent(totalFiber, weeklyTarget.fiber);
  const caloriesPct = getPercent(totalCalories, weeklyTarget.calories);

  // Micro coverages
  const microPct = {
    iron: getPercent(totalIron, weeklyTarget.iron),
    calcium: getPercent(totalCalcium, weeklyTarget.calcium),
    potassium: getPercent(totalPotassium, weeklyTarget.potassium),
    magnesium: getPercent(totalMagnesium, weeklyTarget.magnesium),
    vitaminA: getPercent(totalVitaminA, weeklyTarget.vitaminA),
    vitaminC: getPercent(totalVitaminC, weeklyTarget.vitaminC),
    vitaminD: getPercent(totalVitaminD, weeklyTarget.vitaminD),
    vitaminB12: getPercent(totalVitaminB12, weeklyTarget.vitaminB12),
  };

  // Macro balance score
  // Ideal ratio: 25% protein, 45% carbs, 30% fat
  const totalGrams = totalProtein + totalCarbs + totalFat || 1;
  const proteinRatio = (totalProtein / totalGrams) * 100;
  const carbsRatio = (totalCarbs / totalGrams) * 100;
  const fatRatio = (totalFat / totalGrams) * 100;

  const proteinDeviation = Math.abs(proteinRatio - 25);
  const carbsDeviation = Math.abs(carbsRatio - 45);
  const fatDeviation = Math.abs(fatRatio - 30);
  
  const macroBalanceScore = Math.max(0, Math.round(100 - (proteinDeviation + carbsDeviation + fatDeviation) * 1.5));

  // Micronutrient coverage score (average of all micro coverages)
  const values = Object.values(microPct);
  const microCoverageScore = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);

  // Weekly Nutrition Score
  // Weighted: 40% Protein coverage, 30% Macro Balance, 30% Micronutrient coverage
  const weeklyNutritionScore = Math.round(
    (proteinPct * 0.4) + 
    (macroBalanceScore * 0.3) + 
    (microCoverageScore * 0.3)
  );

  // Generate recommendations/suggestions dynamically
  const suggestions: string[] = [];

  const dayNamesSv: Record<string, string> = {
    'Monday': 'måndag',
    'Tuesday': 'tisdag',
    'Wednesday': 'onsdag',
    'Thursday': 'torsdag',
    'Friday': 'fredag',
    'Saturday': 'lördag',
    'Sunday': 'söndag'
  };

  // Protein check
  if (totalProtein < weeklyTarget.protein * 0.8) {
    suggestions.push("Ditt proteinintag ligger något under målet. Prioritera att lägga till kyckling eller fisk i luncherna.");
  } else {
    suggestions.push("Utmärkt proteinintag! Du uppnår dina träningsmål.");
  }

  // Daily protein consistency checks
  const lowProteinDays = DAYS.filter(day => 
    plans.some(p => p.dayOfWeek === day) && dailyProtein[day] < DAILY_TARGET.protein * 0.6
  );
  if (lowProteinDays.length > 0) {
    suggestions.push(`Proteinintaget är lägre på ${lowProteinDays.map(day => dayNamesSv[day] || day).join(', ')}. Försök lägga till ett proteinrikt recept där.`);
  }

  // Micronutrient warnings
  const lowestMicro = Object.entries(microPct).sort((a, b) => a[1] - b[1])[0];
  if (lowestMicro && lowestMicro[1] < 60) {
    const name = lowestMicro[0];
    if (name === 'iron') suggestions.push("Lägg till en järnrik måltid (t.ex. spenat, nötkött eller linser).");
    if (name === 'calcium') suggestions.push("Lägg till fler kalciumrika ingredienser (t.ex. ost, yoghurt eller broccoli).");
    if (name === 'vitaminD') suggestions.push("Vitamin D-intaget är lågt. Överväg att lägga till lax- eller äggulerätter i helgplaneringen.");
    if (name === 'vitaminC') suggestions.push("Lägg till färsk citron, lime eller paprika för att öka Vitamin C-intaget.");
    if (name === 'vitaminB12') suggestions.push("Inkludera kött, fisk eller mejeriprodukter för att öka Vitamin B12.");
  } else {
    suggestions.push("Superb variation av mikronäringsämnen! Ditt näringsintag ser välbalanserat ut.");
  }

  // Fiber warning
  if (totalFiber < weeklyTarget.fiber * 0.7) {
    suggestions.push("Fiberintaget ligger under målet. Lägg till fler grönsaksbaserade recept (som tomatsoppa eller sallad).");
  }

  // Sodium warnings
  if (totalSodium > weeklyTarget.sodium * 1.2) {
    suggestions.push("Natriumnivåerna är höga denna vecka. Begränsa processat bacon eller konserverade produkter.");
  }

  return (
    <div className="space-y-8">
      
      {/* Visual Analytics Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Weekly Nutrition Score (Circular Gauge) */}
        <div className="bg-card border-3 border-foreground p-6 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col justify-between items-center min-h-[270px]">
          <div>
            <h4 className="font-black text-md text-foreground uppercase tracking-tight">
              Hälsopoäng
            </h4>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase">Övergripande hälsopoäng</p>
          </div>

          <div className="relative flex items-center justify-center h-32 w-32">
            {/* Visual SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="52"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-secondary"
              />
              <circle
                cx="64"
                cy="64"
                r="52"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={326.7}
                strokeDashoffset={326.7 - (326.7 * weeklyNutritionScore) / 100}
                className="text-primary transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-4xl font-black text-foreground tracking-tight leading-none">
                {weeklyNutritionScore}
              </span>
              <span className="text-[9px] uppercase font-black text-muted-foreground tracking-wider block mt-1">
                Poäng
              </span>
            </div>
          </div>

          <span className="text-xs font-black text-primary px-4 py-1.5 rounded-xl bg-primary/10 border-2 border-foreground/30 uppercase tracking-wide">
            {weeklyNutritionScore >= 80 ? 'Utmärkt näringsintag' : weeklyNutritionScore >= 60 ? 'Hälsosam balans' : 'Kan optimeras'}
          </span>
        </div>

        {/* Macro Balance Score Card */}
        <div className="bg-card border-3 border-foreground p-6 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between min-h-[270px]">
          <div>
            <h4 className="font-black text-md text-foreground uppercase tracking-tight">
              Makrobalans
            </h4>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase">Avvikelse från träningsmålen</p>
          </div>

          <div className="space-y-4 my-2">
            {/* Protein bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                <span className="text-cyan-800 font-black">Protein ({Math.round(proteinRatio)}%)</span>
                <span className="text-muted-foreground">Mål: 25%</span>
              </div>
              <div className="h-3 w-full bg-card border-2 border-foreground rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-400 transition-all duration-500" 
                  style={{ width: `${Math.min(100, (proteinRatio / 25) * 100)}%` }}
                />
              </div>
            </div>

            {/* Carbs bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                <span className="text-amber-800 font-black">Kolhydrater ({Math.round(carbsRatio)}%)</span>
                <span className="text-muted-foreground">Mål: 45%</span>
              </div>
              <div className="h-3 w-full bg-card border-2 border-foreground rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-400 transition-all duration-500" 
                  style={{ width: `${Math.min(100, (carbsRatio / 45) * 100)}%` }}
                />
              </div>
            </div>

            {/* Fat bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                <span className="text-rose-800 font-black">Fett ({Math.round(fatRatio)}%)</span>
                <span className="text-muted-foreground">Mål: 30%</span>
              </div>
              <div className="h-3 w-full bg-card border-2 border-foreground rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-400 transition-all duration-500" 
                  style={{ width: `${Math.min(100, (fatRatio / 30) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center border-t-2 border-foreground/30 pt-3 text-xs font-black uppercase tracking-wide">
            <span className="text-muted-foreground">Total balans</span>
            <span className="text-foreground">{macroBalanceScore}/100</span>
          </div>
        </div>

        {/* Micronutrient coverage card */}
        <div className="bg-card border-3 border-foreground p-6 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between min-h-[270px]">
          <div>
            <h4 className="font-black text-md text-foreground uppercase tracking-tight">
              Mikronäringsämnen
            </h4>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase">Poäng för vitaminer & mineraler</p>
          </div>

          <div className="grid grid-cols-2 gap-3.5 my-2">
            <div>
              <span className="text-[9px] text-muted-foreground block font-black uppercase">Järn</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="flex-grow h-2.5 bg-card border-2 border-foreground rounded-full overflow-hidden">
                  <div className="h-full bg-red-400" style={{ width: `${microPct.iron}%` }} />
                </div>
                <span className="text-[10px] font-black font-mono">{microPct.iron}%</span>
              </div>
            </div>

            {/* Calcium */}
            <div>
              <span className="text-[9px] text-muted-foreground block font-black uppercase">Kalcium</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="flex-grow h-2.5 bg-card border-2 border-foreground rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400" style={{ width: `${microPct.calcium}%` }} />
                </div>
                <span className="text-[10px] font-black font-mono">{microPct.calcium}%</span>
              </div>
            </div>

            {/* Vitamin A */}
            <div>
              <span className="text-[9px] text-muted-foreground block font-black uppercase">Vitamin A</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="flex-grow h-2.5 bg-card border-2 border-foreground rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400" style={{ width: `${microPct.vitaminA}%` }} />
                </div>
                <span className="text-[10px] font-black font-mono">{microPct.vitaminA}%</span>
              </div>
            </div>

            {/* Vitamin D */}
            <div>
              <span className="text-[9px] text-muted-foreground block font-black uppercase">Vitamin D</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="flex-grow h-2.5 bg-card border-2 border-foreground rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${microPct.vitaminD}%` }} />
                </div>
                <span className="text-[10px] font-black font-mono">{microPct.vitaminD}%</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center border-t-2 border-foreground/30 pt-3 text-xs font-black uppercase tracking-wide">
            <span className="text-muted-foreground">Essentiell täckning</span>
            <span className="text-foreground">{microCoverageScore}%</span>
          </div>
        </div>

      </div>

      {/* Suggestion list */}
      <div className="bg-card border-3 border-foreground p-6 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-[radial-gradient(rgba(0,0,0,0.02)_1.5px,transparent_1.5px)] [background-size:16px_16px]">
        <h4 className="font-black text-md text-foreground flex items-center gap-2 mb-4 uppercase tracking-tight">
          <Sparkles className="h-5 w-5 text-foreground animate-pulse" />
          <span>Kostrekommendationer & Tips</span>
        </h4>

        {plans.length > 0 ? (
          <ul className="space-y-3.5">
            {suggestions.map((sug, idx) => (
              <li 
                key={idx} 
                className="text-xs leading-relaxed text-foreground flex gap-2.5 p-3.5 rounded-2xl bg-white border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-semibold"
              >
                <div className="h-5 w-5 rounded-lg bg-amber-100 border border-foreground text-foreground flex items-center justify-center shrink-0 shadow-sm">
                  <Info className="h-3.5 w-3.5" />
                </div>
                <span>{sug}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6 text-xs text-muted-foreground font-black uppercase">
            Planera veckans recept i veckoplaneringen för att låsa upp smarta näringsinsikter
          </div>
        )}
      </div>
      
    </div>
  );
}
