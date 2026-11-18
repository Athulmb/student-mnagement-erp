'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Megaphone } from 'lucide-react';
import { StudentLayout } from '@/components/student/student-layout';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/utils';
import api from '@/lib/api';

export default function StudentAnnouncementsPage() {
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['student-announcements'],
    queryFn: async () => {
      const res: any = await api.get('/announcements');
      return Array.isArray(res) ? res : [];
    },
  });

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Academy Announcements
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Official announcements, schedule updates, guest sessions, and placement drives.
          </p>
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
              <p className="font-semibold text-slate-700">No Announcements at Present</p>
              <p className="text-xs">Check back regularly for updates from academy administration.</p>
            </Card>
          ) : (
            announcements.map((item: any) => (
              <Card key={item.id} className="p-6 hover:shadow-sm transition-shadow">
                <div className="space-y-1 border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-500">
                    Posted by {item.author?.name || 'Administrator'} • {formatDateTime(item.createdAt)}
                  </p>
                </div>
                <p className="mt-4 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {item.content}
                </p>
              </Card>
            ))
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
