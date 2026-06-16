import { NextResponse } from 'next/server';
import { getRecipes, createRecipe } from '@/app/actions/recipes';

// GET /api/recipes - Fetch recipes with optional query filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || undefined;
    const cuisine = searchParams.get('cuisine') || undefined;
    const flavor = searchParams.get('flavor') || undefined;
    const mood = searchParams.get('mood') || undefined;
    const occasion = searchParams.get('occasion') || undefined;
    const nutritionGoal = searchParams.get('nutritionGoal') || undefined;
    const mealType = searchParams.get('mealType') || undefined;

    const recipes = await getRecipes({
      query,
      cuisine,
      flavor,
      mood,
      occasion,
      nutritionGoal,
      mealType
    });

    return NextResponse.json(recipes);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch recipes', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/recipes - Create a new recipe
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.name) {
      return NextResponse.json(
        { error: 'Recipe name is required' },
        { status: 400 }
      );
    }
    if (!body.ingredients || body.ingredients.length === 0) {
      return NextResponse.json(
        { error: 'At least one ingredient is required' },
        { status: 400 }
      );
    }
    if (!body.instructions || body.instructions.length === 0) {
      return NextResponse.json(
        { error: 'At least one cooking step is required' },
        { status: 400 }
      );
    }

    const newRecipe = await createRecipe(body);
    return NextResponse.json(newRecipe, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create recipe', details: error.message },
      { status: 500 }
    );
  }
}
