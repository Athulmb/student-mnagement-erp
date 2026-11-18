'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Phone, BookOpen, ShieldCheck, Edit2, Save } from 'lucide-react';
import { StudentLayout } from '@/components/student/student-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { formatDate, getStatusBadgeVariant } from '@/lib/utils';
import api from '@/lib/api';

export default function StudentMyProfilePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    additionalInfo: '',
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['student-my-profile'],
    queryFn: async () => {
      const res: any = await api.get('/student/my-profile');
      return res;
    },
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        phone: profile.phone || '',
        additionalInfo: profile.additionalInfo || '',
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.patch('/student/my-profile', data);
    },
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Profile updated successfully!');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['student-my-profile'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update profile');
    },
  });

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    updateMutation.mutate(form);
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Student Profile & Settings
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              View your institutional credentials and update personal contact information.
            </p>
          </div>
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="text-xs gap-1.5 self-start sm:self-auto"
            >
              <Edit2 className="h-3.5 w-3.5 text-blue-600" />
              <span>Edit Profile Information</span>
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                isLoading={updateMutation.isPending}
                className="text-xs gap-1"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Changes</span>
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <Card className="p-8 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-32 w-full" />
          </Card>
        ) : !profile ? (
          <Card className="p-8 text-center text-slate-500">
            Profile not found.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Identity Card */}
            <Card className="md:col-span-1 p-6 text-center space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 text-2xl font-bold border border-blue-200">
                {profile.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">{profile.name}</h3>
                <p className="font-mono text-xs text-slate-500">{profile.email}</p>
              </div>

              <div className="pt-2">
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full border inline-block ${getStatusBadgeVariant(
                    profile.status,
                  )}`}
                >
                  {profile.status} STUDENT
                </span>
              </div>

              <div className="border-t border-slate-100 pt-4 text-left text-xs text-slate-500 space-y-2">
                <div className="flex justify-between">
                  <span>Student ID:</span>
                  <span className="font-mono text-slate-800">{profile.id.substring(0, 10)}...</span>
                </div>
                <div className="flex justify-between">
                  <span>Enrolled Since:</span>
                  <span className="text-slate-800">{formatDate(profile.createdAt)}</span>
                </div>
              </div>
            </Card>

            {/* Profile Information / Edit Form */}
            <Card className="md:col-span-2 p-6 sm:p-8">
              <h4 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6">
                Institutional & Contact Details
              </h4>

              <div className="space-y-5">
                {/* Full Name */}
                {isEditing ? (
                  <Input
                    label="Full Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                ) : (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Full Legal Name
                    </span>
                    <p className="font-medium text-slate-900 text-sm">{profile.name}</p>
                  </div>
                )}

                {/* Email (Read only) */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Registered Email (Institutional Sign-in)
                  </span>
                  <p className="font-mono text-slate-800 text-sm">{profile.email}</p>
                </div>

                {/* Phone */}
                {isEditing ? (
                  <Input
                    label="Contact Phone Number"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                ) : (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Contact Phone Number
                    </span>
                    <p className="text-slate-900 text-sm">{profile.phone || 'Not provided'}</p>
                  </div>
                )}

                {/* Enrolled Academic Class */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Enrolled Academic Class
                  </span>
                  <p className="font-bold text-blue-600 text-sm">
                    {profile.assignedClass ? `${profile.assignedClass.name} (Sec ${profile.assignedClass.section})` : 'Class Pending Allocation'}
                  </p>
                </div>

                {/* Additional Notes */}
                {isEditing ? (
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Background / Personal Learning Notes
                    </label>
                    <textarea
                      rows={3}
                      value={form.additionalInfo}
                      onChange={(e) => setForm({ ...form, additionalInfo: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Background / Personal Learning Notes
                    </span>
                    <p className="text-slate-700 text-xs leading-relaxed">
                      {profile.additionalInfo || 'None specified.'}
                    </p>
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
