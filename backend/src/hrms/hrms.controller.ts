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
import { HrmsService } from './hrms.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LeaveStatus } from '@prisma/client';

@ApiTags('HRMS')
@Controller('hrms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HrmsController {
  constructor(private readonly hrmsService: HrmsService) {}

  @Get('attendance')
  @ApiOperation({ summary: 'Get employee attendance records with branch and date filter' })
  getAttendance(
    @Query('branchId') branchId?: string,
    @Query('date') date?: string,
  ) {
    return this.hrmsService.getEmployeeAttendance(branchId, date);
  }

  @Post('attendance')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Mark employee daily attendance record' })
  markAttendance(@Body() dto: any) {
    return this.hrmsService.markEmployeeAttendance(dto);
  }

  @Get('leave-types')
  @ApiOperation({ summary: 'List all standard leave types' })
  getLeaveTypes() {
    return this.hrmsService.getLeaveTypes();
  }

  @Get('leave-applications')
  @ApiOperation({ summary: 'Get leave applications (Admin gets all, teachers/staff get personal)' })
  getLeaveApplications(
    @CurrentUser() user: any,
    @Query('status') status?: LeaveStatus,
  ) {
    return this.hrmsService.getLeaveApplications(user, status);
  }

  @Post('leave-applications')
  @ApiOperation({ summary: 'Submit a personal leave application (Teacher/Staff)' })
  applyLeave(@CurrentUser() user: any, @Body() dto: any) {
    return this.hrmsService.applyLeave(user, dto);
  }

  @Patch('leave-applications/:id/review')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Approve or reject leave application (Admin only)' })
  reviewLeave(
    @CurrentUser('id') adminId: string,
    @Param('id') applicationId: string,
    @Body() dto: any,
  ) {
    return this.hrmsService.reviewLeave(adminId, applicationId, dto);
  }
}
