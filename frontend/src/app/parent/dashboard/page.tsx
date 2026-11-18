'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  HeartHandshake,
  GraduationCap,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Building2,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  User,
  LogOut,
  CreditCard,
  Phone,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatDateTime } from '@/lib/utils';
import api from '@/lib/api';

export default function ParentDashboardPage() {
  const router = useRouter();
  const { user, logout, isLoading: isAuthLoading } = useAuth();

  const [selectedChildIndex, setSelectedChildIndex] = useState<number>(0);

  // Fetch Parent Dashboard Data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: async () => {
      const res: any = await api.get('/parent/dashboard');
      return res;
    },
    enabled: !!user,
  });

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const children = dashboardData?.children || [];
  const currentChild = children[selectedChildIndex];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">BMN Academy – Parent Portal</h1>
            <p className="text-[11px] text-slate-500">Student Academic & Financial Progress</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900">{user?.name}</p>
            <p className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">Parent / Guardian</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              await logout();
              router.push('/parent/login');
            }}
            className="text-xs text-rose-600 hover:bg-rose-50 gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Child Selector (if multiple children) */}
        {children.length > 1 && (
          <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-600 px-2">Select Student:</span>
            {children.map((child: any, idx: number) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  selectedChildIndex === idx
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {child.user?.name}
              </button>
            ))}
          </div>
        )}

        {/* Current Child Banner */}
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : !currentChild ? (
          <Card className="p-12 text-center text-slate-500">
            <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No Linked Student Records</p>
            <p className="text-xs">Your account does not currently have any student profiles linked.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Student Overview Card */}
            <div className="rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                      Enrolled Student
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-white/10 px-2 py-0.5 rounded text-indigo-200">
                      ADM: {currentChild.admissionNumber}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight mt-2">{currentChild.user?.name}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-200 mt-1">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      <strong>{currentChild.branch?.branchName}</strong> ({currentChild.branch?.branchCode})
                    </span>
                    <span>•</span>
                    <span>Class: <strong className="text-white">{currentChild.assignedClass?.name} (Sec {currentChild.assignedClass?.section})</strong></span>
                  </div>
                </div>

                <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-xs">
                  <p className="text-[10px] uppercase font-bold text-indigo-300">Campus Contact</p>
                  <p className="font-bold mt-0.5 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-indigo-300" />
                    <span>{currentChild.branch?.phone || '+91 484 2345678'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-5 border-l-4 border-l-emerald-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Status</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                      {currentChild.attendances?.length > 0
                        ? `${Math.round(
                            (currentChild.attendances.filter((a: any) => a.status === 'PRESENT').length /
                              currentChild.attendances.length) *
                              100
                          )}%`
                        : '100%'}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Regular presence</p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                </div>
              </Card>

              <Card className="p-5 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tuition Fees</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                      {currentChild.studentFees?.length > 0
                        ? formatCurrency(currentChild.studentFees[0]?.amountDue - currentChild.studentFees[0]?.amountPaid)
                        : '₹0'}
                    </p>
                    <p className="text-[11px] text-blue-600 font-medium mt-0.5">
                      {currentChild.studentFees?.[0]?.status === 'PAID' ? 'Fully Settled' : 'Pending balance'}
                    </p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </div>
              </Card>

              <Card className="p-5 border-l-4 border-l-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Curriculum Subjects</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                      {currentChild.assignedClass?.subjects?.length || 0}
                    </p>
                    <p className="text-[11px] text-purple-600 font-medium mt-0.5">Active academic courses</p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <BookOpen className="h-6 w-6" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Attendance Log & Fee Ledger */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attendance Card */}
              <Card>
                <CardHeader className="py-4 px-6 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900">Recent Attendance Records</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {currentChild.attendances?.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">No daily attendance recorded yet.</div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                          <th className="py-2.5 px-5">Date</th>
                          <th className="py-2.5 px-5">Status</th>
                          <th className="py-2.5 px-5">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentChild.attendances?.map((att: any) => (
                          <tr key={att.id}>
                            <td className="py-2.5 px-5 font-medium text-slate-800">{formatDate(att.date)}</td>
                            <td className="py-2.5 px-5">
                              {att.status === 'PRESENT' ? (
                                <Badge variant="success">PRESENT</Badge>
                              ) : att.status === 'LATE' ? (
                                <Badge variant="warning">LATE</Badge>
                              ) : (
                                <Badge variant="destructive">ABSENT</Badge>
                              )}
                            </td>
                            <td className="py-2.5 px-5 text-slate-400 italic">{att.remarks || 'Normal'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>

              {/* Fee Ledger Card */}
              <Card>
                <CardHeader className="py-4 px-6 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900">Fee Invoicing & Receipts</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {currentChild.studentFees?.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">No fee invoices issued.</div>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs p-4 space-y-3">
                      {currentChild.studentFees?.map((fee: any) => (
                        <div key={fee.id} className="pt-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{fee.category?.name || 'Tuition Fee'}</span>
                            <Badge variant={fee.status === 'PAID' ? 'success' : 'warning'}>{fee.status}</Badge>
                          </div>
                          <div className="flex justify-between text-slate-500 mt-1">
                            <span>Total Due: {formatCurrency(fee.amountDue)}</span>
                            <span className="font-bold text-emerald-600">Paid: {formatCurrency(fee.amountPaid)}</span>
                          </div>

                          {fee.payments?.length > 0 && (
                            <div className="mt-2 p-2 bg-slate-50 rounded text-[11px] space-y-1">
                              <p className="font-bold text-slate-700">Receipts Issued:</p>
                              {fee.payments.map((p: any) => (
                                <div key={p.id} className="flex justify-between text-slate-600">
                                  <span>Receipt #{p.receiptNumber} ({p.paymentMethod})</span>
                                  <span className="font-mono font-bold text-emerald-700">{formatCurrency(p.amount)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
