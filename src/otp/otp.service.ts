import { Injectable, BadRequestException } from "@nestjs/common";
import * as otpGenerator from "otp-generator";
import dayjs from "../../lib/dayjs";
import { PrismaService } from "src/prisma/prisma.service";
import { MailService } from "src/mail/mail.service";

@Injectable()
export class OtpService {
  constructor(
    private prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // Generate & save OTP
  async generateOtp({ email, phone, user_id, context }: IGenerateOtp) {
    if (!email && !phone) {
      throw new BadRequestException("Either email or phone is required");
    }

    // Optional cleanup: delete old OTPs for the same target
    await this.prisma.otp.deleteMany({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    const digits = this.generateDigits();
    const expiresAt = dayjs().add(10, "minute").toDate(); // expires in 5 min

    const otp = await this.prisma.otp.create({
      data: {
        digits,
        email,
        phone,
        expires_at: expiresAt,
        ...(user_id && {
          user: {
            connect: {
              id: user_id,
            },
          },
        }),
        ...(context && {
          context,
        }),
      },
    });

    return otp;
  }

  // Verify OTP
  async verifyOtp({
    digits,
    email,
    phone,
    context = "email_verification",
  }: IVerifyOtp) {
    const otp = await this.prisma.otp.findFirst({
      where: {
        digits,
        is_used: false,
        OR: [{ email }, { phone }],
        context,
      },
      orderBy: { created_at: "desc" },
    });

    if (!otp) {
      throw new BadRequestException("Invalid OTP");
    }

    if (otp.expires_at && dayjs().isAfter(dayjs(otp.expires_at))) {
      throw new BadRequestException("OTP expired");
    }

    // Mark OTP as used
    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { is_used: true },
    });

    return true;
  }

  private generateDigits(): string {
    return otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
  }
}
