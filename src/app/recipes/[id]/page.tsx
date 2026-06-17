import React from 'react';
import { notFound } from 'next/navigation';
import { getRecipeById } from '@/app/actions/recipes';
import RecipeDetailsContainer from '@/components/recipe/RecipeDetailsContainer';

export const dynamic = 'force-dynamic';

interface RecipePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RecipeDetailsPage({ params }: RecipePageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const recipe = await getRecipeById(id);

  return <RecipeDetailsContainer recipe={recipe} fallbackId={id} />;
}
