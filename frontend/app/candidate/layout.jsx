'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, FileText, Video, CheckCircle, ArrowLeft, User } from 'lucide-react';

export default function CandidateLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Portal Home', href: '/candidate', icon: User },
    { label: 'Submit Documents', href: '/candidate/apply', icon: FileText },
    { label: 'Join Interview Room', href: '/candidate/interview', icon: Video },
    { label: 'Application Status', href: '/candidate/status', icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Candidate Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
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

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main candidate body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">{children}</main>

      {/* Candidate Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>TrustHire Candidate Environment • Secure & Privacy-Conscious Verification</p>
      </footer>
    </div>
  );
}
