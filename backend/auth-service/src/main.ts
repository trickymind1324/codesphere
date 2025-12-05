import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middleware
  app.use(helmet());

  // Compression
  app.use(compression());

  // Cookie parser
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Start server
  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Auth Service is running on port ${port}`);
  console.log(`📧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
}

bootstrap();
