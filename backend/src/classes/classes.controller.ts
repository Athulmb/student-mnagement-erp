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
import { ClassesService } from './classes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Classes')
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new class batch (Admin only)' })
  create(@Body() createClassDto: any, @CurrentUser('id') adminId: string) {
    return this.classesService.create(createClassDto, adminId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all classes with branch filter' })
  findAll(@Query('branchId') branchId?: string) {
    return this.classesService.findAll(branchId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get class details and enrolled students' })
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update class details (Admin only)' })
  update(
    @Param('id') id: string,
    @Body() updateClassDto: any,
    @CurrentUser('id') adminId: string,
  ) {
    return this.classesService.update(id, updateClassDto, adminId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a class' })
  remove(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.classesService.remove(id, adminId);
  }
}
