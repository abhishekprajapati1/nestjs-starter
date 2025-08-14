import { Module, OnModuleInit } from '@nestjs/common';
import { AddressController } from './address.controller';
import { AddressService } from './address.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PincodeService } from './pincode.service';
import {
  IsCityValidForPincodeConstraint,
  IsStateValidForPincodeConstraint,
  IsValidPincodeConstraint,
  IsAddressValidForPincodeConstraint,
  setGlobalPincodeService,
} from './validators/pincode.validator';

@Module({
  controllers: [AddressController],
  providers: [
    AddressService,
    PrismaService,
    PincodeService,
    IsValidPincodeConstraint,
    IsCityValidForPincodeConstraint,
    IsStateValidForPincodeConstraint,
    IsAddressValidForPincodeConstraint,
  ],
})
export class AddressModule implements OnModuleInit {
  constructor(private readonly pincodeService: PincodeService) {}

  onModuleInit() {
    // Set the global pincode service instance for validators
    setGlobalPincodeService(this.pincodeService);
  }
}
