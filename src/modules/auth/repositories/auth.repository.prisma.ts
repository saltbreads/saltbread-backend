import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import type { IAuthRepository } from '../interface/auth.repository.interface';

@Injectable()
export class AuthPrismaRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}
}
