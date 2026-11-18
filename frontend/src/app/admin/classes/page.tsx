'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  BookOpen,
  Plus,
  Users,
  Calendar,
  Clock,
  User,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  AlertCircle,
  Building2,
  Layers,
  ChevronRight,
  Sparkles,
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
import api from '@/lib/api';

export default function AdminClassesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { selectedBranchId, authorizedBranches } = useAuth();

  const [activeTab, setActiveTab] = useState<'classes' | 'timetable'>('classes');
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Modals
  const [createClassModalOpen, setCreateClassModalOpen] = useState(false);
  const [createSubjectModalOpen, setCreateSubjectModalOpen] = useState(false);
  const [addPeriodModalOpen, setAddPeriodModalOpen] = useState(false);
  const [selectedClassForSubjects, setSelectedClassForSubjects] = useState<any>(null);

  // Forms
  const [classForm, setClassForm] = useState({
    name: '',
    section: 'A',
    branchId: '',
    roomNumber: '',
    capacity: '40',
    academicYear: '2026-2027',
  });

  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    totalMarks: '100',
    passMarks: '40',
  });

  const [periodForm, setPeriodForm] = useState({
    branchId: '',
    classId: '',
    subjectId: '',
    teacherAssignmentId: '',
    dayOfWeek: 'Monday',
    periodNumber: 1,
    startTime: '09:00 AM',
    endTime: '09:45 AM',
    roomNumber: '',
  });

  // Days and periods definition
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periodSlots = [
    { num: 1, start: '09:00 AM', end: '09:45 AM' },
    { num: 2, start: '09:50 AM', end: '10:35 AM' },
    { num: 3, start: '10:45 AM', end: '11:30 AM' },
    { num: 4, start: '11:35 AM', end: '12:20 PM' },
    { num: 5, start: '01:15 PM', end: '02:00 PM' },
    { num: 6, start: '02:05 PM', end: '02:50 PM' },
    { num: 7, start: '02:55 PM', end: '03:40 PM' },
  ];

  // Fetch Classes
  const { data: classes = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ['admin-classes', selectedBranchId],
    queryFn: async () => {
      const url = selectedBranchId && selectedBranchId !== 'all'
        ? `/academics/classes?branchId=${selectedBranchId}`
        : '/academics/classes';
      const res: any = await api.get(url);
      return Array.isArray(res) ? res : [];
    },
  });

  // Fetch Teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['admin-teachers-academics', selectedBranchId],
    queryFn: async () => {
      const url = selectedBranchId && selectedBranchId !== 'all'
        ? `/admin/teachers?branchId=${selectedBranchId}`
        : '/admin/teachers';
      const res: any = await api.get(url);
      return Array.isArray(res) ? res : [];
    },
  });

  // Fetch Timetable for selected class
  const activeClassId = selectedClassId || classes[0]?.id;
  const { data: timetable = [], isLoading: isLoadingTimetable } = useQuery({
    queryKey: ['admin-timetable', activeClassId],
    queryFn: async () => {
      if (!activeClassId) return [];
      const res: any = await api.get(`/academics/timetable?classId=${activeClassId}`);
      return Array.isArray(res) ? res : [];
    },
    enabled: !!activeClassId,
  });

  // Create Class Mutation
  const createClassMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/academics/classes', payload);
    },
    onSuccess: () => {
      toast.success('Class created successfully!');
      setCreateClassModalOpen(false);
      setClassForm({
        name: '',
        section: 'A',
        branchId: '',
        roomNumber: '',
        capacity: '40',
        academicYear: '2026-2027',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create class');
    },
  });

  // Create Subject Mutation
  const createSubjectMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/academics/subjects', payload);
    },
    onSuccess: () => {
      toast.success('Subject added to class!');
      setCreateSubjectModalOpen(false);
      setSubjectForm({ name: '', code: '', totalMarks: '100', passMarks: '40' });
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to add subject');
    },
  });

  // Add Timetable Period Mutation
  const addPeriodMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/academics/timetable/periods', payload);
    },
    onSuccess: () => {
      toast.success('Period scheduled successfully without conflicts!');
      setAddPeriodModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-timetable'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Scheduling conflict detected');
    },
  });

  const selectedClassObj = classes.find((c: any) => c.id === activeClassId);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Academics & Timetable Matrix
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Multi-branch class sections, subject curriculums, and conflict-prevented weekly scheduling.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setClassForm({
                  name: '',
                  section: 'A',
                  branchId: selectedBranchId && selectedBranchId !== 'all' ? selectedBranchId : (authorizedBranches[0]?.id || ''),
                  roomNumber: '',
                  capacity: '40',
                  academicYear: '2026-2027',
                });
                setCreateClassModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-md shadow-blue-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>Create Class</span>
            </Button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('classes')}
            className={`py-3 px-6 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'classes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Classes & Subjects</span>
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {classes.length}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab('timetable')}
            className={`py-3 px-6 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'timetable'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Weekly Timetable Matrix</span>
          </button>
        </div>

        {/* TAB 1: Classes & Subjects */}
        {activeTab === 'classes' && (
          <div className="space-y-4">
            {isLoadingClasses ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            ) : classes.length === 0 ? (
              <Card className="p-12 text-center text-slate-500">
                <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700">No Classes Configured</p>
                <p className="text-xs mt-1">Create classes for this branch to start enrolling students and scheduling periods.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {classes.map((cls: any) => (
                  <Card key={cls.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow border border-slate-200">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900">{cls.name}</h3>
                            <Badge variant="outline" className="font-bold">
                              Sec {cls.section}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            <span>{cls.branch?.branchName}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                          {cls.academicYear}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Enrolled Students</p>
                          <p className="font-bold text-slate-800 mt-0.5">{cls._count?.students || 0} / {cls.capacity}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Classroom</p>
                          <p className="font-bold text-slate-800 mt-0.5">{cls.roomNumber || 'Room TBA'}</p>
                        </div>
                      </div>

                      {/* Subjects list in class */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold uppercase text-slate-500">Subjects Curriculum</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[11px] px-2 text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setSelectedClassForSubjects(cls);
                              setCreateSubjectModalOpen(true);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Subject
                          </Button>
                        </div>
                        {cls.subjects && cls.subjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {cls.subjects.map((sub: any) => (
                              <span
                                key={sub.id}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-100 text-slate-800 font-medium"
                              >
                                {sub.name}
                                {sub.code && <span className="text-slate-400 text-[10px] font-mono">({sub.code})</span>}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">No subjects added yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs w-full gap-1.5"
                        onClick={() => {
                          setSelectedClassId(cls.id);
                          setActiveTab('timetable');
                        }}
                      >
                        <Calendar className="h-3.5 w-3.5 text-blue-600" />
                        <span>View Timetable</span>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Weekly Timetable Matrix */}
        {activeTab === 'timetable' && (
          <div className="space-y-4">
            {/* Class Selector Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0">
                  Select Class:
                </span>
                <select
                  value={activeClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="rounded-lg border border-slate-300 py-1.5 px-3 text-xs font-semibold focus:outline-none focus:border-blue-600 bg-white"
                >
                  {classes.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.section}) – {cls.branch?.branchName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedClassObj && (
                <Button
                  onClick={() => {
                    const firstSub = selectedClassObj.subjects?.[0]?.id || '';
                    const defaultBranch = selectedClassObj.branchId;
                    setPeriodForm({
                      branchId: defaultBranch,
                      classId: selectedClassObj.id,
                      subjectId: firstSub,
                      teacherAssignmentId: '',
                      dayOfWeek: 'Monday',
                      periodNumber: 1,
                      startTime: '09:00 AM',
                      endTime: '09:45 AM',
                      roomNumber: selectedClassObj.roomNumber || '',
                    });
                    setAddPeriodModalOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-md shadow-blue-500/20 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Schedule Period</span>
                </Button>
              )}
            </div>

            {/* Timetable Grid */}
            <Card>
              <CardHeader className="py-3 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Weekly Schedule: {selectedClassObj?.name} (Sec {selectedClassObj?.section})
                  </CardTitle>
                  <p className="text-[11px] text-slate-500">
                    Automated conflict checks prevent teacher double-booking across all branches and duplicate class scheduling.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="py-3 px-4 font-bold text-slate-600 uppercase text-[10px] w-24">Day</th>
                        {periodSlots.map((slot) => (
                          <th key={slot.num} className="py-3 px-3 font-bold text-slate-600 uppercase text-[10px] min-w-[130px]">
                            Period {slot.num}
                            <div className="text-[9px] font-mono text-slate-400 font-normal lowercase">{slot.start}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {days.map((day) => (
                        <tr key={day} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-800 bg-slate-50/80 border-r border-slate-200">
                            {day}
                          </td>
                          {periodSlots.map((slot) => {
                            const period = timetable.find(
                              (p: any) => p.dayOfWeek === day && p.periodNumber === slot.num
                            );

                            return (
                              <td key={slot.num} className="py-2.5 px-3 border-r border-slate-100 align-top">
                                {period ? (
                                  <div className="p-2 rounded-lg bg-blue-50/90 border border-blue-200 text-blue-900 space-y-1">
                                    <p className="font-bold text-xs truncate">{period.subject?.name}</p>
                                    <div className="flex items-center gap-1 text-[10px] text-blue-700">
                                      <User className="h-3 w-3 shrink-0" />
                                      <span className="truncate">{period.teacher?.user?.name || 'Assigned Faculty'}</span>
                                    </div>
                                    {period.roomNumber && (
                                      <p className="text-[9px] text-slate-500 font-mono">Rm: {period.roomNumber}</p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="h-14 rounded border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-300">
                                    Free
                                  </div>
                                )}
                              </td>
                            );
                          })}
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

      {/* Create Class Modal */}
      <Modal
        isOpen={createClassModalOpen}
        onClose={() => setCreateClassModalOpen(false)}
        title="Create New Class Section"
        description="Allocate classroom and capacity under a branch campus"
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateClassModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={createClassMutation.isPending}
              onClick={() => {
                if (!classForm.name || !classForm.branchId) {
                  toast.error('Please fill all required fields');
                  return;
                }
                createClassMutation.mutate(classForm);
              }}
            >
              Create Class
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Branch Campus *
            </label>
            <select
              value={classForm.branchId}
              onChange={(e) => setClassForm({ ...classForm, branchId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-medium focus:border-blue-600 focus:outline-none"
            >
              <option value="">Select Branch</option>
              {authorizedBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branchName} ({b.branchCode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Class Name *"
              placeholder="e.g. Class 8 or Grade 10"
              value={classForm.name}
              onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
            />
            <Input
              label="Section *"
              placeholder="e.g. A, B, C"
              value={classForm.section}
              onChange={(e) => setClassForm({ ...classForm, section: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Room / Hall Number"
              placeholder="e.g. Hall 102"
              value={classForm.roomNumber}
              onChange={(e) => setClassForm({ ...classForm, roomNumber: e.target.value })}
            />
            <Input
              label="Student Capacity"
              type="number"
              value={classForm.capacity}
              onChange={(e) => setClassForm({ ...classForm, capacity: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Add Subject Modal */}
      <Modal
        isOpen={createSubjectModalOpen}
        onClose={() => setCreateSubjectModalOpen(false)}
        title={`Add Subject to ${selectedClassForSubjects?.name || 'Class'}`}
        description="Include course module into curriculum"
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateSubjectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={createSubjectMutation.isPending}
              onClick={() => {
                if (!subjectForm.name) {
                  toast.error('Subject name is required');
                  return;
                }
                createSubjectMutation.mutate({
                  classId: selectedClassForSubjects.id,
                  name: subjectForm.name,
                  code: subjectForm.code,
                  totalMarks: Number(subjectForm.totalMarks),
                  passMarks: Number(subjectForm.passMarks),
                });
              }}
            >
              Add Subject
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Subject Name *"
            placeholder="e.g. Mathematics, Science, English"
            value={subjectForm.name}
            onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
          />
          <Input
            label="Subject Code (Optional)"
            placeholder="e.g. MTH-08"
            value={subjectForm.code}
            onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Total Marks"
              type="number"
              value={subjectForm.totalMarks}
              onChange={(e) => setSubjectForm({ ...subjectForm, totalMarks: e.target.value })}
            />
            <Input
              label="Passing Marks"
              type="number"
              value={subjectForm.passMarks}
              onChange={(e) => setSubjectForm({ ...subjectForm, passMarks: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Schedule Period Modal with Conflict Detection */}
      <Modal
        isOpen={addPeriodModalOpen}
        onClose={() => setAddPeriodModalOpen(false)}
        title="Schedule Timetable Period"
        description="Select subject, assigned teacher, and period timing with automatic collision detection"
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddPeriodModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={addPeriodMutation.isPending}
              onClick={() => {
                if (!periodForm.subjectId || !periodForm.teacherAssignmentId) {
                  toast.error('Please select both a subject and teacher assignment');
                  return;
                }
                addPeriodMutation.mutate({
                  branchId: periodForm.branchId,
                  classId: periodForm.classId,
                  subjectId: periodForm.subjectId,
                  teacherId: periodForm.teacherAssignmentId,
                  dayOfWeek: periodForm.dayOfWeek,
                  periodNumber: Number(periodForm.periodNumber),
                  startTime: periodForm.startTime,
                  endTime: periodForm.endTime,
                  roomNumber: periodForm.roomNumber,
                });
              }}
            >
              Verify & Schedule
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-semibold">Conflict Prevention Guard active:</p>
              <p>Teachers cannot be double-booked across any campus in the same period, nor can two subjects be scheduled at once for this class.</p>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Subject *
            </label>
            <select
              value={periodForm.subjectId}
              onChange={(e) => setPeriodForm({ ...periodForm, subjectId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-medium focus:border-blue-600 focus:outline-none"
            >
              <option value="">Select Subject</option>
              {selectedClassObj?.subjects?.map((sub: any) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} {sub.code ? `(${sub.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Assigned Teacher Faculty *
            </label>
            <select
              value={periodForm.teacherAssignmentId}
              onChange={(e) => setPeriodForm({ ...periodForm, teacherAssignmentId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-medium focus:border-blue-600 focus:outline-none"
            >
              <option value="">Select Faculty Assignment</option>
              {teachers.flatMap((t: any) =>
                (t.employeeBranchAssignments || [])
                  .filter((a: any) => a.branchId === selectedClassObj?.branchId)
                  .map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {t.name} – {a.designation || 'Teacher'} ({a.branch?.branchName || 'Campus'})
                    </option>
                  ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Day of Week *
              </label>
              <select
                value={periodForm.dayOfWeek}
                onChange={(e) => setPeriodForm({ ...periodForm, dayOfWeek: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-medium focus:border-blue-600 focus:outline-none"
              >
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Period Number *
              </label>
              <select
                value={periodForm.periodNumber}
                onChange={(e) => {
                  const pNum = Number(e.target.value);
                  const slot = periodSlots.find((s) => s.num === pNum);
                  setPeriodForm({
                    ...periodForm,
                    periodNumber: pNum,
                    startTime: slot?.start || '09:00 AM',
                    endTime: slot?.end || '09:45 AM',
                  });
                }}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-medium focus:border-blue-600 focus:outline-none"
              >
                {periodSlots.map((s) => (
                  <option key={s.num} value={s.num}>
                    Period {s.num} ({s.start} - {s.end})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
