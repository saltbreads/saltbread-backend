import type { Prisma } from '@prisma/client';
import type { TransactionContext } from 'src/shared/prisma/transaction-runner.interface';

export const REVIEW_TAGS_REPOSITORY = Symbol('REVIEW_TAGS_REPOSITORY');

export type ReviewTagRecord = {
  id: string;
  label: string;
  count: number;
  externalCount: number | null;
};

export interface IReviewTagsRepository {
  findByShopId(
    shopId: string,
    ctx?: TransactionContext<Prisma.TransactionClient>,
  ): Promise<ReviewTagRecord[]>;

  upsertAndIncreaseCount(
    params: {
      shopId: string;
      label: string;
    },
    ctx?: TransactionContext<Prisma.TransactionClient>,
  ): Promise<void>;
}
