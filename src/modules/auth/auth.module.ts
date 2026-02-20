import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { UsersModule } from '../users/users.module';
import { SessionPrismaRepository } from './repositories/session.repository.prisma';
import { SESSION_REPOSITORY } from './interface/session.repository.interface';
import { AuthController } from './auth.controller';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { NaverStrategy } from './strategies/naver.strategy';

@Module({
  imports: [ConfigModule, JwtModule.register({}), UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    KakaoStrategy,
    NaverStrategy,
    SessionPrismaRepository,
    {
      provide: SESSION_REPOSITORY,
      useExisting: SessionPrismaRepository,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
