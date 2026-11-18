import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlatformService } from './platform.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, OrganizationStatus } from '@prisma/client';

@ApiTags('Platform Super Admin')
@Controller('platform')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PLATFORM_SUPER_ADMIN)
@ApiBearerAuth()
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Platform Super Admin consolidated SaaS dashboard metrics' })
  getDashboard() {
    return this.platformService.getPlatformDashboard();
  }

  @Get('organizations')
  @ApiOperation({ summary: 'List all onboarded school organizations and their branches' })
  getOrganizations() {
    return this.platformService.getAllOrganizations();
  }

  @Post('onboard-school')
  @ApiOperation({ summary: 'Onboard a new school organization with initial branch and admin account' })
  onboardSchool(@Body() dto: any) {
    return this.platformService.onboardSchool(dto);
  }

  @Patch('organizations/:id/status')
  @ApiOperation({ summary: 'Activate or suspend a school organization' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrganizationStatus,
  ) {
    return this.platformService.updateOrganizationStatus(id, status);
  }
}
