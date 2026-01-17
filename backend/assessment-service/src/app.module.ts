import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';

// Entities
import { Assessment } from './entities/assessment.entity';
import { AssessmentProblem } from './entities/assessment-problem.entity';
import { AssessmentInvitation } from './entities/assessment-invitation.entity';

// Services
import { AssessmentService } from './services/assessment.service';
import { EmailService } from './services/email.service';
import { InvitationService } from './services/invitation.service';
import { ProblemService } from './services/problem.service';

// Controllers
import { AssessmentController } from './controllers/assessment.controller';
import {
  InvitationController,
  PublicInvitationController,
} from './controllers/invitation.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(databaseConfig()),
    TypeOrmModule.forFeature([
      Assessment,
      AssessmentProblem,
      AssessmentInvitation,
    ]),
  ],
  controllers: [
    AssessmentController,
    InvitationController,
    PublicInvitationController,
  ],
  providers: [AssessmentService, EmailService, InvitationService, ProblemService],
})
export class AppModule {}
