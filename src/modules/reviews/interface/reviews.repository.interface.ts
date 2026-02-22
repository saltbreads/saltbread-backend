// src/modules/reviews/interface/reviews.repository.interface.ts
import type { Prisma } from '@prisma/client';
import type { TransactionContext } from 'src/shared/prisma/transaction-runner.interface';

export const REVIEWS_REPOSITORY = Symbol('REVIEWS_REPOSITORY');

export type ReviewOrderBy = Prisma.ReviewOrderByWithRelationInput[];

// 우리가 findMany에서 select로 뽑아올 “리뷰 카드” 레코드 타입
export type ReviewListItemRecord = Prisma.ReviewGetPayload<{
  select: {
    id: true;
    rating: true;
    content: true;
    createdAt: true;
    author: {
      select: {
        id: true;
        nickname: true;
        profileImageUrl: true;
      };
    };
    images: {
      select: {
        id: true;
        url: true;
        order: true;
      };
    };
  };
}>;

export interface IReviewsRepository {
  countByShopId(
    shopId: string,
    ctx?: TransactionContext<Prisma.TransactionClient>,
  ): Promise<number>;

  findPageByShopId(
    shopId: string,
    args: {
      skip: number;
      take: number;
      orderBy: ReviewOrderBy;
    },
    ctx?: TransactionContext<Prisma.TransactionClient>,
  ): Promise<ReviewListItemRecord[]>;
}
