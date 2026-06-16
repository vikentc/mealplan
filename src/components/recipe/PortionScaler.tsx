import React from 'react';
import { Minus, Plus, Users } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface PortionScalerProps {
  servings: number;
  originalServings: number;
  onChange: (newServings: number) => void;
}

export default function PortionScaler({ servings, originalServings, onChange }: PortionScalerProps) {
  const { t } = useLanguage();

  const handleDecrement = () => {
    if (servings > 1) {
      onChange(servings - 1);
    }
  };

  const handleIncrement = () => {
    if (servings < 40) {
      onChange(servings + 1);
    }
  };

  const scaleFactor = servings / originalServings;
  const isScaled = servings !== originalServings;

  return (
    <div className="bg-card border-3 border-foreground p-5 rounded-[2rem] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-xl bg-amber-100 text-foreground border-2 border-foreground flex items-center justify-center shrink-0">
          <Users className="h-4.5 w-4.5" />
        </div>
        <div>
          <h4 className="font-black text-xs text-foreground uppercase tracking-tight leading-tight">{t('details.portions_title')}</h4>
          <p className="text-[10px] text-foreground/80 font-medium">{t('details.portions_desc')}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Decrement Button */}
        <button
          onClick={handleDecrement}
          className="h-11 w-11 rounded-2xl border-2 border-foreground bg-card hover:bg-amber-100/50 flex items-center justify-center text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:scale-102 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          disabled={servings <= 1}
        >
          <Minus className="h-4 w-4" />
        </button>

        {/* Serving Display */}
        <div className="text-center flex-1">
          <span className="text-3xl font-black text-foreground block tracking-tight leading-none">
            {servings}
          </span>
          <span className="text-[9px] uppercase font-black text-foreground/75 tracking-wider block mt-1">
            {t('details.portions_label')}
          </span>
        </div>

        {/* Increment Button */}
        <button
          onClick={handleIncrement}
          className="h-11 w-11 rounded-2xl border-2 border-foreground bg-card hover:bg-amber-100/50 flex items-center justify-center text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:scale-102 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Scaled Multiplier Info */}
      {isScaled && (
        <div className="mt-4 pt-3 border-t-2 border-foreground text-center">
          <span className="inline-block text-[10px] font-black uppercase tracking-wider text-foreground bg-cyan-100 px-3 py-1 rounded-md border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {t('details.scaled_by', { factor: scaleFactor.toFixed(2) })}
          </span>
        </div>
      )}
    </div>
  );
}
