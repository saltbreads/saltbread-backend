import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './shared/prisma/prisma.module';
import { ShopsModule } from './modules/shops/shops.module';
import { AuthModule } from './modules/auth/auth.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { AiModule } from './modules/ai/ai.modlue';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ShopsModule,
    ReviewsModule,
    AiModule,
  ],
})
export class AppModule {}
