import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import type { FavoriteShopItem, IFavoriteRepository } from '../interface/favorite.repository.interface';

@Injectable()
export class FavoritePrismaRepository implements IFavoriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: string, shopId: string): Promise<void> {
    await this.prisma.userFavorite.upsert({
      where: { userId_shopId: { userId, shopId } },
      create: { userId, shopId },
      update: {},
    });
  }

  async remove(userId: string, shopId: string): Promise<void> {
    await this.prisma.userFavorite.deleteMany({
      where: { userId, shopId },
    });
  }

  async findByUserId(userId: string): Promise<FavoriteShopItem[]> {
    const favorites = await this.prisma.userFavorite.findMany({
      where: { userId },
      select: {
        shop: {
          select: {
            id: true,
            name: true,
            heroImageUrl: true,
            region: true,
            roadAddress: true,
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (favorites.length === 0) return [];

    const shopIds = favorites.map((f) => f.shop.id);

    const reviewStats = await this.prisma.review.groupBy({
      by: ['shopId'],
      where: { shopId: { in: shopIds }, isHidden: false },
      _count: { id: true },
      _avg: { rating: true },
    });

    const statsMap = new Map(
      reviewStats.map((s) => [
        s.shopId,
        {
          reviewCount: s._count.id,
          avgRating: s._avg.rating
            ? Math.round(s._avg.rating * 10) / 10
            : null,
        },
      ]),
    );

    return favorites.map((f) => {
      const stats = statsMap.get(f.shop.id);
      return {
        shopId: f.shop.id,
        name: f.shop.name,
        heroImageUrl: f.shop.heroImageUrl,
        region: f.shop.region,
        roadAddress: f.shop.roadAddress,
        avgRating: stats?.avgRating ?? null,
        reviewCount: stats?.reviewCount ?? 0,
        createdAt: f.createdAt,
      };
    });
  }
}
