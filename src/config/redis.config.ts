import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';

export const getRedisConfig = async (configService: ConfigService) => {
  return {
    store: await redisStore({
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: configService.get<number>('REDIS_PORT', 6379),
      password: configService.get<string>('REDIS_PASSWORD'),
      db: configService.get<number>('REDIS_DB', 0),
      ttl: configService.get<number>('REDIS_TTL', 3600), // 1 hour default
    }),
    isGlobal: true,
  };
};
