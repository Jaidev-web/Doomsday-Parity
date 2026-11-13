'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, FileText, Video, CheckCircle, ArrowLeft, User } from 'lucide-react';
import { RoleSessionGuard, signOutRoleSession } from '@/components/auth/RoleSessionGuard';
import { cn } from '@/lib/utils';

export default function CandidateLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { label: 'Portal Home', href: '/candidate', icon: User },
    { label: 'Submit Documents', href: '/candidate/apply', icon: FileText },
    { label: 'Join Interview Room', href: '/candidate/interview', icon: Video },
    { label: 'Application Status', href: '/candidate/status', icon: CheckCircle },
  ];

  const activeIndex = navItems.findIndex((item) =>
    item.href === '/candidate'
      ? pathname === '/candidate'
      : pathname?.startsWith(item.href)
  );

  const tabsRef = useRef([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, top: 0, width: 0, height: 0, opacity: 0 });

  useEffect(() => {
    const updateIndicator = () => {
      if (activeIndex !== -1 && tabsRef.current[activeIndex]) {
        const el = tabsRef.current[activeIndex];
        setIndicatorStyle({
          left: el.offsetLeft,
          top: el.offsetTop,
          width: el.offsetWidth,
          height: el.offsetHeight,
          opacity: 1,
        });
      } else {
        setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
      }
    };

    updateIndicator();
    const timer = setTimeout(updateIndicator, 40);
    window.addEventListener('resize', updateIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeIndex, pathname]);

  return (
    <RoleSessionGuard role="candidate">
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Candidate Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-slate-100 border border-slate-200 bg-white transition-all shadow-2xs"
              title="Go back to previous page"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <Link href="/" className="flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-600 rounded-lg text-white shadow-xs">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Trust<span className="text-emerald-600">Hire</span>
              </span>
            </Link>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hidden sm:inline-block">
              Candidate Portal
            </span>
          </div>

          {/* Navigation Links with Smooth Sliding Indicator */}
          <nav className="relative flex items-center gap-1 sm:gap-2">
            {/* Sliding Active Pill Background */}
            <div
              className="absolute rounded-lg bg-emerald-50 border border-emerald-200 shadow-2xs transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
              style={{
                left: `${indicatorStyle.left}px`,
                top: `${indicatorStyle.top}px`,
                width: `${indicatorStyle.width}px`,
                height: `${indicatorStyle.height}px`,
                opacity: indicatorStyle.opacity,
              }}
            />

            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = idx === activeIndex;
              return (
                <Link
                  key={item.href}
                  ref={(el) => (tabsRef.current[idx] = el)}
                  href={item.href}
                  className={cn(
                    'group relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 select-none',
                    isActive
                      ? 'text-emerald-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 shrink-0',
                      isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                    )}
                  />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => signOutRoleSession('candidate')}
              className="relative z-10 ml-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      {/* Main candidate body with Swapping Page Transition Animation */}
      <main
        key={pathname}
        className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in-50 duration-200"
      >
        {children}
      </main>

      {/* Candidate Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>TrustHire Candidate Environment • Secure & Privacy-Conscious Verification</p>
      </footer>
    </div>
    </RoleSessionGuard>
  );
}
