import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  IsValidPincode,
  IsCityValidForPincode,
  IsStateValidForPincode,
  IsAddressValidForPincode,
} from 'src/address/validators/pincode.validator';

export class CreateAddressDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Optional notes for address.' })
  notes?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The street address.' })
  address: string;

  @IsString()
  @IsNotEmpty()
  @IsCityValidForPincode()
  @ApiProperty({ description: 'The city.' })
  city: string;

  @IsString()
  @IsNotEmpty()
  @IsStateValidForPincode()
  @ApiProperty({ description: 'The state or province.' })
  state: string;

  @IsString()
  @IsNotEmpty()
  @IsValidPincode()
  @Transform(({ value }: { value: string }) => {
    return value.trim();
  })
  @ApiProperty({ description: 'The postal code.' })
  zip_code: string;

  @IsString()
  @IsNotEmpty()
  @IsAddressValidForPincode()
  @ApiProperty({ description: 'The country.' })
  country: string;
}
