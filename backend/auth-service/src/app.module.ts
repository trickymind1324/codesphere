import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { RedisService } from './services/redis.service';
import { EmailService } from './services/email.service';
import { User } from './entities/user.entity';
import { getDatabaseConfig } from './config/database.config';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),

    // Repository
    TypeOrmModule.forFeature([User]),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, RedisService, EmailService, GoogleStrategy, GithubStrategy],
})
export class AppModule {}
