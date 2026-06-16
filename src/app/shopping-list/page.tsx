import React from 'react';
import { getShoppingList } from '@/app/actions/recipes';
import ShoppingListClient from '@/components/recipe/ShoppingListClient';
import { ShoppingBag } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ShoppingListPage() {
  const list = await getShoppingList();

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-foreground flex items-center gap-2.5 uppercase tracking-tight">
          <ShoppingBag className="h-7 w-7 text-foreground animate-pulse" />
          <span>Inköpslista</span>
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5 font-semibold uppercase tracking-wider">
          Sammanställ ingredienser från dina recept, bocka av varor och spara din inköpslista.
        </p>
      </div>

      {/* Client Container */}
      <ShoppingListClient initialRecipes={list.recipes} initialItems={list.items} />
    </div>
  );
}
