'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  GitBranch,
  Users,
  UserCheck,
  UserX,
  Clock,
  GraduationCap,
  Briefcase,
  DollarSign,
  Receipt,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Activity,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth-context';
import { formatDate, formatDateTime, getStatusBadgeVariant } from '@/lib/utils';
import api from '@/lib/api';

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { selectedBranchId, setSelectedBranchId, isOrgAdmin, isPlatformAdmin } = useAuth();

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch Dashboard Stats with active branch context
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['admin-dashboard', selectedBranchId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedBranchId) params.append('branchId', selectedBranchId);
      const res: any = await api.get(`/admin/dashboard?${params.toString()}`);
      return res;
    },
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.patch(`/admin/students/${id}/approve`);
    },
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Student admission approved successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to approve student');
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return api.patch(`/admin/students/${id}/reject`, { reason });
    },
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Student application rejected');
      setRejectModalOpen(false);
      setRejectionReason('');
      setSelectedStudent(null);
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to reject student');
    },
  });

  const isConsolidated = dashboard?.scope === 'CONSOLIDATED_ORGANIZATION';

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Banner Alert for Active Scope */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-2">
              <Building2 className="h-3 w-3" />
              <span>{isConsolidated ? 'Consolidated Organization Network' : `Campus: ${dashboard?.branch?.branchName}`}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {isConsolidated ? 'Head Office Executive Overview' : `${dashboard?.branch?.branchName} Operations`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              {isConsolidated
                ? 'Consolidated academic, HRMS, fee collections, and student lifecycle metrics across all regional campus branches.'
                : `Branch-specific operational control for ${dashboard?.branch?.branchCode} (${dashboard?.branch?.district}, ${dashboard?.branch?.state}).`}
            </p>
          </div>

          {isConsolidated && (isOrgAdmin || isPlatformAdmin) && (
            <Link href="/admin/branches">
              <Button className="bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs gap-2 shrink-0">
                <GitBranch className="h-4 w-4 text-blue-600" />
                <span>Manage Branches</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Overview Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-white border-slate-200/80 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Students
                </p>
                <GraduationCap className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {isLoading ? <Skeleton className="h-8 w-12" /> : dashboard?.totalStudents || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Enrolled learners</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200/80 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Teachers
                </p>
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {isLoading ? <Skeleton className="h-8 w-12" /> : dashboard?.totalTeachers || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Faculty educators</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200/80 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Staff
                </p>
                <Briefcase className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {isLoading ? <Skeleton className="h-8 w-12" /> : dashboard?.totalStaff || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Operations team</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200/80 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {isConsolidated ? 'Campuses' : 'Classes'}
                </p>
                <Building2 className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {isLoading ? <Skeleton className="h-8 w-12" /> : isConsolidated ? dashboard?.totalBranches || 0 : dashboard?.totalClasses || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isConsolidated ? 'Active branches' : 'Academic batches'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200/80 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Fees Collected
                </p>
                <Receipt className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-xl font-black text-emerald-700 mt-2 truncate">
                {isLoading ? <Skeleton className="h-8 w-16" /> : `₹${Number(dashboard?.totalFeeCollected || 0).toLocaleString()}`}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Revenue realized</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200/80 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Salary Cost
                </p>
                <DollarSign className="h-4 w-4 text-rose-600" />
              </div>
              <p className="text-xl font-black text-slate-900 mt-2 truncate">
                {isLoading ? <Skeleton className="h-8 w-16" /> : `₹${Number(dashboard?.totalSalaryExpense || 0).toLocaleString()}`}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Monthly payroll</p>
            </CardContent>
          </Card>
        </div>

        {/* Branch Network Highlights when Consolidated */}
        {isConsolidated && dashboard?.branchesList?.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span>Regional Branch Campuses (Click campus to filter view)</span>
              </h3>
              <Link href="/admin/branches" className="text-xs text-blue-600 hover:underline font-semibold">
                View Comparative Matrix →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {dashboard.branchesList.map((b: any) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBranchId(b.id)}
                  className="p-4 bg-white rounded-xl border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                      {b.branchName}
                    </span>
                    <Badge variant="outline" className="text-[10px] text-blue-600 font-mono">
                      {b.branchCode}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Admin: {b.branchAdmin?.name || 'Unassigned'}
                  </p>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>{b._count?.studentProfiles || 0} Students</span>
                    <span>•</span>
                    <span>{b._count?.employeeBranchAssignments || 0} Staff</span>
                    <span>•</span>
                    <span>{b._count?.classes || 0} Classes</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid: Pending Approvals & Recent Students */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Pending Student Applications */}
          <Card className="lg:col-span-7 bg-white">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>Pending Student Admissions ({dashboard?.pendingApprovals || 0})</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Applications awaiting administrator review</p>
              </div>
              <Link href="/admin/approvals">
                <Button size="sm" variant="ghost" className="text-xs text-blue-600 gap-1">
                  <span>Manage All</span>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-4">Branch Campus</th>
                    <th className="py-2.5 px-4">Class</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboard?.pendingAdmissions?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No pending student admissions at this time.
                      </td>
                    </tr>
                  ) : (
                    dashboard?.pendingAdmissions?.map((student: any) => (
                      <tr key={student.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          {student.name}
                          <span className="block text-[11px] text-slate-400 font-normal">
                            {student.email}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {student.studentProfile?.branch?.branchName || 'Central'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">
                          {student.studentProfile?.admissionClass || 'Class 8'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px]"
                              onClick={() => approveMutation.mutate(student.id)}
                              isLoading={approveMutation.isPending}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-rose-600 hover:bg-rose-50 text-[11px] border-rose-200"
                              onClick={() => {
                                setSelectedStudent(student);
                                setRejectModalOpen(true);
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Recent Registrations */}
          <Card className="lg:col-span-5 bg-white">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Recent Admissions</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Latest registered students</p>
              </div>
              <Link href="/admin/students">
                <Button size="sm" variant="ghost" className="text-xs text-blue-600 gap-1">
                  <span>Directory</span>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <div className="divide-y divide-slate-100">
                {dashboard?.recentStudents?.map((s: any) => (
                  <div key={s.id} className="p-3 hover:bg-slate-50/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{s.name}</span>
                      <span className="text-[11px] text-slate-500">
                        {s.studentProfile?.branch?.branchName} • {s.studentProfile?.assignedClass ? `${s.studentProfile.assignedClass.name}${s.studentProfile.assignedClass.section}` : 'Unassigned'}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeVariant(s.status)}`}
                    >
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Student Application"
        description="Provide a justification note for the applicant"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              isLoading={rejectMutation.isPending}
              onClick={() => {
                if (selectedStudent) {
                  rejectMutation.mutate({
                    id: selectedStudent.id,
                    reason: rejectionReason,
                  });
                }
              }}
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs sm:text-sm">
          <p className="text-slate-600">
            Rejecting admission for <span className="font-bold text-slate-900">{selectedStudent?.name}</span>.
          </p>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Rejection Reason *</label>
            <textarea
              rows={3}
              placeholder="e.g. Incomplete academic transcripts, age criteria mismatch..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
