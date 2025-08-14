import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';

export interface PincodeData {
  PostOfficeName: string;
  Pincode: string;
  City: string;
  District: string;
  State: string;
}

@Injectable()
export class PincodeService implements OnModuleInit {
  private readonly logger = new Logger(PincodeService.name);
  private pincodes: Map<string, PincodeData[]> = new Map();
  private cities: Set<string> = new Set();
  private states: Set<string> = new Set();

  async onModuleInit() {
    try {
      await this.loadPincodes();
      this.logger.log('PincodeService initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize PincodeService', error);
    }
  }

  private async loadPincodes(): Promise<void> {
    try {
      const filePath = join(process.cwd(), 'pincodes.json');
      const data = await readFile(filePath, 'utf8');
      const pincodeData: PincodeData[] = JSON.parse(data);

      // Group pincodes by pincode number for faster lookup
      pincodeData.forEach((item) => {
        const existingEntries = this.pincodes.get(item.Pincode) || [];
        this.pincodes.set(item.Pincode, [...existingEntries, item]);
        this.cities.add(item.City.toLowerCase());
        this.states.add(item.State.toLowerCase());
      });

      this.logger.log(`Loaded ${pincodeData.length} pincode entries`);
    } catch (error) {
      this.logger.error('Failed to load pincodes.json', error);
    }
  }

  /**
   * Validate if a pincode exists
   */
  isValidPincode(pincode: string): boolean {
    return this.pincodes.has(pincode);
  }

  /**
   * Get all data for a specific pincode
   */
  getPincodeData(pincode: string): PincodeData[] {
    return this.pincodes.get(pincode) || [];
  }

  /**
   * Validate if city exists for a given pincode
   */
  isValidCityForPincode(pincode: string, city: string): boolean {
    const pincodeData = this.getPincodeData(pincode);
    return pincodeData.some(
      (data) => data.City.toLowerCase() === city.toLowerCase(),
    );
  }

  /**
   * Validate if state exists for a given pincode
   */
  isValidStateForPincode(pincode: string, state: string): boolean {
    const pincodeData = this.getPincodeData(pincode);
    return pincodeData.some(
      (data) => data.State.toLowerCase() === state.toLowerCase(),
    );
  }

  /**
   * Validate if city and state combination exists for a given pincode
   */
  isValidCityStateForPincode(
    pincode: string,
    city: string,
    state: string,
  ): boolean {
    const pincodeData = this.getPincodeData(pincode);
    return pincodeData.some(
      (data) =>
        data.City.toLowerCase() === city.toLowerCase() &&
        data.State.toLowerCase() === state.toLowerCase(),
    );
  }

  /**
   * Get all cities for a given pincode
   */
  getCitiesForPincode(pincode: string): string[] {
    const pincodeData = this.getPincodeData(pincode);
    return [...new Set(pincodeData.map((data) => data.City))];
  }

  /**
   * Get all states for a given pincode
   */
  getStatesForPincode(pincode: string): string[] {
    const pincodeData = this.getPincodeData(pincode);
    return [...new Set(pincodeData.map((data) => data.State))];
  }

  /**
   * Get all districts for a given pincode
   */
  getDistrictsForPincode(pincode: string): string[] {
    const pincodeData = this.getPincodeData(pincode);
    return [...new Set(pincodeData.map((data) => data.District))];
  }

  /**
   * Search pincodes by city
   */
  searchPincodesByCity(city: string): PincodeData[] {
    const results: PincodeData[] = [];
    this.pincodes.forEach((pincodeData) => {
      pincodeData.forEach((data) => {
        if (data.City.toLowerCase().includes(city.toLowerCase())) {
          results.push(data);
        }
      });
    });
    return results;
  }

  /**
   * Search pincodes by state
   */
  searchPincodesByState(state: string): PincodeData[] {
    const results: PincodeData[] = [];
    this.pincodes.forEach((pincodeData) => {
      pincodeData.forEach((data) => {
        if (data.State.toLowerCase().includes(state.toLowerCase())) {
          results.push(data);
        }
      });
    });
    return results;
  }
}
