'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  Building2,
  GitBranch,
  Users,
  GraduationCap,
  Briefcase,
  PlusCircle,
  ExternalLink,
  CheckCircle2,
  LogOut,
  Layers,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

export default function PlatformDashboardPage() {
  const router = useRouter();
  const { user, isPlatformAdmin, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && (!user || !isPlatformAdmin)) {
      router.push('/platform/login');
    }
  }, [user, isPlatformAdmin, isLoading, router]);

  const { data: dashboardData, isLoading: isLoadingDash } = useQuery({
    queryKey: ['platform-dashboard'],
    queryFn: async () => {
      const res: any = await api.get('/platform/dashboard');
      return res;
    },
    enabled: isPlatformAdmin,
  });

  if (isLoading || !user || !isPlatformAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-xs text-slate-400">Verifying Super Admin clearance...</p>
        </div>
      </div>
    );
  }

  const organizations = dashboardData?.recentOrganizations || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">
              SaaS Multi-School Platform Control
            </h1>
            <p className="text-xs text-slate-400">Multi-Branch ERP Orchestration</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/platform/onboarding">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>Onboard New School</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">School Organizations</p>
                <p className="text-xl font-extrabold text-white">
                  {dashboardData?.totalOrganizations || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <GitBranch className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Total Branches</p>
                <p className="text-xl font-extrabold text-white">
                  {dashboardData?.totalBranches || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Total Students</p>
                <p className="text-xl font-extrabold text-white">
                  {dashboardData?.totalStudents || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Total Teachers</p>
                <p className="text-xl font-extrabold text-white">
                  {dashboardData?.totalTeachers || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Total Employees</p>
                <p className="text-xl font-extrabold text-white">
                  {dashboardData?.totalEmployees || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onboarded School Organizations */}
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-400" />
                <span>Onboarded School Organizations & Multi-Branch Networks</span>
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Each organization maintains centralized governance with branch-level operations
              </p>
            </div>
            <Link href="/platform/onboarding">
              <Button size="sm" variant="outline" className="border-slate-800 text-xs">
                + Add School Organization
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-3 px-6">School Organization</th>
                  <th className="py-3 px-4">Org Code</th>
                  <th className="py-3 px-4">Branches</th>
                  <th className="py-3 px-4">District / State</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {organizations.map((org: any) => (
                  <tr key={org.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-white">
                      {org.organizationName}
                      <span className="block text-[11px] text-slate-400 font-normal">
                        {org.contactEmail}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-blue-400 font-bold">
                      {org.organizationCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {org.branches?.map((b: any) => (
                          <span
                            key={b.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20"
                          >
                            📍 {b.branchName}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {org.district || '—'}, {org.state || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-300">
                        {org.subscriptionPlan}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        {org.organizationStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        href="/login"
                        className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium"
                      >
                        <span>Access Portal</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
