import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import {
  Role,
  AccountStatus,
  EmploymentType,
  PaymentStatus,
} from '@prisma/client';
import { Gender } from '../common/enums/gender.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
  ) {}

  private sanitize(user: any) {
    if (!user) return null;
    const { password, ...sanitized } = user;
    return sanitized;
  }

  // Multi-branch aware Dashboard overview
  async getDashboard(user: any, requestedBranchId?: string) {
    const isPlatformAdmin = user.role === Role.PLATFORM_SUPER_ADMIN;
    const isOrgAdmin = user.role === Role.ORGANIZATION_ADMIN;
    const orgId = user.organizationId;

    const orgWhere = orgId ? { organizationId: orgId } : {};

    // Determine target branch: if specific branch requested or user is branch admin
    let branchId = requestedBranchId;
    if (!branchId || branchId === 'all') {
      if (!isPlatformAdmin && !isOrgAdmin) {
        branchId = user.primaryBranchId || undefined;
      } else {
        branchId = undefined; // consolidated
      }
    }

    if (!branchId) {
      // CONSOLIDATED ORGANIZATION DASHBOARD
      const [
        totalBranches,
        branchesList,
        totalStudents,
        pendingApprovals,
        approvedStudents,
        totalTeachers,
        totalStaff,
        totalClasses,
        feeAggregates,
        payrollAggregates,
        recentStudents,
        pendingAdmissions,
        recentActivities,
      ] = await Promise.all([
        this.prisma.branch.count({ where: orgWhere }),
        this.prisma.branch.findMany({
          where: orgWhere,
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
        }),
        this.prisma.user.count({
          where: {
            ...orgWhere,
            role: Role.STUDENT,
          },
        }),
        this.prisma.user.count({
          where: {
            ...orgWhere,
            role: Role.STUDENT,
            status: AccountStatus.PENDING,
          },
        }),
        this.prisma.user.count({
          where: {
            ...orgWhere,
            role: Role.STUDENT,
            status: AccountStatus.APPROVED,
          },
        }),
        this.prisma.user.count({
          where: {
            ...orgWhere,
            role: Role.TEACHER,
          },
        }),
        this.prisma.user.count({
          where: {
            ...orgWhere,
            role: Role.STAFF,
          },
        }),
        this.prisma.class.count({
          where: orgId ? { branch: { organizationId: orgId } } : {},
        }),
        this.prisma.studentFee.aggregate({
          where: orgId ? { branch: { organizationId: orgId } } : {},
          _sum: { amountDue: true, amountPaid: true },
        }),
        this.prisma.payrollItem.aggregate({
          where: orgId ? { assignment: { branch: { organizationId: orgId } } } : {},
          _sum: { netSalary: true },
        }),
        this.prisma.user.findMany({
          where: { ...orgWhere, role: Role.STUDENT },
          take: 6,
          orderBy: { createdAt: 'desc' },
          include: {
            studentProfile: {
              include: { branch: true, assignedClass: true },
            },
          },
        }),
        this.prisma.user.findMany({
          where: { ...orgWhere, role: Role.STUDENT, status: AccountStatus.PENDING },
          take: 6,
          orderBy: { createdAt: 'desc' },
          include: {
            studentProfile: {
              include: { branch: true },
            },
          },
        }),
        this.prisma.activityLog.findMany({
          where: orgId ? { organizationId: orgId } : {},
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true, email: true, role: true } } },
        }),
      ]);

      return {
        scope: 'CONSOLIDATED_ORGANIZATION',
        selectedBranchId: 'all',
        totalBranches,
        branchesList,
        totalStudents,
        pendingApprovals,
        approvedStudents,
        totalTeachers,
        totalStaff,
        totalClasses,
        totalFeeExpected: feeAggregates._sum.amountDue || 0,
        totalFeeCollected: feeAggregates._sum.amountPaid || 0,
        totalSalaryExpense: payrollAggregates._sum.netSalary || 0,
        recentStudents: recentStudents.map((s) => this.sanitize(s)),
        pendingAdmissions: pendingAdmissions.map((s) => this.sanitize(s)),
        recentActivities,
      };
    } else {
      // BRANCH-SPECIFIC DASHBOARD
      const targetBranch = await this.prisma.branch.findUnique({
        where: { id: branchId },
        include: {
          organization: true,
          branchAdmin: { select: { id: true, name: true, email: true } },
        },
      });

      if (!targetBranch) throw new NotFoundException('Branch not found');

      const [
        branchStudents,
        pendingApprovals,
        approvedStudents,
        branchTeachers,
        branchStaff,
        branchClasses,
        attendanceStats,
        feesAggregate,
        payrollAggregate,
        recentStudents,
        pendingAdmissions,
      ] = await Promise.all([
        this.prisma.studentProfile.count({ where: { branchId } }),
        this.prisma.user.count({
          where: {
            primaryBranchId: branchId,
            role: Role.STUDENT,
            status: AccountStatus.PENDING,
          },
        }),
        this.prisma.user.count({
          where: {
            primaryBranchId: branchId,
            role: Role.STUDENT,
            status: AccountStatus.APPROVED,
          },
        }),
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
        this.prisma.payrollItem.aggregate({
          where: { assignment: { branchId } },
          _sum: { netSalary: true },
        }),
        this.prisma.user.findMany({
          where: { primaryBranchId: branchId, role: Role.STUDENT },
          take: 6,
          orderBy: { createdAt: 'desc' },
          include: {
            studentProfile: {
              include: { branch: true, assignedClass: true },
            },
          },
        }),
        this.prisma.user.findMany({
          where: {
            primaryBranchId: branchId,
            role: Role.STUDENT,
            status: AccountStatus.PENDING,
          },
          take: 6,
          orderBy: { createdAt: 'desc' },
          include: {
            studentProfile: {
              include: { branch: true },
            },
          },
        }),
      ]);

      return {
        scope: 'BRANCH_SPECIFIC',
        selectedBranchId: branchId,
        branch: targetBranch,
        totalStudents: branchStudents,
        pendingApprovals,
        approvedStudents,
        totalTeachers: branchTeachers,
        totalStaff: branchStaff,
        totalClasses: branchClasses,
        totalFeeExpected: feesAggregate._sum.amountDue || 0,
        totalFeeCollected: feesAggregate._sum.amountPaid || 0,
        totalSalaryExpense: payrollAggregate._sum.netSalary || 0,
        attendanceStats,
        recentStudents: recentStudents.map((s) => this.sanitize(s)),
        pendingAdmissions: pendingAdmissions.map((s) => this.sanitize(s)),
      };
    }
  }

  // Branch Comparison Analytics for Organization Admin
  async getBranchComparison(user: any) {
    const orgId = user.organizationId;
    const branches = await this.prisma.branch.findMany({
      where: orgId ? { organizationId: orgId } : {},
      include: {
        branchAdmin: { select: { name: true, email: true } },
        _count: {
          select: {
            studentProfiles: true,
            employeeBranchAssignments: true,
            classes: true,
          },
        },
      },
    });

    const metrics = await Promise.all(
      branches.map(async (b) => {
        const [fees, payroll, attendance] = await Promise.all([
          this.prisma.studentFee.aggregate({
            where: { branchId: b.id },
            _sum: { amountDue: true, amountPaid: true },
          }),
          this.prisma.payrollItem.aggregate({
            where: { assignment: { branchId: b.id } },
            _sum: { netSalary: true },
          }),
          this.prisma.studentAttendance.count({
            where: { branchId: b.id, status: 'PRESENT' },
          }),
        ]);

        return {
          branchId: b.id,
          branchName: b.branchName,
          branchCode: b.branchCode,
          district: b.district,
          students: b._count.studentProfiles,
          employees: b._count.employeeBranchAssignments,
          classes: b._count.classes,
          feeCollected: fees._sum.amountPaid || 0,
          salaryExpense: payroll._sum.netSalary || 0,
          presentAttendanceCount: attendance,
        };
      }),
    );

    return metrics;
  }

  // ==========================================
  // MULTI-BRANCH TEACHER MANAGEMENT
  // ==========================================
  async getTeachers(user: any, branchId?: string, search?: string) {
    const orgId = user.organizationId;
    const where: any = {
      role: Role.TEACHER,
      ...(orgId && { organizationId: orgId }),
    };

    if (branchId && branchId !== 'all') {
      where.employeeBranchAssignments = {
        some: { branchId: branchId },
      };
    }

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { phone: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const teachers = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        branchMemberships: {
          include: { branch: true },
        },
        employeeBranchAssignments: {
          include: {
            branch: true,
            department: true,
            teacherAssignments: {
              include: {
                class: true,
                subject: true,
              },
            },
          },
        },
      },
    });

    return teachers.map((t) => this.sanitize(t));
  }

  async createTeacher(user: any, dto: any) {
    const orgId = user.organizationId || dto.organizationId;
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new ConflictException('An account with this email address already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password || 'Teacher@123', 10);
    const branchId = dto.branchId || user.primaryBranchId;

    if (!branchId) {
      throw new BadRequestException('Primary branch assignment is required');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create teacher user
      const teacher = await tx.user.create({
        data: {
          name: dto.name.trim(),
          email: normalizedEmail,
          phone: dto.phone?.trim() || null,
          password: hashedPassword,
          role: Role.TEACHER,
          status: AccountStatus.APPROVED,
          organizationId: orgId,
          primaryBranchId: branchId,
        },
      });

      // Create branch membership
      await tx.branchMembership.create({
        data: {
          userId: teacher.id,
          branchId: branchId,
          isPrimary: true,
          role: Role.TEACHER,
        },
      });

      // Create employee branch assignment
      const employeeId = dto.employeeId || `EMP-${Date.now().toString().slice(-5)}`;
      const assignment = await tx.employeeBranchAssignment.create({
        data: {
          userId: teacher.id,
          branchId: branchId,
          employeeId: employeeId,
          departmentId: dto.departmentId || null,
          designation: dto.designation || 'Teacher',
          employmentType: (dto.employmentType as EmploymentType) || EmploymentType.FULL_TIME,
          basicSalary: Number(dto.basicSalary) || 25000,
          houseAllowance: Number(dto.houseAllowance) || 3000,
          otherAllowance: Number(dto.otherAllowance) || 2000,
          isPrimary: true,
          bankAccount: dto.bankAccount || null,
          bankName: dto.bankName || null,
          ifscCode: dto.ifscCode || null,
        },
      });

      // Optional assign to class and subject
      if (dto.classId && dto.subjectId) {
        await tx.teacherAssignment.create({
          data: {
            assignmentId: assignment.id,
            classId: dto.classId,
            subjectId: dto.subjectId,
            isClassTeacher: Boolean(dto.isClassTeacher),
          },
        });
      }

      return teacher;
    });
  }

  // Assign existing employee to an additional branch
  async assignEmployeeToBranch(user: any, employeeUserId: string, dto: any) {
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeUserId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const branch = await this.prisma.branch.findUnique({
      where: { id: dto.branchId },
    });
    if (!branch) throw new NotFoundException('Target branch not found');

    return this.prisma.$transaction(async (tx) => {
      // Add branch membership if not already present
      await tx.branchMembership.upsert({
        where: { userId_branchId: { userId: employee.id, branchId: dto.branchId } },
        update: {},
        create: {
          userId: employee.id,
          branchId: dto.branchId,
          isPrimary: false,
          role: employee.role,
        },
      });

      // Create branch assignment
      const empId = dto.employeeId || `EMP-${branch.branchCode}-${Date.now().toString().slice(-4)}`;
      const assignment = await tx.employeeBranchAssignment.create({
        data: {
          userId: employee.id,
          branchId: dto.branchId,
          employeeId: empId,
          departmentId: dto.departmentId || null,
          designation: dto.designation || 'Faculty',
          employmentType: (dto.employmentType as EmploymentType) || EmploymentType.PART_TIME,
          basicSalary: Number(dto.basicSalary) || 20000,
          houseAllowance: Number(dto.houseAllowance) || 2000,
          otherAllowance: Number(dto.otherAllowance) || 1000,
          isPrimary: false,
        },
      });

      if (dto.classId && dto.subjectId) {
        await tx.teacherAssignment.create({
          data: {
            assignmentId: assignment.id,
            classId: dto.classId,
            subjectId: dto.subjectId,
            isClassTeacher: Boolean(dto.isClassTeacher),
          },
        });
      }

      return assignment;
    });
  }

  // ==========================================
  // STAFF MANAGEMENT
  // ==========================================
  async getStaff(user: any, branchId?: string) {
    const orgId = user.organizationId;
    const where: any = {
      role: Role.STAFF,
      ...(orgId && { organizationId: orgId }),
    };

    if (branchId && branchId !== 'all') {
      where.employeeBranchAssignments = { some: { branchId } };
    }

    const staff = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        employeeBranchAssignments: {
          include: { branch: true, department: true },
        },
      },
    });

    return staff.map((s) => this.sanitize(s));
  }

  async createStaff(user: any, dto: any) {
    const orgId = user.organizationId || dto.organizationId;
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new ConflictException('An account with this email address already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password || 'Staff@123', 10);
    const branchId = dto.branchId || user.primaryBranchId;

    return this.prisma.$transaction(async (tx) => {
      const staffUser = await tx.user.create({
        data: {
          name: dto.name.trim(),
          email: normalizedEmail,
          phone: dto.phone?.trim() || null,
          password: hashedPassword,
          role: Role.STAFF,
          status: AccountStatus.APPROVED,
          organizationId: orgId,
          primaryBranchId: branchId,
        },
      });

      await tx.branchMembership.create({
        data: {
          userId: staffUser.id,
          branchId: branchId,
          isPrimary: true,
          role: Role.STAFF,
        },
      });

      const empId = dto.employeeId || `STF-${Date.now().toString().slice(-5)}`;
      await tx.employeeBranchAssignment.create({
        data: {
          userId: staffUser.id,
          branchId: branchId,
          employeeId: empId,
          departmentId: dto.departmentId || null,
          designation: dto.designation || 'Administrative Staff',
          employmentType: (dto.employmentType as EmploymentType) || EmploymentType.FULL_TIME,
          basicSalary: Number(dto.basicSalary) || 22000,
          houseAllowance: Number(dto.houseAllowance) || 3000,
          otherAllowance: Number(dto.otherAllowance) || 1500,
          isPrimary: true,
        },
      });

      return staffUser;
    });
  }

  // ==========================================
  // STUDENT ADMISSION & BRANCH TRANSFERS
  // ==========================================
  async getStudents(user: any, query: any) {
    const orgId = user.organizationId;
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {
      role: Role.STUDENT,
      ...(orgId && { organizationId: orgId }),
    };

    if (query.branchId && query.branchId !== 'all') {
      where.primaryBranchId = query.branchId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search && query.search.trim()) {
      where.OR = [
        { name: { contains: query.search.trim(), mode: 'insensitive' } },
        { email: { contains: query.search.trim(), mode: 'insensitive' } },
        { phone: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          studentProfile: {
            include: {
              branch: true,
              assignedClass: true,
              transferHistory: {
                include: { fromBranch: true, toBranch: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      items: items.map((i) => this.sanitize(i)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPendingStudents(user: any, branchId?: string) {
    const orgId = user.organizationId;
    const where: any = {
      role: Role.STUDENT,
      status: AccountStatus.PENDING,
      ...(orgId && { organizationId: orgId }),
    };

    if (branchId && branchId !== 'all') {
      where.primaryBranchId = branchId;
    }

    const pending = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        studentProfile: {
          include: { branch: true },
        },
      },
    });

    return pending.map((p) => this.sanitize(p));
  }

  async approveStudent(id: string, adminId: string, classId?: string) {
    const student = await this.prisma.user.findUnique({
      where: { id },
      include: { studentProfile: true },
    });

    if (!student) throw new NotFoundException('Student account not found');

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: {
          status: AccountStatus.APPROVED,
          approvedAt: new Date(),
          approvedById: adminId,
        },
      });

      if (classId && student.studentProfile) {
        await tx.studentProfile.update({
          where: { id: student.studentProfile.id },
          data: { classId },
        });
      }

      return u;
    });

    await this.activityLogs.log(
      adminId,
      'APPROVE_STUDENT',
      'USER',
      id,
      `Approved student admission for ${student.name}`,
    );

    return {
      message: 'Student application successfully approved. Student is now authorized to log in.',
      student: this.sanitize(updated),
    };
  }

  async rejectStudent(id: string, adminId: string, reason: string) {
    const student = await this.prisma.user.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student account not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        status: AccountStatus.REJECTED,
        rejectionReason: reason || 'Application rejected by admissions committee',
      },
    });

    await this.activityLogs.log(
      adminId,
      'REJECT_STUDENT',
      'USER',
      id,
      `Rejected student application for ${student.name}. Reason: ${reason}`,
    );

    return {
      message: 'Student application has been marked as rejected.',
      student: this.sanitize(updated),
    };
  }

  // Student Branch Transfer Workflow (Preserves historical records)
  async transferStudentBranch(
    adminId: string,
    dto: {
      studentUserId: string;
      toBranchId: string;
      newClassId?: string;
      reason: string;
    },
  ) {
    const studentUser = await this.prisma.user.findUnique({
      where: { id: dto.studentUserId },
      include: {
        studentProfile: {
          include: { branch: true, assignedClass: true },
        },
      },
    });

    if (!studentUser || !studentUser.studentProfile) {
      throw new NotFoundException('Student profile not found');
    }

    const currentProfile = studentUser.studentProfile;
    const fromBranchId = currentProfile.branchId;

    if (fromBranchId === dto.toBranchId) {
      throw new BadRequestException('Target branch must be different from current branch');
    }

    const toBranch = await this.prisma.branch.findUnique({ where: { id: dto.toBranchId } });
    if (!toBranch) throw new NotFoundException('Target branch not found');

    const previousClassSummary = currentProfile.assignedClass
      ? `${currentProfile.assignedClass.name}${currentProfile.assignedClass.section} (${currentProfile.branch.branchName})`
      : currentProfile.admissionClass || 'Unassigned';

    // Perform atomic transfer
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Record transfer history
      const history = await tx.branchTransferHistory.create({
        data: {
          studentId: currentProfile.id,
          fromBranchId: fromBranchId,
          toBranchId: dto.toBranchId,
          reason: dto.reason,
          previousClass: previousClassSummary,
          authorizedById: adminId,
          transferDate: new Date(),
        },
      });

      // 2. Update Student Profile with new branch and class
      const updatedProfile = await tx.studentProfile.update({
        where: { id: currentProfile.id },
        data: {
          branchId: dto.toBranchId,
          classId: dto.newClassId || null,
        },
      });

      // 3. Update User primaryBranchId
      await tx.user.update({
        where: { id: studentUser.id },
        data: { primaryBranchId: dto.toBranchId },
      });

      // 4. Update or add branch membership
      await tx.branchMembership.upsert({
        where: { userId_branchId: { userId: studentUser.id, branchId: dto.toBranchId } },
        update: { isPrimary: true },
        create: {
          userId: studentUser.id,
          branchId: dto.toBranchId,
          isPrimary: true,
          role: Role.STUDENT,
        },
      });

      // Demote old membership primary flag
      await tx.branchMembership.updateMany({
        where: { userId: studentUser.id, branchId: fromBranchId },
        data: { isPrimary: false },
      });

      return { history, updatedProfile };
    });

    await this.activityLogs.log(
      adminId,
      'TRANSFER_STUDENT_BRANCH',
      'STUDENT',
      studentUser.id,
      `Transferred student ${studentUser.name} from ${currentProfile.branch.branchName} to ${toBranch.branchName}`,
    );

    return {
      message: `Student successfully transferred to ${toBranch.branchName}. Academic history preserved.`,
      transferRecord: result.history,
    };
  }

  // Create Student directly from Admin
  async createStudentByAdmin(user: any, dto: any, adminId: string) {
    const orgId = user.organizationId || dto.organizationId;
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new ConflictException('A student with this email address already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password || 'Student@123456', 10);
    const branchId = dto.branchId || user.primaryBranchId;

    if (!branchId) throw new BadRequestException('Branch assignment is required');

    const status = dto.status || AccountStatus.APPROVED;
    const admissionNumber = dto.admissionNumber || `ADM-${Date.now().toString().slice(-6)}`;

    return this.prisma.$transaction(async (tx) => {
      const studentUser = await tx.user.create({
        data: {
          name: dto.name.trim(),
          email: normalizedEmail,
          phone: dto.phone?.trim() || null,
          password: hashedPassword,
          role: Role.STUDENT,
          status,
          organizationId: orgId,
          primaryBranchId: branchId,
          approvedAt: status === AccountStatus.APPROVED ? new Date() : null,
          approvedById: status === AccountStatus.APPROVED ? adminId : null,
        },
      });

      await tx.studentProfile.create({
        data: {
          userId: studentUser.id,
          branchId,
          admissionNumber,
          studentIdNumber: dto.studentIdNumber || null,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          gender: (dto.gender as Gender) || Gender.MALE,
          address: dto.address?.trim() || null,
          admissionClass: dto.admissionClass || 'Class 8',
          classId: dto.classId || null,
        },
      });

      await tx.branchMembership.create({
        data: {
          userId: studentUser.id,
          branchId,
          isPrimary: true,
          role: Role.STUDENT,
        },
      });

      return studentUser;
    });
  }
}
