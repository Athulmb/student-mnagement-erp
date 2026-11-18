import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PlatformModule } from './platform/platform.module';
import { BranchesModule } from './branches/branches.module';
import { AdminModule } from './admin/admin.module';
import { AcademicsModule } from './academics/academics.module';
import { HrmsModule } from './hrms/hrms.module';
import { PayrollModule } from './payroll/payroll.module';
import { FeesModule } from './fees/fees.module';
import { StudentsModule } from './students/students.module';
import { TeacherModule } from './teacher/teacher.module';
import { ParentModule } from './parent/parent.module';
import { CoursesModule } from './courses/courses.module';
import { ClassesModule } from './classes/classes.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    PrismaModule,
    ActivityLogsModule,
    UsersModule,
    AuthModule,
    PlatformModule,
    BranchesModule,
    AdminModule,
    AcademicsModule,
    HrmsModule,
    PayrollModule,
    FeesModule,
    StudentsModule,
    TeacherModule,
    ParentModule,
    CoursesModule,
    ClassesModule,
    AnnouncementsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
