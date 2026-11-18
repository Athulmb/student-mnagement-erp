'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  HeartHandshake,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export default function ParentLoginPage() {
  const router = useRouter();
  const { parentLogin } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await parentLogin(email, password);
      toast.success(`Welcome back, ${res.user.name}!`);
      router.push(res.redirectUrl || '/parent/dashboard');
    } catch (err: any) {
      toast.error(err?.message || 'Invalid parent credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoParent = () => {
    setEmail('ravi.parent@schoolerp.com');
    setPassword('Parent@123');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
            <HeartHandshake className="h-8 w-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-black tracking-tight text-slate-900">
          BMN Academy – Parent Portal
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Monitor your child's multi-branch attendance, academic grades, and tuition ledger
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-100 sm:px-10 space-y-6">
          {/* Quick Demo Credentials */}
          <div className="p-3.5 bg-indigo-50/80 border border-indigo-200/80 rounded-xl">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Demo Parent Credentials
              </span>
              <button
                type="button"
                onClick={fillDemoParent}
                className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline"
              >
                1-Click Autofill
              </button>
            </div>
            <div className="text-[11px] text-indigo-800 space-y-0.5 font-mono">
              <p>Email: ravi.parent@schoolerp.com</p>
              <p>Pass: Parent@123 (Parent of Devanand R - Kochi Campus)</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Parent / Guardian Email"
              type="email"
              placeholder="e.g. parent@schoolerp.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 shadow-md shadow-indigo-500/20"
              isLoading={isLoading}
            >
              <span>Access Parent Dashboard</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center space-y-2 text-xs text-slate-500">
            <p>
              School Admin or Faculty member?{' '}
              <Link href="/login" className="font-bold text-blue-600 hover:underline">
                Employee Portal Login
              </Link>
            </p>
            <p>
              Student accessing your dashboard?{' '}
              <Link href="/login" className="font-bold text-slate-700 hover:underline">
                Student Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
