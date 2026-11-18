import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class TeacherService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(teacherUserId: string) {
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherUserId },
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
                class: {
                  include: {
                    _count: { select: { students: true } },
                  },
                },
                subject: true,
              },
            },
          },
        },
      },
    });

    if (!teacher) throw new NotFoundException('Teacher account not found');

    // Extract all assignment IDs for this teacher
    const assignmentIds = teacher.employeeBranchAssignments.map((a) => a.id);

    // Fetch timetable periods across all assigned branches
    const timetable = await this.prisma.timetablePeriod.findMany({
      where: { teacherId: { in: assignmentIds } },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
      include: {
        class: true,
        subject: true,
        branch: { select: { branchName: true, branchCode: true } },
      },
    });

    // Fetch recent announcements
    const branchIds = teacher.branchMemberships.map((m) => m.branchId);
    const announcements = await this.prisma.announcement.findMany({
      where: {
        OR: [
          { branchId: null },
          { branchId: { in: branchIds } },
        ],
        targetAudience: { in: ['ALL_ORGANIZATION', 'ALL_BRANCHES', 'SELECTED_BRANCH', 'TEACHERS_ONLY'] },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true } } },
    });

    return {
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
      },
      branchAssignments: teacher.employeeBranchAssignments,
      timetable,
      announcements,
    };
  }

  // Teacher marks student attendance for their authorized class
  async markClassAttendance(teacherUserId: string, dto: {
    classId: string;
    date: string;
    attendances: Array<{ studentId: string; status: AttendanceStatus; remarks?: string }>;
  }) {
    const classObj = await this.prisma.class.findUnique({ where: { id: dto.classId } });
    if (!classObj) throw new NotFoundException('Class not found');

    const targetDate = new Date(dto.date);
    targetDate.setHours(0, 0, 0, 0);

    const results = [];
    for (const item of dto.attendances) {
      const rec = await this.prisma.studentAttendance.upsert({
        where: {
          studentId_date: {
            studentId: item.studentId,
            date: targetDate,
          },
        },
        update: {
          status: item.status,
          remarks: item.remarks || null,
        },
        create: {
          branchId: classObj.branchId,
          classId: dto.classId,
          studentId: item.studentId,
          date: targetDate,
          status: item.status,
          remarks: item.remarks || null,
        },
      });
      results.push(rec);
    }

    return {
      message: `Successfully recorded attendance for ${results.length} students on ${dto.date}`,
      count: results.length,
    };
  }

  // Teacher enters exam marks for their authorized subject
  async enterMarks(dto: {
    examSubjectId: string;
    marks: Array<{ studentId: string; marksObtained: number; grade?: string; remarks?: string }>;
  }) {
    const results = [];
    for (const item of dto.marks) {
      const rec = await this.prisma.studentMark.upsert({
        where: {
          examSubjectId_studentId: {
            examSubjectId: dto.examSubjectId,
            studentId: item.studentId,
          },
        },
        update: {
          marksObtained: Number(item.marksObtained),
          grade: item.grade || null,
          remarks: item.remarks || null,
        },
        create: {
          examSubjectId: dto.examSubjectId,
          studentId: item.studentId,
          marksObtained: Number(item.marksObtained),
          grade: item.grade || null,
          remarks: item.remarks || null,
        },
      });
      results.push(rec);
    }

    return {
      message: `Successfully saved marks for ${results.length} students`,
      count: results.length,
    };
  }
}
