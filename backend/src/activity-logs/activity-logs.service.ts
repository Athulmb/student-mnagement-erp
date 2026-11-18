import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityLogsService {
  constructor(private prisma: PrismaService) {}

  async log(userId: string, action: string, targetType: string, targetId?: string, details?: string, ipAddress?: string) {
    return this.prisma.activityLog.create({
      data: {
        userId,
        action,
        targetType,
        targetId: targetId || null,
        details: details || null,
        ipAddress: ipAddress || null,
      },
    }).catch(() => null);
  }

  async findAll(limit = 50) {
    return this.prisma.activityLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }
}
