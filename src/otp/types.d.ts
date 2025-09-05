interface IGenerateOtp {
  email?: string;
  phone?: string;
  user_id?: number;
  context?: string;
}

interface IVerifyOtp {
  digits: string;
  email?: string;
  phone?: string;
  context?: string;
}
