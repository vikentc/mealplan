'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Calendar, 
  Trash2, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  Search,
  Sparkles,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { saveWeeklyPlan } from '@/app/actions/recipes';
import { useLanguage } from '@/lib/i18n';
import { getTranslatedRecipe } from '@/lib/recipeTranslations';

interface Recipe {
  id: string;
  name: string;
  image: string | null;
  cuisine: string;
  mealType?: string;
  mealTypes?: string[];
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

interface WeeklyCalendarProps {
  initialPlans: any[];
  recipes: Recipe[];
  weekOffset: number;
  onWeekOffsetChange: (offset: number) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getSlotsForDay = (day: string) => {
  if (day === 'Saturday' || day === 'Sunday') {
    return ['breakfast', 'lunch', 'dinner'];
  }
  return ['lunch', 'dinner'];
};

const dayNamesSv: Record<string, string> = {
  'Monday': 'Måndag',
  'Tuesday': 'Tisdag',
  'Wednesday': 'Onsdag',
  'Thursday': 'Torsdag',
  'Friday': 'Fredag',
  'Saturday': 'Lördag',
  'Sunday': 'Söndag'
};

const dayNamesEn: Record<string, string> = {
  'Monday': 'Monday',
  'Tuesday': 'Tuesday',
  'Wednesday': 'Wednesday',
  'Thursday': 'Thursday',
  'Friday': 'Friday',
  'Saturday': 'Saturday',
  'Sunday': 'Sunday'
};

const slotNamesSv: Record<string, string> = {
  'breakfast': 'Frukost',
  'lunch': 'Lunch',
  'dinner': 'Middag'
};

const slotNamesEn: Record<string, string> = {
  'breakfast': 'Breakfast',
  'lunch': 'Lunch',
  'dinner': 'Dinner'
};

export default function WeeklyCalendar({
  initialPlans,
  recipes,
  weekOffset,
  onWeekOffsetChange
}: WeeklyCalendarProps) {
  const [plans, setPlans] = useState<Record<string, Record<string, Recipe | null>>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSelectCell, setActiveSelectCell] = useState<{ day: string; slot: string } | null>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  
  const { t, language } = useLanguage();
  const dayNames = language === 'sv' ? dayNamesSv : dayNamesEn;
  const slotNames = language === 'sv' ? slotNamesSv : slotNamesEn;

  const translatedRecipes = React.useMemo(() => {
    return recipes.map(r => getTranslatedRecipe(r, language));
  }, [recipes, language]);

  const getYesterdayMeal = (day: string, slot: string) => {
    const dayIndex = DAYS.indexOf(day);
    if (dayIndex <= 0) return null;
    const yesterday = DAYS[dayIndex - 1];
    
    if (slot === 'lunch') {
      return plans[yesterday]?.['dinner'] || plans[yesterday]?.['lunch'] || null;
    }
    return plans[yesterday]?.[slot] || null;
  };

  const handleSetYesterdayMeal = (day: string, slot: string, recipe: Recipe) => {
    setPlans(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: recipe
      }
    }));
  };

  // Initialize plans mapping dynamically per day's slots
  useEffect(() => {
    const newPlans: Record<string, Record<string, Recipe | null>> = {};
    DAYS.forEach(day => {
      newPlans[day] = {};
      const slots = getSlotsForDay(day);
      slots.forEach(slot => {
        newPlans[day][slot] = null;
      });
    });

    initialPlans.forEach(p => {
      if (p.dayOfWeek && p.mealSlot && p.recipe) {
        const slots = getSlotsForDay(p.dayOfWeek);
        if (slots.includes(p.mealSlot)) {
          newPlans[p.dayOfWeek][p.mealSlot] = p.recipe;
        }
      }
    });

    setPlans(newPlans);
  }, [initialPlans]);

  // Click-to-assign cell handler
  const handleCellClick = (day: string, slot: string) => {
    setActiveSelectCell({ day, slot });
    setSearchQuery(''); // Reset search input on open
  };

  const selectRecipeForCell = (recipe: Recipe) => {
    if (activeSelectCell) {
      const { day, slot } = activeSelectCell;
      setPlans(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          [slot]: recipe
        }
      }));
      setActiveSelectCell(null);
    }
  };

  const handleRemoveRecipe = (day: string, slot: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlans(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: null
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const plansToSave: Array<{
      weekOffset: number;
      dayOfWeek: string;
      mealSlot: string;
      recipeId: string;
    }> = [];

    DAYS.forEach(day => {
      const slots = getSlotsForDay(day);
      slots.forEach(slot => {
        const recipe = plans[day]?.[slot];
        if (recipe) {
          plansToSave.push({
            weekOffset,
            dayOfWeek: day,
            mealSlot: slot,
            recipeId: recipe.id
          });
        }
      });
    });

    try {
      await saveWeeklyPlan(plansToSave);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save plans:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutofill = () => {
    const getTypes = (r: Recipe) => Array.isArray(r.mealTypes) ? r.mealTypes : (r.mealType ? [r.mealType] : []);
    const breakfastPool = recipes.filter(r => getTypes(r).map(t => t.toLowerCase()).includes('breakfast'));
    const lunchPool = recipes.filter(r => getTypes(r).map(t => t.toLowerCase()).includes('lunch'));
    const dinnerPool = recipes.filter(r => {
      const lowerTypes = getTypes(r).map(t => t.toLowerCase());
      return lowerTypes.includes('dinner') || lowerTypes.includes('main-course') || lowerTypes.includes('main');
    });
    
    const bPool = breakfastPool.length > 0 ? breakfastPool : recipes;
    const lPool = lunchPool.length > 0 ? lunchPool : recipes;
    const dPool = dinnerPool.length > 0 ? dinnerPool : recipes;
    
    const getRandomRecipe = (pool: Recipe[]) => {
      const idx = Math.floor(Math.random() * pool.length);
      return pool[idx];
    };

    let bestPlan: Record<string, Record<string, Recipe | null>> = {};
    let bestScore = Infinity;

    for (let i = 0; i < 100; i++) {
      const candidatePlan: Record<string, Record<string, Recipe | null>> = {};
      const selectedIds = new Set<string>();
      let duplicatePenalty = 0;

      DAYS.forEach(day => {
        candidatePlan[day] = {};
        const slots = getSlotsForDay(day);
        slots.forEach(slot => {
          let pool = dPool;
          if (slot === 'breakfast') pool = bPool;
          else if (slot === 'lunch') pool = lPool;
          
          let recipe = getRandomRecipe(pool);
          let attempts = 0;
          while (selectedIds.has(recipe.id) && attempts < 5) {
            recipe = getRandomRecipe(pool);
            attempts++;
          }

          if (selectedIds.has(recipe.id)) {
            duplicatePenalty += 20;
          }
          selectedIds.add(recipe.id);
          candidatePlan[day][slot] = recipe;
        });
      });

      let score = duplicatePenalty;

      DAYS.forEach(day => {
        const isWeekend = day === 'Saturday' || day === 'Sunday';
        const slots = getSlotsForDay(day);
        
        let calories = 0;
        let protein = 0;
        let carbs = 0;
        let fat = 0;
        let fiber = 0;
        let sodium = 0;

        slots.forEach(slot => {
          const r = candidatePlan[day]?.[slot];
          if (r) {
            calories += r.nutrition?.calories || 0;
            protein += r.nutrition?.protein || 0;
            carbs += r.nutrition?.carbohydrates || 0;
            fat += r.nutrition?.fat || 0;
            fiber += r.nutrition?.fiber || 0;
            sodium += r.nutrition?.sodium || 0;
          }
        });

        const targetCal = isWeekend ? 1900 : 1300;
        const targetProt = isWeekend ? 80 : 55;
        const targetCarbs = isWeekend ? 220 : 150;
        const targetFat = isWeekend ? 65 : 40;
        const targetFiber = isWeekend ? 25 : 18;
        const targetSodium = isWeekend ? 1800 : 1300;

        score += Math.pow((calories - targetCal) / targetCal, 2) * 25;
        score += Math.pow((protein - targetProt) / targetProt, 2) * 20;
        score += Math.pow((carbs - targetCarbs) / targetCarbs, 2) * 5;
        score += Math.pow((fat - targetFat) / targetFat, 2) * 5;
        score += Math.pow((fiber - targetFiber) / targetFiber, 2) * 5;
        if (sodium > targetSodium) {
          score += Math.pow((sodium - targetSodium) / targetSodium, 2) * 10;
        }
      });

      if (score < bestScore) {
        bestScore = score;
        bestPlan = candidatePlan;
      }
    }

    setPlans(bestPlan);
  };

  const handleClearAll = () => {
    setIsClearConfirmOpen(true);
  };

  const executeClearAll = () => {
    const clearedPlans: Record<string, Record<string, Recipe | null>> = {};
    DAYS.forEach(day => {
      clearedPlans[day] = {};
      const slots = getSlotsForDay(day);
      slots.forEach(slot => {
        clearedPlans[day][slot] = null;
      });
    });
    setPlans(clearedPlans);
  };

  // Filter recipes for dialog picker
  const filteredRecipes = translatedRecipes.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate daily totals
  const getDayNutrients = (day: string) => {
    let calories = 0;
    let protein = 0;
    
    const slots = getSlotsForDay(day);
    slots.forEach(slot => {
      const recipe = plans[day]?.[slot];
      if (recipe) {
        calories += recipe.nutrition?.calories || 0;
        protein += recipe.nutrition?.protein || 0;
      }
    });

    return { calories, protein };
  };

  return (
    <div className="w-full relative">
      
      {/* Calendar Area */}
      <div className="flex flex-col gap-6 w-full">
        
        {/* Navigation / Save header */}
        <div className="bg-card border-3 border-foreground p-5 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between flex-wrap gap-4 bg-[radial-gradient(rgba(0,0,0,0.03)_1.5px,transparent_1.5px)] [background-size:16px_16px]">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-100 border-2 border-foreground text-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-md text-foreground uppercase tracking-tight">{t('planner.title')}</h3>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{t('planner.subtitle')}</p>
            </div>
          </div>

          {/* Week offset selectors & Action buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => onWeekOffsetChange(weekOffset - 1)}
              className="h-10 w-10 bg-card border-2 border-foreground hover:bg-secondary flex items-center justify-center rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              title={language === 'sv' ? 'Föregående vecka' : 'Previous week'}
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <span className="px-4 py-2 bg-amber-100 text-amber-950 border-2 border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px] font-black uppercase tracking-wider select-none">
              {weekOffset === 0 ? t('planner.this_week') : weekOffset === 1 ? t('planner.next_week') : t('planner.week_offset', { offset: weekOffset.toString() })}
            </span>
            <button
              onClick={() => onWeekOffsetChange(weekOffset + 1)}
              className="h-10 w-10 bg-card border-2 border-foreground hover:bg-secondary flex items-center justify-center rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              title={language === 'sv' ? 'Nästa vecka' : 'Next week'}
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>

            {/* Autofill Button */}
            <button
              onClick={handleAutofill}
              type="button"
              className="ml-2 px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-foreground border-3 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer"
              title={t('planner.autofill_title')}
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">{t('planner.autofill_btn')}</span>
            </button>

            {/* Clear Plan Button */}
            <button
              onClick={handleClearAll}
              type="button"
              className="ml-2 px-5 py-2.5 bg-red-100 hover:bg-red-200 text-red-800 border-3 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer"
              title={t('planner.clear_title')}
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t('planner.clear_btn')}</span>
            </button>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "ml-2 px-5 py-2.5 border-3 border-foreground font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer",
                saveSuccess
                  ? "bg-green-700 text-white"
                  : "bg-emerald-500 hover:bg-emerald-400 text-foreground"
              )}
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? t('planner.saving') : saveSuccess ? t('planner.saved') : t('planner.save')}</span>
            </button>
          </div>
        </div>

        {/* Calendar Grid - Row-based Layout */}
        <div className="flex flex-col gap-5">
          {DAYS.map(day => {
            const { calories, protein } = getDayNutrients(day);
            const slots = getSlotsForDay(day);

            return (
              <div 
                key={day} 
                className="bg-card border-3 border-foreground rounded-[2rem] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col lg:flex-row gap-5 lg:items-center bg-[radial-gradient(rgba(0,0,0,0.02)_1.5px,transparent_1.5px)] [background-size:16px_16px] transition-all hover:border-foreground group/day"
              >
                {/* Day title & daily totals */}
                <div className="flex lg:flex-col justify-between items-center lg:items-start shrink-0 w-full lg:w-36 border-b lg:border-b-0 lg:border-r-3 border-foreground/30 pb-3.5 lg:pb-0 lg:pr-4">
                  <div>
                    <span className="font-black text-base md:text-lg text-foreground uppercase tracking-tight block">
                      {dayNames[day] || day}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5 block">
                      {t('planner.plan')}
                    </span>
                  </div>

                  <div className="flex items-center lg:flex-col gap-2 lg:gap-1.5 mt-2 font-mono">
                    <span className="text-[10px] font-black text-orange-950 bg-orange-100 border-2 border-foreground px-2 py-0.5 rounded-md whitespace-nowrap">
                      🔥 {calories} {t('card.kcal')}
                    </span>
                    <span className="text-[10px] font-black text-blue-950 bg-blue-100 border-2 border-foreground px-2 py-0.5 rounded-md whitespace-nowrap">
                      💪 {protein.toFixed(1)}g {t('card.prot')}
                    </span>
                  </div>
                </div>

                {/* Slots inside Day Row */}
                <div className={cn(
                  "flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full",
                  slots.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"
                )}>
                  {slots.map(slot => {
                    const originalRecipe = plans[day]?.[slot];
                    const recipe = originalRecipe ? getTranslatedRecipe(originalRecipe, language) : null;
                    const isSelectTarget = activeSelectCell?.day === day && activeSelectCell?.slot === slot;
                    const yesterdayMeal = getYesterdayMeal(day, slot);

                    return (
                      <div
                        key={slot}
                        onClick={() => handleCellClick(day, slot)}
                        className={cn(
                          "group/slot relative border-2 rounded-2xl p-3 min-h-[95px] cursor-pointer flex flex-col justify-between transition-all duration-300",
                          recipe 
                            ? "bg-white border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-amber-50/15" 
                            : isSelectTarget
                              ? "bg-cyan-50 border-dashed border-foreground shadow-inner"
                              : "border-dashed border-foreground/35 hover:bg-amber-50/30 hover:border-foreground"
                        )}
                      >
                        {/* Slot category label */}
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] uppercase font-black text-foreground/80 tracking-widest leading-none block">
                            {slotNames[slot] || slot}
                          </span>
                        </div>

                        {recipe ? (
                          <div className="flex items-center gap-2.5 w-full mt-2 min-w-0">
                            <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-secondary shrink-0 border-2 border-foreground shadow-sm">
                              {recipe.image ? (
                                <Image
                                  src={recipe.image}
                                  alt={recipe.name}
                                  fill
                                  className="object-cover group-hover/slot:scale-105 transition-transform duration-300"
                                  sizes="36px"
                                />
                              ) : (
                                <div className="h-full w-full bg-secondary flex items-center justify-center text-[8px] text-muted-foreground font-extrabold uppercase">
                                  {t('planner.meal')}
                                </div>
                              )}
                            </div>
                            
                            <div className="min-w-0 flex-1">
                              <span className="font-black text-[11px] text-foreground block truncate leading-tight group-hover/slot:text-amber-800 transition-colors uppercase tracking-tight" title={recipe.name}>
                                {recipe.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-bold block mt-0.5 whitespace-nowrap">
                                {recipe.nutrition?.calories || 0} {t('card.kcal')} · <span className="text-emerald-800 bg-emerald-100 border border-foreground/30 px-1 py-0.25 rounded font-black inline-block">{recipe.nutrition?.protein || 0}g P</span>
                              </span>
                            </div>

                            <button
                              onClick={(e) => handleRemoveRecipe(day, slot, e)}
                              className="p-1.5 bg-red-100 hover:bg-red-200 border-2 border-foreground text-red-800 rounded-xl transition-all shrink-0 hover:scale-105 active:scale-95 lg:opacity-0 lg:group-hover/slot:opacity-100 focus:opacity-100 cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                              title={t('planner.clear_cell')}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1.5 py-2 flex-1 w-full text-center">
                            <span className="text-[10px] font-black text-foreground/60 group-hover/slot:text-foreground transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wide">
                              <Plus className="h-3.5 w-3.5" />
                              <span>{t('planner.plan')}</span>
                            </span>
                            {yesterdayMeal && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetYesterdayMeal(day, slot, yesterdayMeal);
                                }}
                                className="px-2 py-1 bg-amber-100 border border-foreground text-[8px] font-black uppercase tracking-wider rounded-md hover:bg-amber-200 transition-all cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none"
                              >
                                {t('planner.leftovers')}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Select Recipe Dialog overlay for Desktop & Mobile */}
      {activeSelectCell && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border-3 border-foreground rounded-[2rem] p-6 w-full max-w-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[85vh] relative animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h4 className="font-black text-lg text-foreground uppercase tracking-tight">
                  {t('planner.add_to_day', { day: language === 'sv' ? (dayNames[activeSelectCell.day] || activeSelectCell.day).toLowerCase() : (dayNames[activeSelectCell.day] || activeSelectCell.day) })}
                </h4>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">{t('planner.choose_for_slot', { slot: (slotNames[activeSelectCell.slot] || activeSelectCell.slot).toLowerCase() })}</p>
              </div>
              <button
                onClick={() => setActiveSelectCell(null)}
                className="text-foreground hover:bg-red-100 border-2 border-foreground px-4.5 py-1.5 rounded-xl font-black uppercase text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer active:translate-y-[1px]"
              >
                {t('planner.close')}
              </button>
            </div>

            {/* Dialog Search */}
            <div className="relative mb-5">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground z-10" />
              <input
                type="text"
                placeholder={t('planner.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-card border-3 border-foreground rounded-2xl text-xs font-black uppercase placeholder:text-foreground/50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>

            {/* Dialog recipe list - 2 column grid */}
            <div className="flex-1 overflow-y-auto pr-1">
              {filteredRecipes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredRecipes.map(recipe => (
                    <div
                      key={recipe.id}
                      onClick={() => selectRecipeForCell(recipe)}
                      className="flex items-center gap-3 p-3 bg-white border-2 border-foreground rounded-2xl cursor-pointer hover:bg-amber-50 hover:translate-y-[-1px] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group"
                    >
                      <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-secondary shrink-0 border-2 border-foreground shadow-sm">
                        {recipe.image ? (
                          <Image
                            src={recipe.image}
                            alt={recipe.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="h-full w-full bg-secondary flex items-center justify-center text-[9px] text-muted-foreground font-black uppercase">
                            {t('planner.meal')}
                          </div>
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <h5 className="font-black text-xs text-foreground truncate group-hover:text-amber-850 uppercase tracking-tight">{recipe.name}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase">{recipe.cuisine}</span>
                          <span className="text-[10px] text-emerald-800 bg-emerald-100 border border-foreground/30 px-2 py-0.5 rounded-md font-black">{recipe.nutrition?.protein || 0}g P</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-muted-foreground font-bold uppercase">
                  {t('planner.no_matches')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Clear All Modal */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border-3 border-foreground rounded-[2rem] p-6 max-w-sm w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 border-2 border-foreground flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Trash2 className="h-5 w-5 text-red-800" />
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-sm uppercase tracking-wider text-foreground">
                  {language === 'sv' ? 'Rensa kalendern?' : 'Clear Weekly Planner?'}
                </h4>
                <p className="text-xs text-foreground/80 font-semibold mt-1">
                  {t('planner.confirm_clear') || (language === 'sv' 
                    ? 'Är du säker på att du vill rensa alla måltider från kalendern?' 
                    : 'Are you sure you want to clear all scheduled meals?')}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 border-2 border-foreground font-black text-[10px] uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              >
                {language === 'sv' ? 'Avbryt' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsClearConfirmOpen(false);
                  executeClearAll();
                }}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 border-2 border-foreground font-black text-[10px] uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              >
                {language === 'sv' ? 'Ja, rensa' : 'Yes, clear'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
