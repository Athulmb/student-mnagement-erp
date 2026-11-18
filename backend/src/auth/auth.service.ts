import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { Role, AccountStatus, User } from '@prisma/client';
import { Gender } from '../common/enums/gender.enum';
import { Response } from 'express';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private sanitizeUser(user: any) {
    if (!user) return null;
    const { password, ...sanitized } = user;
    return sanitized;
  }

  private getRoleRedirectUrl(role: Role): string {
    switch (role) {
      case Role.PLATFORM_SUPER_ADMIN:
        return '/platform/dashboard';
      case Role.ORGANIZATION_ADMIN:
        return '/admin/dashboard';
      case Role.BRANCH_ADMIN:
        return '/admin/dashboard';
      case Role.TEACHER:
        return '/teacher/dashboard';
      case Role.STAFF:
        return '/staff/dashboard';
      case Role.STUDENT:
        return '/student/dashboard';
      case Role.PARENT:
        return '/parent/dashboard';
      default:
        return '/login';
    }
  }

  async registerStudent(dto: RegisterDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Check email uniqueness
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email address already exists');
    }

    // Resolve Organization and Branch
    let branchId = dto.branchId;
    let organizationId = dto.organizationId;

    if (branchId) {
      let branch = await this.prisma.branch.findUnique({
        where: { id: branchId },
        include: { organization: true },
      });

      // Fallback 1: match by exact or case-insensitive branchCode
      if (!branch) {
        branch = await this.prisma.branch.findFirst({
          where: {
            OR: [
              { branchCode: { equals: branchId, mode: 'insensitive' } },
              { branchName: { contains: branchId, mode: 'insensitive' } },
            ],
          },
          include: { organization: true },
        });
      }

      // Fallback 2: match by campus name keywords (e.g., 'calicut', 'kochi', 'malappuram')
      if (!branch) {
        const lower = branchId.toLowerCase();
        if (lower.includes('calicut') || lower.includes('clt') || lower.includes('cl')) {
          branch = await this.prisma.branch.findFirst({
            where: {
              OR: [
                { branchCode: { contains: 'CLT', mode: 'insensitive' } },
                { branchName: { contains: 'Calicut', mode: 'insensitive' } },
              ],
            },
            include: { organization: true },
          });
        } else if (lower.includes('kochi') || lower.includes('kch') || lower.includes('kc')) {
          branch = await this.prisma.branch.findFirst({
            where: {
              OR: [
                { branchCode: { contains: 'KCH', mode: 'insensitive' } },
                { branchName: { contains: 'Kochi', mode: 'insensitive' } },
              ],
            },
            include: { organization: true },
          });
        } else if (lower.includes('malappuram') || lower.includes('mlp')) {
          branch = await this.prisma.branch.findFirst({
            where: {
              OR: [
                { branchCode: { contains: 'MLP', mode: 'insensitive' } },
                { branchName: { contains: 'Malappuram', mode: 'insensitive' } },
              ],
            },
            include: { organization: true },
          });
        }
      }

      // Fallback 3: First active branch in database
      if (!branch) {
        branch = await this.prisma.branch.findFirst({
          where: { status: 'ACTIVE' },
          include: { organization: true },
        });
      }

      if (!branch) {
        throw new NotFoundException('Selected branch does not exist and no active branch is configured');
      }

      branchId = branch.id;
      organizationId = branch.organizationId;
    } else {
      // Default to first active branch if not specified
      const defaultBranch = await this.prisma.branch.findFirst({
        where: { status: 'ACTIVE' },
        include: { organization: true },
      });
      if (defaultBranch) {
        branchId = defaultBranch.id;
        organizationId = defaultBranch.organizationId;
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const admissionNumber = `ADM-${Date.now().toString().slice(-6)}`;

    // Normalize gender defensively
    let studentGender: Gender = Gender.MALE;
    if (dto.gender) {
      const gUpper = dto.gender.toUpperCase();
      if (gUpper === 'FEMALE') studentGender = Gender.FEMALE;
      else if (gUpper === 'OTHER') studentGender = Gender.OTHER;
      else studentGender = Gender.MALE;
    }

    // Create User + StudentProfile in a transaction
    const newUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name.trim(),
          email: normalizedEmail,
          phone: dto.phone?.trim() || null,
          password: hashedPassword,
          role: Role.STUDENT,
          status: AccountStatus.PENDING,
          organizationId: organizationId || null,
          primaryBranchId: branchId || null,
        },
      });

      if (branchId) {
        // Create student profile
        await tx.studentProfile.create({
          data: {
            userId: user.id,
            branchId: branchId,
            admissionNumber,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
            gender: studentGender,
            address: dto.address?.trim() || null,
            emergencyPhone: dto.parentPhone?.trim() || dto.phone?.trim() || null,
            admissionClass: dto.admissionClass || 'Class 8',
          },
        });

        // Add branch membership
        await tx.branchMembership.create({
          data: {
            userId: user.id,
            branchId: branchId,
            isPrimary: true,
            role: Role.STUDENT,
          },
        });
      }

      return user;
    });

    const fullStudent = await this.prisma.user.findUnique({
      where: { id: newUser.id },
      include: {
        studentProfile: {
          include: {
            branch: true,
            assignedClass: true,
          },
        },
      },
    });

    return {
      message: 'Student application submitted successfully. Your registration is awaiting administrator review and approval before dashboard access is granted.',
      student: this.sanitizeUser(fullStudent),
    };
  }

  async login(dto: LoginDto, res?: Response) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        organization: true,
        branchMemberships: {
          include: {
            branch: true,
          },
        },
        employeeBranchAssignments: {
          include: {
            branch: true,
            department: true,
            teacherAssignments: {
              include: {
                class: true,
                subject: true,
              },
            },
          },
        },
        studentProfile: {
          include: {
            branch: true,
            assignedClass: {
              include: {
                subjects: true,
              },
            },
          },
        },
        parentProfile: {
          include: {
            childrenLinks: {
              include: {
                student: {
                  include: {
                    user: true,
                    branch: true,
                    assignedClass: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email address or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email address or password');
    }

    // Role & Account Status validation
    if (user.status === AccountStatus.PENDING) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'ACCOUNT_PENDING',
        message: 'Your account registration is currently pending administrator approval. Please check back shortly.',
      });
    }

    if (user.status === AccountStatus.REJECTED) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'ACCOUNT_REJECTED',
        message: user.rejectionReason
          ? `Your application was not approved. Reason: ${user.rejectionReason}`
          : 'Your account registration was not approved by academy administration.',
        rejectionReason: user.rejectionReason,
      });
    }

    if (user.status === AccountStatus.SUSPENDED) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'ACCOUNT_SUSPENDED',
        message: 'This account has been temporarily suspended. Please contact head administration.',
      });
    }

    // Generate Tokens
    const tokens = await this.generateTokens(user, dto.rememberMe);

    if (res) {
      this.setCookies(res, tokens.accessToken, tokens.refreshToken, dto.rememberMe);
    }

    const redirectUrl = this.getRoleRedirectUrl(user.role);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(user),
      redirectUrl,
    };
  }

  async platformLogin(dto: LoginDto, res?: Response) {
    const result = await this.login(dto, res);
    if (result.user.role !== Role.PLATFORM_SUPER_ADMIN) {
      throw new ForbiddenException('Access restricted to Platform Super Administrators only');
    }
    return result;
  }

  async studentLogin(dto: LoginDto, res?: Response) {
    const result = await this.login(dto, res);
    if (result.user.role !== Role.STUDENT) {
      throw new ForbiddenException('Please use the employee login portal for staff and teacher credentials');
    }
    return result;
  }

  async parentLogin(dto: LoginDto, res?: Response) {
    const result = await this.login(dto, res);
    if (result.user.role !== Role.PARENT) {
      throw new ForbiddenException('This login portal is reserved for Parents and Guardians');
    }
    return result;
  }

  async refresh(refreshTokenFromReq: string, res?: Response) {
    if (!refreshTokenFromReq) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenFromReq },
      include: {
        user: {
          include: {
            organization: true,
            branchMemberships: {
              include: {
                branch: true,
              },
            },
            employeeBranchAssignments: {
              include: {
                branch: true,
              },
            },
            studentProfile: {
              include: {
                branch: true,
                assignedClass: true,
              },
            },
          },
        },
      },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await this.prisma.refreshToken.delete({ where: { id: storedToken.id } }).catch(() => null);
      }
      throw new UnauthorizedException('Refresh token is invalid or expired. Please sign in again.');
    }

    const user = storedToken.user;
    if (user.status !== AccountStatus.APPROVED) {
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } }).catch(() => null);
      throw new ForbiddenException('Account is not currently active');
    }

    // Token rotation
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } }).catch(() => null);

    const tokens = await this.generateTokens(user, false);

    if (res) {
      this.setCookies(res, tokens.accessToken, tokens.refreshToken, false);
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async logout(userId?: string, refreshToken?: string, res?: Response) {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      }).catch(() => null);
    } else if (userId) {
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      }).catch(() => null);
    }

    if (res) {
      const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
      });
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
      });
    }

    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          include: {
            branches: true,
          },
        },
        branchMemberships: {
          include: {
            branch: true,
          },
        },
        employeeBranchAssignments: {
          include: {
            branch: true,
            department: true,
            teacherAssignments: {
              include: {
                class: true,
                subject: true,
              },
            },
          },
        },
        studentProfile: {
          include: {
            branch: true,
            assignedClass: {
              include: {
                subjects: true,
              },
            },
            transferHistory: {
              include: {
                fromBranch: true,
                toBranch: true,
              },
            },
          },
        },
        parentProfile: {
          include: {
            childrenLinks: {
              include: {
                student: {
                  include: {
                    user: true,
                    branch: true,
                    assignedClass: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return this.sanitizeUser(user);
  }

  private async generateTokens(user: User, rememberMe?: boolean) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      primaryBranchId: user.primaryBranchId,
    };

    const accessTokenExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiresIn,
    });

    const refreshTokenString = randomBytes(40).toString('hex');
    const refreshDays = rememberMe ? 30 : 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshDays);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenString,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  private setCookies(res: Response, accessToken: string, refreshToken: string, rememberMe?: boolean) {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const maxAgeRefresh = (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000;
    const maxAgeAccess = 15 * 60 * 1000;

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: maxAgeAccess,
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: maxAgeRefresh,
      path: '/',
    });
  }
}
