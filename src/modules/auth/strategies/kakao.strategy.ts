import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { OAuthProvider } from '@prisma/client';
import { Profile, Strategy } from 'passport-kakao';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from 'src/modules/users/interface/user.repository.interface';

type KakaoProfileJson = {
  kakao_account?: {
    email?: string;
  };
  properties?: {
    nickname?: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
};

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    private readonly config: ConfigService,
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {
    const clientID = config.get<string>('KAKAO_CLIENT_ID');
    const clientSecret = config.get<string>('KAKAO_CLIENT_SECRET');
    const callbackURL = config.get<string>('KAKAO_CALLBACK_URL');

    if (!clientID || !callbackURL) {
      throw new UnauthorizedException('Kakao OAuth env missing');
    }

    super({
      clientID,
      clientSecret: clientSecret || undefined,
      callbackURL,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ) {
    const provider = OAuthProvider.KAKAO;
    const providerUserId = String(profile.id);

    const json = profile._json as unknown as KakaoProfileJson;

    const email: string | null = json.kakao_account?.email ?? null;

    const displayName: string | null =
      json.properties?.nickname ??
      profile.username ??
      profile.displayName ??
      null;

    const profileImageUrl: string | null =
      json.properties?.profile_image ??
      json.properties?.thumbnail_image ??
      profile.photos?.[0]?.value ??
      null;

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
