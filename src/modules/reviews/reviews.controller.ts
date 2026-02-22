import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { GetShopReviewsQueryDto } from './dto/get-shop-reviews-query-dto';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('shops/:shopId/reviews')
  async getShopReviews(
    @Param('shopId') shopId: string,
    @Query() query: GetShopReviewsQueryDto,
  ) {
    const data = await this.reviewsService.getShopReviews(shopId, query);

    return {
      success: true,
      data,
    };
  }
}
