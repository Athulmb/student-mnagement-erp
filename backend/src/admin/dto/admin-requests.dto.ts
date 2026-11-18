import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountStatus } from '@prisma/client';

export class RejectStudentDto {
  @ApiProperty({ example: 'Incomplete prerequisite documentation', description: 'Reason for rejecting student registration' })
  @IsString()
  @IsNotEmpty({ message: 'Rejection reason is required' })
  reason: string;
}

export class UpdateStudentStatusDto {
  @ApiProperty({ enum: AccountStatus, example: AccountStatus.APPROVED })
  @IsEnum(AccountStatus)
  status: AccountStatus;

  @ApiPropertyOptional({ example: 'Admin manual status change' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AssignClassDto {
  @ApiProperty({ example: 'class-uuid', description: 'Class ID to assign the student to' })
  @IsString()
  @IsNotEmpty()
  classId: string;
}

export class QueryStudentsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by search query (name or email)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: AccountStatus })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

  @ApiPropertyOptional({ description: 'Filter by enrolled course ID' })
  @IsOptional()
  @IsString()
  courseId?: string;
}
