import * as bcrypt from 'bcryptjs';
import dayjs from './dayjs';
import { Response } from 'express';
import { MAX_AGES, TOKENS } from './constants';

export const hashString = async (password: string): Promise<string> => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

export const compareString = async (
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

export const setCookie = (
  response: Response,
  { data, age, name }: { data: any; age?: number; name: string },
): void => {
  response.cookie(name || TOKENS.auth_token, data, {
    ...(process.env.DEV_ENVIRONMENT?.toLowerCase() !== 'true' && {
      domain: process.env.DOMAIN_NAME,
    }),
    maxAge: age || MAX_AGES[TOKENS.auth_token],
    httpOnly: true,
    sameSite: 'none',
    secure: true,
  });
};

export const removeCookie = (response: Response, name: string): void => {
  response.clearCookie(name || TOKENS.auth_token, {
    ...(process.env.DEV_ENVIRONMENT?.toLowerCase() !== 'true' && {
      domain: process.env.DOMAIN_NAME,
    }),
  });
};

export const isValidDateString = (
  dateStr: string,
  format: string = 'YYYY-MM-DD',
) => {
  return dayjs(dateStr, format, true).isValid();
};

export const calculateAverage = (data: number[]) => {
  return data.reduce((a, b) => a + b) / data.length;
};

export const isDateInRange = (
  start_date: string | Date,
  end_date: string | Date,
  date: string | Date,
): boolean => {
  const startDate = dayjs.utc(dayjs(start_date).format('YYYY-MM-DD'));
  const endDate = dayjs.utc(dayjs(end_date).format('YYYY-MM-DD'));
  const dateToCheck = dayjs.utc(dayjs(date).format('YYYY-MM-DD'));
  return (
    dateToCheck.isSameOrAfter(startDate) && dateToCheck.isSameOrBefore(endDate)
  );
};

export const getDatesBetweenDates = (
  start: Date = dayjs().toDate(),
  end: Date = dayjs().toDate(),
) => {
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
    console.error(error);
    return [];
  }
};
export const getContractExpiryDate = ({
  start_work,
  type,
  duration,
}: {
  start_work: Date;
  type: 'month' | 'year' | 'week';
  duration: number;
}) => {
  try {
    const date = dayjs(start_work).add(duration, type).format();
    if (date === 'Invalid Date') {
      throw new Error('Invalid arguements provided');
    }
    return dayjs(date).toDate();
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const base64ToUint8Array = (base64: string) => {
  const raw = atob(base64.split(',')[1]);
  const uint8Array = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    uint8Array[i] = raw.charCodeAt(i);
  }
  return uint8Array;
};

export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '');
};
