import { Module } from "@nestjs/common";
import { OtpService } from "./otp.service";
import { MailService } from "src/mail/mail.service";

@Module({
  providers: [OtpService, MailService],
  exports: [OtpService],
})
export class OtpModule {}
