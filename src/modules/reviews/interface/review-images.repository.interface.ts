import type { Prisma } from '@prisma/client';
import type { TransactionContext } from 'src/shared/prisma/transaction-runner.interface';

export const REVIEW_IMAGES_REPOSITORY = Symbol('REVIEW_IMAGES_REPOSITORY');

export type ReviewImageListItem = {
  id: string;
  url: string;
  reviewId: string;
  createdAt: Date;
};

export interface IReviewImagesRepository {
  createMany(
    data: Array<{
      shopId: string;
      reviewId: string;
      uploaderId: string;
      url: string;
      order: number;
    }>,
    ctx?: TransactionContext<Prisma.TransactionClient>,
  ): Promise<void>;
  findRecentByShopId(
    shopId: string,
    take: number,
    ctx?: TransactionContext<Prisma.TransactionClient>,
  ): Promise<ReviewImageListItem[]>;
  findCursorByShopId(
    shopId: string,
    args: {
      take: number;
      cursorId?: string;
    },
    ctx?: TransactionContext<Prisma.TransactionClient>,
  ): Promise<ReviewImageListItem[]>;
}
