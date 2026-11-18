import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'Full Stack Web Development', description: 'Course title' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Learn Next.js, TypeScript, and NestJS', description: 'Course curriculum description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '6 Months', description: 'Course duration' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ example: true, description: 'Is course actively accepting enrollments' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCourseDto {
  @ApiPropertyOptional({ example: 'Full Stack Web Development - Advanced' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
