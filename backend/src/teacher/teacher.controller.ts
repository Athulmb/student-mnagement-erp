import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TeacherService } from './teacher.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Teacher Portal')
@Controller('teacher')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get teacher portal dashboard with multi-branch assignments and timetable' })
  getDashboard(@CurrentUser('id') userId: string) {
    return this.teacherService.getDashboard(userId);
  }

  @Post('mark-attendance')
  @ApiOperation({ summary: 'Mark student attendance for authorized assigned classes' })
  markClassAttendance(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.teacherService.markClassAttendance(userId, dto);
  }

  @Post('enter-marks')
  @ApiOperation({ summary: 'Enter student marks for authorized subjects' })
  enterMarks(@Body() dto: any) {
    return this.teacherService.enterMarks(dto);
  }
}
