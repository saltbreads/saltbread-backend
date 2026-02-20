export type OAuthUserFromStrategy = {
  userId: string;
  provider: 'google' | 'kakao';
  providerId: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
};
