import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { USER_REPOSITORY } from './interface/user.repository.interface';
import { UserPrismaRepository } from './repositories/user.repository.prisma';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [UsersController],
  providers: [
    UserPrismaRepository,
    { provide: USER_REPOSITORY, useExisting: UserPrismaRepository },
    UsersService,
    JwtAuthGuard,
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
