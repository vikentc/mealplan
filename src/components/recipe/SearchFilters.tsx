import React, { useState } from 'react';
import { Search, SlidersHorizontal, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

interface SearchFiltersProps {
  onSearch: (filters: any) => void;
  initialFilters?: any;
  flat?: boolean;
}

const CUISINES = ['Vietnamese', 'Thai', 'Japanese', 'Swedish', 'Italian', 'Mexican'];
const FLAVORS = ['spicy', 'sweet', 'savory', 'sour', 'umami', 'creamy', 'tangy', 'rich', 'light', 'fresh'];
const MOODS = ['comfort food', 'healthy', 'high protein', 'cozy', 'refreshing', 'indulgent', 'energizing', 'quick and easy'];
const MEAL_TYPES = [
  { value: 'breakfast', label: 'Frukost' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Middag' },
  { value: 'dessert', label: 'Efterrätt' },
  { value: 'snack', label: 'Mellanmål' },
];
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

export default function SearchFilters({ onSearch, initialFilters = {}, flat = false }: SearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    query: initialFilters.query || '',
    cuisine: initialFilters.cuisine || '',
    flavor: initialFilters.flavor || '',
    mood: initialFilters.mood || '',
    mealType: initialFilters.mealType || '',
    nutritionGoal: initialFilters.nutritionGoal || '',
  });

  const handleChange = (field: string, value: any) => {
    const updated = { ...filters, [field]: value };
    setFilters(updated);
    
    // Auto-trigger search for dropdown updates, but not for text queries (handled by submit)
    if (field !== 'query') {
      onSearch(updated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleReset = () => {
    const reset = {
      query: '',
      cuisine: '',
      flavor: '',
      mood: '',
      mealType: '',
      nutritionGoal: '',
    };
    setFilters(reset);
    onSearch(reset);
  };

  const hasActiveFilters = Object.values(filters).some(val => val !== '');

  return (
    <div className={flat ? "w-full" : "bg-card border-3 border-foreground p-6 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-8 bg-[radial-gradient(rgba(0,0,0,0.03)_1.5px,transparent_1.5px)] [background-size:16px_16px]"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Search Bar */}
        <div className="space-y-4">
          <div className="relative w-full">
            <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground z-10" />
            <input
              type="text"
              placeholder="Sök på receptnamn eller ingrediens..."
              value={filters.query}
              onChange={(e) => handleChange('query', e.target.value)}
              className="w-full pl-12 pr-28 py-4 bg-card border-3 border-foreground rounded-2xl text-foreground text-xs font-black uppercase tracking-wide focus:outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] placeholder:text-foreground/50 transition-all"
            />
            {/* Search Button combined inside input */}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-foreground hover:bg-foreground/90 text-background text-xs font-black rounded-xl transition-all cursor-pointer uppercase tracking-wider z-10"
            >
              Sök
            </button>
          </div>
          
          <div className={`flex gap-3 ${flat ? 'justify-center' : 'justify-start'}`}>
            {/* Advanced Filters Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-6 py-3 bg-card border-3 border-foreground hover:bg-secondary text-foreground font-black rounded-xl flex items-center justify-between min-w-[160px] transition-all text-[10px] uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 shrink-0" />
                <span>Filter</span>
              </div>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4 shrink-0 ml-4 text-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 ml-4 text-foreground" />
              )}
            </button>
 
            {/* Clear Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3 bg-red-100 hover:bg-red-200 border-3 border-foreground text-red-800 font-black rounded-xl flex items-center justify-center min-w-[140px] gap-2 transition-all text-[10px] uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                title="Återställ filter"
              >
                <RotateCcw className="h-4 w-4 shrink-0" />
                <span>Rensa</span>
              </button>
            )}
          </div>
        </div>
 
        {/* Advanced Filters Panel */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t-3 border-dashed border-foreground/35 transition-all duration-300">
            {/* Cuisine Select */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-foreground uppercase tracking-widest block">Kök</label>
              <div className="relative">
                <select
                  value={filters.cuisine}
                  onChange={(e) => handleChange('cuisine', e.target.value)}
                  className="w-full py-3 pl-6 pr-12 bg-card border-3 border-foreground rounded-xl text-foreground text-xs font-black uppercase tracking-wide focus:outline-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] appearance-none transition-all cursor-pointer"
                >
                  <option value="">Alla kök</option>
                  {CUISINES.map(c => <option key={c} value={c}>{cuisineLabels[c] || c}</option>)}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground pointer-events-none" />
              </div>
            </div>
 
            {/* Flavor Select */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-foreground uppercase tracking-widest block">Smak</label>
              <div className="relative">
                <select
                  value={filters.flavor}
                  onChange={(e) => handleChange('flavor', e.target.value)}
                  className="w-full py-3 pl-6 pr-12 bg-card border-3 border-foreground rounded-xl text-foreground text-xs font-black uppercase tracking-wide focus:outline-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] appearance-none transition-all cursor-pointer"
                >
                  <option value="">Alla smaker</option>
                  {FLAVORS.map(f => <option key={f} value={f}>{flavorLabels[f] || f}</option>)}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground pointer-events-none" />
              </div>
            </div>
 
            {/* Mood Select */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-foreground uppercase tracking-widest block">Kategori</label>
              <div className="relative">
                <select
                  value={filters.mood}
                  onChange={(e) => handleChange('mood', e.target.value)}
                  className="w-full py-3 pl-6 pr-12 bg-card border-3 border-foreground rounded-xl text-foreground text-xs font-black uppercase tracking-wide focus:outline-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] appearance-none transition-all cursor-pointer"
                >
                  <option value="">Alla kategorier</option>
                  {MOODS.map(m => <option key={m} value={m}>{moodLabels[m] || m}</option>)}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground pointer-events-none" />
              </div>
            </div>
 
            {/* Meal Type Select */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-foreground uppercase tracking-widest block">Måltid</label>
              <div className="relative">
                <select
                  value={filters.mealType}
                  onChange={(e) => handleChange('mealType', e.target.value)}
                  className="w-full py-3 pl-6 pr-12 bg-card border-3 border-foreground rounded-xl text-foreground text-xs font-black uppercase tracking-wide focus:outline-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] appearance-none transition-all cursor-pointer"
                >
                  <option value="">Alla måltider</option>
                  {MEAL_TYPES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground pointer-events-none" />
              </div>
            </div>
 
            {/* Nutrition Goals Select */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-foreground uppercase tracking-widest block">Näringsmål</label>
              <div className="relative">
                <select
                  value={filters.nutritionGoal}
                  onChange={(e) => handleChange('nutritionGoal', e.target.value)}
                  className="w-full py-3 pl-6 pr-12 bg-card border-3 border-foreground rounded-xl text-foreground text-xs font-black uppercase tracking-wide focus:outline-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] appearance-none transition-all cursor-pointer"
                >
                  <option value="">Alla mål</option>
                  {NUTRITION_GOALS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
