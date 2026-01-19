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
    return this.prisma.shop.findMany({
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
