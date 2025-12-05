import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';

// Entities
import { Problem } from './entities/problem.entity';
import { TestCase } from './entities/test-case.entity';
import { Tag } from './entities/tag.entity';
import { StarterCode } from './entities/starter-code.entity';

// Controllers
import { ProblemController } from './controllers/problem.controller';
import { TagController } from './controllers/tag.controller';

// Services
import { ProblemService } from './services/problem.service';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Problem, TestCase, Tag, StarterCode]),
  ],
  controllers: [ProblemController, TagController],
  providers: [ProblemService, JwtAuthGuard, RolesGuard],
})
export class AppModule {}
