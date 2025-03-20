import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import { settings } from 'lib/settings';

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  closure: string;
  ctaLabel: string;
  href: string;
  template_name: 'primary';
}

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    const secure = settings.get('SMTP_SECURE_FLAG');

    this.transporter = nodemailer.createTransport({
      host: settings.get('SMTP_HOST'),
      port: settings.get('SMTP_PORT'),
      secure,
      auth: {
        user: settings.get('SMTP_EMAIL'),
        pass: settings.get('SMTP_PASSWORD'),
      },
    } as nodemailer.TransportOptions);
  }

  getHtml(params: SendEmailParams) {
    const baseURL = settings.get('DEV_ENVIRONMENT')
      ? 'http://localhost:3000/'
      : 'https://akkukachasma.com/';
    const href = `${baseURL}${params.href}`;

    // return href;
    const template = fs
      .readFileSync(`src/mail/templates/${params.template_name}.html`, {
        encoding: 'utf-8',
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
  }

  async sendEmail(params: SendEmailParams) {
    const html = this.getHtml(params);

    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.SMTP_EMAIL,
      to: params.to,
      subject: params.subject,
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}
