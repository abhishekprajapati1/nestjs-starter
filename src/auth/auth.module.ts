import { Module } from "@nestjs/common";
import { TokenModule } from "../token/token.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PrismaModule } from "../prisma/prisma.module";
import { MailModule } from "../mail/mail.module";
import { OtpModule } from "src/otp/otp.module";

@Module({
  imports: [TokenModule, MailModule, PrismaModule, OtpModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
