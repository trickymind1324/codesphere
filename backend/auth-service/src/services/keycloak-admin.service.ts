import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Creates users in Keycloak via the admin REST API so the app can offer a
 * first-party registration form (no Keycloak-hosted pages). Uses the admin-cli
 * password grant against the master realm; credentials come from env.
 */
@Injectable()
export class KeycloakAdminService {
  private readonly logger = new Logger(KeycloakAdminService.name);
  private readonly baseUrl: string;
  private readonly realm: string;
  private readonly adminUser: string;
  private readonly adminPassword: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('KEYCLOAK_URL', 'http://keycloak:8080');
    this.realm = this.config.get<string>('KEYCLOAK_REALM', 'codesphere');
    this.adminUser = this.config.get<string>('KEYCLOAK_ADMIN_USER', 'admin');
    this.adminPassword = this.config.get<string>('KEYCLOAK_ADMIN_PASSWORD', 'admin');
  }

  private async adminToken(): Promise<string> {
    const res = await fetch(
      `${this.baseUrl}/realms/master/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: 'admin-cli',
          username: this.adminUser,
          password: this.adminPassword,
        }).toString(),
      },
    );
    if (!res.ok) {
      throw new Error(`Keycloak admin auth failed (${res.status})`);
    }
    const data = (await res.json()) as { access_token: string };
    return data.access_token;
  }

  /**
   * Create an enabled user with a permanent password. The realm's default
   * role (candidate) is applied automatically. Throws ConflictException if the
   * email is already registered.
   */
  async createUser(params: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<void> {
    const token = await this.adminToken();
    const [firstName, ...rest] = params.fullName.trim().split(' ');
    const lastName = rest.join(' ');

    const res = await fetch(`${this.baseUrl}/admin/realms/${this.realm}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        username: params.email,
        email: params.email,
        firstName: firstName || params.email,
        lastName: lastName || '',
        enabled: true,
        emailVerified: true,
        credentials: [
          { type: 'password', value: params.password, temporary: false },
        ],
      }),
    });

    if (res.status === 201) return;
    if (res.status === 409) {
      throw new ConflictException('An account with this email already exists');
    }
    const body = await res.text();
    this.logger.error(`Keycloak user creation failed (${res.status}): ${body}`);
    throw new Error('Registration failed');
  }
}
