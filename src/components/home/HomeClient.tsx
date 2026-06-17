'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
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
  shoppingItemCount = 0
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
