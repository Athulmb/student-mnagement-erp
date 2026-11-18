import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Payroll')
@Controller('payroll')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get payroll runs with branch and year filter (Admin only)' })
  getPayrolls(
    @Query('branchId') branchId?: string,
    @Query('year') year?: number,
  ) {
    return this.payrollService.getPayrolls(branchId, year);
  }

  @Post('generate')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Generate monthly payroll for a branch with automatic net salary computation' })
  generatePayroll(
    @Body() dto: { branchId: string; month: number; year: number },
  ) {
    return this.payrollService.generateBranchPayroll(dto);
  }

  @Patch(':id/pay')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Mark payroll as disbursed/paid' })
  markPaid(@Param('id') payrollId: string) {
    return this.payrollService.markPayrollPaid(payrollId);
  }

  @Get('my-payslips')
  @ApiOperation({ summary: 'Get personal payslips for authenticated teacher or staff' })
  getMyPayslips(@CurrentUser() user: any) {
    return this.payrollService.getEmployeePayslips(user);
  }
}
