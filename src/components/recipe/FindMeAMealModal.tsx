'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Coffee, Utensils, ChefHat, Cookie, Sparkles, 
  Clock, Users, RotateCcw, ArrowLeft, Eye
} from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

interface FindMeAMealModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Frukost', icon: Coffee, bg: 'bg-amber-100', hoverBg: 'hover:bg-amber-200', border: 'border-amber-400', text: 'text-amber-950' },
  { id: 'lunch', label: 'Lunch', icon: Utensils, bg: 'bg-emerald-100', hoverBg: 'hover:bg-emerald-200', border: 'border-emerald-400', text: 'text-emerald-950' },
  { id: 'dinner', label: 'Middag', icon: ChefHat, bg: 'bg-cyan-100', hoverBg: 'hover:bg-cyan-200', border: 'border-cyan-400', text: 'text-cyan-950' },
  { id: 'dessert', label: 'Efterrätt', icon: Sparkles, bg: 'bg-purple-100', hoverBg: 'hover:bg-purple-200', border: 'border-purple-400', text: 'text-purple-950' },
  { id: 'snack', label: 'Mellanmål', icon: Cookie, bg: 'bg-red-100', hoverBg: 'hover:bg-red-200', border: 'border-red-400', text: 'text-red-950' },
];

const LOADING_MESSAGES = [
  "Rör om i grytan... 🥣",
  "Smakar av kryddningen... 🌶️",
  "Konsulterar kocken Maja... 👩‍🍳",
  "Frågar den hungrige Kent... 👨‍🍳",
  "Hittar de färskaste ingredienserna... 🌿",
  "Dukar bordet... 🍽️",
];

export default function FindMeAMealModal({ isOpen, onClose }: FindMeAMealModalProps) {
  const [step, setStep] = useState<'select-type' | 'suggesting'>('select-type');
  const [selectedType, setSelectedType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [suggestedRecipes, setSuggestedRecipes] = useState<any[]>([]);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);

  // Rotate loading messages during active loading
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      const randomMsg = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
      setLoadingMsg(randomMsg);
    }, 1200);
    return () => clearInterval(interval);
  }, [loading]);

  if (!isOpen) return null;

  const handleSelectType = async (typeId: string) => {
    setSelectedType(typeId);
    setStep('suggesting');
    await fetchSuggestions(typeId);
  };

  const fetchSuggestions = async (typeId: string) => {
    setLoading(true);
    setLoadingMsg(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    try {
      const response = await fetch(`/api/recipes?mealType=${typeId}`);
      if (!response.ok) throw new Error('Fetch failed');
      const data = await response.ok ? await response.json() : { recipes: [] };
      const matching = data.recipes || [];
      
      if (matching.length > 0) {
        // Select 3 random ones
        const shuffled = [...matching].sort(() => 0.5 - Math.random());
        setSuggestedRecipes(shuffled.slice(0, 3));
      } else {
        setSuggestedRecipes([]);
      }
    } catch (err) {
      console.error(err);
      setSuggestedRecipes([]);
    } finally {
      // Small artificial delay for premium feels and animations
      setTimeout(() => {
        setLoading(false);
      }, 900);
    }
  };

  const handleBack = () => {
    setStep('select-type');
    setSuggestedRecipes([]);
  };

  const mealTypeLabel = MEAL_TYPES.find(t => t.id === selectedType)?.label || '';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border-3 border-foreground rounded-[2rem] p-6 md:p-8 w-full max-w-4xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-secondary border-2 border-foreground hover:bg-red-100 rounded-xl transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px]"
          aria-label="Stäng modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 pr-8">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 bg-amber-100 border-2 border-foreground px-3 py-1 rounded-md inline-block">
            Måltidsväljare 🎲
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-foreground uppercase tracking-tight mt-1.5 flex items-center gap-2">
            <span>Hitta en måltid</span>
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">
            {step === 'select-type' 
              ? "Svårt att bestämma dig? Välj måltidstyp så drar vi tre smarriga förslag ur hatten!" 
              : `Här är tre utmärkta förslag för din ${mealTypeLabel.toLowerCase()}!`
            }
          </p>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto min-h-[300px] flex flex-col md:justify-center">
          {step === 'select-type' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 py-4">
              {MEAL_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => handleSelectType(type.id)}
                    className={cn(
                      "p-4 md:p-6 border-3 rounded-2xl flex flex-col items-center justify-center gap-2 md:gap-3 transition-all duration-200 cursor-pointer active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
                      "bg-white border-foreground text-foreground/80 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                      type.hoverBg
                    )}
                  >
                    <div className={cn("h-12 w-12 rounded-xl border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]", type.bg, type.text)}>
                      <Icon className="h-6 w-6 shrink-0" />
                    </div>
                    <span className="font-black text-sm uppercase tracking-tight">{type.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Suggestions view */
            <div className="w-full flex-1 flex flex-col justify-between">
              {loading ? (
                /* Loading State */
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="relative h-16 w-16">
                    <div className="absolute inset-0 rounded-full border-4 border-foreground border-t-amber-400 animate-spin" />
                  </div>
                  <p className="font-black text-sm uppercase tracking-wider text-foreground animate-pulse">
                    {loadingMsg}
                  </p>
                </div>
              ) : suggestedRecipes.length === 0 ? (
                /* Empty state */
                <div className="text-center py-12">
                  <p className="text-sm font-black uppercase text-foreground/60">Hittade inga recept för {mealTypeLabel.toLowerCase()} 😭</p>
                  <button
                    onClick={handleBack}
                    className="mt-4 px-4 py-2 border-2 border-foreground rounded-xl bg-card hover:bg-secondary font-black text-xs uppercase"
                  >
                    Gå tillbaka
                  </button>
                </div>
              ) : (
                /* 3 Recipe cards grid */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-2">
                  {suggestedRecipes.map((recipe) => {
                    return (
                      <div 
                        key={recipe.id} 
                        className="bg-card border-3 border-foreground rounded-[2rem] overflow-hidden flex flex-col h-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all relative"
                      >
                        {/* Image area */}
                        <div className="relative h-36 w-full bg-secondary border-b-3 border-foreground">
                          {recipe.image ? (
                            <Image
                              src={recipe.image}
                              alt={recipe.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-foreground/40 font-black uppercase text-[10px] bg-secondary/50">
                              Bild saknas
                            </div>
                          )}

                          {/* Top Badges */}
                          <div className="absolute top-2 left-2 flex gap-1 z-10">
                            <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-950 border border-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                              {recipe.cuisine}
                            </span>
                          </div>


                        </div>

                        {/* Card details */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              {recipe.nutrition?.protein >= 30 && (
                                <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-foreground bg-emerald-100 text-emerald-800">
                                  💪 Proteinrik
                                </span>
                              )}
                              <div className="flex items-center gap-1 text-[8px] font-black uppercase text-foreground bg-secondary/40 border border-foreground px-1.5 py-0.5 rounded">
                                <Clock className="h-3 w-3 text-foreground" />
                                <span>{formatTime(recipe.totalTime)}</span>
                              </div>
                            </div>

                            <h3 className="font-black text-sm uppercase leading-tight line-clamp-1 mb-1 text-foreground">
                              {recipe.name}
                            </h3>
                            <p className="text-[10px] text-foreground/80 font-medium line-clamp-2 mb-3">
                              {recipe.description || "Ingen beskrivning tillgänglig."}
                            </p>
                          </div>

                          {/* Nutrition indicators & Link */}
                          <div className="space-y-3 pt-2 border-t border-dashed border-foreground/30">
                            <div className="flex justify-between items-center text-[9px] font-black uppercase text-foreground/75">
                              <span>{recipe.nutrition?.calories || 0} kcal</span>
                              <span>{recipe.nutrition?.protein || 0}g prot</span>
                            </div>

                            <Link
                              href={`/recipes/${recipe.id}`}
                              onClick={onClose}
                              className="w-full py-2 bg-foreground hover:bg-foreground/90 text-background text-xs font-black uppercase rounded-xl border border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Visa recept</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer (only visible in suggestions step and when not loading) */}
        {step === 'suggesting' && !loading && (
          <div className="mt-6 pt-4 border-t-2 border-dashed border-foreground/30 flex justify-between items-center gap-3">
            <button
              onClick={handleBack}
              type="button"
              className="px-4 py-2 border-2 border-foreground bg-secondary/20 hover:bg-secondary/40 text-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Ändra måltid</span>
            </button>
            
            {suggestedRecipes.length > 0 && (
              <button
                onClick={() => fetchSuggestions(selectedType)}
                type="button"
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-foreground border-2 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] cursor-pointer flex items-center gap-1.5 animate-bounce-subtle"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Slumpa igen 🔄</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
