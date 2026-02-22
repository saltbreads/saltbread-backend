import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { ReviewsPrismaRepository } from './repository/reviews.prisma.repository';
import { REVIEWS_REPOSITORY } from './interface/reviews.repository.interface';
import { ShopsModule } from '../shops/shops.module';

@Module({
  imports: [ShopsModule],
  controllers: [ReviewsController],
  providers: [
    ReviewsService,
    {
      provide: REVIEWS_REPOSITORY,
      useClass: ReviewsPrismaRepository,
    },
  ],
})
export class ReviewsModule {}
