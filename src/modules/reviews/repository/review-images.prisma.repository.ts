import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { getDb } from 'src/shared/prisma/get-db';
import type { TransactionContext } from 'src/shared/prisma/transaction-runner.interface';
import type {
  IReviewImagesRepository,
  ReviewImageListItem,
} from '../interface/review-images.repository.interface';

@Injectable()
export class ReviewImagesPrismaRepository implements IReviewImagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findRecentByShopId(
    shopId: string,
    take: number,
    ctx?: TransactionContext<Prisma.TransactionClient>,
  ): Promise<ReviewImageListItem[]> {
    const db = getDb(ctx, this.prisma);

    return db.reviewImage.findMany({
      where: { shopId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      select: { id: true, url: true, reviewId: true, createdAt: true },
    });
  }

  async findCursorByShopId(
    shopId: string,
    args: { take: number; cursorId?: string },
    ctx?: TransactionContext<Prisma.TransactionClient>,
  ): Promise<ReviewImageListItem[]> {
    const db = getDb(ctx, this.prisma);

    const takePlusOne = args.take + 1;

    return db.reviewImage.findMany({
      where: { shopId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: takePlusOne,

      ...(args.cursorId
        ? {
            cursor: { id: args.cursorId },
            skip: 1,
          }
        : {}),

      select: {
        id: true,
        url: true,
        reviewId: true,
        createdAt: true,
      },
    });
  }
}
