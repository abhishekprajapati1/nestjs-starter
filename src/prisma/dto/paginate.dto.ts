import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class PaginateQueryDto {
  @IsOptional()
  @ApiProperty({ required: false, default: 1 })
  @Transform(({ value }: { value: string }) => Number(value))
  page: number = 1;

  @IsOptional()
  @ApiProperty({ required: false, default: 10 })
  @Transform(({ value }: { value: string }) => Number(value))
  page_size: number = 10;
}
