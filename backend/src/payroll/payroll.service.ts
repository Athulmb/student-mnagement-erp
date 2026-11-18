import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  async getPayrolls(branchId?: string, year?: number) {
    const where: any = {};
    if (branchId && branchId !== 'all') where.branchId = branchId;
    if (year) where.year = Number(year);

    return this.prisma.payroll.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        branch: { select: { id: true, branchName: true, branchCode: true } },
        items: {
          include: {
            assignment: {
              include: {
                user: { select: { id: true, name: true, email: true, role: true } },
                department: true,
              },
            },
          },
        },
      },
    });
  }

  // Generate monthly payroll for a branch
  async generateBranchPayroll(dto: {
    branchId: string;
    month: number;
    year: number;
  }) {
    const branch = await this.prisma.branch.findUnique({ where: { id: dto.branchId } });
    if (!branch) throw new NotFoundException('Branch not found');

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const periodName = `${monthNames[dto.month - 1]} ${dto.year}`;

    // Verify duplicate run
    const existing = await this.prisma.payroll.findUnique({
      where: {
        branchId_month_year: {
          branchId: dto.branchId,
          month: Number(dto.month),
          year: Number(dto.year),
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Payroll for ${branch.branchName} for ${periodName} has already been generated.`,
      );
    }

    // Fetch all active employees assigned to this branch
    const assignments = await this.prisma.employeeBranchAssignment.findMany({
      where: { branchId: dto.branchId, status: 'APPROVED' },
      include: { user: true },
    });

    if (assignments.length === 0) {
      throw new BadRequestException('No active employee assignments found in this branch to generate payroll');
    }

    return this.prisma.$transaction(async (tx) => {
      let totalGross = 0;
      let totalNet = 0;

      const payroll = await tx.payroll.create({
        data: {
          branchId: dto.branchId,
          month: Number(dto.month),
          year: Number(dto.year),
          periodName,
          status: PaymentStatus.PENDING,
        },
      });

      for (const a of assignments) {
        const basic = a.basicSalary || 25000;
        const allowances = (a.houseAllowance || 0) + (a.otherAllowance || 0);
        const bonus = 0;
        const deductions = Math.round(basic * 0.05); // standard 5% tax/provident fund deduction
        const net = basic + allowances + bonus - deductions;

        totalGross += basic + allowances;
        totalNet += net;

        await tx.payrollItem.create({
          data: {
            payrollId: payroll.id,
            assignmentId: a.id,
            basicSalary: basic,
            allowances,
            bonus,
            deductions,
            netSalary: net,
            paymentStatus: PaymentStatus.PENDING,
            remarks: `Monthly salary for ${periodName}`,
          },
        });
      }

      const updated = await tx.payroll.update({
        where: { id: payroll.id },
        data: { totalGross, totalNet },
        include: {
          branch: true,
          items: {
            include: {
              assignment: {
                include: { user: true },
              },
            },
          },
        },
      });

      return updated;
    });
  }

  async markPayrollPaid(payrollId: string) {
    const payroll = await this.prisma.payroll.findUnique({ where: { id: payrollId } });
    if (!payroll) throw new NotFoundException('Payroll record not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.payrollItem.updateMany({
        where: { payrollId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paymentDate: new Date(),
        },
      });

      return tx.payroll.update({
        where: { id: payrollId },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
        },
        include: { items: true },
      });
    });
  }

  // Get personal salary history & payslips for teacher / staff
  async getEmployeePayslips(user: any) {
    const assignments = await this.prisma.employeeBranchAssignment.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    const assignmentIds = assignments.map((a) => a.id);

    return this.prisma.payrollItem.findMany({
      where: { assignmentId: { in: assignmentIds } },
      orderBy: { createdAt: 'desc' },
      include: {
        payroll: {
          include: { branch: true },
        },
        assignment: {
          include: {
            user: { select: { name: true, email: true } },
            department: true,
          },
        },
      },
    });
  }
}
