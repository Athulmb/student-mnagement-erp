'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign,
  Plus,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  Eye,
  Check,
  User,
  ArrowRight,
  TrendingUp,
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
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';

export default function AdminPayrollPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { selectedBranchId, authorizedBranches } = useAuth();

  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
  const [selectedPayslipItem, setSelectedPayslipItem] = useState<any>(null);

  const [formData, setFormData] = useState({
    branchId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch Payrolls
  const { data: payrolls = [], isLoading } = useQuery({
    queryKey: ['admin-payrolls', selectedBranchId],
    queryFn: async () => {
      const url = selectedBranchId && selectedBranchId !== 'all'
        ? `/payroll?branchId=${selectedBranchId}`
        : '/payroll';
      const res: any = await api.get(url);
      return Array.isArray(res) ? res : [];
    },
  });

  // Generate Payroll Mutation
  const generateMutation = useMutation({
    mutationFn: async (payload: { branchId: string; month: number; year: number }) => {
      return api.post('/payroll/generate', payload);
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Monthly payroll generated successfully!');
      setGenerateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-payrolls'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to generate payroll');
    },
  });

  // Mark Paid Mutation
  const markPaidMutation = useMutation({
    mutationFn: async (payrollId: string) => {
      return api.patch(`/payroll/${payrollId}/pay`);
    },
    onSuccess: () => {
      toast.success('Payroll marked as disbursed and paid!');
      queryClient.invalidateQueries({ queryKey: ['admin-payrolls'] });
      if (selectedPayroll) {
        setSelectedPayroll({ ...selectedPayroll, status: 'PAID', paidAt: new Date().toISOString() });
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update disbursement status');
    },
  });

  // Statistics calculation
  const totalNetDisbursed = payrolls
    .filter((p: any) => p.status === 'PAID')
    .reduce((acc: number, p: any) => acc + (p.totalNet || 0), 0);

  const totalPendingNet = payrolls
    .filter((p: any) => p.status !== 'PAID')
    .reduce((acc: number, p: any) => acc + (p.totalNet || 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Multi-Branch Payroll Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Consolidated compensation oversight, branch salary structures, and automated net wage calculation.
            </p>
          </div>
          <Button
            onClick={() => {
              setFormData({
                branchId: selectedBranchId && selectedBranchId !== 'all' ? selectedBranchId : (authorizedBranches[0]?.id || ''),
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
              });
              setGenerateModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-md shadow-blue-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Generate Monthly Payroll</span>
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Disbursed</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalNetDisbursed)}</p>
                <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Paid salary compensation</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Payouts</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalPendingNet)}</p>
                <p className="text-[11px] text-amber-600 font-medium mt-0.5">Approved & awaiting transfer</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payroll Runs</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{payrolls.length}</p>
                <p className="text-[11px] text-blue-600 font-medium mt-0.5">Across authorized branches</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Branch Scope</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {selectedBranchId === 'all' ? 'All Campuses' : (authorizedBranches.find(b => b.id === selectedBranchId)?.branchName || 'Single Campus')}
                </p>
                <p className="text-[11px] text-purple-600 font-medium mt-0.5">Active filter state</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Payroll Runs Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-slate-100">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Payroll Periods & Records</CardTitle>
              <p className="text-xs text-slate-500">
                Formula applied: Net Salary = Basic + Allowances + Bonus - Deductions
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {payrolls.length} Period{payrolls.length === 1 ? '' : 's'}
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : payrolls.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700">No Payroll Cycles Generated</p>
                <p className="text-xs mt-1">Click "Generate Monthly Payroll" to compute wages for assigned branch staff.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      <th className="py-3 px-5">Payroll Period</th>
                      <th className="py-3 px-5">Branch Campus</th>
                      <th className="py-3 px-5">Employees</th>
                      <th className="py-3 px-5">Total Gross</th>
                      <th className="py-3 px-5">Total Net Payable</th>
                      <th className="py-3 px-5">Status</th>
                      <th className="py-3 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {payrolls.map((payroll: any) => (
                      <tr key={payroll.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span>{payroll.periodName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 font-medium text-slate-800">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            <span>{payroll.branch?.branchName || 'Primary Campus'}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {payroll.branch?.branchCode}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-slate-600 font-medium">
                          {payroll.items?.length || 0} Staff
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-slate-700">
                          {formatCurrency(payroll.totalGross)}
                        </td>
                        <td className="py-3.5 px-5 font-black text-slate-900">
                          {formatCurrency(payroll.totalNet)}
                        </td>
                        <td className="py-3.5 px-5">
                          {payroll.status === 'PAID' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" /> PAID
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="h-3 w-3" /> PENDING
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs px-2.5 gap-1"
                            onClick={() => setSelectedPayroll(payroll)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Breakdown</span>
                          </Button>

                          {payroll.status !== 'PAID' && (
                            <Button
                              size="sm"
                              className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-sm"
                              isLoading={markPaidMutation.isPending}
                              onClick={() => {
                                if (confirm(`Disburse ${formatCurrency(payroll.totalNet)} for ${payroll.periodName}?`)) {
                                  markPaidMutation.mutate(payroll.id);
                                }
                              }}
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Disburse</span>
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Generate Payroll Modal */}
      <Modal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        title="Generate Monthly Branch Payroll"
        description="Compute employee earnings, allowances, deductions, and net wage for a selected branch period."
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setGenerateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={generateMutation.isPending}
              onClick={() => {
                if (!formData.branchId) {
                  toast.error('Please select a branch');
                  return;
                }
                generateMutation.mutate({
                  branchId: formData.branchId,
                  month: Number(formData.month),
                  year: Number(formData.year),
                });
              }}
            >
              Generate Payroll Run
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 space-y-1">
            <p className="font-semibold">Calculation Breakdown Rules:</p>
            <p>• Basic Salary is derived from each employee's branch contract structure.</p>
            <p>• Net Salary = Basic + HRA/Allowances + Bonus - Deductions (PF/Tax 5%).</p>
            <p>• Multiple branch assignments for the same teacher generate branch-specific compensation without duplicates.</p>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Campus / Branch *
            </label>
            <select
              value={formData.branchId}
              onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-medium focus:border-blue-600 focus:outline-none"
            >
              <option value="">Select Branch Campus</option>
              {authorizedBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branchName} ({b.branchCode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Month *
              </label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-medium focus:border-blue-600 focus:outline-none"
              >
                {monthNames.map((name, idx) => (
                  <option key={idx} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Year *
              </label>
              <Input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Breakdown / Payslips Modal */}
      <Modal
        isOpen={!!selectedPayroll}
        onClose={() => setSelectedPayroll(null)}
        title={`Payroll Breakdown – ${selectedPayroll?.periodName || ''}`}
        description={`Branch: ${selectedPayroll?.branch?.branchName} (${selectedPayroll?.branch?.branchCode})`}
        maxWidth="2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedPayroll(null)}>
              Close
            </Button>
            {selectedPayroll?.status !== 'PAID' && (
              <Button
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700"
                isLoading={markPaidMutation.isPending}
                onClick={() => {
                  if (confirm(`Disburse entire payroll of ${formatCurrency(selectedPayroll.totalNet)}?`)) {
                    markPaidMutation.mutate(selectedPayroll.id);
                  }
                }}
              >
                Disburse Entire Payroll
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg text-center">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Gross Total</p>
              <p className="text-base font-bold text-slate-900">{formatCurrency(selectedPayroll?.totalGross)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Net Payable</p>
              <p className="text-base font-black text-emerald-600">{formatCurrency(selectedPayroll?.totalNet)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Disbursement Status</p>
              <Badge variant={selectedPayroll?.status === 'PAID' ? 'success' : 'warning'} className="mt-1">
                {selectedPayroll?.status}
              </Badge>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-4">Designation</th>
                  <th className="py-2.5 px-4">Basic</th>
                  <th className="py-2.5 px-4">Allowances</th>
                  <th className="py-2.5 px-4">Deductions</th>
                  <th className="py-2.5 px-4">Net Wage</th>
                  <th className="py-2.5 px-4 text-right">Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedPayroll?.items?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4">
                      <p className="font-bold text-slate-900">{item.assignment?.user?.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{item.assignment?.user?.email}</p>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-medium">
                      {item.assignment?.designation || 'Faculty'}
                    </td>
                    <td className="py-2.5 px-4 font-mono">{formatCurrency(item.basicSalary)}</td>
                    <td className="py-2.5 px-4 font-mono text-emerald-600">+{formatCurrency(item.allowances)}</td>
                    <td className="py-2.5 px-4 font-mono text-rose-600">-{formatCurrency(item.deductions)}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      {formatCurrency(item.netSalary)}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] px-2 text-blue-600 hover:bg-blue-50"
                        onClick={() => setSelectedPayslipItem({ ...item, payroll: selectedPayroll })}
                      >
                        <FileText className="h-3 w-3 mr-1" /> View Slip
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Individual Payslip Modal */}
      <Modal
        isOpen={!!selectedPayslipItem}
        onClose={() => setSelectedPayslipItem(null)}
        title="Employee Payslip"
        description="Official Institution Salary Slip"
        maxWidth="md"
        footer={
          <Button variant="secondary" onClick={() => setSelectedPayslipItem(null)}>
            Close
          </Button>
        }
      >
        {selectedPayslipItem && (
          <div className="space-y-4 text-xs font-sans p-2">
            <div className="border-b border-slate-200 pb-3 text-center">
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                {selectedPayslipItem.payroll?.branch?.branchName}
              </h3>
              <p className="text-[11px] text-slate-500">
                Payslip for Period: {selectedPayslipItem.payroll?.periodName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Employee Name</p>
                <p className="font-bold text-slate-900">{selectedPayslipItem.assignment?.user?.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Designation</p>
                <p className="font-bold text-slate-900">{selectedPayslipItem.assignment?.designation}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Campus Code</p>
                <p className="font-mono text-slate-800">{selectedPayslipItem.payroll?.branch?.branchCode}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Status</p>
                <span className="font-bold text-emerald-600">{selectedPayslipItem.paymentStatus || 'PAID'}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600">
                  <tr>
                    <th className="p-2 border-r border-slate-200">Earnings</th>
                    <th className="p-2 border-r border-slate-200">Amount</th>
                    <th className="p-2 border-r border-slate-200">Deductions</th>
                    <th className="p-2">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2 border-r border-slate-200">Basic Salary</td>
                    <td className="p-2 font-mono border-r border-slate-200">{formatCurrency(selectedPayslipItem.basicSalary)}</td>
                    <td className="p-2 border-r border-slate-200">PF & Tax (5%)</td>
                    <td className="p-2 font-mono text-rose-600">{formatCurrency(selectedPayslipItem.deductions)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-200">Allowances (HRA/DA)</td>
                    <td className="p-2 font-mono text-emerald-600 border-r border-slate-200">+{formatCurrency(selectedPayslipItem.allowances)}</td>
                    <td className="p-2 border-r border-slate-200">Other Deductions</td>
                    <td className="p-2 font-mono">₹0</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-200">Bonus & Incentives</td>
                    <td className="p-2 font-mono text-emerald-600 border-r border-slate-200">+{formatCurrency(selectedPayslipItem.bonus)}</td>
                    <td className="p-2 border-r border-slate-200">-</td>
                    <td className="p-2 font-mono">-</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold border-t border-slate-300">
                    <td className="p-2 border-r border-slate-200">Total Earnings</td>
                    <td className="p-2 font-mono border-r border-slate-200">
                      {formatCurrency(selectedPayslipItem.basicSalary + selectedPayslipItem.allowances + selectedPayslipItem.bonus)}
                    </td>
                    <td className="p-2 border-r border-slate-200">Total Deductions</td>
                    <td className="p-2 font-mono text-rose-600">
                      {formatCurrency(selectedPayslipItem.deductions)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold uppercase text-emerald-700">Net Take-Home Salary</p>
                <p className="text-lg font-black text-emerald-800">{formatCurrency(selectedPayslipItem.netSalary)}</p>
              </div>
              <p className="text-[10px] text-emerald-600 italic">Disbursed electronically to bank account</p>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
