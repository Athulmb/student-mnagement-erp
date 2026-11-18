import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ParentService } from './parent.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Parent Portal')
@Controller('parent')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get parent portal dashboard with linked children records' })
  getDashboard(@CurrentUser('id') userId: string) {
    return this.parentService.getDashboard(userId);
  }
}
