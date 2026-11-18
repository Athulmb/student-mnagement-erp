import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  section?: string;

  @IsString()
  @IsOptional()
  roomNumber?: string;

  @IsString()
  @IsOptional()
  academicYear?: string;
}

export class UpdateClassDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  section?: string;

  @IsString()
  @IsOptional()
  roomNumber?: string;
}
