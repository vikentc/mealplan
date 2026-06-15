'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import WeeklyCalendar from './WeeklyCalendar';

interface WeeklyCalendarWrapperProps {
  initialPlans: any[];
  recipes: any[];
  weekOffset: number;
}

export default function WeeklyCalendarWrapper({
  initialPlans,
  recipes,
  weekOffset
}: WeeklyCalendarWrapperProps) {
  const router = useRouter();

  const handleWeekOffsetChange = (offset: number) => {
    // Limit weekOffset to reasonable range e.g., 0 to 12
    const validatedOffset = Math.max(0, Math.min(12, offset));
    router.push(`/planner?weekOffset=${validatedOffset}`);
  };

  return (
    <WeeklyCalendar
      initialPlans={initialPlans}
      recipes={recipes}
      weekOffset={weekOffset}
      onWeekOffsetChange={handleWeekOffsetChange}
    />
  );
}
