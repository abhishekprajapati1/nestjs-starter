import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { Response } from 'express';
import { MAX_AGES, TOKENS } from 'lib/constants';
import dayjs from 'lib/dayjs';
@Injectable()
export class UtilService {
  logger: Logger;
  constructor(private readonly configService: ConfigService) {
    this.logger = new Logger(UtilService.name);
  }

  async hashString(password: string): Promise<string> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  }

  async compareString(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  setCookie<T = any>(
    response: Response,
    { data, age, name }: { data: T; age?: number; name: string },
  ): void {
    response.cookie(name || TOKENS.auth_token, data, {
      ...(this.configService.get<string>('DEV_ENVIRONMENT') !== 'true' && {
        domain: '.coparent.com',
      }),
      maxAge: age || MAX_AGES[TOKENS.auth_token],
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });
  }

  removeCookie(response: Response, name: string): void {
    response.clearCookie(name || TOKENS.auth_token, {
      ...(this.configService.get<string>('DEV_ENVIRONMENT') !== 'true' && {
        domain: '.coparent.com',
      }),
    });
  }

  calculateAverage(data: number[]) {
    return data.reduce((a, b) => a + b) / data.length;
  }

  isDateInRange = (
    start_date: string | Date,
    end_date: string | Date,
    date: string | Date,
  ): boolean => {
    const startDate = dayjs.utc(dayjs(start_date).format('YYYY-MM-DD'));
    const endDate = dayjs.utc(dayjs(end_date).format('YYYY-MM-DD'));
    const dateToCheck = dayjs.utc(dayjs(date).format('YYYY-MM-DD'));
    return (
      dateToCheck.isSameOrAfter(startDate) &&
      dateToCheck.isSameOrBefore(endDate)
    );
  };

  getDatesBetweenDates(
    start: Date = dayjs().toDate(),
    end: Date = dayjs().toDate(),
  ) {
    try {
      const startDate = dayjs(start);
      const endDate = dayjs(end);
      const datesArray: string[] = [];

      let currentDate = startDate;
      while (currentDate.isSameOrBefore(endDate)) {
        datesArray.push(currentDate.format('YYYY-MM-DD'));
        currentDate = currentDate.add(1, 'day');
      }

      return datesArray;
    } catch (error) {
      this.logger.log(error);
      return [];
    }
  }
}
