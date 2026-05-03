import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import type {
  IUserRepository,
  MyReviewItem,
  MyReviewStats,
  UpsertOAuthUserInput,
} from '../../users/interface/user.repository.interface';

@Injectable()
export class UserPrismaRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertOAuthUser(input: UpsertOAuthUserInput) {
    const { provider, providerUserId, email, displayName, profileImageUrl } =
      input;

    const user = await this.prisma.user.upsert({
      where: {
        provider_providerUserId: { provider, providerUserId },
      },
      update: {
        email,
        displayName,
        profileImageUrl,
        lastLoginAt: new Date(),
      },
      create: {
        provider,
        providerUserId,
        displayName,
        profileImageUrl,
        email,
        lastLoginAt: new Date(),
      },
      select: { id: true },
    });

    return user;
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        displayName: true,
        nickname: true,
        profileImageUrl: true,
        email: true,
        provider: true,
        _count: { select: { favorites: true, reviews: true } },
      },
    });

    if (!user) return null;

    const { _count, ...rest } = user;
    return { ...rest, favoriteCount: _count.favorites, reviewCount: _count.reviews };
  }

  async findMyReviewStats(userId: string): Promise<MyReviewStats> {
    const rows = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { authorId: userId, isHidden: false },
      _count: { rating: true },
    });

    const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;
    let sum = 0;

    for (const row of rows) {
      const r = row.rating as 1 | 2 | 3 | 4 | 5;
      distribution[r] = row._count.rating;
      total += row._count.rating;
      sum += r * row._count.rating;
    }

    return {
      avgRating: total > 0 ? Math.round((sum / total) * 10) / 10 : null,
      ratingDistribution: distribution,
    };
  }

  async findMyReviews(userId: string, args: { skip: number; take: number }): Promise<MyReviewItem[]> {
    return this.prisma.review.findMany({
      where: { authorId: userId, isHidden: false },
      skip: args.skip,
      take: args.take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        content: true,
        tags: true,
        createdAt: true,
        shop: {
          select: {
            id: true,
            name: true,
            roadAddress: true,
            heroImageUrl: true,
          },
        },
        images: {
          select: { id: true, url: true, order: true },
          orderBy: [{ order: 'asc' }, { id: 'asc' }],
        },
      },
    });
  }

  async countMyReviews(userId: string): Promise<number> {
    return this.prisma.review.count({
      where: { authorId: userId, isHidden: false },
    });
  }
}
