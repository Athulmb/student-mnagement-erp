'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
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
  Plus,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { formatDate, formatDateTime } from '@/lib/utils';
import api from '@/lib/api';

export default function StaffDashboardPage() {
  const router = useRouter();
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'profile' | 'leaves' | 'payslips' | 'announcements'>('profile');
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  const [leaveForm, setLeaveForm] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Fetch Leave Types
  const { data: leaveTypes = [] } = useQuery({
    queryKey: ['staff-leave-types'],
    queryFn: async () => {
      const res: any = await api.get('/hrms/leave-types');
      return Array.isArray(res) ? res : [];
    },
  });

  // Fetch My Payslips
  const { data: payslips = [], isLoading: isLoadingPayslips } = useQuery({
    queryKey: ['staff-payslips'],
    queryFn: async () => {
      const res: any = await api.get('/payroll/my-payslips');
      return Array.isArray(res) ? res : [];
    },
  });

  // Fetch Announcements
  const { data: announcements = [] } = useQuery({
    queryKey: ['staff-announcements'],
    queryFn: async () => {
      const res: any = await api.get('/announcements');
      return Array.isArray(res) ? res : [];
    },
  });

  // Apply Leave Mutation
  const applyLeaveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/hrms/leave-applications', payload);
    },
    onSuccess: () => {
      toast.success('Leave application submitted for approval!');
      setLeaveModalOpen(false);
      setLeaveForm({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
      queryClient.invalidateQueries({ queryKey: ['staff-leave-applications'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to submit leave application');
    },
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

  const primaryAssignment = user?.employeeBranchAssignments?.[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-white font-bold">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">BMN Academy – Staff Portal</h1>
            <p className="text-[11px] text-slate-500">Operations & HRMS Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900">{user?.name}</p>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              {primaryAssignment?.designation || 'Staff Member'}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            className="text-xs text-rose-600 hover:bg-rose-50 gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-200 border border-slate-600">
                Staff Operations
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-2">
                Welcome, {user?.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Assigned Worksite: <strong className="text-white">{primaryAssignment?.branch?.branchName || 'Head Office'}</strong> ({primaryAssignment?.branch?.branchCode || 'HO'})
              </p>
            </div>

            <Button
              onClick={() => setLeaveModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Apply for Leave</span>
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-1 shadow-sm">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Profile & Employment</span>
          </button>
          <button
            onClick={() => setActiveTab('payslips')}
            className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'payslips'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>My Payslips</span>
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'announcements'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Megaphone className="h-4 w-4" />
            <span>Announcements</span>
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 md:col-span-2 space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Employment Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-400 uppercase font-semibold text-[10px]">Full Name</p>
                  <p className="font-bold text-slate-800 mt-0.5">{user?.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase font-semibold text-[10px]">Email Address</p>
                  <p className="font-mono text-slate-800 mt-0.5">{user?.email}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase font-semibold text-[10px]">Branch Campus</p>
                  <p className="font-bold text-slate-800 mt-0.5">{primaryAssignment?.branch?.branchName}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase font-semibold text-[10px]">Designation</p>
                  <p className="font-bold text-slate-800 mt-0.5">{primaryAssignment?.designation || 'Staff'}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-3">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Quick Actions
              </h3>
              <Button
                variant="secondary"
                className="w-full text-xs justify-start gap-2"
                onClick={() => setLeaveModalOpen(true)}
              >
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>Submit Leave Request</span>
              </Button>
              <Button
                variant="secondary"
                className="w-full text-xs justify-start gap-2"
                onClick={() => setActiveTab('payslips')}
              >
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span>Check Salary Records</span>
              </Button>
            </Card>
          </div>
        )}

        {/* Payslips Tab */}
        {activeTab === 'payslips' && (
          <Card>
            <CardHeader className="py-4 px-6 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">Salary Disbursement Records</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingPayslips ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : payslips.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <DollarSign className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No Payslips Available</p>
                  <p className="text-xs">Generated payslips will appear here after payroll processing.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
                        <th className="py-3 px-5">Period</th>
                        <th className="py-3 px-5">Campus</th>
                        <th className="py-3 px-5">Basic</th>
                        <th className="py-3 px-5">Allowances</th>
                        <th className="py-3 px-5">Deductions</th>
                        <th className="py-3 px-5">Net Wage</th>
                        <th className="py-3 px-5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payslips.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-5 font-bold text-slate-900">{p.payroll?.periodName}</td>
                          <td className="py-3 px-5 font-medium text-slate-800">{p.payroll?.branch?.branchName}</td>
                          <td className="py-3 px-5 font-mono">{formatCurrency(p.basicSalary)}</td>
                          <td className="py-3 px-5 font-mono text-emerald-600">+{formatCurrency(p.allowances)}</td>
                          <td className="py-3 px-5 font-mono text-rose-600">-{formatCurrency(p.deductions)}</td>
                          <td className="py-3 px-5 font-mono font-bold text-slate-900">{formatCurrency(p.netSalary)}</td>
                          <td className="py-3 px-5">
                            <Badge variant={p.paymentStatus === 'PAID' ? 'success' : 'warning'}>
                              {p.paymentStatus}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            {announcements.map((a: any) => (
              <Card key={a.id} className="p-5 border border-slate-200">
                <h4 className="font-bold text-slate-900">{a.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{formatDateTime(a.createdAt)}</p>
                <p className="text-xs text-slate-700 mt-2 leading-relaxed">{a.content}</p>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Leave Application Modal */}
      <Modal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        title="Apply for Leave"
        description="Submit leave request for administration review and approval"
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setLeaveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={applyLeaveMutation.isPending}
              onClick={() => {
                if (!leaveForm.leaveTypeId || !leaveForm.startDate || !leaveForm.endDate) {
                  toast.error('Please fill all required fields');
                  return;
                }
                applyLeaveMutation.mutate(leaveForm);
              }}
            >
              Submit Application
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Leave Type *
            </label>
            <select
              value={leaveForm.leaveTypeId}
              onChange={(e) => setLeaveForm({ ...leaveForm, leaveTypeId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-medium focus:border-blue-600 focus:outline-none"
            >
              <option value="">Select Leave Type</option>
              {leaveTypes.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Max {t.daysAllowed} days/year)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Start Date *
              </label>
              <input
                type="date"
                value={leaveForm.startDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                End Date *
              </label>
              <input
                type="date"
                value={leaveForm.endDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Reason for Leave *
            </label>
            <textarea
              rows={3}
              placeholder="State the reason..."
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
