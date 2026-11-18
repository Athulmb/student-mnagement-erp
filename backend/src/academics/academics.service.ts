import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AcademicsService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // CLASSES & SECTIONS
  // ==========================================
  async getClasses(user: any, branchId?: string) {
    const orgId = user.organizationId;
    const where: any = {};

    if (branchId && branchId !== 'all') {
      where.branchId = branchId;
    } else if (orgId) {
      where.branch = { organizationId: orgId };
    }

    return this.prisma.class.findMany({
      where,
      orderBy: [{ name: 'asc' }, { section: 'asc' }],
      include: {
        branch: { select: { id: true, branchName: true, branchCode: true } },
        subjects: true,
        assignments: {
          include: {
            assignment: {
              include: { user: { select: { name: true, email: true } } },
            },
            subject: true,
          },
        },
        _count: { select: { students: true } },
      },
    });
  }

  async createClass(user: any, dto: any) {
    const branchId = dto.branchId || user.primaryBranchId;
    if (!branchId) throw new BadRequestException('Branch selection is required');

    const name = dto.name.trim();
    const section = (dto.section || 'A').toUpperCase().trim();
    const academicYear = dto.academicYear || '2026-2027';

    const existing = await this.prisma.class.findUnique({
      where: {
        branchId_name_section_academicYear: {
          branchId,
          name,
          section,
          academicYear,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Class ${name}-${section} already exists in this branch for academic year ${academicYear}`);
    }

    return this.prisma.class.create({
      data: {
        branchId,
        name,
        section,
        roomNumber: dto.roomNumber || null,
        academicYear,
        capacity: Number(dto.capacity) || 40,
      },
      include: { branch: true },
    });
  }

  // ==========================================
  // SUBJECTS
  // ==========================================
  async getSubjects(classId: string) {
    return this.prisma.subject.findMany({
      where: { classId },
      include: {
        teacherAssignments: {
          include: {
            assignment: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
      },
    });
  }

  async createSubject(dto: any) {
    return this.prisma.subject.create({
      data: {
        classId: dto.classId,
        name: dto.name.trim(),
        code: dto.code?.toUpperCase().trim() || null,
        totalMarks: Number(dto.totalMarks) || 100,
        passMarks: Number(dto.passMarks) || 40,
      },
    });
  }

  // ==========================================
  // TIMETABLE WITH SCHEDULING CONFLICT CHECK
  // ==========================================
  async getTimetable(query: { branchId?: string; classId?: string; teacherId?: string }) {
    const where: any = {};
    if (query.classId) where.classId = query.classId;
    if (query.teacherId) where.teacherId = query.teacherId;
    if (query.branchId && query.branchId !== 'all') where.branchId = query.branchId;

    return this.prisma.timetablePeriod.findMany({
      where,
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
      include: {
        class: true,
        subject: true,
        teacher: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });
  }

  async addTimetablePeriod(dto: {
    branchId: string;
    classId: string;
    subjectId: string;
    teacherId: string;
    dayOfWeek: string;
    periodNumber: number;
    startTime: string;
    endTime: string;
    roomNumber?: string;
  }) {
    // 1. Conflict Check: Teacher already booked in ANY class on that day and period
    const teacherConflict = await this.prisma.timetablePeriod.findUnique({
      where: {
        teacherId_dayOfWeek_periodNumber: {
          teacherId: dto.teacherId,
          dayOfWeek: dto.dayOfWeek,
          periodNumber: Number(dto.periodNumber),
        },
      },
      include: { class: true },
    });

    if (teacherConflict) {
      throw new ConflictException(
        `Teacher Conflict: This teacher is already scheduled for Period ${dto.periodNumber} on ${dto.dayOfWeek} in ${teacherConflict.class.name} (${teacherConflict.class.section})`,
      );
    }

    // 2. Conflict Check: Class already has another subject in that period
    const classConflict = await this.prisma.timetablePeriod.findUnique({
      where: {
        classId_dayOfWeek_periodNumber: {
          classId: dto.classId,
          dayOfWeek: dto.dayOfWeek,
          periodNumber: Number(dto.periodNumber),
        },
      },
      include: { subject: true },
    });

    if (classConflict) {
      throw new ConflictException(
        `Class Schedule Conflict: This class already has subject "${classConflict.subject.name}" during Period ${dto.periodNumber} on ${dto.dayOfWeek}`,
      );
    }

    return this.prisma.timetablePeriod.create({
      data: {
        branchId: dto.branchId,
        classId: dto.classId,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        dayOfWeek: dto.dayOfWeek,
        periodNumber: Number(dto.periodNumber),
        startTime: dto.startTime,
        endTime: dto.endTime,
        roomNumber: dto.roomNumber || null,
      },
      include: { class: true, subject: true },
    });
  }
}
