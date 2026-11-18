import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshDto {
  @ApiPropertyOptional({ description: 'Refresh token string (can also be read from HttpOnly cookie)' })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
