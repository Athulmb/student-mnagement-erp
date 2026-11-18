import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/create-course.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new course (Admin only)' })
  create(
    @Body() createCourseDto: CreateCourseDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.coursesService.create(createCourseDto, adminId);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all available courses' })
  findAll(@Query('activeOnly') activeOnly?: string) {
    return this.coursesService.findAll(activeOnly === 'true');
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get course details by ID' })
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update course details (Admin only)' })
  update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.coursesService.update(id, updateCourseDto, adminId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a course (Admin only)' })
  remove(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.coursesService.remove(id, adminId);
  }
}
