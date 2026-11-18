'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Building2,
  Users,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';

export default function AdminHrmsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { selectedBranchId } = useAuth();
  const [activeTab, setActiveTab] = useState<'attendance' | 'leaves'>('attendance');

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewNote, setReviewNote] = useState('');

  // Fetch Employee Attendance
  const { data: attendanceList = [], isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['hrms-attendance', selectedBranchId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedBranchId && selectedBranchId !== 'all') params.append('branchId', selectedBranchId);
      const res: any = await api.get(`/hrms/attendance?${params.toString()}`);
      return Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    },
    enabled: activeTab === 'attendance',
  });

  // Fetch Leave Applications
  const { data: leaveApplications = [], isLoading: isLoadingLeaves } = useQuery({
    queryKey: ['hrms-leaves'],
    queryFn: async () => {
      const res: any = await api.get('/hrms/leave-applications');
      return Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    },
    enabled: activeTab === 'leaves',
  });

  // Review Leave Mutation
  const reviewLeaveMutation = useMutation({
    mutationFn: async ({ id, status, reviewNote }: { id: string; status: string; reviewNote?: string }) => {
      return api.patch(`/hrms/leave-applications/${id}/review`, { status, reviewNote });
    },
    onSuccess: () => {
      toast.success('Leave application reviewed successfully');
      setReviewModalOpen(false);
      setSelectedLeave(null);
      setReviewNote('');
      queryClient.invalidateQueries({ queryKey: ['hrms-leaves'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to review leave application');
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              HRMS: Employee Attendance & Leave Management
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Campus staff attendance logging, biometric check-ins, leave requests, and approval workflow.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'attendance'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Attendance
            </button>
            <button
              onClick={() => setActiveTab('leaves')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'leaves'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Leave Applications ({leaveApplications.filter((l: any) => l.status === 'PENDING').length})
            </button>
          </div>
        </div>

        {activeTab === 'attendance' ? (
          <Card>
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Today's Staff & Faculty Attendance Log</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-6">Employee</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Campus Branch</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Check-In</th>
                    <th className="py-3 px-4">Check-Out</th>
                    <th className="py-3 px-6 text-right">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No attendance logs recorded for selected campus today.
                      </td>
                    </tr>
                  ) : (
                    attendanceList.map((att: any) => (
                      <tr key={att.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-6 font-semibold text-slate-900">
                          {att.assignment?.user?.name}
                          <span className="block font-mono text-[10px] text-slate-400">
                            {att.assignment?.employeeId}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">{att.assignment?.designation}</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            <Building2 className="h-3 w-3" />
                            {att.branch?.branchName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[10px]">
                            {att.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs">{att.checkIn || '—'}</td>
                        <td className="py-3.5 px-4 font-mono text-xs">{att.checkOut || '—'}</td>
                        <td className="py-3.5 px-6 text-right text-slate-500 text-xs">
                          {att.remarks || 'Normal shift'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                <span>Employee Leave Applications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-6">Employee</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Days</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaveApplications.map((leave: any) => (
                    <tr key={leave.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-6 font-semibold text-slate-900">
                        {leave.user?.name}
                        <span className="block text-[11px] text-slate-400">{leave.user?.role}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {leave.leaveType?.name} ({leave.leaveType?.code})
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{leave.daysCount} d</td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{leave.reason}</td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={leave.status === 'APPROVED' ? 'default' : 'secondary'}
                          className={leave.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : ''}
                        >
                          {leave.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {leave.status === 'PENDING' ? (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => {
                              setSelectedLeave(leave);
                              setReviewStatus('APPROVED');
                              setReviewNote('');
                              setReviewModalOpen(true);
                            }}
                          >
                            Review
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review Leave Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Review Leave Application"
        description="Authorize or decline employee absence request"
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={reviewStatus === 'APPROVED' ? 'primary' : 'destructive'}
              isLoading={reviewLeaveMutation.isPending}
              onClick={() => {
                if (selectedLeave) {
                  reviewLeaveMutation.mutate({
                    id: selectedLeave.id,
                    status: reviewStatus,
                    reviewNote,
                  });
                }
              }}
              className={reviewStatus === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
            >
              Confirm {reviewStatus}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-slate-500 block text-xs">Applicant:</span>
            <span className="font-bold text-slate-900 block">{selectedLeave?.user?.name}</span>
            <span className="text-xs text-slate-600 block">
              Leave: {selectedLeave?.leaveType?.name} ({selectedLeave?.daysCount} days)
            </span>
            <span className="text-xs text-slate-500 block">Reason: "{selectedLeave?.reason}"</span>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Decision *</label>
            <select
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white"
            >
              <option value="APPROVED">APPROVE Leave Application</option>
              <option value="REJECTED">REJECT Leave Application</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Administrative Note (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Approved. Alternate teacher designated for morning class."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
