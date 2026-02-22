import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { ReviewsPrismaRepository } from './repository/reviews.prisma.repository';
import { REVIEWS_REPOSITORY } from './interface/reviews.repository.interface';
import { ShopsModule } from '../shops/shops.module';
import { REVIEW_TAGS_REPOSITORY } from './interface/review-tags.repository.interface';
import { ReviewTagsPrismaRepository } from './repository/review-tags.prisma.repository';

@Module({
  imports: [ShopsModule],
  controllers: [ReviewsController],
  providers: [
    ReviewsService,
    {
      provide: REVIEWS_REPOSITORY,
      useClass: ReviewsPrismaRepository,
    },
    {
      provide: REVIEW_TAGS_REPOSITORY,
      useClass: ReviewTagsPrismaRepository,
    },
  ],
})
export class ReviewsModule {}
