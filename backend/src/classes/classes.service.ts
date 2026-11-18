import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async findAll(branchId?: string) {
    const where: any = {};
    if (branchId && branchId !== 'all') where.branchId = branchId;

    const list = await this.prisma.class.findMany({
      where,
      orderBy: [{ name: 'asc' }, { section: 'asc' }],
      include: {
        branch: true,
        subjects: true,
        _count: { select: { students: true } },
      },
    });

    return list.map((c) => ({
      id: c.id,
      name: `${c.name} ${c.section}`,
      branchId: c.branchId,
      branchName: c.branch.branchName,
      roomNumber: c.roomNumber,
      academicYear: c.academicYear,
      capacity: c.capacity,
      status: 'ACTIVE',
      course: {
        id: c.id,
        name: `${c.name} - ${c.branch.branchName}`,
      },
      enrolledCount: c._count.students,
    }));
  }

  async findOne(id: string) {
    const item = await this.prisma.class.findUnique({
      where: { id },
      include: {
        branch: true,
        subjects: true,
        students: {
          include: { user: true },
        },
      },
    });

    if (!item) throw new NotFoundException('Class not found');
    return item;
  }

  async create(dto: any, adminId?: string) {
    return this.prisma.class.create({
      data: {
        branchId: dto.branchId,
        name: dto.name,
        section: dto.section || 'A',
        roomNumber: dto.roomNumber || null,
        academicYear: dto.academicYear || '2026-2027',
      },
    });
  }

  async update(id: string, dto: any, adminId?: string) {
    return this.prisma.class.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.section && { section: dto.section }),
        ...(dto.roomNumber && { roomNumber: dto.roomNumber }),
      },
    });
  }

  async remove(id: string, adminId?: string) {
    await this.prisma.class.delete({ where: { id } });
    return { message: 'Class deleted successfully' };
  }
}
