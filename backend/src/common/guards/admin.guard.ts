import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const isAdmin =
      user.role === Role.PLATFORM_SUPER_ADMIN ||
      user.role === Role.ORGANIZATION_ADMIN ||
      user.role === Role.BRANCH_ADMIN;

    if (!isAdmin) {
      throw new ForbiddenException('Administrative access required');
    }
    return true;
  }
}
