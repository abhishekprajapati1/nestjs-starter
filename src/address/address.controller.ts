import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { AddressService } from './address.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from 'src/prisma/prisma.service';
import { ITenant, Tenant } from 'src/auth/decorators/tenant.decorator';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { PincodeService } from './pincode.service';
import { RequiredIdDto } from 'src/util/dto/common.dto';

@ApiTags('Address Management')
@Controller('addresses')
export class AddressController {
  constructor(
    private readonly addressService: AddressService,
    private readonly pincodeService: PincodeService,
  ) {}

  @Post()
  @ApiOperation({ description: 'Create a new address for logged in user' })
  async createAddress(
    @Body() createAddressDto: CreateAddressDto,
    @Tenant() tenant: ITenant,
  ): Promise<ApiResponse> {
    const address = await this.addressService.findOneByUserId(tenant.id);
    if (address) {
      throw new BadRequestException(
        'User already have address details created.',
      );
    }
    const created = await this.addressService.create({
      user_id: tenant.id,
      createAddressDto,
    });
    return {
      success: true,
      data: created,
      message: 'Address created successfully',
    };
  }

  @Put(':id')
  @ApiOperation({ description: 'Use to update an address by its id' })
  async updateAddress(
    @Param() params: RequiredIdDto,
    @Body() updateAddressDto: UpdateAddressDto,
  ): Promise<ApiResponse> {
    const updated = await this.addressService.update({
      address_id: params.id,
      updateAddressDto,
    });
    return {
      success: true,
      data: updated,
      message: 'Address updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ description: 'Use to delete an address by its id' })
  async deleteAddress(@Param() params: RequiredIdDto): Promise<ApiResponse> {
    const deleted = await this.addressService.remove({ address_id: params.id });
    return {
      success: true,
      data: deleted,
      message: 'Address deleted successfully',
    };
  }

  @Get('validate-pincode/:pincode')
  @ApiOperation({
    description: 'Validate pincode and get suggestions for city/state',
  })
  validatePincode(@Param('pincode') pincode: string): ApiResponse {
    const isValid = this.pincodeService.isValidPincode(pincode);

    if (!isValid) {
      throw new BadRequestException('Invalid pincode');
    }

    const cities = this.pincodeService.getCitiesForPincode(pincode);
    const states = this.pincodeService.getStatesForPincode(pincode);
    const districts = this.pincodeService.getDistrictsForPincode(pincode);

    return {
      success: true,
      data: {
        pincode,
        isValid: true,
        suggestions: {
          cities,
          states,
          districts,
        },
      },
      message: 'Pincode validated successfully',
    };
  }
}
