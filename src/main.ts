import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { json, urlencoded } from "express";
import * as cookieParser from "cookie-parser";
import {
  BadRequestException,
  Logger,
  ValidationError,
  ValidationPipe,
} from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const config = new ConfigService();
  const logger = new Logger("BootStrap");
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("/api");
  app.enableCors({
    origin: config.get<string>("ALLOWED_ORIGINS")?.split(","),
    allowedHeaders: config.get<string>("ALLOWED_HEADERS")?.split(","),
    credentials: config.get<string>("CREDENTIALS") === "true",
  });

  // request configs
  app.use(json({ limit: "50mb" }));
  app.use(urlencoded({ limit: "50mb", extended: true }));
  app.use(cookieParser());

  // validation configs
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (validationErrors: ValidationError[]) => {
        try {
          if (validationErrors.length > 0) {
            const firstError = validationErrors?.[0];
            const constraints = Object.values(
              firstError?.constraints ||
                firstError.children?.[0]?.constraints || {
                  message: "Some validation error occurred",
                },
            )?.[0]; // Get the first constraint message
            return new BadRequestException({
              success: false,
              message: constraints,
            });
          }
        } catch (error) {
          logger.error(error);
          return null; // No errors, return null to avoid unnecessary responses
        }
      },
    }),
  );

  // swagger api documentation setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle("CoParent API")
    .setDescription("Api listing for the project - CoParent")
    .setVersion("0.0.1")
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup("docs", app, swaggerDocument);

  await app.listen(config.get("PORT") ?? 3000);
}
bootstrap()
  .then(() => null)
  .catch(() => null);
