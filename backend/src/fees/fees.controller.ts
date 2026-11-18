import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeesService } from './fees.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentStatus } from '@prisma/client';

@ApiTags('Fees Management')
@Controller('fees')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Get('categories')
  @ApiOperation({ summary: 'List fee categories' })
  getCategories(@CurrentUser() user: any) {
    return this.feesService.getFeeCategories(user.organizationId);
  }

  @Post('categories')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create fee category' })
  createCategory(@CurrentUser() user: any, @Body() dto: any) {
    return this.feesService.createFeeCategory({
      organizationId: user.organizationId || dto.organizationId,
      name: dto.name,
      code: dto.code,
      amount: dto.amount,
    });
  }

  @Get('students')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'List student fee dues and payment statuses' })
  getStudentFees(
    @Query('branchId') branchId?: string,
    @Query('status') status?: PaymentStatus,
  ) {
    return this.feesService.getStudentFees(branchId, status);
  }

  @Post('pay')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Record fee payment and generate receipt number' })
  recordPayment(@Body() dto: any) {
    return this.feesService.recordFeePayment(dto);
  }
}
