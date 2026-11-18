'use client';

import React from 'react';
import Link from 'next/link';
import {
  Settings,
  Shield,
  Database,
  ExternalLink,
  Key,
  Server,
  User,
  CheckCircle2,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

export default function AdminSettingsPage() {
  const { user } = useAuth();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            System & Security Settings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Institutional configuration, environment diagnostics, and administrator credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Profile */}
          <Card>
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                <span>Current Administrator Identity</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Name:</span>
                <span className="font-semibold text-slate-900">{user?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono text-slate-900">{user?.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Institutional Role:</span>
                <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">
                  {user?.role}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Administrator ID:</span>
                <span className="font-mono text-[11px] text-slate-600">{user?.id}</span>
              </div>
            </CardContent>
          </Card>

          {/* System & Architecture */}
          <Card>
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-600" />
                <span>Backend & Database Infrastructure</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">API Endpoint:</span>
                <span className="font-mono text-slate-900">http://localhost:3001</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Database Engine:</span>
                <span className="font-semibold text-slate-900">PostgreSQL (Prisma ORM)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Authentication:</span>
                <span className="text-slate-900">JWT + Refresh Tokens (HttpOnly Cookies)</span>
              </div>
              <div className="pt-2">
                <a
                  href="http://localhost:3001/api/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  <span>Open Interactive Swagger API Documentation</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
