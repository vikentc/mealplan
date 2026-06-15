import React from 'react';
import Link from 'next/link';
import { getRecipes } from '@/app/actions/recipes';
import RecipeCard from '@/components/recipe/RecipeCard';
import SearchFilters from '@/components/recipe/SearchFilters';
import SearchFiltersWrapper from '@/components/recipe/SearchFiltersWrapper';
import { PlusCircle, ChefHat } from 'lucide-react';
import { redirect } from 'next/navigation';


export const dynamic = 'force-dynamic';

interface RecipesPageProps {
  searchParams: Promise<{
    query?: string;
    cuisine?: string;
    flavor?: string;
    mood?: string;
    occasion?: string;
    spiceLevel?: string;
    nutritionGoal?: string;
  }>;
}

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const resolvedParams = await searchParams;
  
  // Format filters from query params
  const filters = {
    query: resolvedParams.query || '',
    cuisine: resolvedParams.cuisine || '',
    flavor: resolvedParams.flavor || '',
    mood: resolvedParams.mood || '',
    occasion: resolvedParams.occasion || '',
    spiceLevel: resolvedParams.spiceLevel !== undefined && resolvedParams.spiceLevel !== '' 
      ? Number(resolvedParams.spiceLevel) 
      : undefined,
    nutritionGoal: resolvedParams.nutritionGoal || '',
  };

  // Fetch filtered recipes
  const { recipes, originalQuery, correctedQuery, suggestions, isCorrected } = await getRecipes(filters);

  // Client search trigger action (pushes state changes to route via Next.js server actions / router client redirects)
  // We can write a server-side redirect action or pass it down. But let's look at how SearchFilters updates the router.
  // Actually, since SearchFilters is a Client Component, we can implement the redirect in a Client wrapper, or let SearchFilters handle it!
  // Wait, let's write a client component or let the user click search.
  // How does SearchFilters know how to navigate? It receives an `onSearch` callback!
  // In `RecipesPage` (server side), we can pass an `onSearch` that runs a Client Component wrapper or we can write a tiny wrapper!
  // Let's create `src/components/recipe/SearchFiltersWrapper.tsx` Client Component that wraps `SearchFilters` and updates the URL when filters change. This is clean and robust.
  
  return (
    <div className="space-y-8">
      
      {/* Header section */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground flex items-center gap-2.5 uppercase tracking-tight">
            <ChefHat className="h-7 w-7 text-foreground" />
            <span>Receptbok</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            Bläddra och filtrera bland dina goda familjerecept
          </p>
        </div>
 
        <Link
          href="/recipes/add"
          className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-foreground border-3 border-foreground font-black text-xs uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 cursor-pointer"
        >
          <PlusCircle className="h-4.5 w-4.5" />
          <span>Skapa nytt recept</span>
        </Link>
      </div>
 
      {/* Advanced Search Filter Panel */}
      <SearchFiltersWrapper initialFilters={filters} />
 


      {/* Recipes Grid */}
      {recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recipes.map((recipe: any) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="bg-card border-3 border-dashed border-foreground py-16 rounded-[2rem] text-center max-w-xl mx-auto mt-12 space-y-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="h-14 w-14 rounded-2xl bg-amber-100 border-2 border-foreground flex items-center justify-center text-foreground mx-auto z-10">
            <ChefHat className="h-7 w-7" />
          </div>
          <div>
            <h4 className="font-black text-lg text-foreground uppercase tracking-tight">Inga recept hittades</h4>
            <p className="text-xs text-foreground/80 font-medium max-w-xs mx-auto mt-1 leading-relaxed">
              Inga rätter matchar dina aktiva sökfilter. Försök att återställa sökkriterierna eller skapa ett nytt recept!
            </p>
          </div>
          <Link
            href="/recipes/add"
            className="inline-block px-5 py-2.5 bg-card border-2 border-foreground hover:bg-secondary text-xs font-black uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
          >
            Skapa ett recept
          </Link>
        </div>
      )}
 
    </div>
  );
}

// Client Side router navigation helper component to update search parameters dynamically
