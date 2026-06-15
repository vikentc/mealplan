'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Coffee, 
  Utensils, 
  ChefHat, 
  Cookie, 
  Sparkles, 
  Smile, 
  X,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Frukost', icon: Coffee, bg: 'bg-amber-100', text: 'text-amber-950' },
  { id: 'lunch', label: 'Lunch', icon: Utensils, bg: 'bg-emerald-100', text: 'text-emerald-950' },
  { id: 'dinner', label: 'Middag', icon: ChefHat, bg: 'bg-cyan-100', text: 'text-cyan-950' },
  { id: 'dessert', label: 'Efterrätt', icon: Sparkles, bg: 'bg-purple-100', text: 'text-purple-950' },
  { id: 'snack', label: 'Mellanmål', icon: Cookie, bg: 'bg-red-100', text: 'text-red-950' },
];

const CRAVINGS = [
  { id: 'comfort-food', label: '🍔 Comfort food', bg: 'bg-amber-100', text: 'text-amber-950' },
  { id: 'spicy', label: '🌶️ Starkt & kryddigt', bg: 'bg-red-100', text: 'text-red-950' },
  { id: 'sweet', label: '🍩 Sött & gott', bg: 'bg-pink-100', text: 'text-pink-950' },
  { id: 'cheesy', label: '🧀 Ostigt & krämigt', bg: 'bg-yellow-100', text: 'text-yellow-950' },
  { id: 'fresh-light', label: '🥗 Fräscht & lätt', bg: 'bg-green-100', text: 'text-green-950' },
  { id: 'warm-hearty', label: '🍲 Varmt & mustigt', bg: 'bg-orange-100', text: 'text-orange-950' },
  { id: 'quick-easy', label: '⏱️ Snabbt & enkelt', bg: 'bg-cyan-100', text: 'text-cyan-950' },
  { id: 'rich-creamy', label: '✨ Fylligt & krämigt', bg: 'bg-purple-100', text: 'text-purple-950' },
  { id: 'high-protein', label: '💪 Proteinrikt (>= 30g)', bg: 'bg-emerald-100', text: 'text-emerald-950' },
];

const CUISINES = ['Vietnamese', 'Thai', 'Japanese', 'Swedish', 'Italian', 'Mexican'];
const FLAVORS = ['spicy', 'sweet', 'savory', 'sour', 'umami', 'creamy', 'tangy', 'rich', 'light', 'fresh'];
const MOODS = ['comfort food', 'healthy', 'high protein', 'cozy', 'refreshing', 'indulgent', 'energizing', 'quick and easy'];
const NUTRITION_GOALS = [
  { value: 'high-protein', label: 'Proteinrik (>= 30g)' },
  { value: 'low-carb', label: 'Lågkolhydrat (<= 30g)' },
  { value: 'low-calorie', label: 'Kalorisnål (<= 400 kcal)' },
  { value: 'high-fiber', label: 'Fiberrik (>= 5g)' },
];

const cuisineLabels: Record<string, string> = {
  'Vietnamese': 'Vietnamesiskt',
  'Thai': 'Thailändskt',
  'Japanese': 'Japanskt',
  'Swedish': 'Svenskt',
  'Italian': 'Italienskt',
  'Mexican': 'Mexikanskt'
};

const flavorLabels: Record<string, string> = {
  'spicy': 'Stark',
  'sweet': 'Söt',
  'savory': 'Fyllig/Smakrik',
  'sour': 'Sur',
  'umami': 'Umami',
  'creamy': 'Krämig',
  'tangy': 'Syrlig',
  'rich': 'Mäktig',
  'light': 'Lätt',
  'fresh': 'Fräsch'
};

const moodLabels: Record<string, string> = {
  'comfort food': 'Husmanskost/Comfort food',
  'healthy': 'Hälsosam',
  'high protein': 'Högprotein',
  'cozy': 'Mysig',
  'refreshing': 'Uppfriskande',
  'indulgent': 'Lyxig',
  'energizing': 'Energigivande',
  'quick and easy': 'Snabb & enkel'
};

export default function RecommendationSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Read URL search params
  const activeQuery = searchParams.get('query') || '';
  const activeMealType = searchParams.get('mealType') || '';
  const activeCraving = searchParams.get('craving') || '';
  const activeCuisine = searchParams.get('cuisine') || '';
  const activeFlavor = searchParams.get('flavor') || '';
  const activeMood = searchParams.get('mood') || '';
  const activeNutritionGoal = searchParams.get('nutritionGoal') || '';

  // Local state for mobile dialog & search bar typing
  const [tempQuery, setTempQuery] = useState(activeQuery);
  const [tempMealType, setTempMealType] = useState(activeMealType);
  const [tempCraving, setTempCraving] = useState(activeCraving);
  const [tempCuisine, setTempCuisine] = useState(activeCuisine);
  const [tempFlavor, setTempFlavor] = useState(activeFlavor);
  const [tempMood, setTempMood] = useState(activeMood);
  const [tempNutritionGoal, setTempNutritionGoal] = useState(activeNutritionGoal);

  // Sync temp states when URL search parameters change
  useEffect(() => {
    setTempQuery(activeQuery);
    setTempMealType(activeMealType);
    setTempCraving(activeCraving);
    setTempCuisine(activeCuisine);
    setTempFlavor(activeFlavor);
    setTempMood(activeMood);
    setTempNutritionGoal(activeNutritionGoal);
  }, [activeQuery, activeMealType, activeCraving, activeCuisine, activeFlavor, activeMood, activeNutritionGoal]);

  const handleOpenDialog = () => {
    setTempQuery(activeQuery);
    setTempMealType(activeMealType);
    setTempCraving(activeCraving);
    setTempCuisine(activeCuisine);
    setTempFlavor(activeFlavor);
    setTempMood(activeMood);
    setTempNutritionGoal(activeNutritionGoal);
    setIsDialogOpen(true);
  };

  // Immediate URL pushes for desktop
  const handleSelectMeal = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeMealType === id) {
      params.delete('mealType');
    } else {
      params.set('mealType', id);
    }
    router.push(`/?${params.toString()}`);
  };

  const handleSelectCraving = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeCraving === id) {
      params.delete('craving');
    } else {
      params.set('craving', id);
    }
    router.push(`/?${params.toString()}`);
  };

  const handleDropdownChange = (field: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(field, value);
    } else {
      params.delete(field);
    }
    router.push(`/?${params.toString()}`);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (tempQuery) {
      params.set('query', tempQuery);
    } else {
      params.delete('query');
    }
    router.push(`/?${params.toString()}`);
  };

  // Local state toggling for mobile dialog
  const handleSelectMealMobile = (id: string) => {
    setTempMealType(prev => prev === id ? '' : id);
  };

  const handleSelectCravingMobile = (id: string) => {
    setTempCraving(prev => prev === id ? '' : id);
  };

  // Reset actions
  const handleReset = () => {
    setTempQuery('');
    setTempMealType('');
    setTempCraving('');
    setTempCuisine('');
    setTempFlavor('');
    setTempMood('');
    setTempNutritionGoal('');
    router.push('/');
  };

  const handleApplyMobile = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (tempMealType) params.set('mealType', tempMealType);
    else params.delete('mealType');

    if (tempCraving) params.set('craving', tempCraving);
    else params.delete('craving');

    if (tempCuisine) params.set('cuisine', tempCuisine);
    else params.delete('cuisine');

    if (tempFlavor) params.set('flavor', tempFlavor);
    else params.delete('flavor');

    if (tempMood) params.set('mood', tempMood);
    else params.delete('mood');

    if (tempNutritionGoal) params.set('nutritionGoal', tempNutritionGoal);
    else params.delete('nutritionGoal');

    router.push(`/?${params.toString()}`);
    setIsDialogOpen(false);
  };

  const handleResetMobile = () => {
    setTempQuery('');
    setTempMealType('');
    setTempCraving('');
    setTempCuisine('');
    setTempFlavor('');
    setTempMood('');
    setTempNutritionGoal('');
    router.push('/');
    setIsDialogOpen(false);
  };

  const hasActiveFilters = !!(
    activeMealType || 
    activeCraving || 
    activeCuisine || 
    activeFlavor || 
    activeMood || 
    activeNutritionGoal
  );

  const activeMealLabel = MEAL_TYPES.find(t => t.id === activeMealType)?.label || '';
  const activeCravingLabel = CRAVINGS.find(c => c.id === activeCraving)?.label || '';

  let triggerText = '🔍 Anpassa måltid & cravings';
  if (activeMealLabel || activeCravingLabel) {
    const parts = [];
    if (activeMealLabel) parts.push(activeMealLabel);
    if (activeCravingLabel) parts.push(activeCravingLabel.split(' ').slice(1).join(' ') || activeCravingLabel);
    triggerText = `🥑 ${parts.join(' + ')}`;
  }

  const renderSelectors = (isMobile: boolean) => {
    const currentMeal = isMobile ? tempMealType : activeMealType;
    const currentCraving = isMobile ? tempCraving : activeCraving;
    const currentCuisine = isMobile ? tempCuisine : activeCuisine;
    const currentFlavor = isMobile ? tempFlavor : activeFlavor;
    const currentMood = isMobile ? tempMood : activeMood;
    const currentGoal = isMobile ? tempNutritionGoal : activeNutritionGoal;

    return (
      <>
        {/* Meal type selection */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-black uppercase text-foreground/80 tracking-wider flex items-center gap-1.5">
            <Utensils className="h-4 w-4" />
            <span>Välj måltid</span>
          </h3>
          
          <div className={cn(
            "grid gap-3",
            isMobile ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
          )}>
            {MEAL_TYPES.map((type) => {
              const Icon = type.icon;
              const isActive = currentMeal === type.id;
              
              return (
                <button
                  key={type.id}
                  onClick={() => isMobile ? handleSelectMealMobile(type.id) : handleSelectMeal(type.id)}
                  type="button"
                  className={cn(
                    "p-4 border-3 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
                    isActive
                      ? cn("border-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-y-[-1px]", type.bg, type.text)
                      : "bg-white border-foreground/30 hover:border-foreground hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] text-foreground/85"
                  )}
                >
                  <Icon className="h-6 w-6 shrink-0" />
                  <span className="font-black text-xs uppercase tracking-tight">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cravings selection */}
        <div className="space-y-3 pt-4">
          <h3 className="text-xs font-black uppercase text-foreground/80 tracking-wider flex items-center gap-1.5">
            <Smile className="h-4 w-4" />
            <span>Vad är du sugen på? (Cravings)</span>
          </h3>

          <div className="flex flex-wrap gap-2.5">
            {CRAVINGS.map((craving) => {
              const isActive = currentCraving === craving.id;
              
              return (
                <button
                  key={craving.id}
                  onClick={() => isMobile ? handleSelectCravingMobile(craving.id) : handleSelectCraving(craving.id)}
                  type="button"
                  className={cn(
                    "px-4 py-2.5 border-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all duration-200 cursor-pointer active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
                    isActive
                      ? cn("border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[-1px]", craving.bg, craving.text)
                      : "bg-white border-foreground/30 hover:border-foreground hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] text-foreground/85"
                  )}
                >
                  {craving.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsible Advanced Section */}
        <div className="pt-4 space-y-3">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-5 py-2.5 bg-card border-2 border-foreground hover:bg-secondary text-foreground text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] flex items-center gap-2 cursor-pointer transition-all"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Avancerade filter</span>
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-card border-3 border-foreground rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-top-2 duration-150">
              {/* Cuisine Dropdown */}
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] font-black text-foreground uppercase tracking-widest block">Kök</label>
                <div className="relative">
                  <select
                    value={currentCuisine}
                    onChange={(e) => isMobile ? setTempCuisine(e.target.value) : handleDropdownChange('cuisine', e.target.value)}
                    className="w-full py-2.5 pl-4 pr-9 bg-white border-2 border-foreground rounded-xl text-foreground text-[11px] font-black uppercase tracking-wide focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Alla kök</option>
                    {CUISINES.map(c => <option key={c} value={c}>{cuisineLabels[c] || c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground pointer-events-none" />
                </div>
              </div>

              {/* Flavor Dropdown */}
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] font-black text-foreground uppercase tracking-widest block">Smak</label>
                <div className="relative">
                  <select
                    value={currentFlavor}
                    onChange={(e) => isMobile ? setTempFlavor(e.target.value) : handleDropdownChange('flavor', e.target.value)}
                    className="w-full py-2.5 pl-4 pr-9 bg-white border-2 border-foreground rounded-xl text-foreground text-[11px] font-black uppercase tracking-wide focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Alla smaker</option>
                    {FLAVORS.map(f => <option key={f} value={f}>{flavorLabels[f] || f}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground pointer-events-none" />
                </div>
              </div>

              {/* Category Dropdown */}
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] font-black text-foreground uppercase tracking-widest block">Kategori</label>
                <div className="relative">
                  <select
                    value={currentMood}
                    onChange={(e) => isMobile ? setTempMood(e.target.value) : handleDropdownChange('mood', e.target.value)}
                    className="w-full py-2.5 pl-4 pr-9 bg-white border-2 border-foreground rounded-xl text-foreground text-[11px] font-black uppercase tracking-wide focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Alla kategorier</option>
                    {MOODS.map(m => <option key={m} value={m}>{moodLabels[m] || m}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground pointer-events-none" />
                </div>
              </div>

              {/* Nutrition Dropdown */}
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] font-black text-foreground uppercase tracking-widest block">Näringsmål</label>
                <div className="relative">
                  <select
                    value={currentGoal}
                    onChange={(e) => isMobile ? setTempNutritionGoal(e.target.value) : handleDropdownChange('nutritionGoal', e.target.value)}
                    className="w-full py-2.5 pl-4 pr-9 bg-white border-2 border-foreground rounded-xl text-foreground text-[11px] font-black uppercase tracking-wide focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Alla mål</option>
                    {NUTRITION_GOALS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      {/* 1. Desktop View (Unified Card-based Mealfinder) */}
      <div className="hidden md:block bg-card border-3 border-foreground rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-[radial-gradient(rgba(0,0,0,0.025)_1.5px,transparent_1.5px)] [background-size:16px_16px]">
        {/* Header Panel */}
        <div className="p-6 md:p-8 border-b-3 border-foreground bg-secondary/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-400 border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <SlidersHorizontal className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Maja & Kents Mealfinder</h2>
              <p className="text-[10px] text-muted-foreground font-semibold">Skräddarsy ditt sök i realtid</p>
            </div>
          </div>
          
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              type="button"
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 border-2 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Rensa filter</span>
            </button>
          )}
        </div>

        {/* Selectors body */}
        <div className="p-6 md:p-8 space-y-6">
          {renderSelectors(false)}
        </div>
      </div>

      {/* 2. Mobile View (Trigger Button & Dialog Overlay) */}
      <div className="block md:hidden">
        <button
          onClick={handleOpenDialog}
          type="button"
          className="w-full py-4 border-3 border-foreground bg-cyan-100 text-foreground font-black uppercase text-xs tracking-wider rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <SlidersHorizontal className="h-4 w-4 text-foreground shrink-0" />
          <span>{triggerText}</span>
        </button>

        {isDialogOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white border-3 border-foreground rounded-[2rem] p-6 w-full max-w-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="mb-4 pr-8">
                <span className="text-[9px] font-black uppercase tracking-widest text-cyan-800 bg-cyan-100 border border-foreground px-2 py-0.5 rounded inline-block">
                  Mealfinder
                </span>
                <h3 className="text-lg font-black text-foreground uppercase tracking-tight mt-1">
                  Maja & Kents Mealfinder
                </h3>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="absolute top-4 right-4 p-2 bg-secondary border-2 border-foreground hover:bg-red-100 rounded-xl transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px]"
                aria-label="Stäng dialog"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Scrollable Selector Panel */}
              <div className="flex-1 overflow-y-auto space-y-5 py-2 pr-1 select-none">
                {renderSelectors(true)}
              </div>

              {/* Actions Footer */}
              <div className="mt-6 pt-4 border-t-2 border-dashed border-foreground/30 flex justify-between gap-3 flex-wrap">
                <button
                  onClick={handleResetMobile}
                  type="button"
                  className="px-5 py-2.5 bg-red-100 hover:bg-red-200 text-red-800 border-2 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] cursor-pointer"
                >
                  Nollställ
                </button>
                <button
                  type="button"
                  onClick={handleApplyMobile}
                  className="px-5 py-2.5 bg-foreground text-background font-black text-xs uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] cursor-pointer"
                >
                  Sök recept
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </>
  );
}
