import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { AnnouncementTarget, Role } from '@prisma/client';

@Injectable()
export class AnnouncementsService {
  constructor(
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
  ) {}

  async create(user: any, dto: {
    title: string;
    content: string;
    priority?: string;
    targetAudience?: AnnouncementTarget;
    targetClass?: string;
    branchId?: string;
    isPinned?: boolean;
  }) {
    const orgId = user.organizationId;
    const branchId = dto.branchId || (dto.targetAudience === AnnouncementTarget.SELECTED_BRANCH ? user.primaryBranchId : null);

    const announcement = await this.prisma.announcement.create({
      data: {
        organizationId: orgId,
        branchId: branchId || null,
        title: dto.title.trim(),
        content: dto.content.trim(),
        priority: dto.priority || 'NORMAL',
        targetAudience: dto.targetAudience || AnnouncementTarget.ALL_ORGANIZATION,
        targetClass: dto.targetClass || null,
        authorId: user.id,
        isPinned: Boolean(dto.isPinned),
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
        branch: { select: { id: true, branchName: true, branchCode: true } },
      },
    });

    await this.activityLogs.log(
      user.id,
      'CREATE_ANNOUNCEMENT',
      'ANNOUNCEMENT',
      announcement.id,
      `Published announcement: ${announcement.title}`,
    );

    return announcement;
  }

  // Branch and role-scoped retrieval
  async findAllForUser(user: any, branchId?: string) {
    const isPlatformAdmin = user.role === Role.PLATFORM_SUPER_ADMIN;
    const isOrgAdmin = user.role === Role.ORGANIZATION_ADMIN;

    const orgId = user.organizationId;
    const effectiveBranchId = branchId && branchId !== 'all' ? branchId : user.primaryBranchId;

    const where: any = {};
    if (orgId && !isPlatformAdmin) {
      where.organizationId = orgId;
    }

    if (!isPlatformAdmin && !isOrgAdmin) {
      // Role & branch scoping
      const audienceConditions: AnnouncementTarget[] = [
        AnnouncementTarget.ALL_ORGANIZATION,
        AnnouncementTarget.ALL_BRANCHES,
        AnnouncementTarget.SELECTED_BRANCH,
      ];

      if (user.role === Role.TEACHER) audienceConditions.push(AnnouncementTarget.TEACHERS_ONLY);
      if (user.role === Role.STAFF) audienceConditions.push(AnnouncementTarget.STAFF_ONLY);
      if (user.role === Role.STUDENT) audienceConditions.push(AnnouncementTarget.STUDENTS_ONLY);
      if (user.role === Role.PARENT) audienceConditions.push(AnnouncementTarget.PARENTS_ONLY);

      where.targetAudience = { in: audienceConditions };

      if (effectiveBranchId) {
        where.OR = [
          { branchId: null }, // Org-wide
          { branchId: effectiveBranchId }, // Specifically for this branch
        ];
      }
    } else if (branchId && branchId !== 'all') {
      where.OR = [
        { branchId: null },
        { branchId },
      ];
    }

    return this.prisma.announcement.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: { select: { id: true, name: true, role: true } },
        branch: { select: { id: true, branchName: true, branchCode: true } },
      },
    });
  }

  async remove(id: string, adminId: string) {
    const item = await this.prisma.announcement.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Announcement not found');

    await this.prisma.announcement.delete({ where: { id } });
    await this.activityLogs.log(adminId, 'DELETE_ANNOUNCEMENT', 'ANNOUNCEMENT', id, `Deleted announcement: ${item.title}`);

    return { message: 'Announcement deleted successfully' };
  }
}
