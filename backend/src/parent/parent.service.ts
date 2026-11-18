import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParentService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(parentUserId: string) {
    const parent = await this.prisma.user.findUnique({
      where: { id: parentUserId },
      include: {
        parentProfile: {
          include: {
            childrenLinks: {
              include: {
                student: {
                  include: {
                    user: { select: { id: true, name: true, email: true, phone: true } },
                    branch: { select: { branchName: true, branchCode: true, phone: true } },
                    assignedClass: {
                      include: {
                        subjects: true,
                      },
                    },
                    attendances: {
                      orderBy: { date: 'desc' },
                      take: 5,
                    },
                    studentFees: {
                      include: { category: true, payments: true },
                    },
                    examMarks: {
                      include: {
                        examSubject: {
                          include: { subject: true, exam: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parent || !parent.parentProfile) {
      throw new NotFoundException('Parent profile not found');
    }

    const children = parent.parentProfile.childrenLinks.map((link) => link.student);

    // Fetch announcements
    const announcements = await this.prisma.announcement.findMany({
      where: {
        targetAudience: { in: ['ALL_ORGANIZATION', 'ALL_BRANCHES', 'PARENTS_ONLY'] },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true } } },
    });

    return {
      parent: {
        id: parent.id,
        name: parent.name,
        email: parent.email,
        phone: parent.phone,
      },
      profile: parent.parentProfile,
      children,
      announcements,
    };
  }
}
