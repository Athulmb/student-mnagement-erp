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
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BranchStatus } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Branches')
@Controller('branches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Get list of active branches for public enrollment/registration' })
  getPublicBranches() {
    return this.branchesService.getPublicBranches();
  }

  @Get()
  @ApiOperation({ summary: 'Get list of authorized branches for current authenticated user' })
  getMyBranches(@CurrentUser() user: any) {
    return this.branchesService.getBranchesForUser(user);
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create a new branch under organization (Organization Admin only)' })
  createBranch(@CurrentUser() user: any, @Body() dto: any) {
    return this.branchesService.createBranch(user, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch details and metrics by ID' })
  getBranchDetails(@CurrentUser() user: any, @Param('id') id: string) {
    return this.branchesService.getBranchDetails(user, id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update branch profile and administrator assignment' })
  updateBranch(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.branchesService.updateBranch(user, id, dto);
  }

  @Patch(':id/status')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Activate, deactivate, or suspend a branch' })
  updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('status') status: BranchStatus,
  ) {
    return this.branchesService.updateBranchStatus(user, id, status);
  }

  @Get(':id/performance')
  @ApiOperation({ summary: 'Get branch operational and performance metrics' })
  getBranchPerformance(@CurrentUser() user: any, @Param('id') id: string) {
    return this.branchesService.getBranchPerformance(user, id);
  }
}
