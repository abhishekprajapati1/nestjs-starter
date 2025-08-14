import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNumberString,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CredentialDto {
  @IsString()
  @IsStrongPassword()
  @MinLength(8)
  @MaxLength(15)
  @ApiProperty({
    description:
      'Choose a strong password that contains alphanumeric characters with special symbols. Password should be minimum 8 characters long.',
  })
  password: string;
}

export class SignupDto {
  @IsString()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  @ApiProperty()
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(150)
  @ApiProperty()
  name: string;

  @IsNumberString()
  @IsPhoneNumber('IN')
  @IsOptional()
  @ApiProperty({ required: false })
  phone_number: string;

  @IsBoolean()
  @ApiProperty()
  agree_t_and_c: boolean;

  @IsObject()
  @ValidateNested()
  @Type(() => CredentialDto)
  @ApiProperty({
    type: CredentialDto,
    required: true,
  })
  credentials: CredentialDto;
}

export class ResendEmailVerificationLinkDto {
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  @ApiProperty()
  email: string;
}
