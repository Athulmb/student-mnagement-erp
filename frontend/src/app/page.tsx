'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  ShieldCheck,
  Building2,
  Users,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Lock,
  HeartHandshake,
  Shield,
  Briefcase,
  DollarSign,
  ArrowRightLeft,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const { user, isAuthenticated, isAdmin, isTeacher, isStaff, isParent, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (isAdmin) {
        router.push('/admin/dashboard');
      } else if (isTeacher) {
        router.push('/teacher/dashboard');
      } else if (isStaff) {
        router.push('/staff/dashboard');
      } else if (isParent) {
        router.push('/parent/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    }
  }, [isAuthenticated, isAdmin, isTeacher, isStaff, isParent, user, isLoading, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 block leading-tight">
                BMN ACADEMY
              </span>
              <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase block">
                Multi-Branch School Management & ERP
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/login">
              <Button variant="outline" className="text-xs sm:text-sm">
                Common Portal Login
              </Button>
            </Link>
            <Link href="/parent/login">
              <Button variant="secondary" className="text-xs sm:text-sm hidden sm:inline-flex gap-1.5">
                <HeartHandshake className="h-4 w-4 text-indigo-600" />
                <span>Parent Portal</span>
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm shadow-md shadow-blue-500/20">
                Admission Application
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center py-16 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/70 px-4 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>Multi-School & Multi-Branch Enterprise ERP Architecture</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Unified Multi-Branch School Management for{' '}
              <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 bg-clip-text text-transparent">
                BMN Academy
              </span>
            </h1>
            <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
              Consolidated administration across all school branches. Featuring multi-campus teacher assignments,
              automated timetable conflict prevention, branch transfers, HRMS & payroll generation, student dues collection,
              and parent progress tracking.
            </p>
          </div>

          {/* Quick Access Portal Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/login">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-500/25">
                <span>Unified Common Login</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Link href="/register">
              <Button size="lg" variant="outline" className="border-slate-300 gap-2">
                <GraduationCap className="h-4 w-4 text-blue-600" />
                <span>Student Admission</span>
              </Button>
            </Link>

            <Link href="/parent/login">
              <Button size="lg" variant="secondary" className="gap-2 bg-indigo-50 border border-indigo-200 text-indigo-900 hover:bg-indigo-100">
                <HeartHandshake className="h-4 w-4 text-indigo-600" />
                <span>Parent Portal</span>
              </Button>
            </Link>

            <Link href="/platform/login">
              <Button size="lg" variant="secondary" className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
                <Shield className="h-4 w-4 text-blue-400" />
                <span>Super Admin</span>
              </Button>
            </Link>
          </div>

          {/* 4 Pillars Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-10 text-left">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Multi-Branch Hierarchy</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Platform Super Admin & Organization Admins supervise Kochi, Calicut, and all subsidiary branches with consolidated metrics.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Multi-Branch Faculty</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Assign teachers to multiple campuses (e.g. Anjali K at Kochi & Calicut) without duplicate accounts or timetable collisions.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Campus Transfers</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Transfer students seamlessly between branches while preserving complete historical attendance and examination marks.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <DollarSign className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">HRMS & Payroll</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Branch-wise salary computation: Net = Basic + Allowances + Bonus - Deductions, plus student tuition invoicing and receipts.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 BMN Academy. Enterprise Multi-Branch School Management ERP.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-slate-900 font-semibold">Common Login</Link>
            <Link href="/parent/login" className="hover:text-slate-900 font-semibold">Parent Portal</Link>
            <Link href="/platform/login" className="hover:text-slate-900 font-semibold">Super Admin</Link>
            <Link href="/register" className="hover:text-slate-900 font-semibold">Admission Application</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
