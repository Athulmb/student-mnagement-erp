import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        organization: true,
        branchMemberships: {
          include: { branch: true },
        },
        studentProfile: {
          include: { branch: true, assignedClass: true },
        },
        employeeBranchAssignments: {
          include: { branch: true },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: true,
        branchMemberships: {
          include: { branch: true },
        },
        studentProfile: {
          include: { branch: true, assignedClass: true },
        },
        employeeBranchAssignments: {
          include: { branch: true },
        },
      },
    });
  }
}
