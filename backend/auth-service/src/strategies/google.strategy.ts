import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/oauth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const user = {
      oauthId: id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      fullName: `${name.givenName} ${name.familyName}`,
      avatarUrl: photos[0].value,
      provider: 'google',
    };

    // OAuth profile is a transient shape consumed by the oauth callback route,
    // not the JWT user that Express.User describes.
    done(null, user as unknown as Express.User);
  }
}
