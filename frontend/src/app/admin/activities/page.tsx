'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Shield, Calendar, User, Clock } from 'lucide-react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/utils';
import api from '@/lib/api';

export default function AdminActivitiesPage() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin-activity-logs'],
    queryFn: async () => {
      const res: any = await api.get('/admin/activity-logs?limit=50');
      return Array.isArray(res) ? res : [];
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Administrative Audit & Activity Trail
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Immutable tracking log of admissions approvals, rejections, class allocations, and status updates.
          </p>
        </div>

        <Card>
          <CardContent className="p-0 divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4">
                  <Skeleton className="h-6 w-full" />
                </div>
              ))
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No administrative actions logged yet.
              </div>
            ) : (
              logs.map((log: any) => (
                <div key={log.id} className="p-4 sm:p-5 flex items-start gap-3 hover:bg-slate-50/50 transition-colors">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs sm:text-sm text-slate-900">
                        {log.details || log.action}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {log.action}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>By {log.admin?.name || 'Administrator'} ({log.admin?.email})</span>
                      <span>•</span>
                      <span>{formatDateTime(log.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
