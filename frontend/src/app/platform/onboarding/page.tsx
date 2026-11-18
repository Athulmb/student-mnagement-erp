'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Building2,
  GitBranch,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

const onboardSchema = z.object({
  schoolName: z.string().min(3, 'School organization name is required'),
  schoolCode: z.string().min(2, 'Unique organization code is required (e.g. NPAG, DPS)'),
  contactEmail: z.string().email('Valid school contact email is required'),
  contactPhone: z.string().optional(),
  district: z.string().min(2, 'District is required'),
  state: z.string().min(2, 'State is required'),
  initialBranchName: z.string().min(3, 'Initial branch campus name is required'),
  initialBranchCode: z.string().min(2, 'Branch code is required (e.g. MAIN, KCH)'),
  adminName: z.string().min(2, 'Organization Administrator name is required'),
  adminEmail: z.string().email('Admin email must be a valid email address'),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

type OnboardData = z.infer<typeof onboardSchema>;

export default function PlatformOnboardingPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OnboardData>({
    resolver: zodResolver(onboardSchema),
    defaultValues: {
      schoolName: '',
      schoolCode: '',
      contactEmail: '',
      contactPhone: '',
      district: 'Ernakulam',
      state: 'Kerala',
      initialBranchName: 'Central Campus',
      initialBranchCode: 'MAIN',
      adminName: '',
      adminEmail: '',
      adminPassword: 'Admin@123456',
    },
  });

  const onSubmit = async (data: OnboardData) => {
    setErrorMessage(null);
    try {
      const res: any = await api.post('/platform/onboard-school', data);
      setSuccessResult(res);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to complete school onboarding. Ensure codes and emails are unique.');
    }
  };

  const handleFillSample = () => {
    setValue('schoolName', 'Oxford International Academy Group');
    setValue('schoolCode', 'OIAG');
    setValue('contactEmail', 'central@oxford-academy.edu');
    setValue('contactPhone', '+91 484 277 8899');
    setValue('district', 'Trivandrum');
    setValue('state', 'Kerala');
    setValue('initialBranchName', 'Technopark City Campus');
    setValue('initialBranchCode', 'OIAG-TPK');
    setValue('adminName', 'Dr. Radhakrishnan Nair');
    setValue('adminEmail', 'admin.radhakrishnan@oxford-academy.edu');
    setValue('adminPassword', 'Admin@123456');
  };

  if (successResult) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center py-12 px-4 sm:px-6">
        <div className="max-w-md mx-auto w-full">
          <Card className="bg-slate-900 border-emerald-500/30 text-white shadow-2xl rounded-2xl overflow-hidden">
            <div className="bg-emerald-600 p-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-white mx-auto mb-2" />
              <h2 className="text-lg font-bold">School Organization Onboarded!</h2>
              <p className="text-xs text-emerald-100">Multi-Branch ERP Hierarchy Initialized</p>
            </div>
            <CardContent className="p-6 space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono">
                <div>
                  <span className="text-slate-400 block">Organization:</span>
                  <span className="text-white font-bold">{successResult?.organization?.organizationName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Organization Code:</span>
                  <span className="text-blue-400 font-bold">{successResult?.organization?.organizationCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Primary Branch:</span>
                  <span className="text-emerald-400 font-bold">{successResult?.primaryBranch?.branchName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Head Admin Login:</span>
                  <span className="text-amber-400">{successResult?.admin?.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Initial Password:</span>
                  <span className="text-white">{successResult?.admin?.temporaryPassword}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <Link href="/platform/dashboard" className="flex-1">
                  <Button variant="outline" className="w-full border-slate-800 text-xs">
                    Platform Control
                  </Button>
                </Link>
                <Link href="/login" className="flex-1">
                  <Button className="w-full bg-blue-600 hover:bg-blue-500 text-xs">
                    Sign In as School Admin
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/platform/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Platform Dashboard</span>
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFillSample}
            className="border-slate-800 bg-slate-900 text-blue-400 text-xs hover:bg-slate-800"
          >
            Fill Sample Onboarding Data
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="h-6 w-6 text-blue-500" />
            <span>Onboard New School Organization</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure the parent school organization, assign its initial campus branch, and grant head office credentials.
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: School Organization */}
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardHeader className="border-b border-slate-800 pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <span>1. School Organization Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    School Organization Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. National Public Academy Group"
                    className="bg-slate-950 border-slate-800 text-white"
                    error={errors.schoolName?.message}
                    {...register('schoolName')}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Organization Code <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. NPAG"
                    className="bg-slate-950 border-slate-800 text-white uppercase font-mono"
                    error={errors.schoolCode?.message}
                    {...register('schoolCode')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Central Contact Email <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="contact@school-academy.edu"
                    className="bg-slate-950 border-slate-800 text-white"
                    error={errors.contactEmail?.message}
                    {...register('contactEmail')}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Contact Phone Number
                  </label>
                  <Input
                    placeholder="+91 484 288 9000"
                    className="bg-slate-950 border-slate-800 text-white"
                    {...register('contactPhone')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">District</label>
                  <Input
                    placeholder="Ernakulam"
                    className="bg-slate-950 border-slate-800 text-white"
                    error={errors.district?.message}
                    {...register('district')}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">State</label>
                  <Input
                    placeholder="Kerala"
                    className="bg-slate-950 border-slate-800 text-white"
                    error={errors.state?.message}
                    {...register('state')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Initial Branch Campus */}
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardHeader className="border-b border-slate-800 pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <span>2. Initial Branch Campus</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Branch Campus Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Kochi Central Campus"
                    className="bg-slate-950 border-slate-800 text-white"
                    error={errors.initialBranchName?.message}
                    {...register('initialBranchName')}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Branch Code <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. NPAG-KCH"
                    className="bg-slate-950 border-slate-800 text-white uppercase font-mono"
                    error={errors.initialBranchCode?.message}
                    {...register('initialBranchCode')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Head Office Admin */}
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardHeader className="border-b border-slate-800 pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <span>3. Initial Head Office Organization Admin Account</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Admin Full Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Dr. Ramachandran Menon"
                    className="bg-slate-950 border-slate-800 text-white"
                    error={errors.adminName?.message}
                    {...register('adminName')}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Admin Email Address <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="admin@school-academy.edu"
                    className="bg-slate-950 border-slate-800 text-white"
                    error={errors.adminEmail?.message}
                    {...register('adminEmail')}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Initial Administrative Password
                </label>
                <Input
                  type="text"
                  placeholder="Admin@123456"
                  className="bg-slate-950 border-slate-800 text-white"
                  error={errors.adminPassword?.message}
                  {...register('adminPassword')}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            size="lg"
            isLoading={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 text-sm shadow-xl shadow-blue-600/20"
          >
            Provision School Organization & Activate Hierarchy
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </form>
      </div>
    </div>
  );
}
