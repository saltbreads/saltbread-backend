// src/modules/reviews/reviews.service.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ReviewSort } from './dto/review-sort.enum';
import { GetShopReviewsQueryDto } from './dto/get-shop-reviews-query-dto';
import {
  REVIEWS_REPOSITORY,
  type IReviewsRepository,
} from './interface/reviews.repository.interface';
import {
  SHOPS_REPOSITORY,
  type IShopsRepository,
} from '../shops/interface/shops.repository.interface';
import {
  TRANSACTION_RUNNER,
  type ITransactionRunner,
} from 'src/shared/prisma/transaction-runner.interface';
import type { ReviewListItemRecord } from './interface/reviews.repository.interface';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(REVIEWS_REPOSITORY)
    private readonly reviewRepo: IReviewsRepository,

    @Inject(SHOPS_REPOSITORY)
    private readonly shopRepo: IShopsRepository,

    @Inject(TRANSACTION_RUNNER)
    private readonly txRunner: ITransactionRunner<Prisma.TransactionClient>,
  ) {}

  async getShopReviews(shopId: string, query: GetShopReviewsQueryDto) {
    // 1) shop 존재 확인 (명확한 404)
    const shop = await this.shopRepo.findById(shopId);
    if (!shop) throw new NotFoundException('Shop not found');

    // 2) pagination 계산 (DTO에서 기본값을 잡았다면 ?? 없어도 됨)
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    // 3) 정렬 결정 (Prisma 타입으로 딱 고정)
    const orderBy: Prisma.ReviewOrderByWithRelationInput[] =
      query.sort === ReviewSort.RATING
        ? [{ rating: 'desc' }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }];

    // 4) 트랜잭션 러너로 total + items 같은 스냅샷에서 조회
    const { total, items } = await this.txRunner.run(async (ctx) => {
      const total = await this.reviewRepo.countByShopId(shopId, ctx);

      const items = await this.reviewRepo.findPageByShopId(
        shopId,
        { skip, take: limit, orderBy },
        ctx,
      );

      return { total, items };
    });

    // 5) 응답 가공 (필드명은 너희 Review select/include에 맞춰 조정)
    const reviews = items.map((r: ReviewListItemRecord) => ({
      id: r.id,
      rating: r.rating,
      content: r.content,
      createdAt: r.createdAt,

      author: r.author
        ? {
            id: r.author.id,
            nickname: r.author.nickname ?? null,
            profileImageUrl: r.author.profileImageUrl ?? null,
          }
        : null,

      images: r.images.map((img) => ({
        id: img.id,
        url: img.url,
        order: img.order,
      })),
    }));

    return {
      items: reviews,
      page,
      limit,
      total,
      hasNext: page * limit < total,
    };
  }
}
