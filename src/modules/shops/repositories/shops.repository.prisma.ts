import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import type {
  IShopsRepository,
  ShopLocation,
} from '../interface/shops.repository.interface';

@Injectable()
export class ShopsPrismaRepository implements IShopsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllLocations(): Promise<ShopLocation[]> {
    const shops = await this.prisma.shop.findMany({
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
      },
    });

    return shops.map((shop) => ({
      id: shop.id,
      name: shop.name,
      latitude: shop.latitude.toNumber(),
      longitude: shop.longitude.toNumber(),
    }));
  }
}
