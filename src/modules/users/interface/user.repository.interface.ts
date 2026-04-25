import { OAuthProvider, User } from '@prisma/client';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export type UpsertOAuthUserInput = {
  provider: OAuthProvider;
  providerUserId: string;
  email: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
};

export interface IUserRepository {
  upsertOAuthUser(input: UpsertOAuthUserInput): Promise<Pick<User, 'id'>>;
  findById(id: string): Promise<(Pick<User, 'id' | 'displayName' | 'nickname' | 'profileImageUrl' | 'email' | 'provider'> & { favoriteCount: number }) | null>;
}
