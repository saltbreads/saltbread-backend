import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import type {
  IReviewCommentRepository,
  IReviewLikeRepository,
  ReviewCommentRecord,
} from '../interface/review-interactions.repository.interface';

@Injectable()
export class ReviewCommentPrismaRepository implements IReviewCommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { reviewId: string; authorId: string; content: string }): Promise<ReviewCommentRecord> {
    return this.prisma.reviewComment.create({
      data,
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
    });
  }

  async delete(commentId: string, authorId: string): Promise<void> {
    const comment = await this.prisma.reviewComment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });

    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
    if (comment.authorId !== authorId) throw new NotFoundException('댓글을 찾을 수 없습니다.');

    await this.prisma.reviewComment.delete({ where: { id: commentId } });
  }

  async findPageByReviewId(reviewId: string, args: { skip: number; take: number }): Promise<ReviewCommentRecord[]> {
    return this.prisma.reviewComment.findMany({
      where: { reviewId },
      skip: args.skip,
      take: args.take,
      orderBy: { createdAt: 'desc' },
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
    });
  }

  async countByReviewId(reviewId: string): Promise<number> {
    return this.prisma.reviewComment.count({ where: { reviewId } });
  }
}

@Injectable()
export class ReviewLikePrismaRepository implements IReviewLikeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(reviewId: string, userId: string): Promise<void> {
    await this.prisma.reviewLike.upsert({
      where: { reviewId_userId: { reviewId, userId } },
      create: { reviewId, userId },
      update: {},
    });
  }

  async remove(reviewId: string, userId: string): Promise<void> {
    await this.prisma.reviewLike.deleteMany({ where: { reviewId, userId } });
  }

  async getLikedReviewIds(userId: string, reviewIds: string[]): Promise<string[]> {
    const likes = await this.prisma.reviewLike.findMany({
      where: { userId, reviewId: { in: reviewIds } },
      select: { reviewId: true },
    });
    return likes.map((l) => l.reviewId);
  }
}
