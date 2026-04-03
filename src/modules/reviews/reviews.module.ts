import { Module, forwardRef } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { ReviewsPrismaRepository } from './repository/reviews.prisma.repository';
import { REVIEWS_REPOSITORY } from './interface/reviews.repository.interface';
import { ShopsModule } from '../shops/shops.module';
import { REVIEW_TAGS_REPOSITORY } from './interface/review-tags.repository.interface';
import { ReviewTagsPrismaRepository } from './repository/review-tags.prisma.repository';
import { REVIEW_IMAGES_REPOSITORY } from './interface/review-images.repository.interface';
import { ReviewImagesPrismaRepository } from './repository/review-images.prisma.repository';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.modlue';

@Module({
  imports: [forwardRef(() => ShopsModule), AuthModule, AiModule],
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
    {
      provide: REVIEW_IMAGES_REPOSITORY,
      useClass: ReviewImagesPrismaRepository,
    },
  ],
  exports: [REVIEW_IMAGES_REPOSITORY],
})
export class ReviewsModule {}
