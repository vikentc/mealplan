import React from 'react';
import { getRecipes, getRecommendationsByCraving, getWeeklyPlan, getShoppingList } from '@/app/actions/recipes';
import HomeClient from '@/components/home/HomeClient';
import { cookies } from 'next/headers';

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

  // Fetch plans for the week (1-week static planner)
  const weeklyPlans = await getWeeklyPlan(0);

  // Fetch filtered recipes with combined filters and cravings
  const searchResult = await getRecipes(filters);
  const recipes = searchResult.recipes;

  const isSearchActive = !!filters.query;
  const isRecommendationActive = !isSearchActive && !!(mealType || craving || filters.cuisine || filters.flavor || filters.mood || filters.nutritionGoal);

  // Fetch shopping list count if logged in
  const cookieStore = await cookies();
  const sessionUser = cookieStore.get('user_session')?.value;
  let shoppingItemCount = 0;
  if (sessionUser) {
    const shoppingList = await getShoppingList();
    if (shoppingList && Array.isArray(shoppingList.items)) {
      // count unchecked items
      shoppingItemCount = shoppingList.items.filter((item: any) => !item.checked).length;
    }
  }

  return (
    <HomeClient
      mealType={mealType}
      craving={craving}
      filters={filters}
      recipes={recipes}
      isSearchActive={isSearchActive}
      isRecommendationActive={isRecommendationActive}
      shoppingItemCount={shoppingItemCount}
      weeklyPlans={weeklyPlans}
    />
  );
}
