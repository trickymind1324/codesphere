import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';

// Entities
import { Problem } from './entities/problem.entity';
import { TestCase } from './entities/test-case.entity';
import { Tag } from './entities/tag.entity';
import { StarterCode } from './entities/starter-code.entity';

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
  controllers: [],
  providers: [],
})
export class AppModule {}
