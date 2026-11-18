'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Users,
  PlusCircle,
  Building2,
  Mail,
  Phone,
  DollarSign,
  Search,
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

export default function AdminStaffPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { selectedBranchId, authorizedBranches } = useAuth();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'Staff@123',
    branchId: '',
    designation: 'Senior Accountant',
    basicSalary: 24000,
    houseAllowance: 4000,
    otherAllowance: 2000,
  });

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['admin-staff', selectedBranchId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedBranchId && selectedBranchId !== 'all') params.append('branchId', selectedBranchId);
      const res: any = await api.get(`/admin/staff?${params.toString()}`);
      return Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    },
  });

  const createStaffMutation = useMutation({
    mutationFn: async (data: typeof createForm) => {
      return api.post('/admin/staff', data);
    },
    onSuccess: () => {
      toast.success('Administrative staff member created!');
      setCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-staff'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create staff');
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Administrative Staff Directory
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage operational staff, departmental coordinators, accountants, and campus logistics.
            </p>
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Staff Account</span>
          </Button>
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-6">Staff Member</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4">Campus Branch</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Monthly Salary</th>
                  <th className="py-3.5 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((s: any) => {
                  const assignment = s.employeeBranchAssignments?.[0];

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        {s.name}
                        <span className="block font-mono text-[11px] text-slate-400 font-normal">
                          {assignment?.employeeId || s.id.substring(0, 8)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-medium">
                        {assignment?.designation || 'Staff'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
                          <Building2 className="h-3 w-3" />
                          {assignment?.branch?.branchName || 'Central'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <span className="block">{s.email}</span>
                        <span>{s.phone || '—'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        ₹{(Number(assignment?.basicSalary || 20000) + Number(assignment?.houseAllowance || 0) + Number(assignment?.otherAllowance || 0)).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-[10px]">
                          ACTIVE
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Create Staff Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Administrative Staff Member"
        description="Provision staff account with campus allocation"
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!createForm.name.trim() || !createForm.email.trim() || !createForm.branchId}
              isLoading={createStaffMutation.isPending}
              onClick={() => createStaffMutation.mutate(createForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Enroll Staff
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Full Name *</label>
            <Input
              placeholder="e.g. Priya Nair"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Email Address *</label>
              <Input
                type="email"
                placeholder="staff@schoolerp.com"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Phone</label>
              <Input
                placeholder="+91 98952 34567"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Designation</label>
              <Input
                placeholder="Senior Accountant"
                value={createForm.designation}
                onChange={(e) => setCreateForm({ ...createForm, designation: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Campus Branch *</label>
              <select
                value={createForm.branchId}
                onChange={(e) => setCreateForm({ ...createForm, branchId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white"
              >
                <option value="">Choose Campus...</option>
                {authorizedBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branchName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="text-[10px] text-slate-500 block">Basic (₹)</label>
              <Input
                type="number"
                value={createForm.basicSalary}
                onChange={(e) => setCreateForm({ ...createForm, basicSalary: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block">HRA (₹)</label>
              <Input
                type="number"
                value={createForm.houseAllowance}
                onChange={(e) => setCreateForm({ ...createForm, houseAllowance: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block">Other (₹)</label>
              <Input
                type="number"
                value={createForm.otherAllowance}
                onChange={(e) => setCreateForm({ ...createForm, otherAllowance: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
