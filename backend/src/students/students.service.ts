import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(studentUserId: string) {
    const studentUser = await this.prisma.user.findUnique({
      where: { id: studentUserId },
      include: {
        studentProfile: {
          include: {
            branch: {
              include: {
                organization: true,
                branchAdmin: { select: { name: true, email: true } },
              },
            },
            assignedClass: {
              include: {
                subjects: {
                  include: {
                    teacherAssignments: {
                      include: {
                        assignment: {
                          include: {
                            user: { select: { name: true, email: true } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            transferHistory: {
              include: {
                fromBranch: true,
                toBranch: true,
              },
              orderBy: { transferDate: 'desc' },
            },
          },
        },
      },
    });

    if (!studentUser || !studentUser.studentProfile) {
      throw new NotFoundException('Student profile not found');
    }

    const profile = studentUser.studentProfile;
    const branchId = profile.branchId;
    const classId = profile.classId;

    // Fetch timetable
    const timetable = classId
      ? await this.prisma.timetablePeriod.findMany({
          where: { classId },
          orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
          include: {
            subject: true,
            teacher: {
              include: { user: { select: { name: true } } },
            },
          },
        })
      : [];

    // Fetch attendance statistics
    const [attendances, totalAttendanceCount, presentCount] = await Promise.all([
      this.prisma.studentAttendance.findMany({
        where: { studentId: profile.id },
        orderBy: { date: 'desc' },
        take: 10,
      }),
      this.prisma.studentAttendance.count({ where: { studentId: profile.id } }),
      this.prisma.studentAttendance.count({
        where: { studentId: profile.id, status: 'PRESENT' },
      }),
    ]);

    const attendanceRate = totalAttendanceCount > 0
      ? Math.round((presentCount / totalAttendanceCount) * 100)
      : 100;

    // Fetch fees
    const fees = await this.prisma.studentFee.findMany({
      where: { studentId: profile.id },
      include: { category: true, payments: true },
    });

    // Fetch announcements
    const announcements = await this.prisma.announcement.findMany({
      where: {
        OR: [
          { branchId: null },
          { branchId: branchId },
        ],
        targetAudience: { in: ['ALL_ORGANIZATION', 'ALL_BRANCHES', 'SELECTED_BRANCH', 'STUDENTS_ONLY'] },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true } } },
    });

    return {
      student: {
        id: studentUser.id,
        name: studentUser.name,
        email: studentUser.email,
        phone: studentUser.phone,
        status: studentUser.status,
      },
      profile: {
        admissionNumber: profile.admissionNumber,
        studentIdNumber: profile.studentIdNumber,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        address: profile.address,
        admissionClass: profile.admissionClass,
      },
      branch: profile.branch,
      assignedClass: profile.assignedClass,
      transferHistory: profile.transferHistory,
      timetable,
      attendanceSummary: {
        totalDays: totalAttendanceCount,
        presentDays: presentCount,
        attendancePercentage: attendanceRate,
        recent: attendances,
      },
      fees,
      announcements,
    };
  }

  async updateProfile(studentUserId: string, dto: { phone?: string; address?: string; emergencyPhone?: string }) {
    const student = await this.prisma.user.findUnique({
      where: { id: studentUserId },
      include: { studentProfile: true },
    });

    if (!student || !student.studentProfile) throw new NotFoundException('Student not found');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: studentUserId },
        data: {
          ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
        },
      }),
      this.prisma.studentProfile.update({
        where: { id: student.studentProfile.id },
        data: {
          ...(dto.address !== undefined && { address: dto.address?.trim() || null }),
          ...(dto.emergencyPhone !== undefined && { emergencyPhone: dto.emergencyPhone?.trim() || null }),
        },
      }),
    ]);

    return { message: 'Profile updated successfully' };
  }

  async getMyClass(studentUserId: string) {
    const studentUser = await this.prisma.user.findUnique({
      where: { id: studentUserId },
      include: {
        studentProfile: {
          include: {
            branch: true,
            assignedClass: {
              include: {
                subjects: true,
                branch: true,
              },
            },
          },
        },
      },
    });
    if (!studentUser || !studentUser.studentProfile) throw new NotFoundException('Student profile not found');
    const profile = studentUser.studentProfile;
    return {
      assigned: !!profile.assignedClass,
      class: profile.assignedClass,
      branch: profile.branch,
      message: profile.assignedClass
        ? undefined
        : 'Your registration has been approved. Your class will be assigned by the campus admin shortly.',
    };
  }

  async getSchedule(studentUserId: string) {
    const studentUser = await this.prisma.user.findUnique({
      where: { id: studentUserId },
      include: { studentProfile: true },
    });
    if (!studentUser || !studentUser.studentProfile?.classId) return [];
    return this.prisma.timetablePeriod.findMany({
      where: { classId: studentUser.studentProfile.classId },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
      include: {
        subject: true,
        teacher: { include: { user: { select: { name: true } } } },
      },
    });
  }
}
