import { Module } from '@nestjs/common';
import { ShopsController } from './shops.controller';
import { ShopsService } from './shops.service';
import { SHOPS_REPOSITORY } from './interface/shops.repository.interface';
import { ShopsPrismaRepository } from './repositories/shops.repository.prisma';
import { SHOP_MENU_REPOSITORY } from './interface/shop-menu.repository.interface';
import { ShopMenuPrismaRepository } from './repositories/shop-menu.prisma.repository';

@Module({
  controllers: [ShopsController],
  providers: [
    ShopsService,
    { provide: SHOPS_REPOSITORY, useClass: ShopsPrismaRepository },
    { provide: SHOP_MENU_REPOSITORY, useClass: ShopMenuPrismaRepository },
  ],
})
export class ShopsModule {}
