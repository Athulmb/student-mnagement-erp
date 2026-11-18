'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  FileText,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Sparkles,
  School,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

export function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading, isStudent } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !isStudent)) {
      router.push('/login');
    }
  }, [user, isStudent, isLoading, router]);

  if (isLoading || !user || !isStudent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Loading your learning space...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { label: 'My Class', href: '/student/my-class', icon: School },
    { label: 'My Course', href: '/student/my-course', icon: BookOpen },
    { label: 'Class Schedule', href: '/student/schedule', icon: Calendar },
    { label: 'Study Materials', href: '/student/materials', icon: FileText },
    { label: 'Announcements', href: '/student/announcements', icon: Bell },
    { label: 'My Profile', href: '/student/my-profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Student Navigation Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white border-r border-slate-200/80 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 shadow-lg lg:shadow-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <Link href="/student/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 block">
                BMN ACADEMY
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 block">
                Student Portal
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Student Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Learning Hub
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Student Profile Card & Logout */}
        <div className="border-t border-slate-100 p-4 bg-slate-50/50">
          <div className="flex items-center gap-3 rounded-xl bg-white p-3 border border-slate-200/80 shadow-sm mb-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-sm">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900">{user.name}</p>
              <p className="truncate text-[11px] text-slate-500">{user.email}</p>
              {user.studentProfile?.admissionNumber && (
                <p className="truncate text-[10px] text-blue-600 font-medium mt-0.5 font-mono">
                  ADM: {user.studentProfile.admissionNumber}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Student Top Bar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <span className="text-xs font-medium text-slate-500">Student Portal</span>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight capitalize">
                {pathname.split('/')[2]?.replace('-', ' ') || 'Dashboard'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200/60 rounded-full px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span>BMN Learning Community</span>
            </div>
            <Link
              href="/student/my-profile"
              className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors shadow-sm"
            >
              <User className="h-4 w-4 text-slate-500" />
              <span className="hidden sm:inline">My Profile</span>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
