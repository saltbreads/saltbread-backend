import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { OAuthProvider } from '@prisma/client';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from 'src/modules/users/interface/user.repository.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly config: ConfigService,
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {
    const clientID = config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = config.get<string>('GOOGLE_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new UnauthorizedException('Google OAuth env missing');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
      passReqToCallback: false,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const provider = OAuthProvider.GOOGLE;
    const providerUserId = profile.id;

    const email = profile.emails?.[0]?.value ?? null;
    const displayName = profile.displayName ?? null;
    const profileImageUrl = profile.photos?.[0]?.value ?? null;

    const user = await this.userRepo.upsertOAuthUser({
      provider,
      providerUserId,
      email,
      displayName,
      profileImageUrl,
    });

    return done(null, { userId: user.id });
  }
}
