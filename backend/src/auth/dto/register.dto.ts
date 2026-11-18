import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Devanand R', description: 'Full name of the student' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'student@example.com', description: 'Valid email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '+91 98400 12345', description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'Student account password (min 6 characters)' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiPropertyOptional({ example: 'org-uuid', description: 'Selected School Organization ID' })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({ example: 'branch-uuid', description: 'Selected Branch ID' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ example: 'Class 8', description: 'Admission Class' })
  @IsOptional()
  @IsString()
  admissionClass?: string;

  @ApiPropertyOptional({ example: '2012-05-14', description: 'Date of birth' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'MALE', description: 'Gender' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: 'Kochi, Kerala', description: 'Residential Address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Ravi K', description: 'Parent / Guardian Full Name' })
  @IsOptional()
  @IsString()
  parentName?: string;

  @ApiPropertyOptional({ example: '+91 98470 55667', description: 'Parent / Guardian Phone' })
  @IsOptional()
  @IsString()
  parentPhone?: string;

  @ApiPropertyOptional({ example: 'Additional notes or previous school details' })
  @IsOptional()
  @IsString()
  additionalInfo?: string;
}
