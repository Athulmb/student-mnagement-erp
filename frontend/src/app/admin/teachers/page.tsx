'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  PlusCircle,
  Building2,
  DollarSign,
  GraduationCap,
  BookOpen,
  GitBranch,
  Phone,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

export default function AdminTeachersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { selectedBranchId, authorizedBranches } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignBranchModalOpen, setAssignBranchModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  // Create Teacher Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'Teacher@123',
    branchId: '',
    designation: 'Senior Faculty',
    basicSalary: 25000,
    houseAllowance: 4000,
    otherAllowance: 2000,
  });

  // Assign to Additional Branch Form State
  const [assignForm, setAssignForm] = useState({
    branchId: '',
    designation: 'Visiting Faculty',
    basicSalary: 20000,
    houseAllowance: 2000,
    otherAllowance: 1000,
  });

  // Fetch teachers with current branch filter
  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['admin-teachers', selectedBranchId, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedBranchId) params.append('branchId', selectedBranchId);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res: any = await api.get(`/admin/teachers?${params.toString()}`);
      return Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    },
  });

  // Create Teacher Mutation
  const createTeacherMutation = useMutation({
    mutationFn: async (data: typeof createForm) => {
      return api.post('/admin/teachers', data);
    },
    onSuccess: () => {
      toast.success('Teacher created with primary branch assignment!');
      setCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create teacher');
    },
  });

  // Assign to Additional Branch Mutation
  const assignBranchMutation = useMutation({
    mutationFn: async ({ teacherId, data }: { teacherId: string; data: typeof assignForm }) => {
      return api.post(`/admin/teachers/${teacherId}/assign-branch`, data);
    },
    onSuccess: () => {
      toast.success('Teacher successfully assigned to additional branch campus!');
      setAssignBranchModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to assign branch');
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Teacher Faculty & Multi-Branch Allocations
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage academic educators, cross-branch assignments, subject mappings, and branch-specific salary structures.
            </p>
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create New Teacher</span>
          </Button>
        </div>

        {/* Search Bar */}
        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search teachers by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            {selectedBranchId !== 'all' && (
              <Badge variant="outline" className="text-xs text-blue-700 border-blue-200 bg-blue-50">
                Filtered by selected branch
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Teachers Directory Table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-6">Teacher Name</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Campus Assignments (Multi-Branch)</th>
                  <th className="py-3.5 px-4">Assigned Classes & Subjects</th>
                  <th className="py-3.5 px-4">Branch Salary Structure</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map((teacher: any) => {
                  const assignments = teacher.employeeBranchAssignments || [];

                  return (
                    <tr key={teacher.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6">
                        <span className="font-bold text-slate-900 block">{teacher.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{teacher.id.substring(0, 8)}...</span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <span className="block font-medium">{teacher.email}</span>
                        <span>{teacher.phone || '—'}</span>
                      </td>

                      {/* Multi-Branch Badge List */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {assignments.map((a: any) => (
                            <div
                              key={a.id}
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] mr-1.5 mb-1 ${
                                a.isPrimary
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                                  : 'bg-purple-50 text-purple-700 border border-purple-200'
                              }`}
                            >
                              <Building2 className="h-3 w-3" />
                              <span>{a.branch?.branchName}</span>
                              {a.isPrimary && (
                                <span className="text-[9px] bg-blue-200/80 text-blue-800 px-1 rounded uppercase font-bold">
                                  Primary
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Class & Subject Mappings */}
                      <td className="py-3.5 px-4">
                        {assignments.flatMap((a: any) => a.teacherAssignments || []).length > 0 ? (
                          <div className="space-y-1">
                            {assignments.flatMap((a: any) => a.teacherAssignments || []).map((ta: any) => (
                              <span
                                key={ta.id}
                                className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-800 rounded px-2 py-0.5 mr-1"
                              >
                                <BookOpen className="h-3 w-3 text-slate-500" />
                                {ta.subject?.name} - {ta.class?.name}{ta.class?.section}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Awaiting Class Assignment</span>
                        )}
                      </td>

                      {/* Salary per Branch */}
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                        {assignments.map((a: any) => (
                          <div key={a.id} className="text-[11px]">
                            <span className="text-slate-400 font-mono">{a.branch?.branchCode}: </span>
                            <span className="font-semibold text-slate-900">
                              ₹{(Number(a.basicSalary) + Number(a.houseAllowance || 0) + Number(a.otherAllowance || 0)).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-purple-700 bg-purple-50/60 hover:bg-purple-100 border-purple-200 gap-1"
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setAssignBranchFormDefault();
                            setAssignBranchModalOpen(true);
                          }}
                        >
                          <GitBranch className="h-3 w-3" />
                          <span>Assign Branch</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Create Teacher Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Teacher Faculty"
        description="Enroll a teacher with primary campus allocation"
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!createForm.name.trim() || !createForm.email.trim() || !createForm.branchId}
              isLoading={createTeacherMutation.isPending}
              onClick={() => createTeacherMutation.mutate(createForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Enroll Teacher
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Full Name *</label>
              <Input
                placeholder="e.g. Anjali K"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Email Address *</label>
              <Input
                type="email"
                placeholder="teacher@schoolerp.com"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Phone</label>
              <Input
                placeholder="+91 98950 12345"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Primary Branch Campus *</label>
              <select
                value={createForm.branchId}
                onChange={(e) => setCreateForm({ ...createForm, branchId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white"
              >
                <option value="">Select Primary Branch...</option>
                {authorizedBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branchName} ({b.branchCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Basic Salary (₹)</label>
              <Input
                type="number"
                value={createForm.basicSalary}
                onChange={(e) => setCreateForm({ ...createForm, basicSalary: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">House Allowance (₹)</label>
              <Input
                type="number"
                value={createForm.houseAllowance}
                onChange={(e) => setCreateForm({ ...createForm, houseAllowance: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Other Allowances (₹)</label>
              <Input
                type="number"
                value={createForm.otherAllowance}
                onChange={(e) => setCreateForm({ ...createForm, otherAllowance: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Assign to Additional Branch Modal */}
      <Modal
        isOpen={assignBranchModalOpen}
        onClose={() => setAssignBranchModalOpen(false)}
        title={selectedTeacher ? `Assign ${selectedTeacher.name} to Additional Branch` : 'Branch Assignment'}
        description="Enable multi-campus teaching assignments without duplicate accounts"
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssignBranchModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!assignForm.branchId}
              isLoading={assignBranchMutation.isPending}
              onClick={() => {
                if (selectedTeacher) {
                  assignBranchMutation.mutate({
                    teacherId: selectedTeacher.id,
                    data: assignForm,
                  });
                }
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Confirm Branch Assignment
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Select Additional Campus Branch *
            </label>
            <select
              value={assignForm.branchId}
              onChange={(e) => setAssignForm({ ...assignForm, branchId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white"
            >
              <option value="">Choose Campus...</option>
              {authorizedBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branchName} ({b.branchCode})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Designation in this Branch</label>
            <Input
              value={assignForm.designation}
              onChange={(e) => setAssignForm({ ...assignForm, designation: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="text-[10px] text-slate-500 block">Basic (₹)</label>
              <Input
                type="number"
                value={assignForm.basicSalary}
                onChange={(e) => setAssignForm({ ...assignForm, basicSalary: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block">HRA (₹)</label>
              <Input
                type="number"
                value={assignForm.houseAllowance}
                onChange={(e) => setAssignForm({ ...assignForm, houseAllowance: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block">Other (₹)</label>
              <Input
                type="number"
                value={assignForm.otherAllowance}
                onChange={(e) => setAssignForm({ ...assignForm, otherAllowance: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );

  function setAssignBranchFormDefault() {
    setAssignForm({
      branchId: '',
      designation: 'Visiting Senior Faculty',
      basicSalary: 22000,
      houseAllowance: 3000,
      otherAllowance: 2000,
    });
  }
}
