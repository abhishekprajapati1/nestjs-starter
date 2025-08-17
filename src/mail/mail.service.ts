import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import * as fs from "fs";
import * as handlebars from "handlebars";
import { ConfigService } from "@nestjs/config";

interface SendPrimaryEmail {
  to: string;
  subject: string;
  body: string;
  closure: string;
  ctaLabel: string;
  href: string;
  template_name: "primary";
}

interface SendPlainEmail {
  to: string;
  subject: string;
  body: string;
  closure: string;
  template_name: "plain";
}
type SendEmailParams = SendPrimaryEmail | SendPlainEmail;

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;
  logger: Logger;
  constructor(private readonly config: ConfigService) {
    this.logger = new Logger(MailService.name);
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>("SMTP_HOST"),
      port: Number(this.config.get<string>("SMTP_PORT")),
      secure: this.config.get<string>("SMTP_SECURE_FLAG") === "true",
      auth: {
        user: this.config.get<string>("SMTP_EMAIL"),
        pass: this.config.get<string>("SMTP_PASSWORD"),
      },
    } as nodemailer.TransportOptions);
  }

  getHtml(params: SendEmailParams) {
    if (params.template_name === "primary") {
      const baseURL =
        this.config.get<string>("DEV_ENVIRONMENT") === "true"
          ? "http://localhost:3000/"
          : "https://coparent.com/";
      const href = `${baseURL}${params.href}`;

      // return href;
      const template = fs
        .readFileSync(`src/mail/templates/${params.template_name}.html`, {
          encoding: "utf-8",
        })
        .toString();

      const compiledTemplate = handlebars.compile(template);
      return compiledTemplate({
        subject: params.subject,
        body: params.body,
        closure: params.closure,
        ctaLabel: params.ctaLabel,
        href: href,
      });
    } else {
      const template = fs
        .readFileSync(`src/mail/templates/${params.template_name}.html`, {
          encoding: "utf-8",
        })
        .toString();

      const compiledTemplate = handlebars.compile(template);
      return compiledTemplate({
        subject: params.subject,
        body: params.body,
        closure: params.closure,
      });
    }
  }

  async sendEmail(params: SendEmailParams) {
    const html = this.getHtml(params);

    const mailOptions: nodemailer.SendMailOptions = {
      from: this.config.get<string>("SMTP_EMAIL"),
      to: params.to,
      subject: params.subject,
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      this.logger.error("Error sending email: " + error);
      throw error;
    }
  }
}
