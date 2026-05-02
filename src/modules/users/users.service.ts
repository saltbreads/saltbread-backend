import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IUserRepository } from './interface/user.repository.interface';
import { USER_REPOSITORY } from './interface/user.repository.interface';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async getMe(userId: string) {
    const [user, reviewStats] = await Promise.all([
      this.userRepository.findById(userId),
      this.userRepository.findMyReviewStats(userId),
    ]);

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return { ...user, ...reviewStats };
  }

  async getMyReviews(userId: string, query: { page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.userRepository.findMyReviews(userId, { skip, take: limit }),
      this.userRepository.countMyReviews(userId),
    ]);

    return { items, page, limit, total, hasNext: page * limit < total };
  }
}
