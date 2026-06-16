'use client';

import React, { useState, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '@/app/actions/auth';
import { ChefHat, Lock, User, AlertCircle, Sparkles } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirectUrl') || '/';
  const { t } = useLanguage();
  
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      try {
        const result = await login(formData, redirectUrl);
        if (result.error) {
          setError(result.error);
        } else if (result.success) {
          // Success! Refresh router and navigate
          router.refresh();
          router.push(result.redirectUrl || '/');
        }
      } catch (err) {
        console.error(err);
        setError(t('login.error_unexpected'));
      }
    });
  };

  return (
    <div className="w-full max-w-md bg-card border-3 border-foreground rounded-[2rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden transition-all duration-300">
      
      {/* Background decorative elements */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-100 border-2 border-foreground rounded-full -z-10" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-100 border-2 border-foreground rounded-full -z-10 animate-pulse" />

      {/* Header/Logo */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="h-16 w-16 rounded-2xl border-3 border-foreground bg-amber-100 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 animate-bounce-subtle">
          <ChefHat className="h-8 w-8 text-foreground" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 bg-amber-100 border-2 border-foreground px-3 py-1 rounded-md inline-block">
          {t('home.title')} 🏰
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-foreground uppercase tracking-tight mt-3">
          {t('login.title')}
        </h2>
        <p className="text-xs text-muted-foreground font-semibold mt-1">
          {t('login.subtitle')}
        </p>
      </div>

      {/* Error Alert Box */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border-2 border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-start gap-2.5 text-red-950 animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black uppercase tracking-wider">{t('login.failed_title')}</p>
            <p className="text-[11px] font-medium mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Username Field */}
        <div className="space-y-1.5">
          <label 
            htmlFor="username" 
            className="text-xs font-black uppercase tracking-wider text-foreground/80 flex items-center gap-1.5"
          >
            <User className="h-3.5 w-3.5" />
            <span>{t('login.username')}</span>
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            disabled={isPending}
            autoComplete="username"
            placeholder={t('login.username')}
            className="w-full p-3.5 bg-white border-2 border-foreground rounded-xl text-sm font-semibold focus:outline-none focus:bg-amber-50/20 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-foreground/30"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <label 
            htmlFor="password" 
            className="text-xs font-black uppercase tracking-wider text-foreground/80 flex items-center gap-1.5"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>{t('login.password')}</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            disabled={isPending}
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full p-3.5 bg-white border-2 border-foreground rounded-xl text-sm font-semibold focus:outline-none focus:bg-amber-50/20 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-foreground/30"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 py-4 bg-amber-400 hover:bg-amber-500 disabled:bg-amber-200 border-3 border-foreground font-black text-sm uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isPending ? (
            <span className="animate-pulse flex items-center gap-1.5">
              {t('login.logging_in')}
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              {t('login.submit')}
            </span>
          )}
        </button>
      </form>


    </div>
  );
}

export default function LoginPage() {
  const { t } = useLanguage();
  return (
    <div className="w-full flex flex-col items-center justify-center py-12 px-4">
      <Suspense fallback={
        <div className="w-full max-w-md bg-card border-3 border-foreground rounded-[2rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center py-20 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-100 border-2 border-foreground rounded-full -z-10" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-100 border-2 border-foreground rounded-full -z-10 animate-pulse" />
          <div className="h-12 w-12 rounded-xl border-2 border-foreground bg-amber-100 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-4 animate-spin" />
          <p className="font-black text-xs uppercase tracking-widest text-foreground animate-pulse">{t('login.loading')}</p>
        </div>
      }>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
