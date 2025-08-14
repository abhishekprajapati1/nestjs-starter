import { Request } from 'express';
import { ITenant } from 'src/auth/decorators/tenant.decorator';

type UserPayload = {
  id: DatabaseId;
  email: string;
  iat?: number;
  exp?: number;
  type?: string;
};

type DatabaseId = number;

interface IUserPayload {
  user: UserPayload;
}

interface TokenPayload {
  token_payload: any;
}

interface RefreshToken {
  refresh: string;
}

interface IRefreshTokenPayload {
  type: string;
  data: ITenant;
}

interface RequestWithAll
  extends Request,
    IUserPayload,
    RefreshToken,
    TokenPayload {}

type OpeningHour = {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  from: string;
  to: string;
};
