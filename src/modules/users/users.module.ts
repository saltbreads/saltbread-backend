import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { USER_REPOSITORY } from './interface/user.repository.interface';
import { UserPrismaRepository } from './repositories/user.repository.prisma';

@Module({
  imports: [PrismaModule],
  providers: [
    UserPrismaRepository,
    { provide: USER_REPOSITORY, useExisting: UserPrismaRepository },
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
