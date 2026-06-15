import React from 'react';
import { notFound } from 'next/navigation';
import { getRecipeById } from '@/app/actions/recipes';
import RecipeForm from '@/components/recipe/RecipeForm';

export const dynamic = 'force-dynamic';

interface EditRecipePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const recipe = await getRecipeById(id);

  if (!recipe) {
    notFound();
  }

  // Cast Json properties for TS compatibility in Form
  const formattedRecipe = {
    ...recipe,
    ingredients: recipe.ingredients as any[],
    instructions: recipe.instructions as string[],
    nutrition: recipe.nutrition as any
  };

  return <RecipeForm recipe={formattedRecipe} />;
}
