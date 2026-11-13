'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Video,
  BarChart3,
  Settings,
  Shield,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeft,
  Bell,
  Search,
  ArrowLeft,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoleSessionGuard, signOutRoleSession } from '@/components/auth/RoleSessionGuard';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  // Sidebar default is open (isCollapsed = false)
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Candidates', icon: Users, href: '/dashboard/candidates' },
    { label: 'Interviews', icon: Video, href: '/dashboard/interviews' },
    { label: 'Reports', icon: BarChart3, href: '/dashboard/reports' },
    { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
  ];

  const activeIndex = navItems.findIndex((item) =>
    item.href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname?.startsWith(item.href)
  );

  return (
    <RoleSessionGuard role="hr">
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {isMobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsMobileNavOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[1px] lg:hidden"
        />
      )}
      {/* Collapsible Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:z-30 lg:translate-x-0',
          isCollapsed ? 'lg:w-20' : 'lg:w-64',
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo & Toggle Header */}
        <div
          className={cn(
            'h-16 border-b border-slate-200 flex items-center transition-all duration-300',
            isCollapsed ? 'px-3 justify-center' : 'px-5 justify-between'
          )}
        >
          {isCollapsed ? (
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 shadow-2xs transition-all"
              title="Expand sidebar"
            >
              <PanelLeft className="w-5 h-5 text-indigo-600" />
            </button>
          ) : (
            <>
              <Link href="/" className="flex items-center gap-2.5 overflow-hidden group">
                <div className="p-1.5 bg-indigo-600 rounded-lg text-white shadow-xs group-hover:bg-indigo-700 transition-colors shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold tracking-tight text-slate-900 truncate animate-in fade-in duration-200">
                  Trust<span className="text-indigo-600">Hire</span>
                </span>
              </Link>

              {/* Sidebar Toggle Button (Only one in the sidebar) */}
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-all"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation with Animated Swapping Pill Indicator */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="relative">
            {/* Sliding Active Pill Background */}
            {activeIndex !== -1 && (
              <div
                className={cn(
                  'absolute rounded-xl bg-indigo-50/90 border border-indigo-200/70 shadow-2xs transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none',
                  isCollapsed ? 'left-1 right-1 h-10' : 'left-0 right-0 h-10'
                )}
                style={{
                  transform: `translateY(${activeIndex * 44}px)`,
                }}
              />
            )}

            {/* Sliding Active Left Edge Accent Bar */}
            {activeIndex !== -1 && !isCollapsed && (
              <div
                className="absolute -left-3 w-1 bg-indigo-600 rounded-r-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
                style={{
                  height: '24px',
                  transform: `translateY(${activeIndex * 44 + 8}px)`,
                }}
              />
            )}

            {/* Navigation Link Items */}
            <div className="space-y-1 relative z-10">
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = idx === activeIndex;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileNavOpen(false)}
                    className={cn(
                      'group relative flex items-center h-10 rounded-xl text-sm font-medium transition-all duration-200 select-none',
                      isCollapsed ? 'justify-center px-0' : 'px-3.5 gap-3',
                      isActive
                        ? 'text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110',
                        isActive
                          ? 'text-indigo-600'
                          : 'text-slate-400 group-hover:text-slate-600'
                      )}
                    />

                    {!isCollapsed && (
                      <>
                        <span className="flex-1 truncate transition-opacity duration-200">
                          {item.label}
                        </span>
                        <ChevronRight
                          className={cn(
                            'w-3.5 h-3.5 transition-all duration-200',
                            isActive
                              ? 'text-indigo-500 opacity-100 translate-x-0'
                              : 'text-slate-300 opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0'
                          )}
                        />
                      </>
                    )}

                    {/* Collapsed Hover Tooltip */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-lg whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Bottom Banner */}
        <div
          className={cn(
            'transition-all duration-300 border-t border-slate-100',
            isCollapsed
              ? 'p-3 flex justify-center'
              : 'p-4 bg-slate-50/60 m-3 rounded-xl border border-slate-200'
          )}
        >
          {isCollapsed ? (
            <div
              className="relative group p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center cursor-pointer shadow-2xs"
              title="Gemma 4 AI Active"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-[11px] rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-lg whitespace-nowrap z-50">
                <span className="font-semibold block text-emerald-400">Gemma 4 AI Active</span>
                <span className="text-slate-300 text-[10px]">In-memory mock DB active</span>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-900">Gemma 4 AI Active</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                In-memory mock DB active. All candidate dossiers and tests demonstrable.
              </p>
            </>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-3 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 lg:max-w-md">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen((open) => !open)}
              aria-label="Open navigation"
              aria-expanded={isMobileNavOpen}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 lg:hidden"
            >
              {isMobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            {/* Global Back Button (Single back option in top bar) */}
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-100 hover:text-indigo-600 group sm:px-3"
              title="Go back to previous page"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
              <span>Back</span>
            </button>

            <div className="relative hidden w-full sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidates, dossiers, or evidence..."
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 pl-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                RH
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-semibold text-slate-900 leading-tight">Lead Recruiter</span>
                <span className="block text-[10px] text-slate-500 font-medium leading-tight">Reiner Hemming</span>
              </div>
            </div>
            <button type="button" onClick={() => signOutRoleSession('hr')} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              Sign out
            </button>
          </div>
        </header>

        {/* Page Content with Swapping Fade Animation */}
        <main
          key={pathname}
          className="mx-auto w-full max-w-7xl flex-1 p-4 animate-in fade-in-50 duration-200 sm:p-6 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
    </RoleSessionGuard>
  );
}
