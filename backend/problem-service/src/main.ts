import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  // Disable the default body parser so we can raise the limit — profile
  // avatar/resume uploads send base64 data URLs (a 5MB PDF ≈ 6.7MB of JSON),
  // which far exceeds Express's ~100KB default. Kept under Kong's 10MB cap.
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(json({ limit: '9mb' }));
  app.use(urlencoded({ extended: true, limit: '9mb' }));
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());
  app.use(cookieParser());

  // CORS configuration
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  const apiPrefix = configService.get<string>('API_PREFIX') || '/api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Start server
  const port = configService.get<number>('PORT') || 8001;
  await app.listen(port);

  console.log(`Problem Service running on: http://localhost:${port}${apiPrefix}`);
}

bootstrap();
