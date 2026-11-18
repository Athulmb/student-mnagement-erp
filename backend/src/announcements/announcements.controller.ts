import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Announcements')
@Controller('announcements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @ApiOperation({ summary: 'Get announcements scoped to current user role and branch' })
  findAll(
    @CurrentUser() user: any,
    @Query('branchId') branchId?: string,
  ) {
    return this.announcementsService.findAllForUser(user, branchId);
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create an announcement (Org-wide or Branch-specific)' })
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.announcementsService.create(user, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Delete an announcement' })
  remove(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.announcementsService.remove(id, adminId);
  }
}
