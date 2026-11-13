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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoleSessionGuard } from '@/components/auth/RoleSessionGuard';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  // Sidebar default is open (isCollapsed = false)
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      {/* Collapsible Sidebar */}
      <aside
        className={cn(
          'border-r border-slate-200 bg-white flex flex-col shrink-0 sticky top-0 h-screen z-30 transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-20' : 'w-64'
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
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            {/* Global Back Button (Single back option in top bar) */}
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200 bg-white transition-all shadow-2xs shrink-0 group"
              title="Go back to previous page"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
              <span>Back</span>
            </button>

            <div className="relative w-full">
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
          className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in-50 duration-200"
        >
          {children}
        </main>
      </div>
    </div>
    </RoleSessionGuard>
  );
}
