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
  ChevronUp
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

export default function RecommendationSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const activeMealType = searchParams.get('mealType') || '';
  const activeCraving = searchParams.get('craving') || '';

  // Collapsible state for desktop: defaults to expanded if a filter is active
  const [isExpanded, setIsExpanded] = useState(!!(activeMealType || activeCraving));

  // Local state for mobile selections to avoid premature dialog closure during selection
  const [tempMealType, setTempMealType] = useState(activeMealType);
  const [tempCraving, setTempCraving] = useState(activeCraving);

  // Keep local state in sync with URL search params changes (e.g. if cleared on desktop)
  useEffect(() => {
    setTempMealType(activeMealType);
    setTempCraving(activeCraving);
  }, [activeMealType, activeCraving]);

  const handleOpenDialog = () => {
    setTempMealType(activeMealType);
    setTempCraving(activeCraving);
    setIsDialogOpen(true);
  };

  const handleSelectMeal = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeMealType === id) {
      params.delete('mealType');
    } else {
      params.set('mealType', id);
    }
    router.push(`/?${params.toString()}`);
  };

  const handleSelectMealMobile = (id: string) => {
    setTempMealType(prev => prev === id ? '' : id);
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

  const handleSelectCravingMobile = (id: string) => {
    setTempCraving(prev => prev === id ? '' : id);
  };

  const handleReset = () => {
    router.push('/');
  };

  const handleApplyMobile = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (tempMealType) {
      params.set('mealType', tempMealType);
    } else {
      params.delete('mealType');
    }

    if (tempCraving) {
      params.set('craving', tempCraving);
    } else {
      params.delete('craving');
    }

    router.push(`/?${params.toString()}`);
    setIsDialogOpen(false);
  };

  const handleResetMobile = () => {
    setTempMealType('');
    setTempCraving('');
    router.push('/');
    setIsDialogOpen(false);
  };

  const activeMealLabel = MEAL_TYPES.find(t => t.id === activeMealType)?.label || '';
  const activeCravingLabel = CRAVINGS.find(c => c.id === activeCraving)?.label || '';

  let triggerText = '🔍 Anpassa måltid & cravings';
  if (activeMealLabel || activeCravingLabel) {
    const parts = [];
    if (activeMealLabel) parts.push(activeMealLabel);
    if (activeCravingLabel) parts.push(activeCravingLabel.split(' ').slice(1).join(' ') || activeCravingLabel);
    triggerText = `🥑 ${parts.join(' + ')}`;
  }

  const renderSelectors = (isMobile: boolean) => (
    <>
      {/* Meal type selection */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase text-foreground/80 tracking-wider flex items-center gap-1.5">
          <Utensils className="h-4 w-4" />
          <span>Välj måltid</span>
        </h3>
        
        <div className={cn(
          "grid gap-4",
          isMobile ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
        )}>
          {MEAL_TYPES.map((type) => {
            const Icon = type.icon;
            const isActive = isMobile ? tempMealType === type.id : activeMealType === type.id;
            
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
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-black uppercase text-foreground/80 tracking-wider flex items-center gap-1.5">
          <Smile className="h-4 w-4" />
          <span>Vad är du sugen på? (Cravings)</span>
        </h3>

        <div className="flex flex-wrap gap-3">
          {CRAVINGS.map((craving) => {
            const isActive = isMobile ? tempCraving === craving.id : activeCraving === craving.id;
            
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
    </>
  );

  return (
    <>
      {/* 1. Desktop View (Collapsible Inline Selector) */}
      <div className="hidden md:block bg-card border-3 border-foreground rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden transition-all duration-300">
        {/* Header Button to Toggle Collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          type="button"
          className="w-full p-6 md:p-8 flex items-center justify-between text-left font-black uppercase text-xs md:text-sm tracking-wider hover:bg-secondary/20 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-3 flex-wrap">
            <SlidersHorizontal className="h-5 w-5 text-foreground shrink-0" />
            <span className="text-foreground font-black">Maja & Kents Matakut (Måltid & cravings)</span>
            {activeMealLabel || activeCravingLabel ? (
              <span className="normal-case text-[10px] md:text-xs text-emerald-800 bg-emerald-100 border border-emerald-800 px-3 py-1 rounded-xl inline-block shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                Valt: {activeMealLabel} {activeCravingLabel ? `+ ${activeCravingLabel.split(' ').slice(1).join(' ')}` : ''}
              </span>
            ) : null}
          </div>
          
          <div className="flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest text-foreground/75 shrink-0 pl-4">
            <span>{isExpanded ? 'Dölj val' : 'Visa val'}</span>
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </button>

        {/* Expandable Section Body */}
        {isExpanded && (
          <div className="p-6 md:p-8 border-t-3 border-foreground bg-[radial-gradient(rgba(0,0,0,0.04)_1.5px,transparent_1.5px)] [background-size:16px_16px] space-y-6 animate-in slide-in-from-top-4 duration-200">
            {renderSelectors(false)}

            {/* Reset button if active filters */}
            {(activeMealType || activeCraving) && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleReset}
                  type="button"
                  className="px-5 py-2.5 bg-red-100 hover:bg-red-200 text-red-800 border-2 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  Nollställ val
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
            <div className="bg-white border-3 border-foreground rounded-[2rem] p-6 w-full max-w-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="mb-4 pr-8">
                <span className="text-[9px] font-black uppercase tracking-widest text-cyan-800 bg-cyan-100 border border-foreground px-2 py-0.5 rounded inline-block">
                  Filtrera måltid
                </span>
                <h3 className="text-lg font-black text-foreground uppercase tracking-tight mt-1">
                  Maja & Kents Matakut
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
              <div className="flex-1 overflow-y-auto space-y-6 py-2 pr-1 select-none">
                {renderSelectors(true)}
              </div>

              {/* Actions Footer */}
              <div className="mt-6 pt-4 border-t-2 border-dashed border-foreground/30 flex justify-between gap-3 flex-wrap">
                <button
                  onClick={handleResetMobile}
                  type="button"
                  className="px-5 py-2.5 bg-red-100 hover:bg-red-200 text-red-800 border-2 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] cursor-pointer"
                >
                  Rensa val
                </button>
                <button
                  type="button"
                  onClick={handleApplyMobile}
                  className="px-5 py-2.5 bg-foreground text-background font-black text-xs uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] cursor-pointer"
                >
                  Visa träffar
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </>
  );
}
