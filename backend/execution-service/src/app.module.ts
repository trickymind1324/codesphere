import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Controllers
import { ExecutionController } from './controllers/execution.controller';

// Services
import { ExecutionService } from './services/execution.service';

// Utils
import { DockerExecutor } from './utils/docker-executor.util';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [ExecutionController],
  providers: [ExecutionService, DockerExecutor, JwtAuthGuard],
})
export class AppModule {}
