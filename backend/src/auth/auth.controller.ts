import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Request, Response } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new student account (placed into PENDING status)' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.registerStudent(dto);
  }

  @Public()
  @Post('student-register')
  @ApiOperation({ summary: 'Public student enrollment registration with branch selection' })
  async studentRegister(@Body() dto: RegisterDto) {
    return this.authService.registerStudent(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Common employee login for Org Admin, Branch Admin, Teachers, and Staff' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(dto, res);
  }

  @Public()
  @Post('platform-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Platform Super Admin login portal' })
  async platformLogin(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.platformLogin(dto, res);
  }

  @Public()
  @Post('student-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Student login portal' })
  async studentLogin(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.studentLogin(dto, res);
  }

  @Public()
  @Post('parent-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Parent / Guardian login portal' })
  async parentLogin(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.parentLogin(dto, res);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT access token using HttpOnly cookie or body token' })
  async refresh(
    @Req() req: Request,
    @Body() dto: RefreshDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken || dto.refreshToken;
    return this.authService.refresh(refreshToken, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log out current session and invalidate refresh tokens' })
  async logout(
    @CurrentUser('id') userId: string,
    @Req() req: Request,
    @Body() dto: RefreshDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken || dto.refreshToken;
    return this.authService.logout(userId, refreshToken, res);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile with branch memberships' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }
}
