import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@bmnacademy.com', description: 'Registered email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Admin@123456', description: 'Account password' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ example: true, description: 'Remember login session across browser restarts' })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
