import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { OAuthProvider } from '@prisma/client';
import { Strategy } from 'passport-naver-v2';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from 'src/modules/users/interface/user.repository.interface';

type NaverProfileJson = {
  response?: {
    id?: string;
    email?: string;
    name?: string;
    nickname?: string;
    profile_image?: string;
  };
};

type NaverProfile = {
  id?: string;
  displayName?: string;
  emails?: Array<{ value?: string }>;
  photos?: Array<{ value?: string }>;
  _json?: unknown;
};

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(
    private readonly config: ConfigService,
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {
    const clientID = config.get<string>('NAVER_CLIENT_ID');
    const clientSecret = config.get<string>('NAVER_CLIENT_SECRET');
    const callbackURL = config.get<string>('NAVER_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new UnauthorizedException('Naver OAuth env missing');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profileRaw: unknown,
    done: (error: any, user?: any) => void,
  ) {
    const profile = profileRaw as NaverProfile;

    const json = (profile._json ?? null) as NaverProfileJson | null;
    const r = json?.response;

    const providerUserId = String(r?.id ?? profile.id ?? '');
    if (!providerUserId) {
      throw new UnauthorizedException('Naver profile id missing');
    }

    const email = r?.email ?? profile.emails?.[0]?.value ?? null;

    const displayName = r?.nickname ?? r?.name ?? profile.displayName ?? null;

    const profileImageUrl =
      r?.profile_image ?? profile.photos?.[0]?.value ?? null;

    const user = await this.userRepo.upsertOAuthUser({
      provider: OAuthProvider.NAVER,
      providerUserId,
      email,
      displayName,
      profileImageUrl,
    });

    return done(null, { userId: user.id });
  }
}
