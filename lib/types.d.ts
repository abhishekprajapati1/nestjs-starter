import { Prisma, UserRole } from '@prisma/client';
import { Request } from 'express';
import { UploadedFile } from '../src/awsbucket/awsbucket.service';

export type JobSortType = 'newest' | 'oldest' | 'applicants_no';

export type UserPayload = {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
  type?: string;
};

export interface IUserPayload {
  user: UserPayload;
}

export interface TokenPayload {
  token_payload: any;
}

export interface RefreshToken {
  refresh: string;
}

export interface RequestWithAll
  extends Request,
    IUserPayload,
    RefreshToken,
    TokenPayload {}

export type OpeningHour = {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  from: string;
  to: string;
};

export type EmployeeFileTypes = 'avatar' | 'resume' | 'tfn_declaration_file';
export interface FindFileParams {
  select?: Prisma.FileSelect;
  name: EmployeeFileTypes;
  prisma?: Prisma.TransactionClient;
}

export interface UpdateFileParams {
  name: EmployeeFileTypes;
  prisma?: Prisma.TransactionClient;
  file: UploadedFile;
}

export type CreatorUser = {
  name: string;
  position: string;
  company_name: string;
};

export type REQUIRED_SETUP_RELATION_TYPE =
  | 'branches'
  | 'payroll_groups'
  | 'policy_documents'
  | 'induction_sections';
export type REQUIRED_SETUP_MODELS_TYPE =
  | 'branches'
  | 'payrollGroups'
  | 'policyDocument'
  | 'inductionSection';
export type RequiredModel = {
  relation: REQUIRED_SETUP_RELATION_TYPE;
  pagePath: string;
  message: string;
};
