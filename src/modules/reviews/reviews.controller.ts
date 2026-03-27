import {
  Controller,
  Get,
  Post,
  Req,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { GetShopReviewsQueryDto } from './dto/get-shop-reviews-query-dto';
import { CreateReviewDto } from './dto/create-review-dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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

  @Get('shops/:shopId/review-tags')
  async getShopReviewTags(@Param('shopId') shopId: string) {
    const data = await this.reviewsService.getShopReviewTags(shopId);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('shops/:shopId/reviews')
  async createReview(
    @Param('shopId') shopId: string,
    @Body() body: CreateReviewDto,
    @Req() req: { user: { userId: string } },
  ) {
    const data = await this.reviewsService.createReview(
      shopId,
      req.user.userId,
      body,
    );

    return {
      success: true,
      data,
    };
  }
}
