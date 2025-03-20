import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './cache/cache.module';
import { BucketModule } from './bucket/bucket.module';
import { TokenModule } from './token/token.module';
import { FileModule } from './file/file.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    CacheModule,
    BucketModule,
    TokenModule,
    FileModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
