'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Video,
  BarChart3,
  Settings,
  Shield,
  ChevronRight,
  Bell,
  Search,
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Candidates', icon: Users, href: '/dashboard/candidates' },
    { label: 'Interviews', icon: Video, href: '/dashboard/interviews' },
    { label: 'Reports', icon: BarChart3, href: '/dashboard/reports' },
    { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0 sticky top-0 h-screen z-30">
        {/* Logo */}
        <div className="h-16 border-b border-slate-200 px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Trust<span className="text-indigo-600">Hire</span>
            </span>
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
            MVP
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Banner */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 m-3 rounded-xl border">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-900">Gemma 4 AI Active</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            In-memory mock DB active. All candidate dossiers and tests demonstrable.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3 flex-1 max-w-md">
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
            <div className="flex items-center gap-2 pl-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                RH
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-semibold text-slate-900">Lead Recruiter</span>
                <span className="block text-[10px] text-slate-500">Acme Enterprise</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
