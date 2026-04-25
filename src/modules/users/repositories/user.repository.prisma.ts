import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import {
  IUserRepository,
  UpsertOAuthUserInput,
} from '../../users/interface/user.repository.interface';

@Injectable()
export class UserPrismaRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertOAuthUser(input: UpsertOAuthUserInput) {
    const { provider, providerUserId, email, displayName, profileImageUrl } =
      input;

    const user = await this.prisma.user.upsert({
      where: {
        provider_providerUserId: { provider, providerUserId },
      },
      update: {
        email,
        displayName,
        profileImageUrl,
        lastLoginAt: new Date(),
      },
      create: {
        provider,
        providerUserId,
        displayName,
        profileImageUrl,
        email,
        lastLoginAt: new Date(),
      },
      select: { id: true },
    });

    return user;
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        displayName: true,
        nickname: true,
        profileImageUrl: true,
        email: true,
        provider: true,
        _count: { select: { favorites: true } },
      },
    });

    if (!user) return null;

    const { _count, ...rest } = user;
    return { ...rest, favoriteCount: _count.favorites };
  }
}
