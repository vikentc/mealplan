'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ChefHat,
  Menu, 
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/app/actions/auth';

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Översikt', href: '/' },
  { label: 'Veckoplanering', href: '/planner' },
  { label: 'Skapa recept', href: '/recipes/add' },
];

const ITEM_COLORS: Record<string, { bg: string; text: string }> = {
  '/': { bg: 'bg-cyan-100', text: 'text-cyan-950' },
  '/planner': { bg: 'bg-emerald-100', text: 'text-emerald-950' },
  '/recipes/add': { bg: 'bg-red-100', text: 'text-red-950' },
};

export default function NavbarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Force light mode only to ensure strict compliance
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const getSessionUserFromCookie = () => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/(?:^|; )user_session=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
  };

  useEffect(() => {
    setCurrentUser(getSessionUserFromCookie());
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    router.push('/login');
    router.refresh();
  };

  const checkIsActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    if (href === '/recipes/add') {
      return pathname === '/recipes/add';
    }
    return pathname.startsWith(href);
  };

  const getNavItemStyle = (href: string) => {
    const isActive = checkIsActive(href);
    if (!isActive) {
      return 'text-foreground/80 hover:text-foreground font-black uppercase tracking-wider text-[10px] px-3.5 py-2 border-2 border-transparent hover:border-foreground hover:bg-amber-50/50 rounded-xl transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px]';
    }
    const color = ITEM_COLORS[href] || { bg: 'bg-cyan-100', text: 'text-cyan-950' };
    return cn(
      "border-2 border-foreground font-black uppercase tracking-wider text-[10px] px-3.5 py-2 rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px]",
      color.bg,
      color.text
    );
  };

  const getMobileItemStyle = (href: string) => {
    const isActive = checkIsActive(href);
    if (!isActive) {
      return 'w-full text-center py-3 bg-card hover:bg-amber-50/30 text-foreground border-2 border-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-black uppercase text-xs tracking-wider rounded-xl transition-all active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]';
    }
    const color = ITEM_COLORS[href] || { bg: 'bg-cyan-100', text: 'text-cyan-950' };
    return cn(
      "w-full text-center py-3 border-2 border-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-black uppercase text-xs tracking-wider rounded-xl transition-all",
      color.bg,
      color.text
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      
      {/* Floating Neobrutalist Navbar */}
      <header className="fixed top-4 left-4 right-4 z-50 h-16 bg-white border-3 border-foreground rounded-2xl flex items-center select-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1440px] w-full mx-auto px-5 flex justify-between items-center h-full relative">
          
          {/* Logo / Home link */}
          <Link 
            href="/" 
            className="flex items-center gap-2 text-foreground font-black text-xs uppercase tracking-wider bg-amber-100 hover:bg-amber-200 border-2 border-foreground px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group"
          >
            <ChefHat className="h-4.5 w-4.5 text-foreground group-hover:rotate-12 transition-transform duration-300" />
            <span className="hidden sm:inline">Maja & Kents Kök</span>
          </Link>

          {/* Desktop Links (Dynamic centred pills) */}
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={getNavItemStyle(item.href)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth State */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {currentUser ? (
              <>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-950 border-2 border-foreground px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  👤 {currentUser}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-[10px] font-black uppercase tracking-wider bg-red-100 hover:bg-red-200 text-red-800 border-2 border-foreground px-3.5 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  Logga ut
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-[10px] font-black uppercase tracking-wider bg-cyan-100 hover:bg-cyan-200 text-cyan-950 border-2 border-foreground px-3.5 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer text-center font-bold"
              >
                Logga in
              </Link>
            )}
          </div>

          {/* Mobile Hamburger menu */}
          <div className="flex items-center gap-4 md:hidden shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="h-10 w-10 border-2 border-foreground bg-amber-100 text-foreground flex items-center justify-center rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              aria-label="Öppna/stäng meny"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-24 left-4 right-4 z-40 bg-white border-3 border-foreground rounded-[2rem] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6 overflow-hidden">
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={getMobileItemStyle(item.href)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          
          <div className="border-t-2 border-foreground/20 pt-4 flex flex-col items-center gap-3">
            {currentUser ? (
              <>
                <span className="inline-block bg-emerald-100 text-emerald-950 border-2 border-foreground px-4 py-2 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs font-black uppercase tracking-wider">
                  👤 Inloggad: {currentUser}
                </span>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-center py-3 bg-red-100 hover:bg-red-200 text-red-800 border-2 border-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-black uppercase text-xs tracking-wider rounded-xl transition-all active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                >
                  Logga ut
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-3 bg-cyan-100 hover:bg-cyan-200 text-cyan-950 border-2 border-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-black uppercase text-xs tracking-wider rounded-xl transition-all active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                Logga in
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Content Container with spacing to prevent fixed header overlap */}
      <main className="flex-1 flex flex-col pt-24 min-w-0">
        <div className="px-6 py-8 md:py-12 max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1440px] w-full mx-auto flex-1">
          {children}
        </div>
      </main>

    </div>
  );
}
