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
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get consolidated or branch-specific administrative dashboard metrics' })
  getDashboard(
    @CurrentUser() user: any,
    @Query('branchId') branchId?: string,
  ) {
    return this.adminService.getDashboard(user, branchId);
  }

  @Get('branch-comparison')
  @ApiOperation({ summary: 'Compare metrics across branches under the organization' })
  getBranchComparison(@CurrentUser() user: any) {
    return this.adminService.getBranchComparison(user);
  }

  // Teachers
  @Get('teachers')
  @ApiOperation({ summary: 'Get teachers with optional branch filter and search' })
  getTeachers(
    @CurrentUser() user: any,
    @Query('branchId') branchId?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getTeachers(user, branchId, search);
  }

  @Post('teachers')
  @ApiOperation({ summary: 'Create a new teacher with primary branch assignment and salary' })
  createTeacher(@CurrentUser() user: any, @Body() dto: any) {
    return this.adminService.createTeacher(user, dto);
  }

  @Post('teachers/:id/assign-branch')
  @ApiOperation({ summary: 'Assign an existing teacher to an additional branch' })
  assignTeacherToBranch(
    @CurrentUser() user: any,
    @Param('id') teacherId: string,
    @Body() dto: any,
  ) {
    return this.adminService.assignEmployeeToBranch(user, teacherId, dto);
  }

  // Staff
  @Get('staff')
  @ApiOperation({ summary: 'Get administrative staff list' })
  getStaff(@CurrentUser() user: any, @Query('branchId') branchId?: string) {
    return this.adminService.getStaff(user, branchId);
  }

  @Post('staff')
  @ApiOperation({ summary: 'Create an administrative staff member' })
  createStaff(@CurrentUser() user: any, @Body() dto: any) {
    return this.adminService.createStaff(user, dto);
  }

  // Students & Approvals
  @Get('students')
  @ApiOperation({ summary: 'Get paginated students list with branch and status filtering' })
  getStudents(@CurrentUser() user: any, @Query() query: any) {
    return this.adminService.getStudents(user, query);
  }

  @Get('students/pending')
  @ApiOperation({ summary: 'Get pending admissions applications awaiting review' })
  getPendingStudents(@CurrentUser() user: any, @Query('branchId') branchId?: string) {
    return this.adminService.getPendingStudents(user, branchId);
  }

  @Post('students')
  @ApiOperation({ summary: 'Create student directly from admin portal' })
  createStudent(
    @CurrentUser() user: any,
    @Body() dto: any,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.createStudentByAdmin(user, dto, adminId);
  }

  @Patch('students/:id/approve')
  @ApiOperation({ summary: 'Approve student admission application' })
  approveStudent(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body('classId') classId?: string,
  ) {
    return this.adminService.approveStudent(id, adminId, classId);
  }

  @Patch('students/:id/reject')
  @ApiOperation({ summary: 'Reject student admission application with note' })
  rejectStudent(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.rejectStudent(id, adminId, reason);
  }

  @Post('students/transfer')
  @ApiOperation({ summary: 'Transfer student from one branch to another, preserving history' })
  transferStudent(
    @CurrentUser('id') adminId: string,
    @Body() dto: { studentUserId: string; toBranchId: string; newClassId?: string; reason: string },
  ) {
    return this.adminService.transferStudentBranch(adminId, dto);
  }
}
