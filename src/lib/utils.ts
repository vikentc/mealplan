import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility to translate difficulty levels into visual colors
export function getDifficultyColor(difficulty: string) {
  const diff = difficulty?.toLowerCase();
  if (diff === 'easy') return 'bg-green-500/10 text-green-700 border-green-500/20';
  if (diff === 'medium') return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
  return 'bg-red-500/10 text-red-700 border-red-500/20';
}

// Utility to format time in minutes to friendly format
export function formatTime(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs} tim ${mins} min` : `${hrs} tim`;
}
