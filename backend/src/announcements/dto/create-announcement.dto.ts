import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'Campus Placement Drive Announcement', description: 'Headline' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Top tech companies will be visiting for recruitment...', description: 'Full announcement body' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: 'ALL', description: 'Target audience: ALL, STUDENT, or ADMIN', default: 'ALL' })
  @IsOptional()
  @IsString()
  targetRole?: string;
}

export class UpdateAnnouncementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetRole?: string;
}
