// src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TRANSACTION_RUNNER } from './transaction-runner.interface';
import { PrismaTransactionRunner } from './prisma-transaction-runner';

@Global()
@Module({
  providers: [
    PrismaService,
    { provide: TRANSACTION_RUNNER, useClass: PrismaTransactionRunner },
  ],
  exports: [PrismaService, TRANSACTION_RUNNER],
})
export class PrismaModule {}
