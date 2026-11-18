'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from './api';

export type UserRole =
  | 'PLATFORM_SUPER_ADMIN'
  | 'ORGANIZATION_ADMIN'
  | 'BRANCH_ADMIN'
  | 'TEACHER'
  | 'STAFF'
  | 'STUDENT'
  | 'PARENT'
  | 'ADMIN'; // legacy alias

export interface Branch {
  id: string;
  branchName: string;
  branchCode: string;
  district?: string;
  state?: string;
  phone?: string;
  email?: string;
  status: string;
  isPrimaryBranch?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  organizationId?: string | null;
  organization?: {
    id: string;
    organizationName: string;
    organizationCode: string;
    logo?: string;
    branches?: Branch[];
  } | null;
  primaryBranchId?: string | null;
  branchMemberships?: Array<{
    id: string;
    branchId: string;
    isPrimary: boolean;
    role: UserRole;
    branch: Branch;
  }>;
  employeeBranchAssignments?: Array<{
    id: string;
    branchId: string;
    employeeId: string;
    designation: string;
    isPrimary: boolean;
    branch: Branch;
    teacherAssignments?: any[];
  }>;
  studentProfile?: {
    id: string;
    branchId: string;
    admissionNumber: string;
    studentIdNumber?: string;
    admissionClass?: string;
    branch?: Branch;
    assignedClass?: any;
    transferHistory?: any[];
  } | null;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPlatformAdmin: boolean;
  isOrgAdmin: boolean;
  isBranchAdmin: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isStaff: boolean;
  isStudent: boolean;
  isParent: boolean;
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  authorizedBranches: Branch[];
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ redirectUrl: string; user: User }>;
  platformLogin: (email: string, password: string) => Promise<{ redirectUrl: string; user: User }>;
  studentLogin: (email: string, password: string) => Promise<{ redirectUrl: string; user: User }>;
  parentLogin: (email: string, password: string) => Promise<{ redirectUrl: string; user: User }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedBranchId, setSelectedBranchIdState] = useState<string>('all');
  const [authorizedBranches, setAuthorizedBranches] = useState<Branch[]>([]);
  const router = useRouter();

  // Load authorized branches when user changes
  useEffect(() => {
    if (!user) {
      setAuthorizedBranches([]);
      return;
    }

    if (user.role === 'PLATFORM_SUPER_ADMIN' || user.role === 'ORGANIZATION_ADMIN') {
      // Organization Admin can access all branches in org
      api.get('/branches')
        .then((res: any) => {
          const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
          setAuthorizedBranches(list);
          const savedBranch = typeof window !== 'undefined' ? localStorage.getItem('erp_selected_branch') : null;
          if (savedBranch) {
            setSelectedBranchIdState(savedBranch);
          } else {
            setSelectedBranchIdState('all');
          }
        })
        .catch(() => setAuthorizedBranches([]));
    } else {
      // Branch Admin, Teacher, Staff: gather branches from memberships / assignments
      const branchesFromMemberships: Branch[] = (user.branchMemberships || [])
        .map((m) => m.branch)
        .filter(Boolean);

      const branchesFromAssignments: Branch[] = (user.employeeBranchAssignments || [])
        .map((a) => a.branch)
        .filter(Boolean);

      // Unique by branch ID
      const map = new Map<string, Branch>();
      [...branchesFromMemberships, ...branchesFromAssignments].forEach((b) => {
        if (b && b.id) map.set(b.id, b);
      });
      const uniqueBranches = Array.from(map.values());
      setAuthorizedBranches(uniqueBranches);

      // Default to primary or first available
      const primary = uniqueBranches.find((b) => b.id === user.primaryBranchId) || uniqueBranches[0];
      if (primary) {
        setSelectedBranchIdState(primary.id);
      }
    }
  }, [user]);

  const setSelectedBranchId = (id: string) => {
    setSelectedBranchIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('erp_selected_branch', id);
    }
  };

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const data: any = await api.get('/auth/profile');
      if (data) {
        setUser(data as User);
        if (typeof window !== 'undefined') {
          localStorage.setItem('bmn_user', JSON.stringify(data));
        }
        return data as User;
      }
      return null;
    } catch {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bmn_access_token');
        localStorage.removeItem('bmn_refresh_token');
        localStorage.removeItem('bmn_user');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('bmn_user');
      const token = localStorage.getItem('bmn_access_token');
      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // ignore
        }
      }
    }
    refreshUser();
  }, [refreshUser]);

  const handleAuthSuccess = (res: any) => {
    const { accessToken, refreshToken, user: authUser, redirectUrl } = res;
    if (typeof window !== 'undefined') {
      if (accessToken) localStorage.setItem('bmn_access_token', accessToken);
      if (refreshToken) localStorage.setItem('bmn_refresh_token', refreshToken);
      if (authUser) localStorage.setItem('bmn_user', JSON.stringify(authUser));
    }
    setUser(authUser);
    return { redirectUrl, user: authUser };
  };

  const login = async (email: string, password: string, rememberMe = false) => {
    setIsLoading(true);
    try {
      const res: any = await api.post('/auth/login', { email, password, rememberMe });
      return handleAuthSuccess(res);
    } finally {
      setIsLoading(false);
    }
  };

  const platformLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res: any = await api.post('/auth/platform-login', { email, password });
      return handleAuthSuccess(res);
    } finally {
      setIsLoading(false);
    }
  };

  const studentLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res: any = await api.post('/auth/student-login', { email, password });
      return handleAuthSuccess(res);
    } finally {
      setIsLoading(false);
    }
  };

  const parentLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res: any = await api.post('/auth/parent-login', { email, password });
      return handleAuthSuccess(res);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout').catch(() => null);
    } finally {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bmn_access_token');
        localStorage.removeItem('bmn_refresh_token');
        localStorage.removeItem('bmn_user');
        localStorage.removeItem('erp_selected_branch');
      }
      router.push('/login');
    }
  };

  const isPlatformAdmin = user?.role === 'PLATFORM_SUPER_ADMIN';
  const isOrgAdmin = user?.role === 'ORGANIZATION_ADMIN';
  const isBranchAdmin = user?.role === 'BRANCH_ADMIN';
  const isAdmin = isPlatformAdmin || isOrgAdmin || isBranchAdmin || user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const isStaff = user?.role === 'STAFF';
  const isStudent = user?.role === 'STUDENT';
  const isParent = user?.role === 'PARENT';

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isPlatformAdmin,
    isOrgAdmin,
    isBranchAdmin,
    isAdmin,
    isTeacher,
    isStaff,
    isStudent,
    isParent,
    selectedBranchId,
    setSelectedBranchId,
    authorizedBranches,
    login,
    platformLogin,
    studentLogin,
    parentLogin,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
