import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class FeesService {
  constructor(private prisma: PrismaService) {}

  async getFeeCategories(organizationId?: string) {
    const where = organizationId ? { organizationId } : {};
    return this.prisma.feeCategory.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async createFeeCategory(dto: {
    organizationId: string;
    name: string;
    code?: string;
    amount: number;
  }) {
    return this.prisma.feeCategory.create({
      data: {
        organizationId: dto.organizationId,
        name: dto.name.trim(),
        code: dto.code?.toUpperCase().trim() || null,
        amount: Number(dto.amount) || 15000,
      },
    });
  }

  async getStudentFees(branchId?: string, status?: PaymentStatus) {
    const where: any = {};
    if (branchId && branchId !== 'all') where.branchId = branchId;
    if (status) where.status = status;

    return this.prisma.studentFee.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        category: true,
        student: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            assignedClass: true,
            branch: { select: { branchName: true, branchCode: true } },
          },
        },
        payments: true,
      },
    });
  }

  async recordFeePayment(dto: {
    studentFeeId: string;
    amount: number;
    paymentMethod?: string;
    transactionRef?: string;
  }) {
    const studentFee = await this.prisma.studentFee.findUnique({
      where: { id: dto.studentFeeId },
    });
    if (!studentFee) throw new NotFoundException('Student fee record not found');

    const paymentAmount = Number(dto.amount);
    const newPaidAmount = studentFee.amountPaid + paymentAmount;
    const isFullyPaid = newPaidAmount >= studentFee.amountDue;
    const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.feePayment.create({
        data: {
          studentFeeId: dto.studentFeeId,
          amount: paymentAmount,
          paymentMethod: dto.paymentMethod || 'Cash',
          transactionRef: dto.transactionRef || null,
          receiptNumber,
        },
      });

      const updatedFee = await tx.studentFee.update({
        where: { id: dto.studentFeeId },
        data: {
          amountPaid: newPaidAmount,
          status: isFullyPaid ? PaymentStatus.PAID : PaymentStatus.PARTIAL,
        },
        include: { payments: true, category: true, student: true },
      });

      return {
        message: 'Fee payment successfully recorded.',
        payment,
        studentFee: updatedFee,
      };
    });
  }
}
