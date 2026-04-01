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
import { REVIEW_TAGS_REPOSITORY } from './interface/review-tags.repository.interface';
import { type IReviewTagsRepository } from './interface/review-tags.repository.interface';
import { CreateReviewDto } from './dto/create-review-dto';
import {
  type IReviewImagesRepository,
  REVIEW_IMAGES_REPOSITORY,
} from './interface/review-images.repository.interface';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(REVIEWS_REPOSITORY)
    private readonly reviewRepo: IReviewsRepository,

    @Inject(SHOPS_REPOSITORY)
    private readonly shopRepo: IShopsRepository,

    @Inject(TRANSACTION_RUNNER)
    private readonly txRunner: ITransactionRunner<Prisma.TransactionClient>,

    @Inject(REVIEW_TAGS_REPOSITORY)
    private readonly reviewTagsRepo: IReviewTagsRepository,

    @Inject(REVIEW_IMAGES_REPOSITORY)
    private readonly reviewImagesRepo: IReviewImagesRepository,
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

  // TODO:
  // 현재는 서비스 초기 단계로 내부 리뷰 데이터가 충분하지 않기 때문에,
  // 태그 노출 강화를 위해 count + externalCount(displayCount) 기준으로 정렬한다.
  //
  // externalCount는 초기 부스팅 및 외부 데이터 연동을 위한 보조 지표이며,
  // 서비스 안정화 후 제거할 예정이다.
  //
  // 이후에는 DB count 기반 정렬로 전환하고,
  // 정렬 로직을 Service → Repository(DB orderBy)로 이동하여 성능을 개선한다.
  async getShopReviewTags(shopId: string) {
    const shop = await this.shopRepo.findById(shopId);
    if (!shop) throw new NotFoundException('Shop not found');

    const tags = await this.reviewTagsRepo.findByShopId(shopId);

    const mapped = tags.map((t) => {
      const external = t.externalCount ?? 0;

      return {
        id: t.id,
        label: t.label,
        count: t.count,
        externalCount: t.externalCount,
        displayCount: t.count + external,
      };
    });

    mapped.sort((a, b) => b.displayCount - a.displayCount);

    return { items: mapped };
  }

  async createReview(shopId: string, userId: string, body: CreateReviewDto) {
    // 1) shop 존재 확인
    const shop = await this.shopRepo.findById(shopId);
    if (!shop) throw new NotFoundException('Shop not found');

    // 2) 리뷰 + 이미지 + 태그 집계 한 트랜잭션에서 처리
    const created = await this.txRunner.run(async (ctx) => {
      const review = await this.reviewRepo.create(
        {
          shopId,
          authorId: userId,
          rating: body.rating,
          content: body.content ?? null,
        },
        ctx,
      );

      if (body.imageUrls?.length) {
        await this.reviewImagesRepo.createMany(
          body.imageUrls.map((url, index) => ({
            shopId,
            reviewId: review.id,
            uploaderId: userId,
            url,
            order: index,
          })),
          ctx,
        );
      }

      if (body.tags?.length) {
        const uniqueTags = [...new Set(body.tags)];

        for (const label of uniqueTags) {
          await this.reviewTagsRepo.upsertAndIncreaseCount(
            {
              shopId,
              label,
            },
            ctx,
          );
        }
      }

      const reviewWithImages = await this.reviewRepo.findById(review.id, ctx);

      if (!reviewWithImages) {
        throw new NotFoundException('Created review not found');
      }

      return reviewWithImages;
    });

    // 3) 응답 가공
    return {
      id: created.id,
      rating: created.rating,
      content: created.content,
      createdAt: created.createdAt,

      author: created.author
        ? {
            id: created.author.id,
            nickname: created.author.nickname ?? null,
            profileImageUrl: created.author.profileImageUrl ?? null,
          }
        : null,

      images: created.images.map((img) => ({
        id: img.id,
        url: img.url,
        order: img.order,
      })),
    };
  }
}
