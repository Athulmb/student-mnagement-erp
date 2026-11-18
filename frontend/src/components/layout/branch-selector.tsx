'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, ChevronDown, Check } from 'lucide-react';

export function BranchSelector() {
  const {
    user,
    isPlatformAdmin,
    isOrgAdmin,
    selectedBranchId,
    setSelectedBranchId,
    authorizedBranches,
  } = useAuth();
  const queryClient = useQueryClient();

  if (!user) return null;

  // Students and parents don't switch branches in the header
  if (user.role === 'STUDENT' || user.role === 'PARENT') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200/60 text-xs text-blue-700 font-medium">
        <Building2 className="h-3.5 w-3.5 text-blue-600" />
        <span className="truncate max-w-[180px]">
          {user.studentProfile?.branch?.branchName || 'Academy Campus'}
        </span>
      </div>
    );
  }

  const handleBranchChange = (newBranchId: string) => {
    setSelectedBranchId(newBranchId);
    // Invalidate queries so that dashboard and all lists refresh with the selected branch context
    queryClient.invalidateQueries();
  };

  const showAllBranchesOption = isPlatformAdmin || isOrgAdmin;

  return (
    <div className="relative inline-flex items-center">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors shadow-sm">
        <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
        <select
          value={selectedBranchId}
          onChange={(e) => handleBranchChange(e.target.value)}
          className="bg-transparent text-xs font-semibold text-slate-800 pr-5 appearance-none focus:outline-none cursor-pointer"
          title="Select Branch Campus"
        >
          {showAllBranchesOption && (
            <option value="all">
              🌐 All Branches (Consolidated)
            </option>
          )}
          {authorizedBranches.map((b) => (
            <option key={b.id} value={b.id}>
              📍 {b.branchName} ({b.branchCode})
            </option>
          ))}
        </select>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400 pointer-events-none -ml-4" />
      </div>

      {selectedBranchId !== 'all' && (
        <span className="ml-2 hidden lg:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Branch Scoped
        </span>
      )}
    </div>
  );
}
