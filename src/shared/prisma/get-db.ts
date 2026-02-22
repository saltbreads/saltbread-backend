import type { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import type { TransactionContext } from './transaction-runner.interface';

export type Db = Prisma.TransactionClient | PrismaService;

export function getDb(
  ctx: TransactionContext<Prisma.TransactionClient> | undefined,
  prisma: PrismaService,
): Db {
  return ctx?.tx ?? prisma;
}
