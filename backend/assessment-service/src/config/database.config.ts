import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Assessment } from '../entities/assessment.entity';
import { AssessmentProblem } from '../entities/assessment-problem.entity';
import { AssessmentInvitation } from '../entities/assessment-invitation.entity';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5435'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'codesphere_assessments',
  entities: [Assessment, AssessmentProblem, AssessmentInvitation],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  migrations: ['dist/migrations/*.js'],
  migrationsRun: false,
});
