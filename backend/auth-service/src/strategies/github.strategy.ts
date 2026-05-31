import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/oauth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function
  ): Promise<any> {
    const { id, username, displayName, emails, photos } = profile;

    const user = {
      oauthId: id,
      email: emails && emails[0] ? emails[0].value : null,
      username,
      fullName: displayName || username,
      avatarUrl: photos && photos[0] ? photos[0].value : null,
      provider: 'github',
    };

    done(null, user);
  }
}
