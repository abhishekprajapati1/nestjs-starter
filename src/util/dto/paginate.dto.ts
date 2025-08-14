import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class PaginateQueryDto {
  @IsOptional()
  @ApiPropertyOptional({ default: 1 })
  @Transform(({ value }: { value: string }) => Number(value))
  page: number = 1;

  @IsOptional()
  @ApiPropertyOptional({ default: 10 })
  @Transform(({ value }: { value: string }) => Number(value))
  page_size: number = 10;
}
