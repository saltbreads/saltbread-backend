import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import type {
  IShopMenuRepository,
  ShopMenuRecord,
} from '../interface/shop-menu.repository.interface';

@Injectable()
export class ShopMenuPrismaRepository implements IShopMenuRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByShopId(shopId: string): Promise<ShopMenuRecord[]> {
    return this.prisma.shopMenu.findMany({
      where: { shopId },
      select: {
        id: true,
        name: true,
        price: true,
        priceText: true,
        imageUrl: true,
        order: true,
      },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    });
  }
}
