'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, School, User, MapPin, BookOpen } from 'lucide-react';
import { StudentLayout } from '@/components/student/student-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';

export default function StudentSchedulePage() {
  const { data: timetable = [], isLoading } = useQuery({
    queryKey: ['student-schedule'],
    queryFn: async () => {
      const res: any = await api.get('/student/schedule');
      return Array.isArray(res) ? res : [];
    },
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Class Timetable & Schedule
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Weekly subject schedule, class periods, and faculty assignments.
          </p>
        </div>

        {isLoading ? (
          <Card className="p-8 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </Card>
        ) : timetable.length === 0 ? (
          <Card className="p-12 text-center text-slate-500">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-800 text-sm">Schedule Pending Assignment</p>
            <p className="text-xs">Your timetable periods will be displayed here once scheduled by the branch administrator.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader className="py-4 px-6 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900">Weekly Class Timetable</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
                        <th className="py-3 px-5">Day</th>
                        <th className="py-3 px-5">Period</th>
                        <th className="py-3 px-5">Subject</th>
                        <th className="py-3 px-5">Faculty</th>
                        <th className="py-3 px-5">Timing</th>
                        <th className="py-3 px-5">Room</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {timetable.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-5 font-bold text-slate-800">{p.dayOfWeek}</td>
                          <td className="py-3 px-5 font-semibold text-blue-600">Period {p.periodNumber}</td>
                          <td className="py-3 px-5 font-bold text-slate-900">{p.subject?.name}</td>
                          <td className="py-3 px-5 text-slate-600">{p.teacher?.user?.name || 'Assigned Faculty'}</td>
                          <td className="py-3 px-5 font-mono text-slate-500">{p.startTime} – {p.endTime}</td>
                          <td className="py-3 px-5 font-mono text-slate-400">{p.roomNumber || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
