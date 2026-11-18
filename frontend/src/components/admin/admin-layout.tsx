'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  Receipt,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronRight,
  GitBranch,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { BranchSelector } from '@/components/layout/branch-selector';
import { cn } from '@/lib/utils';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading, isAdmin, isOrgAdmin, isPlatformAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.push('/login');
    }
  }, [user, isAdmin, isLoading, router]);

  if (isLoading || !user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Verifying administrative credentials...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    ...(isOrgAdmin || isPlatformAdmin
      ? [{ label: 'Branch Management', href: '/admin/branches', icon: Building2, highlight: true }]
      : []),
    { label: 'Students Directory', href: '/admin/students', icon: GraduationCap },
    { label: 'Pending Admissions', href: '/admin/approvals', icon: Users },
    { label: 'Teachers (Multi-Branch)', href: '/admin/teachers', icon: Users },
    { label: 'Staff Directory', href: '/admin/staff', icon: Briefcase },
    { label: 'Classes & Timetable', href: '/admin/classes', icon: Calendar },
    { label: 'HRMS & Attendance', href: '/admin/hrms', icon: Clock },
    { label: 'Payroll Management', href: '/admin/payroll', icon: DollarSign },
    { label: 'Fees Collection', href: '/admin/fees', icon: Receipt },
    { label: 'Announcements', href: '/admin/announcements', icon: Bell },
    { label: 'Organization Settings', href: '/admin/settings', icon: Settings },
  ];

  const orgName = user.organization?.organizationName || 'School Organization ERP';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 shadow-xl',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between border-b border-slate-800/80 px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Shield className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold tracking-tight text-white block truncate">
                {orgName}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 block">
                {user.role === 'PLATFORM_SUPER_ADMIN'
                  ? 'Platform Super Admin'
                  : user.role === 'ORGANIZATION_ADMIN'
                  ? 'Head Office / Org Admin'
                  : 'Branch Admin Portal'}
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation Menu
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
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white',
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Admin User Card & Logout */}
        <div className="border-t border-slate-800/80 p-4 bg-slate-950/40">
          <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-2.5 mb-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-semibold text-white">{user.name}</p>
              <p className="truncate text-[10px] text-slate-400">{user.email}</p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-800/40 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar with Branch Selector */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span>{orgName}</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-slate-900 font-semibold capitalize">
                  {pathname.split('/')[2] || 'Dashboard'}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight capitalize">
                {pathname.split('/')[2]?.replace('-', ' ') || 'Admin Dashboard'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Multi-Branch Selector Dropdown */}
            <BranchSelector />

            <Link
              href="/admin/settings"
              className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors shadow-sm"
            >
              <Settings className="h-4 w-4 text-slate-500" />
              <span>Settings</span>
            </Link>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
