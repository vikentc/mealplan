import React from 'react';
import { getRecipes, getWeeklyPlan } from '@/app/actions/recipes';
import WeeklyCalendar from '@/components/recipe/WeeklyCalendar';
import NutritionDashboard from '@/components/recipe/NutritionDashboard';
import { CalendarRange, Activity } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PlannerPageProps {
  searchParams: Promise<{
    weekOffset?: string;
  }>;
}

export default async function PlannerPage({ searchParams }: PlannerPageProps) {
  const resolvedParams = await searchParams;
  const weekOffset = resolvedParams.weekOffset !== undefined 
    ? Number(resolvedParams.weekOffset) 
    : 0;

  // Fetch all recipes for picker, and current plans
  const { recipes } = await getRecipes();
  const plans = await getWeeklyPlan(weekOffset);

  // Cast recipe objects to simplify typing
  const formattedRecipes = recipes.map((r: any) => ({
    id: r.id,
    name: r.name,
    image: r.image,
    cuisine: r.cuisine,
    mealType: r.mealType,
    nutrition: {
      calories: r.nutrition?.calories || 0,
      protein: r.nutrition?.protein || 0,
      carbohydrates: r.nutrition?.carbohydrates || 0,
      fat: r.nutrition?.fat || 0,
      fiber: r.nutrition?.fiber || 0,
      sugar: r.nutrition?.sugar || 0,
      sodium: r.nutrition?.sodium || 0,
      iron: r.nutrition?.iron || 0,
      calcium: r.nutrition?.calcium || 0,
      potassium: r.nutrition?.potassium || 0,
      magnesium: r.nutrition?.magnesium || 0,
      vitaminA: r.nutrition?.vitaminA || 0,
      vitaminC: r.nutrition?.vitaminC || 0,
      vitaminD: r.nutrition?.vitaminD || 0,
      vitaminB12: r.nutrition?.vitaminB12 || 0,
    }
  }));

  // Client components router integration for weekOffset
  // We can pass a client routing handler or tiny client wrapper.
  // We have a prop in WeeklyCalendar: onWeekOffsetChange. We will implement it in a client container, 
  // or inside WeeklyCalendar itself by doing router.push(`/planner?weekOffset=${offset}`)!
  // Yes, in WeeklyCalendar we can do:
  // onWeekOffsetChange={(offset) => router.push(`/planner?weekOffset=${offset}`)}
  // This is extremely clean.
  
  return (
    <div className="space-y-10">
      
      {/* Page Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-foreground flex items-center gap-2.5 uppercase tracking-tight">
          <CalendarRange className="h-7 w-7 text-foreground animate-pulse" />
          <span>Veckoplanering</span>
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5 font-semibold uppercase tracking-wider">
          Nå dina hälsomål. Dra måltider till kalendern, spara och analysera ditt veckovisa näringsintag.
        </p>
      </div>

      {/* Grid: 2/3 width planner, 1/3 width nutrition dashboard on desktop */}
      <div className="space-y-12">
        {/* The interactive drag & drop calendar */}
        <WeeklyCalendarWrapper 
          initialPlans={plans} 
          recipes={formattedRecipes} 
          weekOffset={weekOffset} 
        />

        {/* Nutrition analytics for the planned week */}
        <section className="space-y-6 pt-10 border-t-3 border-foreground">
          <h3 className="font-black text-xl md:text-2xl text-foreground flex items-center gap-2.5 uppercase tracking-tight">
            <Activity className="h-6 w-6 text-foreground" />
            <span>Smart näringsanalys & statistik</span>
          </h3>
          <NutritionDashboard plans={plans} />
        </section>
      </div>

    </div>
  );
}

// Client Side router wrapper for WeeklyCalendar to update weekOffset
import WeeklyCalendarWrapper from '@/components/recipe/WeeklyCalendarWrapper';
