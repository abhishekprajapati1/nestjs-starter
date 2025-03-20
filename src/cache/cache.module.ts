import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheModule as CMCacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    CMCacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: 'localhost',
            port: 6379,
          },
          ttl:
            process.env.DEV_ENVIRONMENT === 'true'
              ? 4 * 60 * 60 * 1000
              : 1 * 60 * 60 * 1000, // 4 hour for development and 1 hour for production
        }),
      }),
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
