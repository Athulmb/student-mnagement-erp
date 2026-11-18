import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Student Portal')
@Controller('student')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get student portal personalized dashboard metrics and records' })
  getDashboard(@CurrentUser('id') userId: string) {
    return this.studentsService.getDashboard(userId);
  }

  @Get('my-class')
  @ApiOperation({ summary: 'Get student assigned class details' })
  getMyClass(@CurrentUser('id') userId: string) {
    return this.studentsService.getMyClass(userId);
  }

  @Get('schedule')
  @ApiOperation({ summary: 'Get student weekly timetable' })
  getSchedule(@CurrentUser('id') userId: string) {
    return this.studentsService.getSchedule(userId);
  }

  @Patch('my-profile')
  @ApiOperation({ summary: 'Update permitted student personal details' })
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.studentsService.updateProfile(userId, dto);
  }
}
