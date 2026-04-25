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
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((f) => ({
      shopId: f.shop.id,
      name: f.shop.name,
      heroImageUrl: f.shop.heroImageUrl,
      region: f.shop.region,
      createdAt: f.createdAt,
    }));
  }
}
