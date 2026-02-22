// src/modules/reviews/repository/reviews.repository.ts
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { getDb } from 'src/shared/prisma/get-db';
import type { TransactionContext } from 'src/shared/prisma/transaction-runner.interface';
import type {
  IReviewsRepository,
  ReviewOrderBy,
  ReviewListItemRecord,
} from '../interface/reviews.repository.interface';

@Injectable()
export class ReviewsPrismaRepository implements IReviewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countByShopId(
    shopId: string,
    ctx?: TransactionContext<Prisma.TransactionClient>,
  ): Promise<number> {
    const db = getDb(ctx, this.prisma);

    return db.review.count({
      where: {
        shopId,
        isHidden: false,
      },
    });
  }

  async findPageByShopId(
    shopId: string,
    args: { skip: number; take: number; orderBy: ReviewOrderBy },
    ctx?: TransactionContext<Prisma.TransactionClient>,
  ): Promise<ReviewListItemRecord[]> {
    const db = getDb(ctx, this.prisma);

    return db.review.findMany({
      where: {
        shopId,
        isHidden: false,
      },
      skip: args.skip,
      take: args.take,
      orderBy: args.orderBy,

      select: {
        id: true,
        rating: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            nickname: true,
            profileImageUrl: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            order: true,
          },
          orderBy: [{ order: 'asc' }, { id: 'asc' }],
        },
      },
    });
  }
}
