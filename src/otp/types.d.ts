interface IGenerateOtp {
  email?: string;
  phone?: string;
  user_id?: number;
}

interface IVerifyOtp {
  digits: string;
  email?: string;
  phone?: string;
}
