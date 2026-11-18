'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Award, CheckCircle2, Building2, Calendar, FileText } from 'lucide-react';
import { StudentLayout } from '@/components/student/student-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';

export default function StudentMyCoursePage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: async () => {
      const res: any = await api.get('/student/dashboard');
      return res;
    },
  });

  const assignedClass = dashboard?.assignedClass;
  const branch = dashboard?.branch;
  const subjects = assignedClass?.subjects || [];

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Academic Curriculum & Subjects
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Course syllabus, enrolled subjects, pass criteria, and academic grading standards.
          </p>
        </div>

        {isLoading ? (
          <Card className="p-8 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </Card>
        ) : !assignedClass ? (
          <Card className="p-12 text-center text-slate-500">
            <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Curriculum Pending Assignment</p>
            <p className="text-xs mt-1">Your academic subjects will appear here once your class batch is allocated.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="p-6 sm:p-8 bg-white border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">
                    Enrolled Academic Section
                  </span>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {assignedClass.name} (Sec {assignedClass.section})
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>Campus: {branch?.branchName} ({branch?.branchCode})</span>
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-4 py-2 text-xs font-semibold text-blue-800">
                  <Award className="h-4 w-4 text-blue-600" />
                  <span>Academic Year {assignedClass.academicYear || '2026-2027'}</span>
                </div>
              </div>

              {/* Subjects Grid */}
              <div className="pt-6 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">
                  Active Subjects ({subjects.length})
                </h4>

                {subjects.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No individual subjects configured for this class yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjects.map((sub: any) => (
                      <div
                        key={sub.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <p className="font-bold text-slate-900 text-sm">{sub.name}</p>
                          {sub.code && (
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {sub.code}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                          <span>Max Marks: {sub.totalMarks || 100}</span>
                          <span className="font-medium text-emerald-600">Pass: {sub.passMarks || 40}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
