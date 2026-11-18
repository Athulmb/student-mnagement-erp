'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Plus,
  Trash2,
  Calendar,
  Users,
  Eye,
  Megaphone,
  Building2,
  Pin,
  AlertTriangle,
  Info,
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
import { formatDateTime } from '@/lib/utils';
import api from '@/lib/api';

export default function AdminAnnouncementsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { selectedBranchId, authorizedBranches } = useAuth();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    targetAudience: 'ALL_ORGANIZATION',
    branchId: '',
    priority: 'NORMAL',
    isPinned: false,
  });

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['admin-announcements', selectedBranchId],
    queryFn: async () => {
      const url = selectedBranchId && selectedBranchId !== 'all'
        ? `/announcements?branchId=${selectedBranchId}`
        : '/announcements';
      const res: any = await api.get(url);
      return Array.isArray(res) ? res : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/announcements', data);
    },
    onSuccess: () => {
      toast.success('Announcement broadcasted successfully!');
      setCreateModalOpen(false);
      setForm({
        title: '',
        content: '',
        targetAudience: 'ALL_ORGANIZATION',
        branchId: '',
        priority: 'NORMAL',
        isPinned: false,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to post announcement');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/announcements/${id}`);
    },
    onSuccess: () => {
      toast.success('Announcement removed');
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete announcement');
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Institutional Notice Board
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Publish organization-wide bulletins or broadcast notices targeted to specific branch campuses.
            </p>
          </div>
          <Button
            onClick={() => {
              setForm({
                title: '',
                content: '',
                targetAudience: selectedBranchId && selectedBranchId !== 'all' ? 'SELECTED_BRANCH' : 'ALL_ORGANIZATION',
                branchId: selectedBranchId && selectedBranchId !== 'all' ? selectedBranchId : '',
                priority: 'NORMAL',
                isPinned: false,
              });
              setCreateModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-md shadow-blue-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>New Announcement</span>
          </Button>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-16 w-full" />
              </Card>
            ))
          ) : announcements.length === 0 ? (
            <Card className="p-12 text-center text-slate-500">
              <Megaphone className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No Announcements Active</p>
              <p className="text-xs">Post an announcement to notify students, teachers, or administrators.</p>
            </Card>
          ) : (
            announcements.map((item: any) => (
              <Card
                key={item.id}
                className={`p-6 hover:shadow-sm transition-shadow border ${
                  item.isPinned ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.isPinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          <Pin className="h-3 w-3" /> Pinned Notice
                        </span>
                      )}
                      <span className="text-base font-bold text-slate-900">{item.title}</span>
                      {item.priority === 'URGENT' && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Urgent
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1 font-medium text-slate-700">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>{item.branch ? `${item.branch.branchName} Campus` : 'All Campuses (Consolidated)'}</span>
                      </div>
                      <span>•</span>
                      <span>Target: <span className="font-semibold text-slate-700">{item.targetAudience?.replace('_', ' ')}</span></span>
                      <span>•</span>
                      <span>By {item.author?.name || 'Administrator'}</span>
                      <span>•</span>
                      <span>{formatDateTime(item.createdAt)}</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50"
                    onClick={() => {
                      if (confirm(`Delete notice "${item.title}"?`)) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <p className="mt-4 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {item.content}
                </p>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create Announcement Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Broadcast Announcement"
        description="Publish institutional notices across student, teacher, and administrative dashboards"
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!form.title || !form.content) {
                  toast.error('Please enter a title and announcement content');
                  return;
                }
                createMutation.mutate(form);
              }}
              isLoading={createMutation.isPending}
            >
              Publish Announcement
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Announcement Title *"
            placeholder="e.g. Schedule Revision for Upcoming Annual Day"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Target Audience
              </label>
              <select
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-medium focus:border-blue-600 focus:outline-none"
              >
                <option value="ALL_ORGANIZATION">All Organization Users</option>
                <option value="SELECTED_BRANCH">Specific Branch Campus</option>
                <option value="TEACHERS_ONLY">Teachers & Faculty Only</option>
                <option value="STUDENTS_ONLY">Students Only</option>
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Branch Campus Target
              </label>
              <select
                value={form.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-medium focus:border-blue-600 focus:outline-none"
              >
                <option value="">All Branches (Organization-Wide)</option>
                {authorizedBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branchName} ({b.branchCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Priority Level
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-medium focus:border-blue-600 focus:outline-none"
              >
                <option value="NORMAL">Normal Information</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent Action Required</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="pinNotice"
                checked={form.isPinned}
                onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="pinNotice" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Pin to top of dashboards
              </label>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Notice Content *
            </label>
            <textarea
              rows={4}
              placeholder="Write the full message details..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-3 text-xs focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
