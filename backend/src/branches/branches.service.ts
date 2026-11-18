import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, BranchStatus, AccountStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async getPublicBranches() {
    return this.prisma.branch.findMany({
      where: { status: BranchStatus.ACTIVE },
      select: {
        id: true,
        branchName: true,
        branchCode: true,
        district: true,
        state: true,
        country: true,
        academicYear: true,
        organization: {
          select: {
            id: true,
            organizationName: true,
            organizationCode: true,
          },
        },
      },
      orderBy: { branchName: 'asc' },
    });
  }

  async getBranchesForUser(user: any) {
    if (user.role === Role.PLATFORM_SUPER_ADMIN) {
      return this.prisma.branch.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          organization: { select: { organizationName: true, organizationCode: true } },
          branchAdmin: { select: { id: true, name: true, email: true } },
          _count: {
            select: {
              studentProfiles: true,
              employeeBranchAssignments: true,
              classes: true,
            },
          },
        },
      });
    }

    if (user.role === Role.ORGANIZATION_ADMIN) {
      if (!user.organizationId) {
        return [];
      }
      return this.prisma.branch.findMany({
        where: { organizationId: user.organizationId },
        orderBy: { createdAt: 'desc' },
        include: {
          branchAdmin: { select: { id: true, name: true, email: true } },
          _count: {
            select: {
              studentProfiles: true,
              employeeBranchAssignments: true,
              classes: true,
            },
          },
        },
      });
    }

    // For Branch Admin, Teacher, Staff, Student: fetch only authorized branch memberships
    const memberships = await this.prisma.branchMembership.findMany({
      where: { userId: user.id },
      include: {
        branch: {
          include: {
            organization: { select: { organizationName: true, organizationCode: true } },
            branchAdmin: { select: { id: true, name: true, email: true } },
            _count: {
              select: {
                studentProfiles: true,
                employeeBranchAssignments: true,
                classes: true,
              },
            },
          },
        },
      },
    });

    return memberships.map((m) => ({
      ...m.branch,
      isPrimaryBranch: m.isPrimary,
      assignedRole: m.role,
    }));
  }

  async createBranch(
    user: any,
    dto: {
      organizationId?: string;
      branchName: string;
      branchCode: string;
      address?: string;
      district?: string;
      state?: string;
      country?: string;
      phone?: string;
      email?: string;
      academicYear?: string;
      adminName?: string;
      adminEmail?: string;
      adminPhone?: string;
      adminPassword?: string;
    },
  ) {
    const orgId = user.organizationId || dto.organizationId;
    if (!orgId) {
      throw new ForbiddenException('Organization context is required to create a branch');
    }

    const code = dto.branchCode.toUpperCase().trim();

    // Verify branchCode uniqueness within this organization
    const existing = await this.prisma.branch.findUnique({
      where: {
        organizationId_branchCode: {
          organizationId: orgId,
          branchCode: code,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Branch with code "${code}" already exists in this organization`);
    }

    return this.prisma.$transaction(async (tx) => {
      let branchAdminId: string | null = null;

      // Optional create branch admin
      if (dto.adminEmail) {
        const adminEmail = dto.adminEmail.toLowerCase().trim();
        let adminUser = await tx.user.findUnique({ where: { email: adminEmail } });

        if (!adminUser) {
          const hashedPassword = await bcrypt.hash(dto.adminPassword || 'Admin@123', 10);
          adminUser = await tx.user.create({
            data: {
              name: dto.adminName || 'Branch Administrator',
              email: adminEmail,
              phone: dto.adminPhone || null,
              password: hashedPassword,
              role: Role.BRANCH_ADMIN,
              status: AccountStatus.APPROVED,
              organizationId: orgId,
            },
          });
        }
        branchAdminId = adminUser.id;
      }

      const branch = await tx.branch.create({
        data: {
          organizationId: orgId,
          branchName: dto.branchName.trim(),
          branchCode: code,
          address: dto.address?.trim() || null,
          district: dto.district?.trim() || null,
          state: dto.state?.trim() || null,
          country: dto.country || 'India',
          phone: dto.phone?.trim() || null,
          email: dto.email?.trim() || null,
          academicYear: dto.academicYear || '2026-2027',
          status: BranchStatus.ACTIVE,
          branchAdminId: branchAdminId,
        },
      });

      if (branchAdminId) {
        await tx.branchMembership.upsert({
          where: { userId_branchId: { userId: branchAdminId, branchId: branch.id } },
          update: {},
          create: {
            userId: branchAdminId,
            branchId: branch.id,
            isPrimary: true,
            role: Role.BRANCH_ADMIN,
          },
        });
      }

      return branch;
    });
  }

  async getBranchDetails(user: any, branchId: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        organization: true,
        branchAdmin: {
          select: { id: true, name: true, email: true, phone: true },
        },
        _count: {
          select: {
            studentProfiles: true,
            employeeBranchAssignments: true,
            classes: true,
            examinations: true,
          },
        },
      },
    });

    if (!branch) throw new NotFoundException('Branch not found');

    // Tenant check
    if (user.role !== Role.PLATFORM_SUPER_ADMIN && branch.organizationId !== user.organizationId) {
      throw new ForbiddenException('You do not have access to this branch');
    }

    return branch;
  }

  async updateBranch(user: any, branchId: string, dto: any) {
    await this.getBranchDetails(user, branchId);

    return this.prisma.branch.update({
      where: { id: branchId },
      data: {
        ...(dto.branchName && { branchName: dto.branchName.trim() }),
        ...(dto.address !== undefined && { address: dto.address?.trim() || null }),
        ...(dto.district !== undefined && { district: dto.district?.trim() || null }),
        ...(dto.state !== undefined && { state: dto.state?.trim() || null }),
        ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
        ...(dto.email !== undefined && { email: dto.email?.trim() || null }),
        ...(dto.academicYear && { academicYear: dto.academicYear.trim() }),
        ...(dto.branchAdminId && { branchAdminId: dto.branchAdminId }),
      },
    });
  }

  async updateBranchStatus(user: any, branchId: string, status: BranchStatus) {
    await this.getBranchDetails(user, branchId);

    return this.prisma.branch.update({
      where: { id: branchId },
      data: { status },
    });
  }

  async getBranchPerformance(user: any, branchId: string) {
    const branch = await this.getBranchDetails(user, branchId);

    const [
      studentsCount,
      teachersCount,
      staffCount,
      classesCount,
      recentAttendances,
      feesSummary,
    ] = await Promise.all([
      this.prisma.studentProfile.count({ where: { branchId } }),
      this.prisma.employeeBranchAssignment.count({
        where: { branchId, user: { role: Role.TEACHER } },
      }),
      this.prisma.employeeBranchAssignment.count({
        where: { branchId, user: { role: Role.STAFF } },
      }),
      this.prisma.class.count({ where: { branchId } }),
      this.prisma.studentAttendance.groupBy({
        by: ['status'],
        where: { branchId },
        _count: true,
      }),
      this.prisma.studentFee.aggregate({
        where: { branchId },
        _sum: { amountDue: true, amountPaid: true },
      }),
    ]);

    return {
      branch,
      metrics: {
        studentsCount,
        teachersCount,
        staffCount,
        classesCount,
        totalFeesExpected: feesSummary._sum.amountDue || 0,
        totalFeesCollected: feesSummary._sum.amountPaid || 0,
        attendanceBreakdown: recentAttendances,
      },
    };
  }
}
