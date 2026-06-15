import React from 'react';
import { Flame, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpiceScalerProps {
  spiceLevel: number;
  originalSpiceLevel: number;
  onChange: (newSpiceLevel: number) => void;
}

const SPICE_LABELS = [
  { label: 'Ej starkt', color: 'text-green-800 bg-green-100 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' },
  { label: 'Mild', color: 'text-amber-850 bg-amber-100 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' },
  { label: 'Mellan', color: 'text-orange-900 bg-orange-100 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' },
  { label: 'Stark', color: 'text-red-800 bg-red-100 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' },
  { label: 'Mycket stark', color: 'text-red-900 bg-red-200 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' },
  { label: 'Extrem', color: 'text-purple-900 bg-purple-100 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' },
];

export default function SpiceScaler({ spiceLevel, originalSpiceLevel, onChange }: SpiceScalerProps) {
  const currentLabel = SPICE_LABELS[spiceLevel] || SPICE_LABELS[0];
  const isChanged = spiceLevel !== originalSpiceLevel;

  // Compute scaling factor preview for spicy ingredients
  const getSpiceFactor = () => {
    if (originalSpiceLevel === 0) {
      // If original is 0 but user wants spice, multiply by user level directly
      return spiceLevel;
    }
    // Otherwise scale proportionally
    return spiceLevel / originalSpiceLevel;
  };

  const factor = getSpiceFactor();

  return (
    <div className="bg-card border-3 border-foreground p-5 rounded-[2rem] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-xl bg-red-100 text-red-700 border-2 border-foreground flex items-center justify-center shrink-0">
          <Flame className="h-4.5 w-4.5 fill-current" />
        </div>
        <div>
          <h4 className="font-black text-xs text-foreground uppercase tracking-tight leading-tight">Anpassa kryddstyrka</h4>
          <p className="text-[10px] text-foreground/80 font-medium">Skalar kryddiga ingredienser automatiskt</p>
        </div>
      </div>

      {/* Level Label Badge */}
      <div className="flex justify-between items-center mb-5">
        <span className="text-[10px] font-black uppercase text-foreground/75 tracking-wider">Nuvarande nivå</span>
        <span className={cn("text-[10px] font-black uppercase px-2.5 py-1 rounded-md transition-all duration-300", currentLabel.color)}>
          Nivå {spiceLevel}: {currentLabel.label}
        </span>
      </div>

      {/* Slider Controls */}
      <div className="space-y-3">
        <input
          type="range"
          min="0"
          max="5"
          step="1"
          value={spiceLevel}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-3 rounded-lg bg-secondary border-2 border-foreground appearance-none cursor-pointer accent-red-500 transition-all focus:outline-none"
        />
        
        {/* Scale labels */}
        <div className="flex justify-between text-[10px] font-black text-foreground/80 px-1">
          <span>0</span>
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
        </div>
      </div>

      {/* Visual Adjustments Alert */}
      {isChanged && (
        <div className="mt-5 pt-3.5 border-t-2 border-foreground flex gap-2.5 text-xs text-foreground">
          <Info className="h-4.5 w-4.5 text-foreground shrink-0 mt-0.5" />
          <div className="leading-snug">
            {spiceLevel === 0 ? (
              <span>Alla kryddiga ingredienser kommer att <strong className="font-black underline decoration-red-500">tas bort</strong>.</span>
            ) : originalSpiceLevel === 0 ? (
              <span>Kryddiga ingredienser kommer att <strong className="font-black underline decoration-emerald-500">läggas till</strong> med en basmängd.</span>
            ) : (
              <span>
                Kryddiga ingredienser kommer att skalas med <strong className="font-black">{factor.toFixed(2)}x</strong> (originalnivå: {originalSpiceLevel}).
              </span>
            )}
            <span className="block text-[9px] text-red-800 font-black uppercase tracking-wider mt-1.5">
              Live-justeringar visas nedan i färgkodad text.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
