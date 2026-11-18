import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll(activeOnly?: boolean) {
    const subjects = await this.prisma.subject.findMany({
      include: {
        class: {
          include: { branch: true },
        },
      },
    });

    return subjects.map((s) => ({
      id: s.id,
      name: `${s.name} - ${s.class.name} (${s.class.branch.branchName})`,
      description: `Course offering in ${s.class.name} ${s.class.section}`,
      duration: 'Academic Session 2026-2027',
      isActive: true,
      classId: s.classId,
      branchId: s.class.branchId,
    }));
  }

  async findOne(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: { class: { include: { branch: true } } },
    });
    if (!subject) throw new NotFoundException('Course subject not found');

    return {
      id: subject.id,
      name: subject.name,
      class: subject.class,
    };
  }

  async create(dto: any, adminId?: string) {
    return { message: 'Course registered' };
  }

  async update(id: string, dto: any, adminId?: string) {
    return { message: 'Course updated' };
  }

  async remove(id: string, adminId?: string) {
    return { message: 'Course removed' };
  }
}
