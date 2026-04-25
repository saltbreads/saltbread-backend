import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IUserRepository } from './interface/user.repository.interface';
import { USER_REPOSITORY } from './interface/user.repository.interface';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async getMe(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }
}
