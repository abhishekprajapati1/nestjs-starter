import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './app.exception';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { settings } from 'lib/settings';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('/api');
  console.log('see this', settings.get('PORT'));

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: true,
      // exceptionFactory: (validationErrors: ValidationError[]) => {
      //   try {
      //     if (validationErrors.length > 0) {
      //       const firstError = validationErrors?.[0];
      //       const constraints = Object.values(
      //         firstError?.constraints || firstError.children?.[0]?.constraints,
      //       )?.[0]; // Get the first constraint message
      //       return new BadRequestException({
      //         success: false,
      //         message: constraints,
      //       });
      //     }
      //   } catch (error) {
      //     console.log(error);
      //     return null; // No errors, return null to avoid unnecessary responses
      //   }
      // },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('LMS')
    .setDescription('Api listing for the project - LMS')
    .setVersion('1.0.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  await app.listen(settings.get('PORT') ?? 8000);
}
bootstrap()
  .then(() => {})
  .catch(() => {});
