import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import type {
  ITransactionRunner,
  TransactionContext,
} from './transaction-runner.interface';

@Injectable()
export class PrismaTransactionRunner implements ITransactionRunner<Prisma.TransactionClient> {
  constructor(private readonly prisma: PrismaService) {}

  async run<T>(
    callback: (ctx: TransactionContext<Prisma.TransactionClient>) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return callback({ tx });
    });
  }
}
