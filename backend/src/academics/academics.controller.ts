import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AcademicsService } from './academics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Academics')
@Controller('academics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AcademicsController {
  constructor(private readonly academicsService: AcademicsService) {}

  @Get('classes')
  @ApiOperation({ summary: 'Get classes list with branch filter' })
  getClasses(@CurrentUser() user: any, @Query('branchId') branchId?: string) {
    return this.academicsService.getClasses(user, branchId);
  }

  @Post('classes')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create a new class under a branch' })
  createClass(@CurrentUser() user: any, @Body() dto: any) {
    return this.academicsService.createClass(user, dto);
  }

  @Get('classes/:id/subjects')
  @ApiOperation({ summary: 'Get subjects assigned to a class' })
  getSubjects(@Param('id') classId: string) {
    return this.academicsService.getSubjects(classId);
  }

  @Post('subjects')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create a subject for a class' })
  createSubject(@Body() dto: any) {
    return this.academicsService.createSubject(dto);
  }

  @Get('timetable')
  @ApiOperation({ summary: 'Get timetable filtered by branch, class, or teacher' })
  getTimetable(
    @Query('branchId') branchId?: string,
    @Query('classId') classId?: string,
    @Query('teacherId') teacherId?: string,
  ) {
    return this.academicsService.getTimetable({ branchId, classId, teacherId });
  }

  @Post('timetable/periods')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Schedule a timetable period with automated conflict prevention' })
  addTimetablePeriod(@Body() dto: any) {
    return this.academicsService.addTimetablePeriod(dto);
  }
}
