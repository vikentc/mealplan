import React from 'react';
import { getRecipes, getRecommendationsByCraving, getWeeklyPlan } from '@/app/actions/recipes';
import HomeClient from '@/components/home/HomeClient';

export const dynamic = 'force-dynamic';

interface DashboardPageProps {
  searchParams: Promise<{
    query?: string;
    cuisine?: string;
    flavor?: string;
    mood?: string;
    occasion?: string;
    spiceLevel?: string;
    nutritionGoal?: string;
    mealType?: string;
    craving?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedParams = await searchParams;
  
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

  const mealType = resolvedParams.mealType || '';
  const craving = resolvedParams.craving || '';

  // Fetch plans for the current week to exclude already planned meals
  const currentWeekPlans = await getWeeklyPlan(0);
  const currentWeekRecipeIds = currentWeekPlans.map((p: any) => p.recipeId);

  let recipes: any[] = [];
  let isSearchActive = !!(filters.query || filters.cuisine || filters.flavor || filters.mood || filters.occasion || filters.spiceLevel !== undefined || filters.nutritionGoal);
  let isRecommendationActive = !!(mealType || craving);

  if (isRecommendationActive) {
    // Fetch dynamic recommendations
    recipes = await getRecommendationsByCraving({
      mealType,
      craving,
      currentWeekRecipeIds
    });
  } else {
    // Fetch filtered recipes search results
    const searchResult = await getRecipes(filters);
    recipes = searchResult.recipes;
  }

  return (
    <HomeClient
      mealType={mealType}
      craving={craving}
      filters={filters}
      recipes={recipes}
      isSearchActive={isSearchActive}
      isRecommendationActive={isRecommendationActive}
    />
  );
}
