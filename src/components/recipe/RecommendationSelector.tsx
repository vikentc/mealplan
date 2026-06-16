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
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Globe,
  Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';

const MEAL_TYPES = [
  { id: 'breakfast', icon: Coffee, bg: 'bg-amber-100', text: 'text-amber-950' },
  { id: 'lunch', icon: Utensils, bg: 'bg-emerald-100', text: 'text-emerald-950' },
  { id: 'dinner', icon: ChefHat, bg: 'bg-cyan-100', text: 'text-cyan-950' },
  { id: 'dessert', icon: Sparkles, bg: 'bg-purple-100', text: 'text-purple-950' },
  { id: 'snack', icon: Cookie, bg: 'bg-red-100', text: 'text-red-950' },
];

const CRAVINGS = [
  { id: 'comfort-food', bg: 'bg-amber-100', text: 'text-amber-950' },
  { id: 'spicy', bg: 'bg-red-100', text: 'text-red-950' },
  { id: 'sweet', bg: 'bg-pink-100', text: 'text-pink-950' },
  { id: 'cheesy', bg: 'bg-yellow-100', text: 'text-yellow-950' },
  { id: 'fresh-light', bg: 'bg-green-100', text: 'text-green-950' },
  { id: 'warm-hearty', bg: 'bg-orange-100', text: 'text-orange-950' },
  { id: 'quick-easy', bg: 'bg-cyan-100', text: 'text-cyan-950' },
  { id: 'rich-creamy', bg: 'bg-purple-100', text: 'text-purple-950' },
  { id: 'high-protein', bg: 'bg-emerald-100', text: 'text-emerald-950' },
];

const CUISINES = ['Vietnamese', 'Thai', 'Japanese', 'Swedish', 'Italian', 'Mexican'];
const FLAVORS = ['spicy', 'sweet', 'savory', 'sour', 'umami', 'creamy', 'tangy', 'rich', 'light', 'fresh'];

export default function RecommendationSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { t, language } = useLanguage();
  
  // Collapsible state for desktop card: defaults to expanded if any filter is active
  const [isExpanded, setIsExpanded] = useState(!!(
    searchParams.get('mealType') || 
    searchParams.get('craving') || 
    searchParams.get('cuisine') || 
    searchParams.get('flavor')
  ));

  // Read URL search params
  const activeQuery = searchParams.get('query') || '';
  const activeMealType = searchParams.get('mealType') || '';
  const activeCraving = searchParams.get('craving') || '';
  const activeCuisine = searchParams.get('cuisine') || '';
  const activeFlavor = searchParams.get('flavor') || '';

  // Local state for mobile dialog
  const [tempQuery, setTempQuery] = useState(activeQuery);
  const [tempMealType, setTempMealType] = useState(activeMealType);
  const [tempCraving, setTempCraving] = useState(activeCraving);
  const [tempCuisine, setTempCuisine] = useState(activeCuisine);
  const [tempFlavor, setTempFlavor] = useState(activeFlavor);

  // Sync temp states when URL search parameters change
  useEffect(() => {
    setTempQuery(activeQuery);
    setTempMealType(activeMealType);
    setTempCraving(activeCraving);
    setTempCuisine(activeCuisine);
    setTempFlavor(activeFlavor);
  }, [activeQuery, activeMealType, activeCraving, activeCuisine, activeFlavor]);

  const handleOpenDialog = () => {
    setTempQuery(activeQuery);
    setTempMealType(activeMealType);
    setTempCraving(activeCraving);
    setTempCuisine(activeCuisine);
    setTempFlavor(activeFlavor);
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

  const handleSelectCuisine = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeCuisine === id) {
      params.delete('cuisine');
    } else {
      params.set('cuisine', id);
    }
    router.push(`/?${params.toString()}`);
  };

  const handleSelectFlavor = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeFlavor === id) {
      params.delete('flavor');
    } else {
      params.set('flavor', id);
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

  const handleSelectCuisineMobile = (id: string) => {
    setTempCuisine(prev => prev === id ? '' : id);
  };

  const handleSelectFlavorMobile = (id: string) => {
    setTempFlavor(prev => prev === id ? '' : id);
  };

  // Reset actions
  const handleReset = () => {
    setTempQuery('');
    setTempMealType('');
    setTempCraving('');
    setTempCuisine('');
    setTempFlavor('');
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

    router.push(`/?${params.toString()}`);
    setIsDialogOpen(false);
  };

  const handleResetMobile = () => {
    setTempQuery('');
    setTempMealType('');
    setTempCraving('');
    setTempCuisine('');
    setTempFlavor('');
    router.push('/');
    setIsDialogOpen(false);
  };

  const hasActiveFilters = !!(
    activeMealType || 
    activeCraving || 
    activeCuisine || 
    activeFlavor
  );

  const activeMealLabel = activeMealType ? t(`meal.${activeMealType}`) : '';
  const activeCravingLabel = activeCraving ? t(`craving.${activeCraving}`) : '';

  let triggerText = t('compass.trigger');
  if (activeMealLabel || activeCravingLabel) {
    const parts = [];
    if (activeMealLabel) parts.push(activeMealLabel);
    if (activeCravingLabel) parts.push(activeCravingLabel.includes(' ') ? activeCravingLabel.split(' ').slice(1).join(' ') : activeCravingLabel);
    triggerText = `🥑 ${parts.join(' + ')}`;
  }

  const renderSelectors = (isMobile: boolean) => {
    const currentMeal = isMobile ? tempMealType : activeMealType;
    const currentCraving = isMobile ? tempCraving : activeCraving;
    const currentCuisine = isMobile ? tempCuisine : activeCuisine;
    const currentFlavor = isMobile ? tempFlavor : activeFlavor;

    return (
      <>
        {/* Meal type selection */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-black uppercase text-foreground/80 tracking-wider flex items-center gap-1.5">
            <Utensils className="h-4 w-4 text-foreground/70" />
            <span>{t('compass.choose_meal')}</span>
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
                  <span className="font-black text-xs uppercase tracking-tight">{t(`meal.${type.id}`)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cravings selection */}
        <div className="space-y-3 pt-4">
          <h3 className="text-xs font-black uppercase text-foreground/80 tracking-wider flex items-center gap-1.5">
            <Smile className="h-4 w-4 text-foreground/70" />
            <span>{t('compass.cravings')}</span>
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
                  {t(`craving.${craving.id}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Kluriga följdfrågor (Cuisine & Flavor) */}
        <div className="space-y-4 pt-4 border-t-2 border-dashed border-foreground/20">
          <h3 className="text-xs font-black uppercase text-foreground/80 tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal className="h-4 w-4 text-foreground/70" />
            <span>{t('compass.followup')}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cuisine Selectable Tags */}
            <div className="space-y-3 p-4 bg-secondary/5 border-2 border-foreground/10 rounded-2xl">
              <h4 className="text-[10px] font-black uppercase text-foreground/70 tracking-wider flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-foreground/60" />
                <span>{t('compass.cuisine')}</span>
              </h4>

              <div className="flex flex-wrap gap-2">
                {CUISINES.map((cuisine) => {
                  const label = t(`cuisine.${cuisine}`) || cuisine;
                  const isActive = currentCuisine === cuisine;
                  
                  return (
                    <button
                      key={cuisine}
                      onClick={() => isMobile ? handleSelectCuisineMobile(cuisine) : handleSelectCuisine(cuisine)}
                      type="button"
                      className={cn(
                        "px-4 py-2.5 border-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all duration-200 cursor-pointer active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
                        isActive
                          ? "border-foreground bg-cyan-100 text-cyan-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[-1px]"
                          : "bg-white border-foreground/30 hover:border-foreground hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] text-foreground/85"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Flavor Selectable Tags */}
            <div className="space-y-3 p-4 bg-secondary/5 border-2 border-foreground/10 rounded-2xl">
              <h4 className="text-[10px] font-black uppercase text-foreground/70 tracking-wider flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-foreground/60" />
                <span>{t('compass.flavor')}</span>
              </h4>

              <div className="flex flex-wrap gap-2">
                {FLAVORS.map((flavor) => {
                  const label = t(`flavor.${flavor}`) || flavor;
                  const isActive = currentFlavor === flavor;
                  
                  return (
                    <button
                      key={flavor}
                      onClick={() => isMobile ? handleSelectFlavorMobile(flavor) : handleSelectFlavor(flavor)}
                      type="button"
                      className={cn(
                        "px-4 py-2.5 border-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all duration-200 cursor-pointer active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
                        isActive
                          ? "border-foreground bg-orange-100 text-orange-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[-1px]"
                          : "bg-white border-foreground/30 hover:border-foreground hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] text-foreground/85"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      {/* 1. Desktop View (Unified Card-based Mealfinder) */}
      <div className="hidden md:block bg-card border-3 border-foreground rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {/* Header Panel Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          type="button"
          className="w-full p-6 md:p-8 bg-secondary/15 flex items-center justify-between hover:bg-secondary/25 transition-colors cursor-pointer select-none text-left focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-400 border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <SlidersHorizontal className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-foreground">{t('compass.title')}</h2>
              <p className="text-[10px] text-muted-foreground font-semibold">{t('compass.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/75 shrink-0 pl-4">
            <span>{isExpanded ? t('compass.hide') : t('compass.show')}</span>
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </button>

        {/* Selectors body */}
        {isExpanded && (
          <div className="p-6 md:p-8 space-y-6 border-t-3 border-foreground bg-[radial-gradient(rgba(0,0,0,0.025)_1.5px,transparent_1.5px)] [background-size:16px_16px] animate-in slide-in-from-top-4 duration-200">
            {renderSelectors(false)}

            {hasActiveFilters && (
              <div className="flex justify-end pt-4 border-t-2 border-dashed border-foreground/25">
                <button
                  onClick={handleReset}
                  type="button"
                  className="px-5 py-2.5 bg-red-100 hover:bg-red-200 text-red-800 border-2 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>{t('compass.clear')}</span>
                </button>
              </div>
            )}
          </div>
        )}
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
                  {t('compass.trigger')} 🧭
                </span>
                <h3 className="text-lg font-black text-foreground uppercase tracking-tight mt-1">
                  {t('compass.title')}
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
                  {t('compass.reset')}
                </button>
                <button
                  type="button"
                  onClick={handleApplyMobile}
                  className="px-5 py-2.5 bg-foreground text-background font-black text-xs uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] cursor-pointer"
                >
                  {t('compass.search')}
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </>
  );
}
