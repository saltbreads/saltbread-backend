export const REVIEW_COMMENT_REPOSITORY = Symbol('REVIEW_COMMENT_REPOSITORY');
export const REVIEW_LIKE_REPOSITORY = Symbol('REVIEW_LIKE_REPOSITORY');

export type ReviewCommentRecord = {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    nickname: string | null;
    displayName: string | null;
    profileImageUrl: string | null;
  };
};

export interface IReviewCommentRepository {
  create(data: { reviewId: string; authorId: string; content: string }): Promise<ReviewCommentRecord>;
  delete(commentId: string, authorId: string): Promise<void>;
  findPageByReviewId(reviewId: string, args: { skip: number; take: number }): Promise<ReviewCommentRecord[]>;
  countByReviewId(reviewId: string): Promise<number>;
}

export interface IReviewLikeRepository {
  add(reviewId: string, userId: string): Promise<void>;
  remove(reviewId: string, userId: string): Promise<void>;
  getLikedReviewIds(userId: string, reviewIds: string[]): Promise<string[]>;
}
