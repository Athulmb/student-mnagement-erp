import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceStatus, LeaveStatus } from '@prisma/client';

@Injectable()
export class HrmsService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // EMPLOYEE ATTENDANCE
  // ==========================================
  async getEmployeeAttendance(branchId?: string, dateStr?: string) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const where: any = { date: targetDate };
    if (branchId && branchId !== 'all') {
      where.branchId = branchId;
    }

    return this.prisma.employeeAttendance.findMany({
      where,
      include: {
        branch: { select: { branchName: true, branchCode: true } },
        assignment: {
          include: {
            user: { select: { name: true, email: true, role: true } },
            department: true,
          },
        },
      },
    });
  }

  async markEmployeeAttendance(dto: {
    branchId: string;
    assignmentId: string;
    date: string;
    status: AttendanceStatus;
    checkIn?: string;
    checkOut?: string;
    remarks?: string;
  }) {
    const d = new Date(dto.date);
    d.setHours(0, 0, 0, 0);

    return this.prisma.employeeAttendance.upsert({
      where: {
        assignmentId_date: {
          assignmentId: dto.assignmentId,
          date: d,
        },
      },
      update: {
        status: dto.status,
        checkIn: dto.checkIn || null,
        checkOut: dto.checkOut || null,
        remarks: dto.remarks || null,
      },
      create: {
        branchId: dto.branchId,
        assignmentId: dto.assignmentId,
        date: d,
        status: dto.status,
        checkIn: dto.checkIn || null,
        checkOut: dto.checkOut || null,
        remarks: dto.remarks || null,
      },
    });
  }

  // ==========================================
  // LEAVE MANAGEMENT
  // ==========================================
  async getLeaveTypes() {
    return this.prisma.leaveType.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getLeaveApplications(user: any, status?: LeaveStatus) {
    const where: any = {};
    if (status) where.status = status;

    // If teacher or staff, see only personal leaves
    if (user.role === 'TEACHER' || user.role === 'STAFF') {
      where.userId = user.id;
    }

    return this.prisma.leaveApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        leaveType: true,
      },
    });
  }

  async applyLeave(user: any, dto: {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    return this.prisma.leaveApplication.create({
      data: {
        userId: user.id,
        leaveTypeId: dto.leaveTypeId,
        startDate: start,
        endDate: end,
        daysCount,
        reason: dto.reason.trim(),
        status: LeaveStatus.PENDING,
      },
      include: { leaveType: true },
    });
  }

  async reviewLeave(adminId: string, applicationId: string, dto: {
    status: LeaveStatus;
    reviewNote?: string;
  }) {
    const application = await this.prisma.leaveApplication.findUnique({
      where: { id: applicationId },
    });
    if (!application) throw new NotFoundException('Leave application not found');

    return this.prisma.leaveApplication.update({
      where: { id: applicationId },
      data: {
        status: dto.status,
        reviewNote: dto.reviewNote || null,
        reviewedAt: new Date(),
        reviewedById: adminId,
      },
    });
  }
}
