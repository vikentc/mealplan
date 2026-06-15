'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import SearchFilters from './SearchFilters';

interface SearchFiltersWrapperProps {
  initialFilters: any;
  flat?: boolean;
}

export default function SearchFiltersWrapper({ initialFilters, flat = false }: SearchFiltersWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = (filters: any) => {
    const params = new URLSearchParams();
    
    if (filters.query) params.set('query', filters.query);
    if (filters.cuisine) params.set('cuisine', filters.cuisine);
    if (filters.flavor) params.set('flavor', filters.flavor);
    if (filters.mood) params.set('mood', filters.mood);
    if (filters.mealType) params.set('mealType', filters.mealType);
    if (filters.nutritionGoal) params.set('nutritionGoal', filters.nutritionGoal);

    const queryStr = params.toString();
    const url = queryStr ? `${pathname}?${queryStr}` : pathname;
    
    router.push(url);
  };

  return <SearchFilters onSearch={handleSearch} initialFilters={initialFilters} flat={flat} />;
}
