import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import {
  ISessionRepository,
  CreateSessionInput,
} from '../interface/session.repository.interface';

@Injectable()
export class SessionPrismaRepository implements ISessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateSessionInput) {
    const session = await this.prisma.authSession.create({
      data: {
        id: input.id,
        userId: input.userId,
        refreshTokenHash: input.refreshTokenHash,
        expiresAt: input.expiresAt,
        userAgent: input.userAgent ?? null,
        ip: input.ip ?? null,
      },
      select: { id: true },
    });

    return session;
  }

  async findById(id: string) {
    return this.prisma.authSession.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        refreshTokenHash: true,
        expiresAt: true,
      },
    });
  }

  async updateRefreshHash(sessionId: string, newHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.authSession.update({
      where: { id: sessionId },
      data: { refreshTokenHash: newHash, expiresAt },
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.authSession.delete({ where: { id } }).catch(() => {});
  }
}
