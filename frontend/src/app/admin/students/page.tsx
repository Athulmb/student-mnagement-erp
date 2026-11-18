'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  Search,
  Filter,
  Eye,
  Edit,
  GraduationCap,
  Building2,
  GitBranch,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  History,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth-context';
import { formatDate, formatDateTime, getStatusBadgeVariant } from '@/lib/utils';
import api from '@/lib/api';

function AdminStudentsContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { selectedBranchId, authorizedBranches } = useAuth();

  // Search & Filter State
  const initialStatus = searchParams?.get('status') || '';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [branchFilter, setBranchFilter] = useState(selectedBranchId || 'all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Create Student Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'Student@123',
    branchId: '',
    admissionClass: 'Class 8',
    status: 'APPROVED',
  });

  // Transfer Student Form State
  const [transferForm, setTransferForm] = useState({
    toBranchId: '',
    reason: '',
  });

  // Sync branchFilter with header selectedBranchId
  useEffect(() => {
    if (selectedBranchId) {
      setBranchFilter(selectedBranchId);
      setCurrentPage(1);
    }
  }, [selectedBranchId]);

  // Fetch Students with server-side pagination & filtering
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['admin-students', currentPage, searchTerm, statusFilter, branchFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('limit', '10');
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (statusFilter) params.append('status', statusFilter);
      if (branchFilter && branchFilter !== 'all') params.append('branchId', branchFilter);

      const res: any = await api.get(`/admin/students?${params.toString()}`);
      return res;
    },
  });

  // Create Student Mutation
  const createStudentMutation = useMutation({
    mutationFn: async (data: typeof createForm) => {
      return api.post('/admin/students', data);
    },
    onSuccess: () => {
      toast.success('Student account enrolled successfully!');
      setCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create student account');
    },
  });

  // Student Branch Transfer Mutation
  const transferMutation = useMutation({
    mutationFn: async ({ studentUserId, toBranchId, reason }: { studentUserId: string; toBranchId: string; reason: string }) => {
      return api.post('/admin/students/transfer', { studentUserId, toBranchId, reason });
    },
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Student transferred to new branch campus!');
      setTransferModalOpen(false);
      setTransferForm({ toBranchId: '', reason: '' });
      setSelectedStudent(null);
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Branch transfer failed');
    },
  });

  const studentsList = studentsData?.items || [];
  const totalPages = studentsData?.totalPages || 1;
  const totalRecords = studentsData?.total || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Student Directory & Multi-Campus Admissions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage student registrations, campus allocations, inter-branch transfers, and academic progression.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setCreateForm({
                  name: '',
                  email: '',
                  phone: '',
                  password: 'Student@123',
                  branchId: authorizedBranches[0]?.id || '',
                  admissionClass: 'Class 8',
                  status: 'APPROVED',
                });
                setCreateModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Enroll New Student</span>
            </Button>
            <div className="hidden sm:block text-xs text-slate-500 font-medium border-l border-slate-200 pl-3">
              Total Enrolled: <span className="font-bold text-slate-900">{totalRecords}</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Search */}
              <div className="sm:col-span-6 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search students by name, email, or admission ID..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Status Filter */}
              <div className="sm:col-span-3">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>

              {/* Branch Filter */}
              <div className="sm:col-span-3">
                <select
                  value={branchFilter}
                  onChange={(e) => {
                    setBranchFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  <option value="all">All Branches</option>
                  {authorizedBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.branchName} ({b.branchCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Admission ID</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Campus Branch</th>
                  <th className="py-3.5 px-4">Assigned Class</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Reg. Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8} className="p-4">
                        <Skeleton className="h-8 w-full" />
                      </td>
                    </tr>
                  ))
                ) : studentsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No students found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  studentsList.map((student: any) => {
                    const profile = student.studentProfile;
                    const assignedClass = profile?.assignedClass;
                    const transferHistory = profile?.transferHistory || [];
                    const hasTransferred = transferHistory.length > 0;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 font-mono text-xs text-blue-600 font-bold">
                          {profile?.admissionNumber || student.id.substring(0, 8)}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900 block">{student.name}</span>
                          {hasTransferred && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                              <History className="h-3 w-3" />
                              Transferred from {transferHistory[0].fromBranch?.branchName || 'Previous Branch'}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                            <Building2 className="h-3 w-3 text-blue-600" />
                            {profile?.branch?.branchName || 'Central'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {assignedClass ? (
                            <span className="font-semibold text-slate-800">
                              {assignedClass.name} {assignedClass.section}
                            </span>
                          ) : (
                            <span className="text-amber-600 text-xs">
                              {profile?.admissionClass || 'Awaiting Batch'}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 text-xs">
                          <span className="block">{student.email}</span>
                          <span className="text-slate-400">{student.phone || '—'}</span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          {formatDate(student.createdAt)}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadgeVariant(
                              student.status,
                            )}`}
                          >
                            {student.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-xs"
                              title="View Full Academic Profile"
                              onClick={() => {
                                setSelectedStudent(student);
                                setViewModalOpen(true);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>

                            {/* Inter-Branch Transfer Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200"
                              title="Transfer to Another Campus Branch"
                              onClick={() => {
                                setSelectedStudent(student);
                                setTransferForm({
                                  toBranchId: '',
                                  reason: '',
                                });
                                setTransferModalOpen(true);
                              }}
                            >
                              <GitBranch className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 p-4">
              <span className="text-xs text-slate-500">
                Page {currentPage} of {totalPages} ({totalRecords} records)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-3 text-xs gap-1"
                >
                  <ChevronLeft className="h-3 w-3" />
                  <span>Previous</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-3 text-xs gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Enroll Student Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Enroll New Student"
        description="Add a student account with branch campus allocation"
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!createForm.name.trim() || !createForm.email.trim() || !createForm.branchId}
              isLoading={createStudentMutation.isPending}
              onClick={() => createStudentMutation.mutate(createForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Enroll Student
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Full Name *</label>
              <Input
                placeholder="e.g. Devanand R"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Email Address *</label>
              <Input
                type="email"
                placeholder="student@schoolerp.com"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Phone</label>
              <Input
                placeholder="+91 97450 11223"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Target Campus Branch *</label>
              <select
                value={createForm.branchId}
                onChange={(e) => setCreateForm({ ...createForm, branchId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white"
              >
                <option value="">Select Branch...</option>
                {authorizedBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branchName} ({b.branchCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Admission Class</label>
              <Input
                placeholder="Class 8"
                value={createForm.admissionClass}
                onChange={(e) => setCreateForm({ ...createForm, admissionClass: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Account Status</label>
              <select
                value={createForm.status}
                onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white"
              >
                <option value="APPROVED">APPROVED (Immediate access)</option>
                <option value="PENDING">PENDING (Requires review)</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Student Branch Transfer Modal */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title={selectedStudent ? `Branch Transfer: ${selectedStudent.name}` : 'Student Branch Transfer'}
        description="Preserve previous academic and class history while relocating student to a new campus"
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!transferForm.toBranchId || !transferForm.reason.trim()}
              isLoading={transferMutation.isPending}
              onClick={() => {
                if (selectedStudent) {
                  transferMutation.mutate({
                    studentUserId: selectedStudent.id,
                    toBranchId: transferForm.toBranchId,
                    reason: transferForm.reason,
                  });
                }
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Authorize Campus Transfer
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-slate-500 block text-xs">Current Branch Campus:</span>
            <span className="font-bold text-slate-900 text-sm">
              {selectedStudent?.studentProfile?.branch?.branchName} ({selectedStudent?.studentProfile?.branch?.branchCode})
            </span>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Select Destination Campus Branch *
            </label>
            <select
              value={transferForm.toBranchId}
              onChange={(e) => setTransferForm({ ...transferForm, toBranchId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white"
            >
              <option value="">Choose Destination Campus...</option>
              {authorizedBranches
                .filter((b) => b.id !== selectedStudent?.studentProfile?.branchId)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    📍 {b.branchName} ({b.branchCode})
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Transfer Justification / Reason *
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Parental employment relocation, boarding hostel admission, academic stream change..."
              value={transferForm.reason}
              onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>
      </Modal>

      {/* View Profile Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Student Academic Record"
        description="Comprehensive enrollment and campus assignment profile"
        maxWidth="lg"
        footer={<Button variant="secondary" onClick={() => setViewModalOpen(false)}>Close</Button>}
      >
        {selectedStudent && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block text-xs">Admission ID</span>
                <span className="font-mono font-bold text-blue-600">{selectedStudent.studentProfile?.admissionNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Current Campus Branch</span>
                <span className="font-bold text-slate-900">{selectedStudent.studentProfile?.branch?.branchName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Student Name</span>
                <span className="font-bold text-slate-900">{selectedStudent.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Email</span>
                <span className="font-mono text-slate-800">{selectedStudent.email}</span>
              </div>
            </div>

            {selectedStudent.studentProfile?.transferHistory?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase text-slate-700">Campus Transfer History</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {selectedStudent.studentProfile.transferHistory.map((th: any) => (
                    <div key={th.id} className="p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-slate-900">
                        <span>{th.fromBranch?.branchName} ➔ {th.toBranch?.branchName}</span>
                        <span className="text-slate-400 font-normal">{formatDate(th.transferDate)}</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{th.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}

export default function AdminStudentsPage() {
  return (
    <Suspense
      fallback={
        <AdminLayout>
          <div className="p-8 text-center text-sm text-slate-500">
            Loading student directory...
          </div>
        </AdminLayout>
      }
    >
      <AdminStudentsContent />
    </Suspense>
  );
}
