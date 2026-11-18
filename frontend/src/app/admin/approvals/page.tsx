'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Phone,
  Mail,
  BookOpen,
  Calendar,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { formatDate, formatDateTime } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

export default function AdminApprovalsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { selectedBranchId } = useAuth();

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [approveConfirmModalOpen, setApproveConfirmModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch all pending students
  const { data: pendingStudents, isLoading, error } = useQuery({
    queryKey: ['admin-pending', selectedBranchId],
    queryFn: async () => {
      const url = selectedBranchId && selectedBranchId !== 'all'
        ? `/admin/students/pending?branchId=${selectedBranchId}`
        : '/admin/students/pending';
      const res: any = await api.get(url);
      return Array.isArray(res) ? res : [];
    },
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.patch(`/admin/students/${id}/approve`);
    },
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Student registration successfully approved!');
      setApproveConfirmModalOpen(false);
      setSelectedStudent(null);
      queryClient.invalidateQueries({ queryKey: ['admin-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to approve student registration');
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return api.patch(`/admin/students/${id}/reject`, { reason });
    },
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Student registration rejected');
      setRejectModalOpen(false);
      setRejectionReason('');
      setSelectedStudent(null);
      queryClient.invalidateQueries({ queryKey: ['admin-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to reject student registration');
    },
  });

  const handleOpenApproveConfirm = (student: any) => {
    setSelectedStudent(student);
    setApproveConfirmModalOpen(true);
  };

  const handleOpenReject = (student: any) => {
    setSelectedStudent(student);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleOpenDetails = (student: any) => {
    setSelectedStudent(student);
    setDetailsModalOpen(true);
  };

  const handleConfirmApprove = () => {
    if (selectedStudent) {
      approveMutation.mutate(selectedStudent.id);
    }
  };

  const handleConfirmReject = () => {
    if (!selectedStudent || !rejectionReason.trim()) {
      toast.error('A rejection reason is required');
      return;
    }
    rejectMutation.mutate({ id: selectedStudent.id, reason: rejectionReason });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Student Registration Approvals
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Review and decide on new applicant admissions before granting portal access.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="warning" className="text-xs py-1 px-3">
              {pendingStudents?.length || 0} Pending Applications
            </Badge>
          </div>
        </div>

        {/* Approvals Table Card */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Student Name</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">Campus Branch</th>
                  <th className="py-3.5 px-4">Target Class</th>
                  <th className="py-3.5 px-4">Registration Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="p-4">
                        <Skeleton className="h-8 w-full" />
                      </td>
                    </tr>
                  ))
                ) : pendingStudents?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-semibold text-slate-800">All Caught Up!</p>
                        <p className="text-xs text-slate-500">
                          There are currently no student registrations awaiting approval.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pendingStudents?.map((student: any) => (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                        {student.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                        {student.email}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {student.studentProfile?.branch?.branchName || 'Primary Campus'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-blue-600">
                          {student.studentProfile?.admissionClass || 'Class 8'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {formatDateTime(student.createdAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          PENDING
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900 gap-1"
                            onClick={() => handleOpenDetails(student)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Details</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 px-2.5 text-xs gap-1"
                            onClick={() => handleOpenReject(student)}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Reject</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="success"
                            className="h-8 px-2.5 text-xs gap-1"
                            onClick={() => handleOpenApproveConfirm(student)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Approve</span>
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
      </div>

      {/* View Details Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Student Registration Details"
        description="Comprehensive application review"
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" onClick={() => setDetailsModalOpen(false)}>
              Close
            </Button>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  setDetailsModalOpen(false);
                  handleOpenReject(selectedStudent);
                }}
              >
                Reject
              </Button>
              <Button
                variant="success"
                onClick={() => {
                  setDetailsModalOpen(false);
                  handleOpenApproveConfirm(selectedStudent);
                }}
              >
                Approve Student
              </Button>
            </div>
          </div>
        }
      >
        {selectedStudent && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block text-xs">Full Name</span>
                <span className="font-semibold text-slate-900 text-base">{selectedStudent.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Application Status</span>
                <span className="font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-xs">
                  {selectedStudent.status}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Email Address</span>
                <span className="font-mono text-slate-800">{selectedStudent.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Phone Number</span>
                <span className="text-slate-800">{selectedStudent.phone || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Target Admission Class</span>
                <span className="font-semibold text-blue-600">
                  {selectedStudent.studentProfile?.admissionClass || 'Class 8'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Registration Date</span>
                <span className="text-slate-800">{formatDateTime(selectedStudent.createdAt)}</span>
              </div>
            </div>

            {selectedStudent.additionalInfo && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Applicant's Background Statement
                </span>
                <p className="text-slate-700 leading-relaxed text-xs">
                  {selectedStudent.additionalInfo}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirmation Dialog: Approve Student */}
      <Modal
        isOpen={approveConfirmModalOpen}
        onClose={() => setApproveConfirmModalOpen(false)}
        title="Confirm Student Admission Approval"
        description="Grant portal access to this student"
        footer={
          <>
            <Button variant="secondary" onClick={() => setApproveConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleConfirmApprove}
              isLoading={approveMutation.isPending}
            >
              Confirm & Approve
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            Are you sure you want to approve{' '}
            <strong className="text-slate-900">{selectedStudent?.name}</strong> (
            <span className="font-mono">{selectedStudent?.email}</span>)?
          </p>
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900 space-y-1">
            <p className="font-semibold">Upon approval:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Student account status changes to <span className="font-semibold">APPROVED</span>.</li>
              <li>Student becomes immediately eligible to sign in using their credentials.</li>
              <li>Approval timestamp and your administrator ID will be recorded.</li>
              <li>You can subsequently allocate this student to an active class batch.</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Rejection Dialog with Mandatory Reason */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Student Application"
        description="Provide a formal reason for this rejection"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              isLoading={rejectMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs">
            <span className="text-slate-500">Applicant: </span>
            <span className="font-semibold text-slate-900">{selectedStudent?.name}</span> (
            <span className="font-mono text-slate-600">{selectedStudent?.email}</span>)
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="State clear reasons (e.g. Documentation incomplete, academic prerequisite mismatch, or capacity limits)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-[11px] text-rose-800">
            Note: The student will be blocked from logging into the portal, and this reason will be displayed if they attempt to sign in.
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
