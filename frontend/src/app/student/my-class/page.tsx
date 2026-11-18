'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  School,
  Clock,
  Calendar,
  User,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { StudentLayout } from '@/components/student/student-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';

export default function StudentMyClassPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-my-class'],
    queryFn: async () => {
      const res: any = await api.get('/student/my-class');
      return res;
    },
  });

  const isAssigned = data?.assigned;
  const cls = data?.class;
  const enrolledCourse = data?.enrolledCourse;
  const pendingMessage = data?.message || 'Your registration has been approved. Your class will be assigned by the admin shortly.';

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            My Assigned Class Batch
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            View cohort details, instructors, class schedules, and graduation milestones.
          </p>
        </div>

        {isLoading ? (
          <Card className="p-8 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </Card>
        ) : !isAssigned || !cls ? (
          <Card className="p-8 sm:p-12 text-center bg-white border border-slate-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4 border border-amber-200/60">
              <Clock className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Class Batch Assignment in Progress
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              {pendingMessage}
            </p>

            {data?.branch && (
              <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 max-w-md mx-auto text-left space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Enrolled Campus Branch
                </span>
                <p className="font-semibold text-slate-900 text-sm">{data.branch.branchName}</p>
                <p className="text-xs text-slate-500">Campus Code: {data.branch.branchCode}</p>
              </div>
            )}

            <div className="mt-8 flex justify-center gap-3">
              <Link href="/student/my-course">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  <span>View Course Curriculum</span>
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="overflow-hidden border border-slate-200/80">
              <div className="bg-gradient-to-r from-slate-900 to-blue-900 p-6 sm:p-8 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                      Active Class Batch
                    </span>
                    <h3 className="text-2xl font-bold tracking-tight text-white">{cls.name}</h3>
                    <p className="text-xs text-blue-100">{cls.courseDetails?.name}</p>
                  </div>
                  <Badge variant="success" className="text-xs uppercase self-start sm:self-center px-3 py-1">
                    {cls.status}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6 sm:p-8 space-y-6">
                {cls.description && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Batch Description
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {cls.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 flex items-center gap-1.5 text-xs">
                      <User className="h-4 w-4 text-blue-600" />
                      Lead Instructor
                    </span>
                    <p className="font-bold text-slate-900 text-sm">
                      {cls.instructor || 'Academy Faculty'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 flex items-center gap-1.5 text-xs">
                      <Clock className="h-4 w-4 text-amber-600" />
                      Class Schedule
                    </span>
                    <p className="font-bold text-slate-900 text-sm">
                      {cls.schedule || 'Scheduled via LMS'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 flex items-center gap-1.5 text-xs">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      Batch Commencement
                    </span>
                    <p className="font-bold text-slate-900 text-sm">{formatDate(cls.startDate)}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 flex items-center gap-1.5 text-xs">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                      Target Graduation
                    </span>
                    <p className="font-bold text-slate-900 text-sm">{formatDate(cls.endDate)}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                  <span>Enrolled on {formatDate(cls.assignedAt)}</span>
                  <div className="flex gap-2">
                    <Link href="/student/schedule">
                      <Button variant="outline" size="sm" className="text-xs">
                        View Timetable
                      </Button>
                    </Link>
                    <Link href="/student/materials">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                        Study Materials
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
