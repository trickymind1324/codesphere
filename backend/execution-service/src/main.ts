import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { DockerExecutor } from './utils/docker-executor.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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

  // Build Docker images if enabled
  if (configService.get<boolean>('ENABLE_DOCKER', true)) {
    const dockerExecutor = app.get(DockerExecutor);
    try {
      await dockerExecutor.buildImages();
      console.log('Docker images built successfully');
    } catch (error) {
      console.error('Failed to build Docker images:', error.message);
      console.log('Warning: Code execution may not work without Docker images');
    }
  }

  // Start server
  const port = configService.get<number>('PORT') || 8002;
  await app.listen(port);

  console.log(`Execution Service running on: http://localhost:${port}${apiPrefix}`);
  console.log(`Ready to execute code securely in isolated containers`);
}

bootstrap();
