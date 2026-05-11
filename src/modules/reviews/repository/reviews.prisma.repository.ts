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
import { ReviewDetailRecord } from '../interface/reviews.repository.interface';

@Injectable()
export class ReviewsPrismaRepository implements IReviewsRepository {
  constructor(private readonly prisma: PrismaService) {}
  async create(
    data: {
      shopId: string;
      authorId: string;
      rating: number;
      content: string | null;
      tags?: string[];
    },
    ctx?: TransactionContext<Prisma.TransactionClient>,
  ): Promise<{ id: string }> {
    const db = getDb(ctx, this.prisma);

    const review = await db.review.create({
      data,
      select: {
        id: true,
      },
    });

    return review;
  }

  async findById(
    reviewId: string,
    ctx?: TransactionContext<Prisma.TransactionClient>,
  ): Promise<ReviewDetailRecord | null> {
    const db = getDb(ctx, this.prisma);

    return db.review.findUnique({
      where: {
        id: reviewId,
      },
      select: {
        id: true,
        rating: true,
        content: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            nickname: true,
            displayName: true,
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
            displayName: true,
            profileImageUrl: true,
          },
        },
        images: {
          select: { id: true, url: true, order: true },
          orderBy: [{ order: 'asc' }, { id: 'asc' }],
        },
        _count: {
          select: { likes: true, comments: true },
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                nickname: true,
                displayName: true,
                profileImageUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' as const },
          take: 3,
        },
      },
    });
  }
}
