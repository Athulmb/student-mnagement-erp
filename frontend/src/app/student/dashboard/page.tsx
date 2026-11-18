'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  User,
  Bell,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Building2,
  FileText,
  DollarSign,
  ArrowRightLeft,
  Megaphone,
} from 'lucide-react';
import { StudentLayout } from '@/components/student/student-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatDateTime } from '@/lib/utils';
import api from '@/lib/api';

export default function StudentDashboardPage() {
  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: async () => {
      const res: any = await api.get('/student/dashboard');
      return res;
    },
  });

  const student = dashboard?.student;
  const profile = dashboard?.profile;
  const branch = dashboard?.branch;
  const assignedClass = dashboard?.assignedClass;
  const transferHistory = dashboard?.transferHistory || [];
  const timetable = dashboard?.timetable || [];
  const attendance = dashboard?.attendanceSummary;
  const fees = dashboard?.fees || [];
  const announcements = dashboard?.announcements || [];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-200 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-blue-300" />
                <span>Student Academic Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {isLoading ? <Skeleton className="h-9 w-64 bg-white/20" /> : `Welcome back, ${student?.name}!`}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                Enrolled under <strong className="text-white">{branch?.organization?.organizationName || 'BMN Academy'}</strong>.
              </p>
            </div>

            {branch && (
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-xs text-right">
                <p className="text-[10px] uppercase font-bold text-blue-300">Current Campus Worksite</p>
                <p className="text-sm font-black text-white mt-0.5 flex items-center justify-end gap-1.5">
                  <Building2 className="h-4 w-4 text-blue-300" />
                  <span>{branch.branchName}</span>
                </p>
                <p className="text-[10px] font-mono text-blue-200 mt-0.5">Code: {branch.branchCode}</p>
              </div>
            )}
          </div>
        </div>

        {/* Inter-Branch Transfer Alert Banner (if student was transferred) */}
        {transferHistory.length > 0 && (
          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 sm:p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Campus Transfer Recorded</h3>
                  <Badge variant="outline" className="text-[10px] font-semibold bg-white">
                    Transfer Verified
                  </Badge>
                </div>
                <p className="text-xs text-slate-600">
                  Transferred from <strong>{transferHistory[0]?.fromBranch?.branchName}</strong> to{' '}
                  <strong>{transferHistory[0]?.toBranch?.branchName}</strong> on{' '}
                  {formatDate(transferHistory[0]?.transferDate)}. All historical attendance and mark sheets remain preserved.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Overview 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border-l-4 border-l-blue-500">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admission ID</p>
            <p className="text-xl font-black text-slate-900 mt-1 font-mono">
              {profile?.admissionNumber || 'ADM-PENDING'}
            </p>
            <p className="text-[11px] text-blue-600 font-medium mt-0.5">Official Student Code</p>
          </Card>

          <Card className="p-5 border-l-4 border-l-purple-500">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Class</p>
            <p className="text-xl font-black text-slate-900 mt-1">
              {assignedClass ? `${assignedClass.name} (Sec ${assignedClass.section})` : 'Pending Assignment'}
            </p>
            <p className="text-[11px] text-purple-600 font-medium mt-0.5">
              {assignedClass?.subjects?.length || 0} Curriculum Subjects
            </p>
          </Card>

          <Card className="p-5 border-l-4 border-l-emerald-500">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</p>
            <p className="text-xl font-black text-slate-900 mt-1">
              {attendance?.attendancePercentage ?? 100}%
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
              {attendance?.presentDays ?? 0} days present
            </p>
          </Card>

          <Card className="p-5 border-l-4 border-l-amber-500">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fee Balance</p>
            <p className="text-xl font-black text-slate-900 mt-1">
              {fees.length > 0 ? formatCurrency(fees[0].amountDue - fees[0].amountPaid) : '₹0'}
            </p>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">
              {fees[0]?.status === 'PAID' ? 'Fully Settled' : 'Tuition Invoiced'}
            </p>
          </Card>
        </div>

        {/* Timetable & Notices Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Timetable Preview */}
          <Card className="lg:col-span-2">
            <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Class Schedule: {assignedClass?.name} (Sec {assignedClass?.section})
                </CardTitle>
                <p className="text-xs text-slate-500">Daily subject periods at {branch?.branchName}</p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {timetable.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No weekly schedule published for your class section yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
                        <th className="py-2.5 px-4">Day</th>
                        <th className="py-2.5 px-4">Period</th>
                        <th className="py-2.5 px-4">Subject</th>
                        <th className="py-2.5 px-4">Faculty</th>
                        <th className="py-2.5 px-4">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {timetable.slice(0, 8).map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4 font-bold text-slate-800">{p.dayOfWeek}</td>
                          <td className="py-2.5 px-4 font-semibold text-blue-600">Period {p.periodNumber}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-900">{p.subject?.name}</td>
                          <td className="py-2.5 px-4 text-slate-600">{p.teacher?.user?.name || 'Faculty'}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-500">{p.startTime} – {p.endTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Institutional Announcements */}
          <Card>
            <CardHeader className="py-4 px-6 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">Campus Notices</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {announcements.length === 0 ? (
                <div className="text-center text-slate-400 text-xs py-6">No current announcements.</div>
              ) : (
                announcements.map((item: any) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{item.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{item.content}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{formatDate(item.createdAt)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
}
