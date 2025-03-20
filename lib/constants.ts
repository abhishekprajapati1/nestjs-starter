import { SignOptions } from 'jsonwebtoken';

// update all the token value related types defined in this file
export const TOKENS = {
  auth_token: '_lat',
  refresh_token: '_lrt',
};
export const TOKEN_VALUES = ['_lat', '_lrt'];
export type TokensType = {
  _lat: string;
  _lrt: string;
};

// IMPORTANT: match the times in both MAX_AGES and TOKEN_EXPIRATIONS
export const MAX_AGES = {
  [TOKENS.auth_token]: 1000 * 60 * 30, // 30 minutes
  [TOKENS.refresh_token]: 1000 * 60 * 60 * 24 * 60, // 60 days
};

export const TOKEN_EXPIRATIONS: {
  [key: string]: SignOptions['expiresIn'] | number;
} = {
  [TOKENS.auth_token]: '30M',
  [TOKENS.refresh_token]: '60D',
};

export const PATTERNS = {
  mobile_number: /^(\+?61)?0?([2-8]\d{8})$/,
  hex_color:
    /^(#([a-fA-F0-9]{3}){1,2}|(rgb|hsl)\(\s*\d+%?\s*,\s*\d*%?\s*,\s*\d*%?\s*\))$/,
  time_in_ampm: /.*:(?:.*am|.* pm)$/,
};

// this is used in refresh-token controller
export const REFRESHABLE_TOKEN_TYPES_ARRAY = [TOKENS.auth_token];
export type REFRESHABLE_TOKEN_TYPES = '_lat';

export type TOKEN_DATA = {
  value?: string;
  life?: number;
  type?: REFRESHABLE_TOKEN_TYPES;
};

export const SORT_BY_DEFAULTS = [
  'created_asc',
  'created_desc',
  'name_asc',
  'name_desc',
  'recently_updated',
];

export const ERR_TYPES = {
  token_expired: 'ERR_TOKEN_EXPIRED',
  token_invalid: 'ERR_TOKEN_INVALID',
  already_verified: 'ERR_ALREADY_VERIFIED',
  internal_server_err: 'INTERNAL_SERVER_ERR',
  prisma_err: 'PRISMA_ERR',
};
