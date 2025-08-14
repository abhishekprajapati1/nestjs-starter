import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable, Logger } from '@nestjs/common';
import { PincodeService } from '../pincode.service';

// Global instance to be set by the module
let globalPincodeService: PincodeService | null = null;

export function setGlobalPincodeService(service: PincodeService) {
  globalPincodeService = service;
}

@ValidatorConstraint({ name: 'IsValidPincode', async: true })
@Injectable()
export class IsValidPincodeConstraint implements ValidatorConstraintInterface {
  validate(pincode: string) {
    if (!pincode || typeof pincode !== 'string') {
      return false;
    }
    if (!globalPincodeService) {
      return true; // Skip validation if service is not available
    }
    return globalPincodeService.isValidPincode(pincode);
  }

  defaultMessage() {
    return 'Invalid pincode. Please provide a valid Indian pincode.';
  }
}

export function IsValidPincode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPincodeConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'IsCityValidForPincode', async: true })
@Injectable()
export class IsCityValidForPincodeConstraint
  implements ValidatorConstraintInterface
{
  private logger: Logger;
  constructor() {
    this.logger = new Logger(IsCityValidForPincodeConstraint.name);
  }
  validate(city: string, args: ValidationArguments) {
    if (!city || typeof city !== 'string') {
      return false;
    }

    const object = args.object;
    //@ts-expect-error Since we know for a fact that it will have the zip_code
    const pincode = object.zip_code as string;

    if (!pincode) {
      return true; // Let the pincode validator handle this
    }

    if (!globalPincodeService) {
      return true; // Skip validation if service is not available
    }

    return globalPincodeService.isValidCityForPincode(pincode, city);
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object;
    //@ts-expect-error We know that zip_code will always present in the dto.
    const pincode = object.zip_code as string;

    if (pincode && globalPincodeService) {
      try {
        const validCities = globalPincodeService.getCitiesForPincode(pincode);
        if (validCities.length > 0) {
          return `City does not match the pincode. Valid cities for pincode ${pincode}: ${validCities.join(', ')}`;
        }
      } catch (error) {
        this.logger.error(error);
        // Fallback if pincodeService is not available
      }
    }

    return 'City does not match the provided pincode.';
  }
}

export function IsCityValidForPincode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCityValidForPincodeConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'IsStateValidForPincode', async: true })
@Injectable()
export class IsStateValidForPincodeConstraint
  implements ValidatorConstraintInterface
{
  private logger: Logger;
  constructor() {
    this.logger = new Logger(IsCityValidForPincodeConstraint.name);
  }
  validate(state: string, args: ValidationArguments) {
    if (!state || typeof state !== 'string') {
      return false;
    }

    const object = args.object;
    //@ts-expect-error The dto will always contain zip_code
    const pincode = object.zip_code as string;

    if (!pincode) {
      return true; // Let the pincode validator handle this
    }

    if (!globalPincodeService) {
      return true; // Skip validation if service is not available
    }

    return globalPincodeService.isValidStateForPincode(pincode, state);
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object;
    //@ts-expect-error The DTO will always contain zip_code
    const pincode = object.zip_code as string;

    if (pincode && globalPincodeService) {
      try {
        const validStates = globalPincodeService.getStatesForPincode(pincode);
        if (validStates.length > 0) {
          return `State does not match the pincode. Valid states for pincode ${pincode}: ${validStates.join(', ')}`;
        }
      } catch (error) {
        this.logger.error(error);
        // Fallback if pincodeService is not available
      }
    }

    return 'State does not match the provided pincode.';
  }
}

export function IsStateValidForPincode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStateValidForPincodeConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'IsAddressValidForPincode', async: true })
@Injectable()
export class IsAddressValidForPincodeConstraint
  implements ValidatorConstraintInterface
{
  private logger: Logger;
  constructor() {
    this.logger = new Logger(IsCityValidForPincodeConstraint.name);
  }
  validate(value: any, args: ValidationArguments) {
    const object = args.object;
    //@ts-expect-error The DTO will always contain zip_code
    const pincode = object.zip_code as string;
    //@ts-expect-error The DTO will always contain city
    const city = object.city as string;
    //@ts-expect-error The DTO will always contain state
    const state = object.state as string;

    if (!pincode || !city || !state) {
      return true; // Let individual validators handle missing fields
    }

    if (!globalPincodeService) {
      return true; // Skip validation if service is not available
    }

    return globalPincodeService.isValidCityStateForPincode(
      pincode,
      city,
      state,
    );
  }

  defaultMessage() {
    return 'The combination of pincode, city, and state is invalid.';
  }
}

export function IsAddressValidForPincode(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsAddressValidForPincodeConstraint,
    });
  };
}
