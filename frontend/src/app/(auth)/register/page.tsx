'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(7, 'Phone number must be at least 7 digits').optional().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password is required'),
    branchId: z.string().min(1, 'Please select your preferred campus branch'),
    admissionClass: z.string().min(1, 'Please select your admission class/grade'),
    gender: z.string().optional(),
    address: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface BranchOption {
  id: string;
  branchName: string;
  branchCode: string;
  district?: string;
  state?: string;
}

const DEFAULT_BRANCHES: BranchOption[] = [
  { id: 'NPAG-KCH', branchName: 'BMN Academy – Kochi Central Campus', branchCode: 'KC' },
  { id: 'NPAG-CLT', branchName: 'BMN Academy – Calicut Campus', branchCode: 'CL' },
  { id: 'NPAG-MLP', branchName: 'BMN Academy – Malappuram Campus', branchCode: 'ML' },
];

export default function RegisterPage() {
  const [branches, setBranches] = useState<BranchOption[]>(DEFAULT_BRANCHES);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<boolean>(false);
  const [registeredStudent, setRegisteredStudent] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      branchId: 'NPAG-CLT',
      admissionClass: 'Class 8',
      gender: 'MALE',
      address: '',
    },
  });

  useEffect(() => {
    async function loadBranches() {
      try {
        const res: any = await api.get('/branches/public');
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        if (list.length > 0) {
          setBranches(list);
          setValue('branchId', list[0].id);
        }
      } catch (err) {
        try {
          const res2: any = await api.get('/branches');
          const list2 = Array.isArray(res2) ? res2 : Array.isArray(res2?.data) ? res2.data : [];
          if (list2.length > 0) {
            setBranches(list2);
            setValue('branchId', list2[0].id);
          }
        } catch (e) {
          // Use default branches
        }
      }
    }
    loadBranches();
  }, [setValue]);

  const onSubmit = async (data: RegisterFormData) => {
    setErrorMessage(null);
    try {
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        password: data.password,
        branchId: data.branchId,
        admissionClass: data.admissionClass,
        gender: data.gender,
        address: data.address || undefined,
      };

      const res: any = await api.post('/auth/register', payload);
      setRegisteredStudent(res?.student || { name: data.name, email: data.email });
      setRegistrationSuccess(true);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Failed to submit registration. Please try again or contact admissions.'
      );
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
          <Card className="border border-slate-200 shadow-xl rounded-2xl overflow-hidden text-center p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 mb-4 shadow-sm">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Admission Registration Received!
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Congratulations, <strong className="text-slate-900">{registeredStudent?.name}</strong>. Your
              application has been placed into the institutional verification queue.
            </p>

            <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
                <Clock className="h-4 w-4 text-amber-600" />
                <span>Next Step: Administrator Approval Required</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                As per institutional security policy, new student accounts start with <strong>PENDING</strong> status.
                Once campus admissions verifies your credentials, your account will be activated for portal login.
              </p>
            </div>

            <div className="mt-6">
              <Link href="/login">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5">
                  Return to Common Portal Login
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <Link href="/" className="inline-flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
            <GraduationCap className="h-7 w-7" />
          </div>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Student Admission Application
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
          Apply for enrollment at BMN Academy Campus Network
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <Card className="border border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            {errorMessage && (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Registration Issue</p>
                  <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Full Student Name *"
                placeholder="e.g. Devanand R"
                error={errors.name?.message}
                {...register('name')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Email Address *"
                  type="email"
                  placeholder="student@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Input
                  label="Phone / Mobile Number"
                  placeholder="+91 98400 12345"
                  error={errors.phone?.message}
                  {...register('phone')}
                />
              </div>

              {/* Branch Selection */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Select Campus Branch *
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-medium focus:border-blue-600 focus:outline-none"
                  {...register('branchId')}
                >
                  <option value="">Choose Campus</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.branchName} ({b.branchCode})
                    </option>
                  ))}
                </select>
                {errors.branchId && (
                  <p className="text-xs text-rose-600 font-medium">{errors.branchId.message}</p>
                )}
              </div>

              {/* Grade / Admission Class */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Grade / Class *
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-medium focus:border-blue-600 focus:outline-none"
                    {...register('admissionClass')}
                  >
                    <option value="Class 8">Class 8 (Grade 8)</option>
                    <option value="Class 9">Class 9 (Grade 9)</option>
                    <option value="Class 10">Class 10 (Grade 10)</option>
                    <option value="Class 11">Class 11 (Senior Sec)</option>
                    <option value="Class 12">Class 12 (Senior Sec)</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Gender
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-medium focus:border-blue-600 focus:outline-none"
                    {...register('gender')}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Password (min 6 chars) *"
                  type="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <Input
                  label="Confirm Password *"
                  type="password"
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                isLoading={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 shadow-md shadow-blue-500/20"
              >
                <span>Submit Admission Application</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-500">
              Already registered or have employee credentials?{' '}
              <Link href="/login" className="font-bold text-blue-600 hover:underline">
                Portal Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
