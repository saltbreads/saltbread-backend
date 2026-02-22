import { Module, forwardRef } from '@nestjs/common';
import { ReviewsModule } from '../reviews/reviews.module';
import { SHOP_MENU_REPOSITORY } from './interface/shop-menu.repository.interface';
import { SHOPS_REPOSITORY } from './interface/shops.repository.interface';
import { ShopMenuPrismaRepository } from './repositories/shop-menu.prisma.repository';
import { ShopsPrismaRepository } from './repositories/shops.repository.prisma';
import { ShopsController } from './shops.controller';
import { ShopsService } from './shops.service';

@Module({
  imports: [forwardRef(() => ReviewsModule)],
  controllers: [ShopsController],
  providers: [
    ShopsService,
    { provide: SHOPS_REPOSITORY, useClass: ShopsPrismaRepository },
    { provide: SHOP_MENU_REPOSITORY, useClass: ShopMenuPrismaRepository },
  ],
  exports: [SHOPS_REPOSITORY],
})
export class ShopsModule {}
