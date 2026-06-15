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
    mealType: resolvedParams.mealType || '',
    craving: resolvedParams.craving || '',
    nutritionGoal: resolvedParams.nutritionGoal || '',
  };

  const mealType = resolvedParams.mealType || '';
  const craving = resolvedParams.craving || '';

  // Fetch plans for the current week to exclude already planned meals
  const currentWeekPlans = await getWeeklyPlan(0);
  const currentWeekRecipeIds = currentWeekPlans.map((p: any) => p.recipeId);

  // Fetch filtered recipes with combined filters and cravings
  const searchResult = await getRecipes(filters);
  const recipes = searchResult.recipes;

  const isSearchActive = !!filters.query;
  const isRecommendationActive = !isSearchActive && !!(mealType || craving || filters.cuisine || filters.flavor || filters.mood || filters.nutritionGoal);

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
