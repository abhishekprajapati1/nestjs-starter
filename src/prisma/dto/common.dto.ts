import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { DatabaseIdType } from 'lib/settings';

export class RequiredIdDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  id: DatabaseIdType;
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
