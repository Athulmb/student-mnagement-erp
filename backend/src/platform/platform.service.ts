import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  Role,
  AccountStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  OrganizationStatus,
  BranchStatus,
} from '@prisma/client';

@Injectable()
export class PlatformService {
  constructor(private prisma: PrismaService) {}

  async getPlatformDashboard() {
    const [
      totalOrganizations,
      totalBranches,
      totalStudents,
      totalTeachers,
      totalEmployees,
      recentOrganizations,
      subscriptionBreakdown,
    ] = await Promise.all([
      this.prisma.organization.count(),
      this.prisma.branch.count(),
      this.prisma.user.count({ where: { role: Role.STUDENT } }),
      this.prisma.user.count({ where: { role: Role.TEACHER } }),
      this.prisma.employeeBranchAssignment.count(),
      this.prisma.organization.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          branches: {
            select: { id: true, branchName: true, status: true },
          },
          _count: {
            select: { branches: true, users: true },
          },
        },
      }),
      this.prisma.organization.groupBy({
        by: ['subscriptionPlan'],
        _count: true,
      }),
    ]);

    return {
      totalOrganizations,
      totalBranches,
      totalStudents,
      totalTeachers,
      totalEmployees,
      recentOrganizations,
      subscriptionBreakdown,
      platformStatus: 'HEALTHY',
    };
  }

  async getAllOrganizations() {
    return this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        branches: {
          include: {
            branchAdmin: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: {
                studentProfiles: true,
                employeeBranchAssignments: true,
                classes: true,
              },
            },
          },
        },
        _count: {
          select: { branches: true, users: true },
        },
      },
    });
  }

  async onboardSchool(dto: {
    schoolName: string;
    schoolCode: string;
    contactEmail: string;
    contactPhone?: string;
    address?: string;
    district?: string;
    state?: string;
    country?: string;
    website?: string;
    subscriptionPlan?: SubscriptionPlan;
    initialBranchName?: string;
    initialBranchCode?: string;
    adminName: string;
    adminEmail: string;
    adminPhone?: string;
    adminPassword?: string;
  }) {
    const code = dto.schoolCode.toUpperCase().trim();
    const adminEmail = dto.adminEmail.toLowerCase().trim();

    // Verify code uniqueness
    const existingOrg = await this.prisma.organization.findUnique({
      where: { organizationCode: code },
    });
    if (existingOrg) {
      throw new ConflictException(`School organization with code "${code}" already exists`);
    }

    // Verify admin email uniqueness
    const existingUser = await this.prisma.user.findUnique({
      where: { email: adminEmail },
    });
    if (existingUser) {
      throw new ConflictException(`An account with email "${adminEmail}" already exists`);
    }

    const hashedPassword = await bcrypt.hash(dto.adminPassword || 'Admin@123456', 10);
    const branchCode = (dto.initialBranchCode || `${code}-MAIN`).toUpperCase().trim();
    const branchName = dto.initialBranchName || 'Main Campus';

    // Atomic transaction for school onboarding
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Organization
      const org = await tx.organization.create({
        data: {
          organizationName: dto.schoolName.trim(),
          organizationCode: code,
          contactEmail: dto.contactEmail.toLowerCase().trim(),
          contactPhone: dto.contactPhone?.trim() || null,
          address: dto.address?.trim() || null,
          district: dto.district?.trim() || null,
          state: dto.state?.trim() || null,
          country: dto.country || 'India',
          website: dto.website?.trim() || null,
          subscriptionPlan: dto.subscriptionPlan || SubscriptionPlan.STANDARD,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          organizationStatus: OrganizationStatus.ACTIVE,
        },
      });

      // 2. Create Initial Branch
      const branch = await tx.branch.create({
        data: {
          organizationId: org.id,
          branchName: branchName,
          branchCode: branchCode,
          district: dto.district?.trim() || null,
          state: dto.state?.trim() || null,
          status: BranchStatus.ACTIVE,
        },
      });

      // 3. Create Initial Organization Admin
      const admin = await tx.user.create({
        data: {
          name: dto.adminName.trim(),
          email: adminEmail,
          password: hashedPassword,
          phone: dto.adminPhone?.trim() || null,
          role: Role.ORGANIZATION_ADMIN,
          status: AccountStatus.APPROVED,
          organizationId: org.id,
          primaryBranchId: branch.id,
        },
      });

      // 4. Create Branch Membership for Admin
      await tx.branchMembership.create({
        data: {
          userId: admin.id,
          branchId: branch.id,
          isPrimary: true,
          role: Role.ORGANIZATION_ADMIN,
        },
      });

      // Set Branch Admin
      await tx.branch.update({
        where: { id: branch.id },
        data: { branchAdminId: admin.id },
      });

      return { org, branch, admin };
    });

    return {
      message: 'School organization onboarded successfully with primary branch and administrative access.',
      organization: result.org,
      primaryBranch: result.branch,
      admin: {
        id: result.admin.id,
        name: result.admin.name,
        email: result.admin.email,
        temporaryPassword: dto.adminPassword || 'Admin@123456',
      },
    };
  }

  async updateOrganizationStatus(id: string, status: OrganizationStatus) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');

    return this.prisma.organization.update({
      where: { id },
      data: { organizationStatus: status },
    });
  }
}
