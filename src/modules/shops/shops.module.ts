import { Module } from '@nestjs/common';
import { ShopsController } from './shops.controller';
import { ShopsService } from './shops.service';
import { SHOPS_REPOSITORY } from './interface/shops.repository.interface';
import { ShopsPrismaRepository } from './repositories/shops.repository.prisma';

@Module({
  controllers: [ShopsController],
  providers: [
    ShopsService,
    { provide: SHOPS_REPOSITORY, useClass: ShopsPrismaRepository },
  ],
})
export class ShopsModule {}
