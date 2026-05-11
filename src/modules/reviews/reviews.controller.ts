import {
  Controller,
  Get,
  Post,
  Delete,
  Req,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { ReviewsService } from './reviews.service';
import { GetShopReviewsQueryDto } from './dto/get-shop-reviews-query-dto';
import { CreateReviewDto } from './dto/create-review-dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { SuggestReviewTagsDto } from './dto/suggest-review-tags-dto';
import type { AuthPrincipal } from '../auth/types/auth-pricncipal';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('shops/:shopId/reviews')
  @UseGuards(OptionalJwtAuthGuard)
  async getShopReviews(
    @Param('shopId') shopId: string,
    @Query() query: GetShopReviewsQueryDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as AuthPrincipal | undefined)?.userId;
    const data = await this.reviewsService.getShopReviews(shopId, query, userId);
    return { success: true, data };
  }

  @Get('shops/:shopId/review-tags')
  async getShopReviewTags(@Param('shopId') shopId: string) {
    const data = await this.reviewsService.getShopReviewTags(shopId);
    return { success: true, data };
  }

  @Post('shops/:shopId/reviews')
  @UseGuards(JwtAuthGuard)
  async createReview(
    @Param('shopId') shopId: string,
    @Body() body: CreateReviewDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthPrincipal;
    const data = await this.reviewsService.createReview(shopId, user.userId, body);
    return { success: true, data };
  }

  @Post('reviews/ai-tag-suggestions')
  @UseGuards(JwtAuthGuard)
  async suggestReviewTags(@Body() dto: SuggestReviewTagsDto) {
    const data = await this.reviewsService.suggestReviewTags(dto);
    return { success: true, data };
  }

  // 댓글
  @Post('reviews/:reviewId/comments')
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Param('reviewId') reviewId: string,
    @Body('content') content: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthPrincipal;
    const data = await this.reviewsService.addComment(reviewId, user.userId, content);
    return { success: true, data };
  }

  @Delete('reviews/comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @Param('commentId') commentId: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthPrincipal;
    await this.reviewsService.deleteComment(commentId, user.userId);
  }

  @Get('reviews/:reviewId/comments')
  async getComments(
    @Param('reviewId') reviewId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.reviewsService.getComments(reviewId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    return { success: true, data };
  }

  // 좋아요
  @Post('reviews/:reviewId/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async addLike(
    @Param('reviewId') reviewId: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthPrincipal;
    await this.reviewsService.addLike(reviewId, user.userId);
  }

  @Delete('reviews/:reviewId/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeLike(
    @Param('reviewId') reviewId: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthPrincipal;
    await this.reviewsService.removeLike(reviewId, user.userId);
  }
}
