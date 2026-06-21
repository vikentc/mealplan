'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  PlusCircle, 
  Sparkles, 
  Utensils, 
  Coffee,
  Heart,
  ChefHat,
  Search,
  ChevronRight,
  BookOpen,
  X
} from 'lucide-react';
import RecommendationSelector from '@/components/recipe/RecommendationSelector';
import RecommendationCard from '@/components/recipe/RecommendationCard';
import RecipeCard from '@/components/recipe/RecipeCard';
import FindMeAMealModal from '@/components/recipe/FindMeAMealModal';
import { useLanguage } from '@/lib/i18n';

interface HomeClientProps {
  mealType: string;
  craving: string;
  filters: any;
  recipes: any[];
  isSearchActive: boolean;
  isRecommendationActive: boolean;
  shoppingItemCount?: number;
  weeklyPlans?: any[];
}

const mealTypeLabels: Record<string, string> = {
  'breakfast': 'Frukost',
  'lunch': 'Lunch',
  'dinner': 'Middag',
  'dessert': 'Efterrätt',
  'snack': 'Mellanmål',
};

const cravingLabels: Record<string, string> = {
  'comfort-food': '🍔 Comfort food',
  'spicy': '🌶️ Starkt & kryddigt',
  'sweet': '🍩 Sött & gott',
  'cheesy': '🧀 Ostigt & krämigt',
  'fresh-light': '🥗 Fräscht & lätt',
  'warm-hearty': '🍲 Varmt & mustigt',
  'quick-easy': '⏱️ Snabbt & enkelt',
  'rich-creamy': '✨ Fylligt & krämigt',
  'high-protein': '💪 Proteinrikt',
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05
    }
  }
} as const;

const itemVariants = {
  hidden: { y: 25, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 90, damping: 14 } }
} as const;

export default function HomeClient({
  mealType,
  craving,
  filters,
  recipes,
  isSearchActive,
  isRecommendationActive,
  shoppingItemCount = 0,
  weeklyPlans = []
}: HomeClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showRules, setShowRules] = useState(false);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeQuery = searchParams.get('query') || '';
  const [queryText, setQueryText] = useState(activeQuery);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [itemCount, setItemCount] = useState(shoppingItemCount);
  const [displayRecipes, setDisplayRecipes] = useState<any[]>(recipes);
  const { t, language } = useLanguage();

  const [upcomingMeals, setUpcomingMeals] = useState<any[]>([]);

  useEffect(() => {
    if (!weeklyPlans || weeklyPlans.length === 0) {
      setUpcomingMeals([]);
      return;
    }

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const SLOT_ORDER = ['breakfast', 'lunch', 'snack', 'dinner'];

    // Get current local date & time
    const now = new Date();
    const currentHour = now.getHours();
    const currentDayIndex = (now.getDay() + 6) % 7; // Monday is 0, Sunday is 6

    // Determine current slot index based on time
    let currentSlotIndex = 0;
    if (currentHour >= 10 && currentHour < 14) {
      currentSlotIndex = 1; // lunch
    } else if (currentHour >= 14 && currentHour < 17) {
      currentSlotIndex = 2; // snack
    } else if (currentHour >= 17) {
      currentSlotIndex = 3; // dinner
    }

    const upcoming = weeklyPlans
      .map(p => {
        const dayIndex = DAYS.indexOf(p.dayOfWeek);
        const slotIndex = SLOT_ORDER.indexOf(p.mealSlot);
        const rank = (p.weekOffset || 0) * 100 + (dayIndex >= 0 ? dayIndex : 0) * 10 + (slotIndex >= 0 ? slotIndex : 0);
        return { ...p, rank };
      })
      .filter(p => {
        const isFutureWeek = (p.weekOffset || 0) > 0;
        const currentRank = currentDayIndex * 10 + currentSlotIndex;
        const isFutureTodayOrLater = (p.weekOffset || 0) === 0 && p.rank >= currentRank;
        return isFutureWeek || isFutureTodayOrLater;
      })
      .sort((a, b) => a.rank - b.rank);

    setUpcomingMeals(upcoming);
  }, [weeklyPlans]);

  const getRelativeDayName = (dayOfWeek: string, weekOffset: number) => {
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

    if (weekOffset === 0) {
      const now = new Date();
      const todayIndex = (now.getDay() + 6) % 7; // Monday = 0, Sunday = 6
      const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const planDayIndex = DAYS.indexOf(dayOfWeek);

      if (planDayIndex === todayIndex) {
        return language === 'sv' ? 'Idag' : 'Today';
      }
      if (planDayIndex === (todayIndex + 1) % 7) {
        return language === 'sv' ? 'Imorgon' : 'Tomorrow';
      }
      return language === 'sv' ? dayNamesSv[dayOfWeek] : dayNamesEn[dayOfWeek];
    }

    if (weekOffset === 1) {
      return language === 'sv' 
        ? `Nästa ${dayNamesSv[dayOfWeek].toLowerCase()}` 
        : `Next ${dayNamesEn[dayOfWeek]}`;
    }

    return language === 'sv' ? dayNamesSv[dayOfWeek] : dayNamesEn[dayOfWeek];
  };

  useEffect(() => {
    setQueryText(activeQuery);
    if (typeof document !== 'undefined') {
      setIsLoggedIn(document.cookie.includes('user_session='));
    }
  }, [activeQuery]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localStore = localStorage.getItem('shopping-list-store');
      if (localStore) {
        try {
          const parsed = JSON.parse(localStore);
          if (parsed && Array.isArray(parsed.items)) {
            const uncheckedCount = parsed.items.filter((item: any) => !item.checked).length;
            setItemCount(uncheckedCount);
          }
        } catch (e) {
          console.error('Failed to parse shopping list from localStorage in HomeClient:', e);
        }
      }
    }
  }, [shoppingItemCount]);

  useEffect(() => {
    let localRecipes: any[] = [];
    if (typeof window !== 'undefined') {
      const localRecipesStore = localStorage.getItem('local-recipes');
      if (localRecipesStore) {
        try {
          const parsed = JSON.parse(localRecipesStore);
          if (Array.isArray(parsed)) {
            localRecipes = parsed;
          }
        } catch (e) {
          console.error('Failed to parse local recipes in HomeClient:', e);
        }
      }
    }

    // Filter local recipes based on active query & tags
    const filteredLocal = localRecipes.filter(recipe => {
      // 1. Filter by mealType
      if (mealType && !(recipe.mealTypes || []).some((m: string) => m.toLowerCase() === mealType.toLowerCase())) {
        return false;
      }
      
      // 2. Filter by craving/mood
      if (craving) {
        const cravingMatch = (recipe.moodTags || []).some((m: string) => m.toLowerCase() === craving.toLowerCase()) ||
                             (recipe.flavorProfile || []).some((f: string) => f.toLowerCase() === craving.toLowerCase());
        if (!cravingMatch) return false;
      }

      // 3. Filter by cuisine
      if (filters.cuisine && recipe.cuisine?.toLowerCase() !== filters.cuisine.toLowerCase()) {
        return false;
      }

      // 4. Filter by query
      if (filters.query) {
        const q = filters.query.toLowerCase();
        const nameMatch = recipe.name?.toLowerCase().includes(q);
        const descMatch = recipe.description?.toLowerCase().includes(q);
        const ingMatch = (recipe.ingredients || []).some((ing: any) => ing.name?.toLowerCase().includes(q));
        if (!nameMatch && !descMatch && !ingMatch) return false;
      }

      // 5. Filter by flavor
      if (filters.flavor && !(recipe.flavorProfile || []).some((f: string) => f.toLowerCase() === filters.flavor.toLowerCase())) {
        return false;
      }

      // 6. Filter by mood
      if (filters.mood && !(recipe.moodTags || []).some((m: string) => m.toLowerCase() === filters.mood.toLowerCase())) {
        return false;
      }

      // 7. Filter by nutritionGoal
      if (filters.nutritionGoal) {
        const goal = filters.nutritionGoal.toLowerCase();
        const calories = recipe.nutrition?.calories || 0;
        const protein = recipe.nutrition?.protein || 0;
        const carbs = recipe.nutrition?.carbohydrates || 0;
        
        if (goal === 'high protein' && protein < 20) return false;
        if (goal === 'low carb' && carbs > 15) return false;
        if (goal === 'low calorie' && calories > 400) return false;
      }

      return true;
    });

    // Merge and remove duplicates by ID
    const merged = [...filteredLocal, ...recipes];
    const uniqueMap = new Map();
    merged.forEach(r => uniqueMap.set(r.id, r));
    
    setDisplayRecipes(Array.from(uniqueMap.values()));
  }, [recipes, mealType, craving, filters]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (queryText) {
      params.set('query', queryText);
    } else {
      params.delete('query');
    }
    router.push(`/?${params.toString()}`);
  };
  
  // Parallax Scroll Hooks
  const { scrollY } = useScroll();
  
  // Floating background elements drift at different speeds
  const yCoffee = useTransform(scrollY, [0, 1000], [0, -180]);
  const yHeart = useTransform(scrollY, [0, 1000], [0, -320]);
  const yUtensil = useTransform(scrollY, [0, 1000], [0, -80]);
  const ySparkle = useTransform(scrollY, [0, 1000], [0, -250]);

  // Determine section title
  let sectionTitle = t('home.recipes_title');
  if (isSearchActive || isRecommendationActive) {
    const parts = [];
    if (filters.query) parts.push(`"${filters.query}"`);
    if (mealType) parts.push(t(`meal.${mealType}`) || mealType);
    if (craving) {
      const translatedCraving = t(`craving.${craving}`);
      parts.push(translatedCraving.includes(' ') ? translatedCraving.split(' ').slice(1).join(' ') : translatedCraving);
    }
    if (filters.cuisine) parts.push(t(`cuisine.${filters.cuisine}`) || filters.cuisine);
    if (filters.nutritionGoal) parts.push(filters.nutritionGoal);
    
    if (isSearchActive) {
      sectionTitle = `${t('home.search_results_for')} ${parts.join(' + ')}`;
    } else {
      sectionTitle = `${t('home.mealfinder_choices')} ${parts.join(' + ')}`;
    }
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden px-3 -mx-3 space-y-10 pb-12">
      
      {/* Shopping List Quick Link Indicator */}
      {itemCount > 0 && (
        <div className="flex justify-center -mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <Link
            href="/shopping-list"
            className="flex items-center gap-2.5 px-5 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-950 border-3 border-foreground font-black text-xs uppercase tracking-wider rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
            </span>
            <span>
              {language === 'sv' 
                ? `Du har ${itemCount} ${itemCount === 1 ? 'vara' : 'varor'} att handla i inköpslistan!` 
                : `You have ${itemCount} ${itemCount === 1 ? 'item' : 'items'} in your shopping list!`}
            </span>
            <ChevronRight className="h-4.5 w-4.5 text-foreground group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </div>
      )}
      
      {/* Scroll-Parallax Floating Hipster Decors */}
      <motion.div 
        style={{ y: yCoffee }}
        className="hidden lg:flex absolute left-[-60px] top-[15%] text-amber-800/15 select-none pointer-events-none"
      >
        <Coffee className="h-24 w-24 transform -rotate-12" />
      </motion.div>

      <motion.div 
        style={{ y: yHeart }}
        className="hidden lg:flex absolute right-[-50px] top-[40%] text-red-800/15 select-none pointer-events-none"
      >
        <Heart className="h-28 w-28 transform rotate-45 fill-current" />
      </motion.div>

      <motion.div 
        style={{ y: yUtensil }}
        className="hidden lg:flex absolute left-[-50px] top-[60%] text-emerald-800/15 select-none pointer-events-none"
      >
        <Utensils className="h-24 w-24 transform rotate-12" />
      </motion.div>

      <motion.div 
        style={{ y: ySparkle }}
        className="hidden lg:flex absolute right-[-60px] top-[75%] text-cyan-800/15 select-none pointer-events-none"
      >
        <Sparkles className="h-24 w-24 transform -rotate-45" />
      </motion.div>

      {/* Welcome Hero Panel (Clean, borderless text style with staggered spring variants) */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="py-10 md:py-16 flex flex-col items-center text-center justify-center gap-6 w-full select-none"
      >
        <motion.div variants={itemVariants} className="space-y-4 max-w-2xl w-full flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 border-2 border-foreground px-3.5 py-1.5 rounded-full inline-block animate-bounce-subtle">
            {t('home.tag')}
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-none uppercase">
            {t('home.title')}
          </h2>
          <p className="text-sm md:text-base text-foreground font-medium leading-relaxed max-w-lg mx-auto">
            {t('home.description')}
          </p>
        </motion.div>

        {/* Search focus */}
        <motion.div variants={itemVariants} className="w-full max-w-3xl mx-auto pt-3 text-left">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground z-10" />
            <input
              type="text"
              placeholder={t('home.search_placeholder')}
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              className="w-full pl-12 pr-28 py-4 bg-card border-3 border-foreground rounded-2xl text-foreground text-xs font-black uppercase tracking-wide focus:outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] placeholder:text-foreground/50 transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-foreground hover:bg-foreground/90 text-background text-xs font-black rounded-xl transition-all cursor-pointer uppercase tracking-wider z-10"
            >
              {t('home.search_btn')}
            </button>
          </form>
        </motion.div>

        {/* Suggest button */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setIsSuggestOpen(true)}
            className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-foreground border-3 border-foreground font-black text-xs uppercase tracking-wider rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="h-4.5 w-4.5 text-foreground shrink-0 animate-pulse" />
            <span>{t('home.find_meal_btn')}</span>
          </button>
        </motion.div>
      </motion.section>

      {/* Upcoming Meals Section (Clean Neo-brutalist Card Grid) */}
      {upcomingMeals.length > 0 && (
        <div className="bg-amber-50/50 border-3 border-foreground rounded-[2rem] p-5 md:p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-[radial-gradient(rgba(0,0,0,0.03)_1.5px,transparent_1.5px)] [background-size:16px_16px] space-y-5">
          <div className="flex items-center justify-between border-b-2 border-dashed border-foreground/30 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-amber-100 border-2 border-foreground text-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Coffee className="h-4.5 w-4.5 animate-bounce-subtle" />
              </div>
              <div>
                <h3 className="font-black text-sm md:text-base text-foreground uppercase tracking-tight">
                  {t('home.upcoming_title')}
                </h3>
                <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                  {language === 'sv' ? 'Vad som serveras härnäst i köket' : 'What is serving next in the kitchen'}
                </p>
              </div>
            </div>
            
            <Link
              href="/planner"
              className="px-3.5 py-1.5 bg-white border-2 border-foreground hover:bg-amber-100 text-[10px] font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>{language === 'sv' ? 'Öppna kalender' : 'Open calendar'}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Grid Layout: Next Meal Spotlight (Left) & Horizontal scroll of the rest (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Next Meal Spotlight */}
            <div className="lg:col-span-5 bg-white border-2 border-foreground rounded-[1.5rem] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
              {(() => {
                const nextPlan = upcomingMeals[0];
                const recipe = nextPlan.recipe;
                const dayStr = getRelativeDayName(nextPlan.dayOfWeek, nextPlan.weekOffset);
                const slotStr = language === 'sv' ? mealTypeLabels[nextPlan.mealSlot] || nextPlan.mealSlot : nextPlan.mealSlot;

                return (
                  <div className="space-y-4 h-full flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-rose-800 bg-rose-100 border border-foreground/35 px-2.5 py-1 rounded-md inline-block mb-3.5">
                        🔥 {t('home.next_meal')}
                      </span>
                      
                      {/* Flex layout for image and text details */}
                      <div className="flex gap-4">
                        <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-secondary border-2 border-foreground shadow-sm shrink-0">
                          {recipe.image ? (
                            <Image
                              src={recipe.image}
                              alt={recipe.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          ) : (
                            <div className="h-full w-full bg-secondary flex items-center justify-center text-[10px] text-muted-foreground font-black uppercase">
                              {language === 'sv' ? 'Måltid' : 'Meal'}
                            </div>
                          )}
                        </div>
                        
                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md font-bold inline-block uppercase tracking-wider">
                            {dayStr} · {slotStr}
                          </span>
                          <h4 className="font-black text-sm text-foreground uppercase tracking-tight line-clamp-2 leading-tight">
                            {recipe.name}
                          </h4>
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
                            {recipe.cuisine} · {recipe.nutrition?.calories || 0} kcal
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-dashed border-foreground/20 mt-4">
                      <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold text-foreground/80">
                        <span className="bg-emerald-100 text-emerald-950 border border-foreground/25 px-1.5 py-0.5 rounded">
                          💪 {recipe.nutrition?.protein || 0}g P
                        </span>
                        <span className="bg-blue-100 text-blue-950 border border-foreground/25 px-1.5 py-0.5 rounded">
                          🍞 {recipe.nutrition?.carbohydrates || 0}g C
                        </span>
                      </div>
                      
                      <Link
                        href={`/recipes/${recipe.id}`}
                        className="px-3.5 py-2 bg-foreground hover:bg-foreground/90 text-background text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px]"
                      >
                        {language === 'sv' ? 'Visa recept' : 'View recipe'}
                      </Link>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right: The rest of the upcoming meals */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-foreground/70 mb-3 flex items-center gap-1.5 px-1">
                <span>{t('home.upcoming_all')}</span>
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse inline-block"></span>
              </h4>

              {upcomingMeals.length > 1 ? (
                /* Scrollable Row Container optimized for mobile swipe */
                <div className="flex gap-4 overflow-x-auto pb-3 pt-1 px-1 scrollbar-none -mx-4 px-4 lg:mx-0 lg:px-0">
                  {upcomingMeals.slice(1, 6).map((plan, index) => {
                    const recipe = plan.recipe;
                    const dayStr = getRelativeDayName(plan.dayOfWeek, plan.weekOffset);
                    const slotStr = language === 'sv' ? mealTypeLabels[plan.mealSlot] || plan.mealSlot : plan.mealSlot;

                    return (
                      <Link
                        key={plan.id || index}
                        href={`/recipes/${recipe.id}`}
                        className="bg-white border-2 border-foreground rounded-2xl p-3 w-48 shrink-0 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] transition-all flex flex-col justify-between space-y-3 group cursor-pointer"
                      >
                        <div className="space-y-2">
                          <div className="relative h-24 w-full rounded-xl overflow-hidden bg-secondary border border-foreground/35">
                            {recipe.image ? (
                              <Image
                                src={recipe.image}
                                alt={recipe.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="200px"
                              />
                            ) : (
                              <div className="h-full w-full bg-secondary flex items-center justify-center text-[10px] text-muted-foreground font-black uppercase">
                                {language === 'sv' ? 'Måltid' : 'Meal'}
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-1 min-w-0">
                            <span className="text-[8px] text-emerald-800 bg-emerald-50 border border-emerald-250 px-1.5 py-0.25 rounded font-black inline-block uppercase tracking-wider">
                              {dayStr} · {slotStr}
                            </span>
                            <h5 className="font-black text-xs text-foreground uppercase tracking-tight truncate leading-tight group-hover:text-amber-800 transition-colors">
                              {recipe.name}
                            </h5>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground border-t border-dashed border-foreground/20 pt-1.5">
                          <span>{recipe.nutrition?.calories || 0} kcal</span>
                          <span className="text-emerald-800 font-extrabold">{recipe.nutrition?.protein || 0}g P</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white border-2 border-dashed border-foreground/20 p-8 rounded-2xl text-center text-xs font-semibold text-muted-foreground uppercase py-10 flex-1 flex items-center justify-center">
                  {language === 'sv' ? 'Inga fler måltider inplanerade' : 'No other meals planned'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selector Grid (cravings + meal types selection) */}
      <RecommendationSelector />

      {/* Matching Recipes Title */}
      <div className="border-b-3 border-foreground pb-2 pt-2">
        <h3 className="font-black text-lg text-foreground uppercase tracking-tight flex items-center gap-2.5">
          <ChefHat className="h-5.5 w-5.5 text-foreground animate-pulse" />
          <span>{sectionTitle} ({displayRecipes.length} {language === 'sv' ? 'st' : 'pcs'})</span>
        </h3>
      </div>

      {/* Grid displaying matching results */}
      {displayRecipes.length > 0 ? (
        isRecommendationActive ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {displayRecipes.map((recipe: any) => {
              const primaryMealType = Array.isArray(recipe.mealTypes) && recipe.mealTypes.length > 0 
                ? recipe.mealTypes[0] 
                : (recipe.mealType || 'dinner');
              return (
                <RecommendationCard
                  key={recipe.id}
                  recipe={recipe}
                  category={t(`category.${primaryMealType}`) || t(`meal.${primaryMealType}`) || (language === 'sv' ? 'Förslag' : 'Suggestion')}
                  description={
                    craving
                      ? t('card.reco_desc_craving', { craving: t(`craving.${craving}`).includes(' ') ? t(`craving.${craving}`).split(' ').slice(1).join(' ') : t(`craving.${craving}`) })
                      : t('card.reco_desc_default', { type: (t(`meal.${primaryMealType}`) || t('card.reco_desc_default_generic')).toLowerCase() })
                  }
                />
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayRecipes.map((recipe: any) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )
      ) : (
        <div className="bg-white border-3 border-dashed border-foreground py-16 rounded-[2rem] text-center max-w-xl mx-auto mt-12 space-y-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="h-14 w-14 rounded-2xl bg-amber-100 border-2 border-foreground flex items-center justify-center text-foreground mx-auto">
            <X className="h-7 w-7" />
          </div>
          <div>
            <h4 className="font-black text-lg text-foreground uppercase tracking-tight">{t('home.no_results_title')}</h4>
            <p className="text-xs text-foreground/80 font-medium max-w-xs mx-auto mt-1 leading-relaxed">
              {t('home.no_results_desc')}
            </p>
          </div>
          {isLoggedIn && (
            <Link
              href="/recipes/add"
              className="inline-block px-5 py-2.5 bg-card border-2 border-foreground hover:bg-secondary text-xs font-black uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            >
              {t('home.create_recipe_btn')}
            </Link>
          )}
        </div>
      )}

      {/* UX/UI Rules Modal Overlay */}
      {showRules && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white border-3 border-foreground rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[85vh] relative animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowRules(false)}
              className="absolute top-4 right-4 p-2 bg-secondary border-2 border-foreground hover:bg-red-100 rounded-xl transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              aria-label="Stäng dialog"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-800 bg-cyan-100 border border-foreground px-2.5 py-1 rounded-md inline-block mb-2.5">
                📖 Riktlinjer & tillgänglighet
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-foreground uppercase tracking-tight">
                UX/UI-regler för Maja & Kents Kök
              </h3>
              <p className="text-xs text-muted-foreground mt-1 font-semibold">
                Våra grundläggande designprinciper för att säkerställa hög tillgänglighet (WCAG AA), läsbarhet och en konsekvent upplevelse på alla sidor.
              </p>
            </div>

            {/* Scrollable list of rules */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-foreground font-medium">
              <div className="p-4 bg-amber-50 border-2 border-foreground rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <h4 className="font-black text-xs text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="bg-amber-100 border border-amber-800 h-5 w-5 rounded-md flex items-center justify-center font-black">1</span>
                  Färgkontrast & Läsbarhet (WCAG AA)
                </h4>
                <p className="mt-2 text-amber-950 leading-relaxed">
                  All text måste uppfylla kontrastförhållandet på minst <strong>4.5:1</strong> mot dess bakgrund. Vi använder fasta färger (t.ex. mörk bärnsten <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-800">text-amber-800</code> and mörkgrön <code className="bg-emerald-100 px-1 py-0.5 rounded text-emerald-800">text-emerald-800</code>) på en ren vit eller lätt tonad bakgrund. Inga ljusgrå texter eller färg-på-färg som försvårar läsning är tillåtna.
                </p>
              </div>

              <div className="p-4 bg-emerald-50 border-2 border-foreground rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <h4 className="font-black text-xs text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="bg-emerald-100 border border-emerald-800 h-5 w-5 rounded-md flex items-center justify-center font-black">2</span>
                  Tydlig Tangentbordsfokus (WCAG 2.4.7)
                </h4>
                <p className="mt-2 text-emerald-950 leading-relaxed">
                  Användare som navigerar med tangentbordet måste alltid kunna se det fokuserade elementet. Alla inmatningsfält, knappar och länkar är utrustade med en framträdande fokusram (<code className="bg-emerald-100 px-1 py-0.5 rounded text-emerald-800">focus-visible:outline-2</code>) med en förskjutning på <code className="bg-emerald-100 px-1 py-0.5 rounded">2.5px</code>.
                </p>
              </div>

              <div className="p-4 bg-sky-50 border-2 border-foreground rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <h4 className="font-black text-xs text-sky-800 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="bg-sky-100 border border-sky-800 h-5 w-5 rounded-md flex items-center justify-center font-black">3</span>
                  Ingen Överlappning av Element
                </h4>
                <p className="mt-2 text-sky-950 leading-relaxed">
                  Texter, ikoner eller interaktiva knappar får <strong>aldrig placeras ovanpå matbilder</strong> eller dekorativa element där de kan bli svåra att läsa eller klicka på. Bilder hålls i stängda containerfack och knappar placeras alltid på solida bakgrunder.
                </p>
              </div>

              <div className="p-4 bg-purple-50 border-2 border-foreground rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <h4 className="font-black text-xs text-purple-800 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="bg-purple-100 border border-purple-800 h-5 w-5 rounded-md flex items-center justify-center font-black">4</span>
                  Skalning av Portioner & Kryddor
                </h4>
                <p className="mt-2 text-purple-950 leading-relaxed">
                  Vid ändring av antal portioner skalas ingredienserna automatiskt och proportionellt medan tillagningsinstruktionerna förblir intakta för att inte förvirra kocken. Kryddskalaren modifierar enbart de heta ingredienserna (chili, cayenne, hot sauce) och visar en live-förhandsvisning.
                </p>
              </div>

              <div className="p-4 bg-rose-50 border-2 border-foreground rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <h4 className="font-black text-xs text-rose-800 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="bg-rose-100 border border-rose-800 h-5 w-5 rounded-md flex items-center justify-center font-black">5</span>
                  Responsiv design & tryckytor
                </h4>
                <p className="mt-2 text-rose-950 leading-relaxed">
                  Webbplatsen är mobilanpassad (Mobile-First) där layouterna staplas vackert på mindre skärmar utan horisontell scroll. Alla klickbara ytor (knappar/länkar) är designade med en minsta storlek på <strong>44x44px</strong> för att enkelt kunna klickas på pekskärmar.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-dashed border-foreground/30 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRules(false)}
                className="px-6 py-2.5 bg-foreground text-background text-xs font-black uppercase rounded-xl hover:bg-foreground/90 transition-all cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-bold"
              >
                Jag förstår
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggests modal */}
      <FindMeAMealModal isOpen={isSuggestOpen} onClose={() => setIsSuggestOpen(false)} />

    </div>
  );
}
