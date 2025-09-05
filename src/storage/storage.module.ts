import { Module } from "@nestjs/common";
import { StorageService } from "./storage.service";
import { ConfigService } from "@nestjs/config";
import { S3StorageAdapter } from "./s3-storage.adapter";
import { StorageController } from "./storage.controller";
import { LocalStorageAdapter } from "./local-storage.adapter";
import { StorageCrons } from "./storage.cron";

@Module({
  providers: [
    {
      provide: "STORAGE_ADAPTER",
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        if (process.env.STORAGE_ADAPTER === "s3") {
          return new S3StorageAdapter(config);
        }
        return new LocalStorageAdapter("uploads");
      },
    },
    {
      provide: StorageService,
      inject: ["STORAGE_ADAPTER"],
      useFactory: (adapter: S3StorageAdapter | LocalStorageAdapter) => {
        return new StorageService(adapter);
      },
    },
    StorageCrons,
  ],
  controllers: [StorageController],
  exports: [StorageService],
})
export class StorageModule {}
