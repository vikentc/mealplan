'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  Save, 
  Plus, 
  Check, 
  AlertCircle, 
  Loader2, 
  Utensils, 
  ShoppingCart,
  FileText,
  Pencil
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { saveShoppingList } from '@/app/actions/recipes';
import { useLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface RecipeInstance {
  id: string;
  name: string;
  servings: number;
  instanceId: string;
}

interface RecipeAmount {
  recipeId: string;
  recipeName: string;
  instanceId: string;
  quantity: number | null;
  unit: string | null;
}

interface ShoppingItem {
  name: string;
  quantity: number | null;
  unit: string | null;
  checked: boolean;
  isCustom: boolean;
  recipeAmounts?: RecipeAmount[];
}

interface ShoppingListClientProps {
  initialRecipes: RecipeInstance[];
  initialItems: ShoppingItem[];
}

export default function ShoppingListClient({ 
  initialRecipes = [], 
  initialItems = [] 
}: ShoppingListClientProps) {
  const router = useRouter();
  const { language } = useLanguage();
  
  const [recipes, setRecipes] = useState<RecipeInstance[]>(initialRecipes);
  const [items, setItems] = useState<ShoppingItem[]>(initialItems);

  // Sync with client-side localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localStore = localStorage.getItem('shopping-list-store');
      if (localStore) {
        try {
          const parsed = JSON.parse(localStore);
          if (parsed && (Array.isArray(parsed.items) || Array.isArray(parsed.recipes))) {
            const hasLocalItems = (parsed.items && parsed.items.length > 0) || (parsed.recipes && parsed.recipes.length > 0);
            
            // ALWAYS prioritize localStorage if it has items/recipes
            if (hasLocalItems) {
              setRecipes(parsed.recipes || []);
              setItems(parsed.items || []);
            }
          }
        } catch (e) {
          console.error('Failed to parse shopping list from localStorage', e);
        }
      }
    }
  }, []); // Run ONLY once on mount

  // Helper to save to localStorage
  const saveToLocal = (updatedRecipes: RecipeInstance[], updatedItems: ShoppingItem[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('shopping-list-store', JSON.stringify({
        recipes: updatedRecipes,
        items: updatedItems,
        updatedAt: Date.now()
      }));
    }
  };
  
  // Custom item inputs
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState('');
  const [customUnit, setCustomUnit] = useState('');

  // Status & Feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Custom dialog states
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Edit item states
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editUnit, setEditUnit] = useState('');

  const handleStartEdit = (index: number) => {
    const item = items[index];
    setEditingIndex(index);
    setEditName(item.name);
    setEditQty(item.quantity !== null ? String(item.quantity) : '');
    setEditUnit(item.unit || '');
  };

  const handleSaveEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIndex === null) return;
    if (!editName.trim()) return;

    const qty = editQty.trim() !== '' ? Number(editQty.replace(',', '.')) : null;
    if (qty !== null && isNaN(qty)) {
      setAlertMessage(language === 'sv' ? 'Mängd måste vara en siffra.' : 'Quantity must be a number.');
      return;
    }

    const updatedItems = items.map((item, idx) => {
      if (idx === editingIndex) {
        return {
          ...item,
          name: editName.trim(),
          quantity: qty,
          unit: editUnit.trim() || null,
        };
      }
      return item;
    });

    setItems(updatedItems);
    setEditingIndex(null);
    await autoSave(recipes, updatedItems);
  };

  // Helper to save changes automatically to backend
  const autoSave = async (updatedRecipes: RecipeInstance[], updatedItems: ShoppingItem[]) => {
    // Save to localStorage immediately so client state is guaranteed persistent
    saveToLocal(updatedRecipes, updatedItems);

    setIsSaving(true);
    setSaveFeedback(null);
    try {
      const result = await saveShoppingList(updatedRecipes, updatedItems);
      if (result && (result as any).error) {
        setSaveFeedback({
          type: 'success',
          message: language === 'sv' 
            ? 'Inköpslistan har sparats lokalt på din enhet!' 
            : 'Shopping list saved locally on your device!'
        });
        return;
      }
      setSaveFeedback({
        type: 'success',
        message: language === 'sv' ? 'Inköpslistan har sparats!' : 'Shopping list saved successfully!'
      });
      router.refresh();
    } catch (error: any) {
      console.error('Database save failed, using local storage:', error);
      setSaveFeedback({
        type: 'success',
        message: language === 'sv' 
          ? 'Inköpslistan har sparats lokalt på din enhet!' 
          : 'Shopping list saved locally on your device!'
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveFeedback(null), 3000);
    }
  };

  // 1. Toggle checked status
  const handleToggleChecked = async (index: number) => {
    const updatedItems = items.map((item, idx) => 
      idx === index ? { ...item, checked: !item.checked } : item
    );
    setItems(updatedItems);
    await autoSave(recipes, updatedItems);
  };

  // 2. Add custom item
  const handleAddCustomItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const qty = customQty.trim() !== '' ? Number(customQty.replace(',', '.')) : null;
    if (qty !== null && isNaN(qty)) {
      setAlertMessage(language === 'sv' ? 'Mängd måste vara en siffra.' : 'Quantity must be a number.');
      return;
    }

    const newItem: ShoppingItem = {
      name: customName.trim(),
      quantity: qty,
      unit: customUnit.trim() || null,
      checked: false,
      isCustom: true,
      recipeAmounts: []
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    setIsAddCustomOpen(false);
    
    // Reset inputs
    setCustomName('');
    setCustomQty('');
    setCustomUnit('');

    await autoSave(recipes, updatedItems);
  };

  // 3. Remove a recipe instance and its ingredient contributions
  const handleRemoveRecipe = async (instanceId: string) => {
    const updatedRecipes = recipes.filter(r => r.instanceId !== instanceId);
    const updatedItems = items.map(item => {
      if (item.isCustom) return item;
      
      const remaining = (item.recipeAmounts || []).filter(ra => ra.instanceId !== instanceId);
      if (remaining.length === 0) return null; // Remove item if no recipe needs it

      // Recalculate quantity
      let newQty: number | null = 0;
      let hasNull = false;
      remaining.forEach(ra => {
        if (ra.quantity === null) hasNull = true;
        else if (newQty !== null) newQty += ra.quantity;
      });

      return {
        ...item,
        recipeAmounts: remaining,
        quantity: hasNull ? null : (newQty !== null ? Math.round(newQty * 100) / 100 : null)
      };
    }).filter(Boolean) as ShoppingItem[];

    setRecipes(updatedRecipes);
    setItems(updatedItems);
    await autoSave(updatedRecipes, updatedItems);
  };

  // 4. Remove a custom item
  const handleRemoveCustomItem = async (indexToRemove: number) => {
    const updatedItems = items.filter((_, idx) => idx !== indexToRemove);
    setItems(updatedItems);
    await autoSave(recipes, updatedItems);
  };

  // 5. Clear all items and recipes (and save immediately)
  const handleClearAll = () => {
    setIsClearConfirmOpen(true);
  };

  const executeClearAll = async () => {
    setRecipes([]);
    setItems([]);
    
    // Clear localStorage immediately
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shopping-list-store');
    }
    
    setIsSaving(true);
    setSaveFeedback(null);
    try {
      await saveShoppingList([], []);
      setSaveFeedback({
        type: 'success',
        message: language === 'sv' ? 'Inköpslistan har rensats och sparats!' : 'Shopping list has been cleared and saved!'
      });
      router.refresh();
    } catch (error: any) {
      console.error('Database clear failed:', error);
      setSaveFeedback({
        type: 'success',
        message: language === 'sv' ? 'Inköpslistan har rensats lokalt!' : 'Shopping list has been cleared locally!'
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveFeedback(null), 4000);
    }
  };

  // Separate checked and unchecked items
  const uncheckedItems = items.filter(item => !item.checked);
  const checkedItems = items.filter(item => item.checked);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* LEFT COLUMN: Recipes in list & Actions */}
      <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
        
        {/* Recipes Block */}
        <section className="bg-card border-3 border-foreground p-6 rounded-[2rem] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <h3 className="font-black text-sm uppercase tracking-wider text-foreground flex items-center gap-1.5 border-b-2 border-foreground/15 pb-2">
            <Utensils className="h-4 w-4" />
            <span>{language === 'sv' ? 'Recept i listan' : 'Recipes in List'}</span>
          </h3>

          {recipes.length === 0 ? (
            <p className="text-xs text-foreground/60 font-semibold italic">
              {language === 'sv' 
                ? 'Inga recept tillagda. Gå till ett recept för att lägga till dess ingredienser!' 
                : 'No recipes added. Visit a recipe to add its ingredients!'}
            </p>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {recipes.map((r) => (
                <div 
                  key={r.instanceId} 
                  className="flex items-center justify-between gap-3 p-3 bg-amber-50/40 border-2 border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-foreground line-clamp-1">{r.name}</p>
                    <p className="text-[10px] font-black uppercase text-foreground/50">{r.servings} {language === 'sv' ? 'port' : 'servings'}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveRecipe(r.instanceId)}
                    type="button"
                    className="p-1.5 bg-red-100 hover:bg-red-200 border-2 border-foreground text-red-800 rounded-lg active:translate-y-[1px] transition-all cursor-pointer"
                    title={language === 'sv' ? 'Ta bort receptet och dess ingredienser' : 'Remove recipe and ingredients'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Global Save/Clear Actions */}
        <section className="space-y-3">
          {isSaving && (
            <div className="p-3 bg-cyan-50 border-2 border-cyan-500 text-cyan-900 rounded-xl flex items-center gap-2.5 text-xs font-semibold shadow-[2px_2px_0px_0px_rgba(6,182,212,0.2)] animate-pulse">
              <Loader2 className="h-4.5 w-4.5 animate-spin shrink-0 text-cyan-700" />
              <span>{language === 'sv' ? 'Sparar ändringar...' : 'Saving changes...'}</span>
            </div>
          )}

          {!isSaving && saveFeedback && (
            <div className={cn(
              "p-3.5 border-2 rounded-xl flex items-start gap-2.5 text-xs font-semibold shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)]",
              saveFeedback.type === 'success' 
                ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-[3px_3px_0px_0px_rgba(16,185,129,0.2)]" 
                : "bg-red-50 border-red-500 text-red-850 shadow-[3px_3px_0px_0px_rgba(239,68,68,0.2)]"
            )}>
              {saveFeedback.type === 'success' ? (
                <Check className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              )}
              <span>{saveFeedback.message}</span>
            </div>
          )}

          {recipes.length > 0 || items.length > 0 ? (
            <button
              onClick={handleClearAll}
              className="w-full py-3 bg-red-100 hover:bg-red-200 text-red-800 border-3 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="h-4.5 w-4.5" />
              <span>{language === 'sv' ? 'Rensa allt' : 'Clear All'}</span>
            </button>
          ) : null}
        </section>

      </div>

      {/* RIGHT COLUMN: Items checklist & Add custom items */}
      <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
        
        {/* Checklist */}
        <section className="bg-card border-3 border-foreground p-6 md:p-8 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
          
          <div className="flex justify-between items-center gap-3 border-b-2 border-foreground/15 pb-2 flex-wrap">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <ShoppingCart className="h-4.5 w-4.5" />
                <span>{language === 'sv' ? 'Varor att handla' : 'Items Checklist'}</span>
              </h3>
              <span className="text-[10px] font-black uppercase text-foreground bg-cyan-100 border-2 border-foreground px-2 py-0.5 rounded-md shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] animate-pulse">
                {uncheckedItems.length} {language === 'sv' ? 'kvar' : 'left'}
              </span>
            </div>
            
            <button
              type="button"
              onClick={() => setIsAddCustomOpen(true)}
              className="px-3 py-1.5 bg-cyan-100 hover:bg-cyan-200 text-cyan-950 border-2 border-foreground font-black text-[10px] uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{language === 'sv' ? 'Egen vara' : 'Custom Item'}</span>
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xs text-foreground/60 font-semibold italic">
                {language === 'sv' 
                  ? 'Din inköpslista är tom! Skapa recept eller lägg till egna varor.' 
                  : 'Your shopping list is empty! Visit recipes or add custom items below.'}
              </p>
            </div>
          ) : (
            <div className="divide-y-2 divide-foreground/15 space-y-1">
              
              {/* Unchecked Items */}
              {uncheckedItems.map((item) => {
                const globalIndex = items.indexOf(item);
                return (
                  <div key={globalIndex} className="py-3.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <div 
                        className="flex items-center gap-3 select-none cursor-pointer"
                        onClick={() => handleToggleChecked(globalIndex)}
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => {}} // handled by click on parent div
                          className="h-5 w-5 rounded-full border-2 border-foreground bg-white checked:bg-[#f5ecd8] focus:ring-0 focus:ring-offset-0 cursor-pointer appearance-none shrink-0 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] checked:shadow-none checked:translate-y-[1.5px] transition-all relative after:content-[''] after:hidden checked:after:block after:absolute after:left-[5.5px] after:top-[1.5px] after:w-[5px] after:h-[10px] after:border-r-2 after:border-b-2 after:border-foreground after:rotate-45"
                        />
                        <span className="text-xs font-black uppercase text-foreground">
                          {item.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.quantity !== null && (
                          <span className="px-2 py-0.5 border-2 border-foreground bg-cyan-100 text-foreground text-[10px] font-black uppercase rounded-md shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                            {item.quantity} {item.unit || ''}
                          </span>
                        )}
                        <button
                          onClick={() => handleStartEdit(globalIndex)}
                          type="button"
                          className="p-1 bg-amber-50 hover:bg-amber-200 border-2 border-foreground text-amber-900 rounded-md active:translate-y-[1px] cursor-pointer"
                          title={language === 'sv' ? 'Redigera vara' : 'Edit item'}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {item.isCustom && (
                          <button
                            onClick={() => handleRemoveCustomItem(globalIndex)}
                            type="button"
                            className="p-1 bg-red-100 hover:bg-red-200 border-2 border-foreground text-red-800 rounded-md active:translate-y-[1px] cursor-pointer"
                            title={language === 'sv' ? 'Ta bort vara' : 'Delete item'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Breakdown of recipe contributions */}
                    {!item.isCustom && item.recipeAmounts && item.recipeAmounts.length > 0 && (
                      <div className="pl-8 flex flex-col gap-0.5 border-l-2 border-dashed border-foreground/20 ml-2.5">
                        {item.recipeAmounts.map((ra, idx) => (
                          <span key={idx} className="text-[9px] font-black uppercase text-foreground/60 leading-none">
                            • {ra.quantity !== null ? `${ra.quantity} ${ra.unit || ''}` : (language === 'sv' ? 'efter smak' : 'to taste')} ({ra.recipeName})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Checked Items Divider */}
              {checkedItems.length > 0 && uncheckedItems.length > 0 && (
                <div className="py-2 flex items-center gap-2.5 text-[10px] font-black uppercase text-foreground/40 tracking-wider">
                  <div className="h-[2px] bg-foreground/10 flex-1"></div>
                  <span>{language === 'sv' ? 'Köpta varor' : 'Bought Items'}</span>
                  <div className="h-[2px] bg-foreground/10 flex-1"></div>
                </div>
              )}

              {/* Checked Items */}
              {checkedItems.map((item) => {
                const globalIndex = items.indexOf(item);
                return (
                  <div key={globalIndex} className="py-3 bg-secondary/10 opacity-55 rounded-xl px-2.5 my-1.5 flex items-center justify-between gap-3 transition-opacity">
                    <div 
                      className="flex items-center gap-3 select-none cursor-pointer"
                      onClick={() => handleToggleChecked(globalIndex)}
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => {}} // handled by click on parent div
                        className="h-5 w-5 rounded-full border-2 border-foreground bg-[#f5ecd8] checked:bg-[#f5ecd8] focus:ring-0 focus:ring-offset-0 cursor-pointer appearance-none shrink-0 relative after:content-[''] after:block after:absolute after:left-[5.5px] after:top-[1.5px] after:w-[5px] after:h-[10px] after:border-r-2 after:border-b-2 after:border-foreground after:rotate-45"
                      />
                      <span className="text-xs font-black uppercase text-foreground/65 line-through">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.quantity !== null && (
                        <span className="px-2 py-0.5 border-2 border-foreground bg-secondary text-foreground text-[10px] font-black uppercase rounded-md line-through">
                          {item.quantity} {item.unit || ''}
                        </span>
                      )}
                      <button
                        onClick={() => handleStartEdit(globalIndex)}
                        type="button"
                        className="p-1 bg-amber-50 hover:bg-amber-200 border-2 border-foreground text-amber-900 rounded-md cursor-pointer"
                        title={language === 'sv' ? 'Redigera vara' : 'Edit item'}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {item.isCustom && (
                        <button
                          onClick={() => handleRemoveCustomItem(globalIndex)}
                          type="button"
                          className="p-1 bg-red-100 hover:bg-red-200 border-2 border-foreground text-red-800 rounded-md cursor-pointer"
                          title={language === 'sv' ? 'Ta bort vara' : 'Delete item'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

            </div>
          )}

        </section>

      </div>

      {/* Confirmation Modal */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border-3 border-foreground rounded-[2rem] p-6 max-w-sm w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 border-2 border-foreground flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Trash2 className="h-5 w-5 text-red-800" />
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-sm uppercase tracking-wider text-foreground">
                  {language === 'sv' ? 'Rensa inköpslista?' : 'Clear Shopping List?'}
                </h4>
                <p className="text-xs text-foreground/80 font-semibold mt-1">
                  {language === 'sv' 
                    ? 'Är du säker på att du vill rensa hela listan? Detta kan inte ångras och sparar listan direkt.' 
                    : 'Are you sure you want to clear the entire list? This cannot be undone and saves the list immediately.'}
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

      {/* Alert Modal */}
      {alertMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border-3 border-foreground rounded-[2rem] p-6 max-w-sm w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 border-2 border-foreground flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <AlertCircle className="h-5 w-5 text-amber-850" />
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-sm uppercase tracking-wider text-foreground">
                  {language === 'sv' ? 'Uppmärksamhet' : 'Attention'}
                </h4>
                <p className="text-xs text-foreground/80 font-semibold mt-1">
                  {alertMessage}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setAlertMessage(null)}
                className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-foreground border-2 border-foreground font-black text-[10px] uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              >
                {language === 'sv' ? 'Stäng' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Item Modal */}
      {isAddCustomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border-3 border-foreground rounded-[2rem] p-6 max-w-sm w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b-2 border-foreground/15 pb-2">
              <h4 className="font-black text-sm uppercase tracking-wider text-foreground">
                {language === 'sv' ? 'Lägg till egen vara' : 'Add Custom Item'}
              </h4>
              <button
                type="button"
                onClick={() => setIsAddCustomOpen(false)}
                className="text-foreground hover:text-red-600 font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddCustomItem} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-foreground/80 uppercase tracking-wider block">
                  {language === 'sv' ? 'Artikelnamn' : 'Item Name'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'sv' ? 't.ex. Mjölk' : 'e.g. Milk'}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-foreground rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-foreground/80 uppercase tracking-wider block">
                    {language === 'sv' ? 'Mängd' : 'Quantity'}
                  </label>
                  <input
                    type="text"
                    placeholder="1.5"
                    value={customQty}
                    onChange={(e) => setCustomQty(e.target.value)}
                    className="w-full p-2.5 bg-white border-2 border-foreground rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-foreground/80 uppercase tracking-wider block">
                    {language === 'sv' ? 'Enhet' : 'Unit'}
                  </label>
                  <input
                    type="text"
                    placeholder="st, dl, g"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    className="w-full p-2.5 bg-white border-2 border-foreground rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomOpen(false)}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 border-2 border-foreground font-black text-[10px] uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  {language === 'sv' ? 'Avbryt' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-100 hover:bg-cyan-200 text-foreground border-2 border-foreground font-black text-[10px] uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>{language === 'sv' ? 'Lägg till' : 'Add'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border-3 border-foreground rounded-[2rem] p-6 max-w-sm w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b-2 border-foreground/15 pb-2">
              <h4 className="font-black text-sm uppercase tracking-wider text-foreground">
                {language === 'sv' ? 'Redigera vara' : 'Edit Item'}
              </h4>
              <button
                type="button"
                onClick={() => setEditingIndex(null)}
                className="text-foreground hover:text-red-600 font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveEditItem} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-foreground/80 uppercase tracking-wider block">
                  {language === 'sv' ? 'Artikelnamn' : 'Item Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-foreground rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-foreground/80 uppercase tracking-wider block">
                    {language === 'sv' ? 'Mängd' : 'Quantity'}
                  </label>
                  <input
                    type="text"
                    placeholder="1.5"
                    value={editQty}
                    onChange={(e) => setEditQty(e.target.value)}
                    className="w-full p-2.5 bg-white border-2 border-foreground rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-foreground/80 uppercase tracking-wider block">
                    {language === 'sv' ? 'Enhet' : 'Unit'}
                  </label>
                  <input
                    type="text"
                    placeholder="st, dl, g"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full p-2.5 bg-white border-2 border-foreground rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingIndex(null)}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 border-2 border-foreground font-black text-[10px] uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  {language === 'sv' ? 'Avbryt' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-foreground border-2 border-foreground font-black text-[10px] uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-1"
                >
                  <Check className="h-4 w-4" />
                  <span>{language === 'sv' ? 'Spara' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
