'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  GraduationCap,
  Lock,
  Mail,
  AlertCircle,
  Clock,
  XCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Building2,
  Sparkles,
  Shield,
  HeartHandshake,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const [rejectionNotice, setRejectionNotice] = useState<string | null>(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    setPendingNotice(null);
    setRejectionNotice(null);

    try {
      const result = await login(data.email, data.password, data.rememberMe);
      if (result.redirectUrl) {
        router.push(result.redirectUrl);
      }
    } catch (err: any) {
      if (err?.code === 'ACCOUNT_PENDING') {
        setPendingNotice(
          err.message ||
            'Your student registration is awaiting administrator approval. You will receive access once approved by admissions.',
        );
      } else if (err?.code === 'ACCOUNT_REJECTED') {
        setRejectionNotice(
          err.message ||
            'Your registration was not approved by the academy administration. Please contact support.',
        );
      } else if (err?.code === 'ACCOUNT_SUSPENDED') {
        setErrorMessage(
          err.message || 'Your account has been suspended. Please contact the administrator.',
        );
      } else {
        setErrorMessage(err?.message || 'Invalid email address or password. Please try again.');
      }
    }
  };

  const fillCredentials = (email: string, pass: string) => {
    setValue('email', email);
    setValue('password', pass);
    setErrorMessage(null);
    setPendingNotice(null);
    setRejectionNotice(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <Link href="/" className="inline-flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
            <GraduationCap className="h-7 w-7" />
          </div>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          BMN ACADEMY
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
          Multi-Branch School Management & Common Login Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <Card className="border border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            {/* Status alerts */}
            {errorMessage && (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 flex items-start gap-3 animate-in fade-in">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Authentication Failed</p>
                  <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {pendingNotice && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs sm:text-sm text-amber-900 flex items-start gap-3 animate-in fade-in">
                <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-amber-900">Registration Pending Approval</p>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">{pendingNotice}</p>
                  <div className="mt-2 text-[10px] font-bold text-amber-700 bg-amber-100/70 rounded px-2 py-0.5 inline-block">
                    STATUS: PENDING ADMIN REVIEW
                  </div>
                </div>
              </div>
            )}

            {rejectionNotice && (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-900 flex items-start gap-3 animate-in fade-in">
                <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-rose-900">Application Notice</p>
                  <p className="text-xs text-rose-800 mt-1 leading-relaxed">{rejectionNotice}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@schoolerp.com"
                  autoComplete="email"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(true)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-600 font-medium mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    {...register('rememberMe')}
                  />
                  <span className="text-xs font-medium text-slate-600">Remember credentials</span>
                </label>
              </div>

              <Button
                type="submit"
                size="lg"
                isLoading={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 shadow-md shadow-blue-500/20"
              >
                Sign In to Unified Portal
              </Button>
            </form>

            {/* Quick 1-Click Role Accounts */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" /> 1-Click Multi-Branch Demo Roles
                </span>
                <span className="text-[9px] text-slate-400">Click to fill</span>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {/* Org Admin */}
                <button
                  type="button"
                  onClick={() => fillCredentials('orgadmin@schoolerp.com', 'OrgAdmin@123')}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-left hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <span className="font-bold text-slate-900 block truncate">Org Admin</span>
                  <span className="text-[10px] text-slate-500 block truncate">All Campuses</span>
                </button>

                {/* Kochi Branch Admin */}
                <button
                  type="button"
                  onClick={() => fillCredentials('admin.kochi@schoolerp.com', 'Admin@123')}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-left hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <span className="font-bold text-slate-900 block truncate">Kochi Admin</span>
                  <span className="text-[10px] text-slate-500 block truncate">Kochi Campus</span>
                </button>

                {/* Calicut Branch Admin */}
                <button
                  type="button"
                  onClick={() => fillCredentials('admin.calicut@schoolerp.com', 'Admin@123')}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-left hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <span className="font-bold text-slate-900 block truncate">Calicut Admin</span>
                  <span className="text-[10px] text-slate-500 block truncate">Calicut Campus</span>
                </button>

                {/* Multi-Branch Teacher */}
                <button
                  type="button"
                  onClick={() => fillCredentials('anjali.teacher@schoolerp.com', 'Teacher@123')}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-left hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <span className="font-bold text-slate-900 block truncate">Teacher Anjali</span>
                  <span className="text-[10px] text-slate-500 block truncate">Kochi & Calicut</span>
                </button>

                {/* Staff Member */}
                <button
                  type="button"
                  onClick={() => fillCredentials('priya.staff@schoolerp.com', 'Staff@123')}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-left hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <span className="font-bold text-slate-900 block truncate">Staff Priya</span>
                  <span className="text-[10px] text-slate-500 block truncate">Operations/Admin</span>
                </button>

                {/* Student */}
                <button
                  type="button"
                  onClick={() => fillCredentials('devanand.student@schoolerp.com', 'Student@123')}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-left hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <span className="font-bold text-slate-900 block truncate">Student Devanand</span>
                  <span className="text-[10px] text-slate-500 block truncate">Class 8A Kochi</span>
                </button>
              </div>
            </div>

            {/* Specialized Portals Navigation */}
            <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/platform/login"
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors text-[11px]"
              >
                <Shield className="h-3.5 w-3.5 text-blue-400" />
                <span>Super Admin</span>
              </Link>

              <Link
                href="/parent/login"
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold hover:bg-indigo-100 transition-colors text-[11px]"
              >
                <HeartHandshake className="h-3.5 w-3.5 text-indigo-600" />
                <span>Parent Portal</span>
              </Link>
            </div>

            {/* Register Link */}
            <div className="mt-5 text-center text-xs text-slate-500">
              New student seeking campus admission?{' '}
              <Link
                href="/register"
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Register for Admission
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forgot Password Dialog */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Password Reset Support"
        description="Institutional Security Standard"
        footer={
          <Button onClick={() => setForgotModalOpen(false)} variant="primary">
            Understood
          </Button>
        }
      >
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            To uphold security across campus operations, credentials are encrypted and centrally managed.
          </p>
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-blue-900 space-y-1">
            <p className="font-semibold">Campus IT Support Desk:</p>
            <p>Email: <span className="font-mono">support@bmnacademy.com</span></p>
            <p>Admin Helpline: <span className="font-mono">+91 484 2345678</span></p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
