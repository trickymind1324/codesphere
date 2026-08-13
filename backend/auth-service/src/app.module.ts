import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { KeycloakAdminService } from './services/keycloak-admin.service';

/**
 * Auth-service is a thin, stateless proxy: it only creates users in Keycloak
 * for the first-party sign-up form. Keycloak owns everything else, so there is
 * no database, cache, mailer, or token signing here.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
    }),
  ],
  controllers: [AuthController],
  providers: [KeycloakAdminService],
})
export class AppModule {}
