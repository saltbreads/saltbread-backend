import { OAuthProvider, User } from '@prisma/client';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export type UpsertOAuthUserInput = {
  provider: OAuthProvider;
  providerUserId: string;
  email: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
};

export type MyReviewItem = {
  id: string;
  rating: number;
  content: string | null;
  tags: string[];
  images: { id: string; url: string; order: number }[];
  shop: { id: string; name: string; roadAddress: string | null; heroImageUrl: string | null };
  createdAt: Date;
};

export type MyReviewStats = {
  avgRating: number | null;
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

export interface IUserRepository {
  upsertOAuthUser(input: UpsertOAuthUserInput): Promise<Pick<User, 'id'>>;
  findById(id: string): Promise<(Pick<User, 'id' | 'displayName' | 'nickname' | 'profileImageUrl' | 'email' | 'provider'> & { favoriteCount: number; reviewCount: number }) | null>;
  findMyReviewStats(userId: string): Promise<MyReviewStats>;
  findMyReviews(userId: string, args: { skip: number; take: number }): Promise<MyReviewItem[]>;
  countMyReviews(userId: string): Promise<number>;
}
