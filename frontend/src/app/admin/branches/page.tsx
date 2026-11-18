'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  GitBranch,
  PlusCircle,
  Users,
  GraduationCap,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Shield,
  CheckCircle2,
  XCircle,
  BarChart3,
  Calendar,
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

export default function AdminBranchesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [performanceModalOpen, setPerformanceModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);

  // Create Branch Form State
  const [createForm, setCreateForm] = useState({
    branchName: '',
    branchCode: '',
    district: 'Ernakulam',
    state: 'Kerala',
    address: '',
    phone: '',
    email: '',
    adminName: '',
    adminEmail: '',
    adminPassword: 'Admin@123',
  });

  // Fetch all branches
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: async () => {
      const res: any = await api.get('/branches');
      return Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    },
  });

  // Fetch branch comparison metrics
  const { data: comparisonMetrics = [] } = useQuery({
    queryKey: ['admin-branch-comparison'],
    queryFn: async () => {
      const res: any = await api.get('/admin/branch-comparison');
      return Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    },
  });

  // Create Branch Mutation
  const createBranchMutation = useMutation({
    mutationFn: async (data: typeof createForm) => {
      return api.post('/branches', data);
    },
    onSuccess: (res: any) => {
      toast.success('New campus branch added successfully!');
      setCreateModalOpen(false);
      setCreateForm({
        branchName: '',
        branchCode: '',
        district: 'Ernakulam',
        state: 'Kerala',
        address: '',
        phone: '',
        email: '',
        adminName: '',
        adminEmail: '',
        adminPassword: 'Admin@123',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
      queryClient.invalidateQueries({ queryKey: ['admin-branch-comparison'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create branch');
    },
  });

  // Toggle Branch Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return api.patch(`/branches/${id}/status`, { status });
    },
    onSuccess: () => {
      toast.success('Branch status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update branch status');
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Branch Campus Management
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Oversee multi-branch academic infrastructure, campus performance, and regional administrators.
            </p>
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create New Branch</span>
          </Button>
        </div>

        {/* Branch Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {branches.map((b: any) => (
            <Card key={b.id} className="border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>{b.branchName}</span>
                    </h3>
                    <span className="font-mono text-xs text-blue-600 font-bold block mt-0.5">
                      {b.branchCode}
                    </span>
                  </div>
                  <Badge
                    variant={b.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className={b.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : ''}
                  >
                    {b.status}
                  </Badge>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{b.address || `${b.district}, ${b.state}`}</span>
                  </div>
                  {b.branchAdmin && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Admin: {b.branchAdmin.name}</span>
                    </div>
                  )}
                </div>

                {/* Micro Metrics */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Students</span>
                    <span className="text-sm font-bold text-slate-800">
                      {b._count?.studentProfiles || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Employees</span>
                    <span className="text-sm font-bold text-slate-800">
                      {b._count?.employeeBranchAssignments || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Classes</span>
                    <span className="text-sm font-bold text-slate-800">
                      {b._count?.classes || 0}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 px-2.5"
                    onClick={() => {
                      setSelectedBranch(b);
                      setPerformanceModalOpen(true);
                    }}
                  >
                    <BarChart3 className="h-3.5 w-3.5 mr-1 text-blue-600" />
                    <span>View Performance</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 px-2 text-slate-500 hover:text-slate-900"
                    onClick={() =>
                      toggleStatusMutation.mutate({
                        id: b.id,
                        status: b.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                      })
                    }
                  >
                    {b.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Multi-Branch Comparison Table */}
        <Card>
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span>Multi-Branch Comparative Performance Matrix</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-6">Campus Branch</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">Students Enrolled</th>
                  <th className="py-3 px-4">Faculty & Staff</th>
                  <th className="py-3 px-4">Classes</th>
                  <th className="py-3 px-4">Total Fee Collected</th>
                  <th className="py-3 px-4">Monthly Salary Expense</th>
                  <th className="py-3 px-6 text-right">Attendance Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comparisonMetrics.map((m: any) => (
                  <tr key={m.branchId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      {m.branchName}
                      <span className="block font-mono text-[10px] text-blue-600 font-bold">
                        {m.branchCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{m.district || '—'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{m.students}</td>
                    <td className="py-3.5 px-4 text-slate-800">{m.employees}</td>
                    <td className="py-3.5 px-4 text-slate-800">{m.classes}</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700">
                      ₹{Number(m.feeCollected).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      ₹{Number(m.salaryExpense).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                        <CheckCircle2 className="h-3 w-3" />
                        {m.presentAttendanceCount} Present Records
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Create Branch Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Campus Branch"
        description="Expand school organization with a new regional operational center"
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!createForm.branchName.trim() || !createForm.branchCode.trim()}
              isLoading={createBranchMutation.isPending}
              onClick={() => createBranchMutation.mutate(createForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Confirm Branch Provisioning
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (createForm.branchName.trim() && createForm.branchCode.trim()) {
              createBranchMutation.mutate(createForm);
            }
          }}
          className="space-y-4 text-xs sm:text-sm"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Branch Campus Name <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="e.g. Malappuram Tech Campus"
                value={createForm.branchName}
                onChange={(e) => setCreateForm({ ...createForm, branchName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Branch Code <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="e.g. NPAG-MLP"
                value={createForm.branchCode}
                onChange={(e) => setCreateForm({ ...createForm, branchCode: e.target.value.toUpperCase() })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">District</label>
              <Input
                placeholder="Malappuram"
                value={createForm.district}
                onChange={(e) => setCreateForm({ ...createForm, district: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">State</label>
              <Input
                placeholder="Kerala"
                value={createForm.state}
                onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Campus Physical Address</label>
            <Input
              placeholder="Down Hill Techno Valley, Malappuram"
              value={createForm.address}
              onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <p className="font-semibold text-xs text-slate-800">Assign Branch Administrator (Optional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Admin Name"
                value={createForm.adminName}
                onChange={(e) => setCreateForm({ ...createForm, adminName: e.target.value })}
              />
              <Input
                type="email"
                placeholder="admin.malappuram@schoolerp.com"
                value={createForm.adminEmail}
                onChange={(e) => setCreateForm({ ...createForm, adminEmail: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Performance Modal */}
      <Modal
        isOpen={performanceModalOpen}
        onClose={() => setPerformanceModalOpen(false)}
        title={selectedBranch ? `${selectedBranch.branchName} Performance` : 'Branch Performance'}
        description="Campus operational summary and enrollment health"
        maxWidth="md"
        footer={
          <Button variant="secondary" onClick={() => setPerformanceModalOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedBranch && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-bold text-sm text-slate-900 block">{selectedBranch.branchName}</span>
                <span className="font-mono text-blue-600">{selectedBranch.branchCode}</span>
              </div>
              <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                {selectedBranch.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Enrolled Students</span>
                <span className="text-lg font-bold text-slate-900">{selectedBranch._count?.studentProfiles || 0}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Assigned Staff</span>
                <span className="text-lg font-bold text-slate-900">{selectedBranch._count?.employeeBranchAssignments || 0}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Active Classes</span>
                <span className="text-lg font-bold text-slate-900">{selectedBranch._count?.classes || 0}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Academic Year</span>
                <span className="text-sm font-semibold text-slate-800">{selectedBranch.academicYear || '2026-2027'}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
