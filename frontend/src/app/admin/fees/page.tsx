'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt,
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
  Search,
  Filter,
  DollarSign,
  Download,
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

export default function AdminFeesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { selectedBranchId, authorizedBranches } = useAuth();

  const [activeTab, setActiveTab] = useState<'collections' | 'categories'>('collections');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [lastPaymentReceipt, setLastPaymentReceipt] = useState<any>(null);

  // Form states
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    transactionRef: '',
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    code: '',
    amount: '',
  });

  // Fetch Student Fees
  const { data: studentFees = [], isLoading: isLoadingFees } = useQuery({
    queryKey: ['admin-student-fees', selectedBranchId, statusFilter],
    queryFn: async () => {
      let url = '/fees/students';
      const params = new URLSearchParams();
      if (selectedBranchId && selectedBranchId !== 'all') {
        params.append('branchId', selectedBranchId);
      }
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      const res: any = await api.get(url);
      return Array.isArray(res) ? res : [];
    },
  });

  // Fetch Fee Categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['admin-fee-categories'],
    queryFn: async () => {
      const res: any = await api.get('/fees/categories');
      return Array.isArray(res) ? res : [];
    },
  });

  // Pay Fee Mutation
  const payMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/fees/pay', payload);
    },
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Payment successfully recorded!');
      setPaymentModalOpen(false);
      setLastPaymentReceipt(res?.payment);
      setReceiptModalOpen(true);
      queryClient.invalidateQueries({ queryKey: ['admin-student-fees'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to record fee payment');
    },
  });

  // Create Category Mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/fees/categories', payload);
    },
    onSuccess: () => {
      toast.success('Fee category created successfully!');
      setCategoryModalOpen(false);
      setCategoryForm({ name: '', code: '', amount: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-fee-categories'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create fee category');
    },
  });

  // Filtered student fees by search term
  const filteredFees = studentFees.filter((item: any) => {
    const studentName = item.student?.user?.name?.toLowerCase() || '';
    const admNo = item.student?.admissionNumber?.toLowerCase() || '';
    const categoryName = item.category?.name?.toLowerCase() || '';
    const query = searchTerm.toLowerCase();
    return studentName.includes(query) || admNo.includes(query) || categoryName.includes(query);
  });

  // Statistics
  const totalAssessed = studentFees.reduce((acc: number, f: any) => acc + (f.amountDue || 0), 0);
  const totalCollected = studentFees.reduce((acc: number, f: any) => acc + (f.amountPaid || 0), 0);
  const totalOutstanding = totalAssessed - totalCollected;

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
              Fee Collections & Invoicing
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Campus tuition dues, fee structure categories, instant receipt issuance, and payment ledger.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setCategoryModalOpen(true)}
              className="text-xs gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>New Category</span>
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Assessed</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalAssessed)}</p>
                <p className="text-[11px] text-blue-600 font-medium mt-0.5">Across student invoices</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Collected</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalCollected)}</p>
                <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                  {totalAssessed > 0 ? Math.round((totalCollected / totalAssessed) * 100) : 0}% recovery rate
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-l-4 border-l-rose-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Dues</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalOutstanding)}</p>
                <p className="text-[11px] text-rose-600 font-medium mt-0.5">Pending collection</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee Categories</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{categories.length}</p>
                <p className="text-[11px] text-purple-600 font-medium mt-0.5">Tuition, lab, sports, etc.</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Receipt className="h-6 w-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* View Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('collections')}
            className={`py-3 px-6 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'collections'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Student Invoices & Dues</span>
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {filteredFees.length}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-3 px-6 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'categories'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Fee Structures ({categories.length})</span>
          </button>
        </div>

        {/* Collections Tab */}
        {activeTab === 'collections' && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student or admission no..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-600 shrink-0">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 py-1.5 px-3 text-xs focus:outline-none focus:border-blue-600 bg-white"
                >
                  <option value="ALL">All Payment Statuses</option>
                  <option value="PAID">Fully Paid</option>
                  <option value="PARTIAL">Partially Paid</option>
                  <option value="PENDING">Pending Payment</option>
                </select>
              </div>
            </div>

            {/* Invoices Table */}
            <Card>
              <CardContent className="p-0">
                {isLoadingFees ? (
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : filteredFees.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-semibold text-slate-700">No Student Fee Dues Found</p>
                    <p className="text-xs mt-1">There are no fee records matching the selected campus and status filter.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          <th className="py-3 px-5">Student & Admission</th>
                          <th className="py-3 px-5">Branch Campus</th>
                          <th className="py-3 px-5">Fee Category</th>
                          <th className="py-3 px-5">Total Amount</th>
                          <th className="py-3 px-5">Paid</th>
                          <th className="py-3 px-5">Remaining Due</th>
                          <th className="py-3 px-5">Status</th>
                          <th className="py-3 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredFees.map((fee: any) => {
                          const remaining = (fee.amountDue || 0) - (fee.amountPaid || 0);
                          return (
                            <tr key={fee.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3.5 px-5">
                                <p className="font-bold text-slate-900">{fee.student?.user?.name}</p>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                                  <span>{fee.student?.admissionNumber}</span>
                                  {fee.student?.assignedClass && (
                                    <>
                                      <span>•</span>
                                      <span className="font-sans font-medium text-slate-600">
                                        {fee.student?.assignedClass?.name} ({fee.student?.assignedClass?.section})
                                      </span>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-5">
                                <div className="flex items-center gap-1 font-medium text-slate-800">
                                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                  <span>{fee.student?.branch?.branchName || 'Primary Campus'}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-5 font-semibold text-slate-700">
                                {fee.category?.name || 'General Tuition'}
                              </td>
                              <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                                {formatCurrency(fee.amountDue)}
                              </td>
                              <td className="py-3.5 px-5 font-mono text-emerald-600 font-semibold">
                                {formatCurrency(fee.amountPaid)}
                              </td>
                              <td className="py-3.5 px-5 font-mono font-bold text-rose-600">
                                {formatCurrency(remaining)}
                              </td>
                              <td className="py-3.5 px-5">
                                {fee.status === 'PAID' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <CheckCircle2 className="h-3 w-3" /> PAID
                                  </span>
                                ) : fee.status === 'PARTIAL' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                    <Clock className="h-3 w-3" /> PARTIAL
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    <AlertCircle className="h-3 w-3" /> PENDING
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-5 text-right space-x-2">
                                {fee.status !== 'PAID' && (
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs px-2.5 bg-blue-600 hover:bg-blue-700 text-white gap-1 shadow-sm"
                                    onClick={() => {
                                      setSelectedFee(fee);
                                      setPaymentForm({
                                        amount: remaining.toString(),
                                        paymentMethod: 'CASH',
                                        transactionRef: '',
                                      });
                                      setPaymentModalOpen(true);
                                    }}
                                  >
                                    <CreditCard className="h-3.5 w-3.5" />
                                    <span>Collect Fee</span>
                                  </Button>
                                )}
                                {fee.payments?.length > 0 && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-7 text-xs px-2.5 gap-1"
                                    onClick={() => {
                                      setSelectedFee(fee);
                                      setLastPaymentReceipt(fee.payments[fee.payments.length - 1]);
                                      setReceiptModalOpen(true);
                                    }}
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    <span>Receipt</span>
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat: any) => (
              <Card key={cat.id} className="p-5 hover:shadow-sm transition-shadow border border-slate-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">{cat.name}</h3>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">Code: {cat.code || 'N/A'}</p>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono font-bold">
                    {formatCurrency(cat.amount)}
                  </Badge>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Organization Standard</span>
                  <span className="text-emerald-600 font-medium">Active</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Collect Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Record Student Fee Payment"
        description={`Student: ${selectedFee?.student?.user?.name} (${selectedFee?.student?.admissionNumber})`}
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={payMutation.isPending}
              onClick={() => {
                if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
                  toast.error('Please enter a valid payment amount');
                  return;
                }
                payMutation.mutate({
                  studentFeeId: selectedFee.id,
                  amount: Number(paymentForm.amount),
                  paymentMethod: paymentForm.paymentMethod,
                  transactionRef: paymentForm.transactionRef,
                });
              }}
            >
              Confirm & Issue Receipt
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Fee Category:</span>
              <span className="font-bold text-slate-900">{selectedFee?.category?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Remaining Balance:</span>
              <span className="font-mono font-bold text-rose-600">
                {formatCurrency((selectedFee?.amountDue || 0) - (selectedFee?.amountPaid || 0))}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Payment Amount (₹) *
            </label>
            <Input
              type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Payment Mode *
            </label>
            <select
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-medium focus:border-blue-600 focus:outline-none"
            >
              <option value="CASH">Cash Deposit</option>
              <option value="UPI">UPI / Online Gateway</option>
              <option value="BANK_TRANSFER">Direct Bank Transfer (NEFT/IMPS)</option>
              <option value="CHEQUE">Bank Cheque</option>
            </select>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Transaction / Cheque Reference (Optional)
            </label>
            <Input
              placeholder="e.g. UPI-78234891 or Cheque #0045"
              value={paymentForm.transactionRef}
              onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Payment Receipt Modal */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Official Fee Payment Receipt"
        description="Generated and logged on the institutional ledger"
        maxWidth="md"
        footer={
          <Button variant="secondary" onClick={() => setReceiptModalOpen(false)}>
            Close Receipt
          </Button>
        }
      >
        {lastPaymentReceipt && (
          <div className="space-y-4 text-xs p-2">
            <div className="text-center border-b border-slate-200 pb-3">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-2">
                Payment Received
              </span>
              <h2 className="text-base font-black text-slate-900 uppercase">
                {selectedFee?.student?.branch?.branchName || 'School Organization'}
              </h2>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Receipt #{lastPaymentReceipt.receiptNumber}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Student Name</p>
                <p className="font-bold text-slate-900">{selectedFee?.student?.user?.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Admission ID</p>
                <p className="font-mono text-slate-900">{selectedFee?.student?.admissionNumber}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Payment Mode</p>
                <p className="font-medium text-slate-800">{lastPaymentReceipt.paymentMethod}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Date</p>
                <p className="text-slate-800">{formatDate(lastPaymentReceipt.createdAt || new Date())}</p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-700">Amount Paid</p>
                <p className="text-2xl font-black text-emerald-900">{formatCurrency(lastPaymentReceipt.amount)}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>

            <p className="text-[10px] text-center text-slate-400 italic">
              This is a computer-generated receipt authenticated by the School ERP system.
            </p>
          </div>
        )}
      </Modal>

      {/* Create Category Modal */}
      <Modal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Add Fee Structure Category"
        description="Define standard tuition, laboratory, sports, or admission fee amounts."
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={createCategoryMutation.isPending}
              onClick={() => {
                if (!categoryForm.name || !categoryForm.amount) {
                  toast.error('Please fill all required fields');
                  return;
                }
                createCategoryMutation.mutate({
                  name: categoryForm.name,
                  code: categoryForm.code,
                  amount: Number(categoryForm.amount),
                });
              }}
            >
              Save Fee Category
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Category Name *"
            placeholder="e.g. Annual Tuition Fee"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
          />
          <Input
            label="Fee Code"
            placeholder="e.g. TUITION-2026"
            value={categoryForm.code}
            onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
          />
          <Input
            label="Standard Amount (₹) *"
            type="number"
            placeholder="e.g. 15000"
            value={categoryForm.amount}
            onChange={(e) => setCategoryForm({ ...categoryForm, amount: e.target.value })}
          />
        </div>
      </Modal>
    </AdminLayout>
  );
}
