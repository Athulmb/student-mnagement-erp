'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, Sparkles, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';

const platformLoginSchema = z.object({
  email: z.string().email('Please enter a valid administrative email'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

type PlatformLoginData = z.infer<typeof platformLoginSchema>;

export default function PlatformLoginPage() {
  const router = useRouter();
  const { platformLogin } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PlatformLoginData>({
    resolver: zodResolver(platformLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: PlatformLoginData) => {
    setErrorMessage(null);
    try {
      const res = await platformLogin(data.email, data.password);
      router.push(res.redirectUrl || '/platform/dashboard');
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Authentication failed. Please verify Super Admin credentials.',
      );
    }
  };

  const handleFillDemo = () => {
    setValue('email', 'superadmin@schoolerp.com');
    setValue('password', 'SuperAdmin@123');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow decoration */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mb-4 shadow-lg shadow-blue-500/10">
          <Shield className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Platform Super Admin
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Multi-School ERP SaaS Platform Control Console
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <Card className="border border-slate-800 bg-slate-900/90 shadow-2xl rounded-2xl overflow-hidden backdrop-blur">
          <CardContent className="p-8 space-y-6">
            {errorMessage && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Super Admin Email
                </label>
                <Input
                  type="email"
                  placeholder="superadmin@schoolerp.com"
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                isLoading={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-600/20"
              >
                Access Platform Control
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>

            {/* Quick Demo Fill button */}
            <div className="pt-2 border-t border-slate-800/80">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFillDemo}
                className="w-full border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white text-xs gap-2"
              >
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                <span>Auto-Fill Super Admin Demo Credentials</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <a href="/login" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
            ← Switch to School Employee Login
          </a>
        </div>
      </div>
    </div>
  );
}
