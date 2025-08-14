import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { DatabaseId } from 'lib/types';

export class RequiredIdDto {
  @IsNumber()
  @ApiProperty()
  id: DatabaseId;
}

export class CreateTitleDescriptionDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.trim())
  @ApiProperty()
  title: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  description: string;
}

export class UpdateTitleDescriptionDto extends PartialType(
  CreateTitleDescriptionDto,
) {}

export class ParamSlugDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  @ApiProperty()
  slug: string;
}
