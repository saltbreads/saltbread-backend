import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { getDb } from 'src/shared/prisma/get-db';
import type { TransactionContext } from 'src/shared/prisma/transaction-runner.interface';
import type {
  IReviewTagsRepository,
  ReviewTagRecord,
} from '../interface/review-tags.repository.interface';

@Injectable()
export class ReviewTagsPrismaRepository implements IReviewTagsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByShopId(
    shopId: string,
    ctx?: TransactionContext<Prisma.TransactionClient>,
  ): Promise<ReviewTagRecord[]> {
    const db = getDb(ctx, this.prisma);

    const tags = await db.reviewTag.findMany({
      where: {
        shopId,
        isActive: true,
      },
      select: {
        id: true,
        label: true,
        count: true,
        externalCount: true,
      },
    });

    return tags as ReviewTagRecord[];
  }
}
