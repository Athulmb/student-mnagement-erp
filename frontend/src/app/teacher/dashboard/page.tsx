'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Building2,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  User,
  LogOut,
  Plus,
  Users,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { formatDate, formatDateTime } from '@/lib/utils';
import api from '@/lib/api';

export default function TeacherDashboardPage() {
  const router = useRouter();
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'assignments' | 'timetable' | 'payslips' | 'announcements'>('assignments');
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState<any>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [studentAttendances, setStudentAttendances] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({});

  // Fetch Teacher Dashboard Data
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['teacher-dashboard'],
    queryFn: async () => {
      const res: any = await api.get('/teacher/dashboard');
      return res;
    },
    enabled: !!user,
  });

  // Fetch My Payslips
  const { data: payslips = [], isLoading: isLoadingPayslips } = useQuery({
    queryKey: ['my-payslips'],
    queryFn: async () => {
      const res: any = await api.get('/payroll/my-payslips');
      return Array.isArray(res) ? res : [];
    },
    enabled: !!user,
  });

  // Fetch Students for Attendance
  const { data: classStudents = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['class-students-attendance', selectedClassForAttendance?.id],
    queryFn: async () => {
      if (!selectedClassForAttendance?.id) return [];
      const res: any = await api.get(`/admin/students?classId=${selectedClassForAttendance.id}`);
      const list = Array.isArray(res) ? res : [];
      // Initialize all to PRESENT by default
      const initial: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
      list.forEach((s: any) => {
        initial[s.studentProfile?.id || s.id] = 'PRESENT';
      });
      setStudentAttendances(initial);
      return list;
    },
    enabled: !!selectedClassForAttendance?.id && attendanceModalOpen,
  });

  // Submit Attendance Mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/teacher/mark-attendance', payload);
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Attendance logged successfully!');
      setAttendanceModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to submit attendance');
    },
  });

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const branchAssignments = dashboardData?.branchAssignments || [];
  const timetable = dashboardData?.timetable || [];
  const announcements = dashboardData?.announcements || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">BMN Academy – Faculty Portal</h1>
            <p className="text-[11px] text-slate-500">Multi-Branch Teaching & Academic Management</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900">{user?.name || dashboardData?.teacher?.name}</p>
            <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">Faculty Member</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            className="text-xs text-rose-600 hover:bg-rose-50 gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Welcome Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-100 border border-blue-400/30">
                Active Faculty Session
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-2">
                Welcome back, {user?.name || dashboardData?.teacher?.name}!
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl">
                You are assigned across <strong className="text-white">{branchAssignments.length} campus branches</strong>. Review your curriculum, mark class attendance, and manage student assessments.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {branchAssignments.map((a: any) => (
                <div
                  key={a.id}
                  className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium"
                >
                  <p className="font-bold flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-blue-300" />
                    <span>{a.branch?.branchName}</span>
                    {a.isPrimary && (
                      <span className="text-[9px] bg-blue-400/40 px-1.5 py-0.2 rounded font-mono">PRIMARY</span>
                    )}
                  </p>
                  <p className="text-[10px] text-blue-200 mt-0.5">{a.designation || 'Teacher'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-1 shadow-sm">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'assignments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Assigned Classes ({branchAssignments.reduce((acc: number, a: any) => acc + (a.teacherAssignments?.length || 0), 0)})</span>
          </button>

          <button
            onClick={() => setActiveTab('timetable')}
            className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'timetable'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>My Weekly Timetable</span>
          </button>

          <button
            onClick={() => setActiveTab('payslips')}
            className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'payslips'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>Compensation & Payslips</span>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'announcements'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Megaphone className="h-4 w-4" />
            <span>Announcements ({announcements.length})</span>
          </button>
        </div>

        {/* TAB 1: Assigned Classes Across Campuses */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            {isLoadingDashboard ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : branchAssignments.length === 0 ? (
              <Card className="p-12 text-center text-slate-500">
                <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700">No Branch Assignments Configured</p>
                <p className="text-xs">Your administrator has not yet assigned you to a branch campus.</p>
              </Card>
            ) : (
              branchAssignments.map((assignment: any) => (
                <div key={assignment.id} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <h3 className="text-base font-bold text-slate-900">
                        {assignment.branch?.branchName} Campus
                      </h3>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {assignment.branch?.branchCode}
                      </Badge>
                      {assignment.isPrimary && (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Primary Worksite
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      Designation: <strong className="text-slate-800">{assignment.designation}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assignment.teacherAssignments && assignment.teacherAssignments.length > 0 ? (
                      assignment.teacherAssignments.map((ta: any) => (
                        <Card key={ta.id} className="p-5 hover:shadow-md transition-shadow border border-slate-200">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-base font-bold text-slate-900">
                                  {ta.class?.name} (Sec {ta.class?.section})
                                </h4>
                                <p className="text-xs font-semibold text-blue-600 mt-0.5">
                                  Subject: {ta.subject?.name || 'Class Teacher'}
                                </p>
                              </div>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                                {ta.subject?.code || 'GEN'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-500 py-2 border-y border-slate-100">
                              <span>Enrolled Students</span>
                              <span className="font-bold text-slate-800">
                                {ta.class?._count?.students || 0} Students
                              </span>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <Button
                                size="sm"
                                className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                                onClick={() => {
                                  setSelectedClassForAttendance(ta.class);
                                  setAttendanceModalOpen(true);
                                }}
                              >
                                <Users className="h-3.5 w-3.5" />
                                <span>Mark Attendance</span>
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-full p-6 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 text-xs">
                        No specific classroom subjects assigned under {assignment.branch?.branchName} yet.
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: Timetable Grid */}
        {activeTab === 'timetable' && (
          <Card>
            <CardHeader className="py-4 px-6 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                Weekly Teaching Schedule Across All Campuses
              </CardTitle>
              <p className="text-xs text-slate-500">
                Consolidated periods scheduled at both Kochi and Calicut branches.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {timetable.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No Teaching Periods Scheduled</p>
                  <p className="text-xs">Your timetable periods will appear here once scheduled by the branch administrator.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
                        <th className="py-3 px-5">Day</th>
                        <th className="py-3 px-5">Period</th>
                        <th className="py-3 px-5">Time Slot</th>
                        <th className="py-3 px-5">Campus Branch</th>
                        <th className="py-3 px-5">Classroom & Section</th>
                        <th className="py-3 px-5">Subject</th>
                        <th className="py-3 px-5">Room</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {timetable.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-5 font-bold text-slate-900">{p.dayOfWeek}</td>
                          <td className="py-3 px-5 font-bold text-blue-600">Period {p.periodNumber}</td>
                          <td className="py-3 px-5 font-mono text-slate-600">{p.startTime} – {p.endTime}</td>
                          <td className="py-3 px-5">
                            <span className="font-medium text-slate-800">{p.branch?.branchName}</span>
                          </td>
                          <td className="py-3 px-5 font-semibold text-slate-900">
                            {p.class?.name} (Sec {p.class?.section})
                          </td>
                          <td className="py-3 px-5 text-indigo-700 font-bold">{p.subject?.name}</td>
                          <td className="py-3 px-5 text-slate-500 font-mono">{p.roomNumber || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 3: My Payslips */}
        {activeTab === 'payslips' && (
          <Card>
            <CardHeader className="py-4 px-6 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">Personal Salary Payslips</CardTitle>
              <p className="text-xs text-slate-500">
                Official branch-specific compensation, allowances, deductions, and net deposited wage.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingPayslips ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : payslips.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <DollarSign className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No Payslips Generated</p>
                  <p className="text-xs">Your monthly salary disbursement records will be listed here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
                        <th className="py-3 px-5">Period</th>
                        <th className="py-3 px-5">Branch Campus</th>
                        <th className="py-3 px-5">Basic</th>
                        <th className="py-3 px-5">Allowances</th>
                        <th className="py-3 px-5">Deductions</th>
                        <th className="py-3 px-5">Net Take-Home</th>
                        <th className="py-3 px-5">Status</th>
                        <th className="py-3 px-5 text-right">View Slip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payslips.map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-5 font-bold text-slate-900">{item.payroll?.periodName}</td>
                          <td className="py-3 px-5 font-medium text-slate-800">
                            {item.payroll?.branch?.branchName}
                          </td>
                          <td className="py-3 px-5 font-mono">{formatCurrency(item.basicSalary)}</td>
                          <td className="py-3 px-5 font-mono text-emerald-600">+{formatCurrency(item.allowances)}</td>
                          <td className="py-3 px-5 font-mono text-rose-600">-{formatCurrency(item.deductions)}</td>
                          <td className="py-3 px-5 font-mono font-bold text-slate-900">
                            {formatCurrency(item.netSalary)}
                          </td>
                          <td className="py-3 px-5">
                            <Badge variant={item.paymentStatus === 'PAID' ? 'success' : 'warning'}>
                              {item.paymentStatus}
                            </Badge>
                          </td>
                          <td className="py-3 px-5 text-right">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-7 text-xs px-2.5 gap-1"
                              onClick={() => setSelectedPayslip(item)}
                            >
                              <FileText className="h-3 w-3" />
                              <span>Details</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 4: Announcements */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <Card className="p-12 text-center text-slate-500">
                <Megaphone className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No Announcements For Faculty</p>
                <p className="text-xs">Notice bulletins from school administration will appear here.</p>
              </Card>
            ) : (
              announcements.map((item: any) => (
                <Card key={item.id} className="p-5 border border-slate-200 hover:shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Posted by {item.author?.name || 'Administrator'} • {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 mt-3 whitespace-pre-wrap leading-relaxed">
                    {item.content}
                  </p>
                </Card>
              ))
            )}
          </div>
        )}
      </main>

      {/* Attendance Modal */}
      <Modal
        isOpen={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        title={`Mark Student Attendance – ${selectedClassForAttendance?.name || ''} (Sec ${selectedClassForAttendance?.section || ''})`}
        description="Verify daily student presence for official institutional registers"
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAttendanceModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={markAttendanceMutation.isPending}
              onClick={() => {
                const attendances = Object.entries(studentAttendances).map(([studentId, status]) => ({
                  studentId,
                  status,
                }));

                markAttendanceMutation.mutate({
                  classId: selectedClassForAttendance.id,
                  date: attendanceDate,
                  attendances,
                });
              }}
            >
              Submit Attendance Register
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
            <span className="text-xs font-semibold text-slate-700">Attendance Date:</span>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="overflow-x-auto max-h-72 border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-4">Admission No</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingStudents ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-slate-400">Loading student roster...</td>
                  </tr>
                ) : classStudents.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-slate-400">No students enrolled in this section.</td>
                  </tr>
                ) : (
                  classStudents.map((st: any) => {
                    const studentId = st.studentProfile?.id || st.id;
                    const status = studentAttendances[studentId] || 'PRESENT';

                    return (
                      <tr key={studentId} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{st.name}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-500">
                          {st.studentProfile?.admissionNumber || 'ADM-N/A'}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                            <button
                              type="button"
                              onClick={() => setStudentAttendances({ ...studentAttendances, [studentId]: 'PRESENT' })}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded ${
                                status === 'PRESENT'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              P
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudentAttendances({ ...studentAttendances, [studentId]: 'LATE' })}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded ${
                                status === 'LATE'
                                  ? 'bg-amber-500 text-white shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              L
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudentAttendances({ ...studentAttendances, [studentId]: 'ABSENT' })}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded ${
                                status === 'ABSENT'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              A
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Payslip Modal */}
      <Modal
        isOpen={!!selectedPayslip}
        onClose={() => setSelectedPayslip(null)}
        title="Faculty Payslip"
        description={`Period: ${selectedPayslip?.payroll?.periodName} – Campus: ${selectedPayslip?.payroll?.branch?.branchName}`}
        maxWidth="md"
        footer={
          <Button variant="secondary" onClick={() => setSelectedPayslip(null)}>
            Close
          </Button>
        }
      >
        {selectedPayslip && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Faculty Name</p>
                <p className="font-bold text-slate-900">{dashboardData?.teacher?.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Designation</p>
                <p className="font-bold text-slate-900">{selectedPayslip.assignment?.designation || 'Teacher'}</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600">
                  <tr>
                    <th className="p-2 border-r border-slate-200">Component</th>
                    <th className="p-2">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2 border-r border-slate-200">Basic Wage</td>
                    <td className="p-2 font-mono">{formatCurrency(selectedPayslip.basicSalary)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-200">Allowances (HRA / DA)</td>
                    <td className="p-2 font-mono text-emerald-600">+{formatCurrency(selectedPayslip.allowances)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-200">PF & Tax Deductions (5%)</td>
                    <td className="p-2 font-mono text-rose-600">-{formatCurrency(selectedPayslip.deductions)}</td>
                  </tr>
                  <tr className="bg-emerald-50 font-bold border-t border-emerald-200">
                    <td className="p-2 border-r border-slate-200 text-emerald-800">Net Take-Home Salary</td>
                    <td className="p-2 font-mono text-emerald-900 font-black">
                      {formatCurrency(selectedPayslip.netSalary)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
