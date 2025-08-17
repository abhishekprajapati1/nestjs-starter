import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type, Transform } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsNumberString,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  Length,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

export class CredentialDto {
  @IsString()
  @IsStrongPassword()
  @MinLength(8)
  @MaxLength(15)
  @ApiProperty({
    description:
      "Choose a strong password that contains alphanumeric characters with special symbols. Password should be minimum 8 characters long.",
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
  @IsPhoneNumber("IN")
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

export class VerifyOtpDto {
  @IsString()
  @Length(6)
  @ApiProperty({ description: "OTP sent to eithr email or phone" })
  otp: string;

  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({ description: "Email if the otp was sent to email." })
  email?: string;

  @IsOptional()
  @IsPhoneNumber("IN")
  @ApiPropertyOptional({
    description: "Phone number if the otp was sent to phone number.",
  })
  phone?: string;
}

export class ResendOtpDto {
  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({ description: "Email if the otp was sent to email." })
  email?: string;

  @IsOptional()
  @IsPhoneNumber("IN")
  @ApiPropertyOptional({
    description: "Phone number if the otp was sent to phone number.",
  })
  phone?: string;
}
