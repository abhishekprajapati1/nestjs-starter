import { Controller, Get, HttpStatus, Post, Body } from "@nestjs/common";
import { AppService } from "./app.service";
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
} from "@nestjs/swagger";
import { ApiResponse } from "./prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { PublicApi } from "./auth/decorators/public.decorator";

@ApiTags("Api Server")
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @PublicApi()
  @ApiOperation({ summary: "Get system health status" })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: "System health information retrieved successfully",
  })
  @SwaggerResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: "One or more system components are unhealthy",
  })
  async getServerHealth(): Promise<ApiResponse> {
    const server = this.appService.serverHealth();
    const database = await this.appService.databaseHealth();
    const storage = await this.appService.storageSetup();
    const smtp = this.appService.smtpSetup();
    const cache = this.appService.cacheSetup();

    // Determine overall system health
    const allHealthy = [server, database, storage, smtp, cache].every(
      (service) => service.status === "healthy",
    );
    const anyUnhealthy = [server, database, storage, smtp, cache].some(
      (service) => service.status === "unhealthy",
    );

    const overallStatus = anyUnhealthy
      ? "unhealthy"
      : allHealthy
        ? "healthy"
        : "degraded";

    return {
      success: overallStatus !== "unhealthy",
      message: `System status: ${overallStatus}`,
      data: {
        status: overallStatus,
        server,
        database,
        storage,
        smtp,
        cache,
      },
    };
  }

  @Get("health")
  @PublicApi()
  @ApiOperation({ summary: "Simple health check endpoint" })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: "API is up and running",
  })
  health(): ApiResponse {
    return {
      success: true,
      message: "API is operational",
      data: {
        timestamp: new Date().toISOString(),
        environment:
          this.config.get<string>("DEV_ENVIRONMENT") === "true"
            ? "development"
            : "production",
      },
    };
  }
}
