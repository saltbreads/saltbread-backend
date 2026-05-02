import { AuthSession } from '@prisma/client';

export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');

export type CreateSessionInput = {
  id?: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  userAgent?: string | null;
  ip?: string | null;
};

export interface ISessionRepository {
  create(input: CreateSessionInput): Promise<Pick<AuthSession, 'id'>>;
  findById(id: string): Promise<{
    id: string;
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
  } | null>;
  updateRefreshHash(sessionId: string, newHash: string, expiresAt: Date): Promise<void>;
  deleteById(id: string): Promise<void>;
}
