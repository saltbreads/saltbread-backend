import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';
import { SESSION_REPOSITORY } from './interface/session.repository.interface';
import { type ISessionRepository } from './interface/session.repository.interface';
import { parseDurationToDate } from 'src/shared/utils/parseDuration';
import { createId } from '@paralleldrive/cuid2';

type AccessPayload = { sub: string };
type RefreshPayload = { sub: string; sid: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepo: ISessionRepository,
  ) {}

  private accessSecret() {
    return this.config.get<string>('JWT_ACCESS_SECRET', '');
  }
  private refreshSecret() {
    return this.config.get<string>('JWT_REFRESH_SECRET', '');
  }

  private accessExpiresIn(): StringValue {
    return this.config.getOrThrow<string>(
      'JWT_ACCESS_EXPIRES_IN',
    ) as StringValue;
  }

  private refreshExpiresIn(): StringValue {
    return this.config.getOrThrow<string>(
      'JWT_REFRESH_EXPIRES_IN',
    ) as StringValue;
  }

  private async hashToken(token: string) {
    const saltRounds = 10;
    return bcrypt.hash(token, saltRounds);
  }

  private parseRefreshExpiryDate(): Date {
    return parseDurationToDate(this.refreshExpiresIn());
  }

  private signAccessToken(userId: string) {
    const payload: AccessPayload = { sub: userId };
    return this.jwt.sign(payload, {
      secret: this.accessSecret(),
      expiresIn: this.accessExpiresIn(),
    });
  }

  private signRefreshToken(userId: string, sessionId: string) {
    const payload: RefreshPayload = { sub: userId, sid: sessionId };
    return this.jwt.sign(payload, {
      secret: this.refreshSecret(),
      expiresIn: this.refreshExpiresIn(),
    });
  }

  /**
   * 로그인 성공 시 호출:
   * - 세션 생성
   * - refresh 발급 + 해시 저장
   * - access 발급
   */
  async issueTokens(
    userId: string,
    meta?: { userAgent?: string; ip?: string },
  ) {
    const expiresAt = this.parseRefreshExpiryDate();

    // cuid를 직접 생성해서 한 번에 create
    const id = createId();

    const refreshToken = this.signRefreshToken(userId, id);
    const refreshHash = await this.hashToken(refreshToken);

    const session = await this.sessionRepo.create({
      id,
      userId,
      refreshTokenHash: refreshHash,
      expiresAt,
      userAgent: meta?.userAgent ?? null,
      ip: meta?.ip ?? null,
    });

    const accessToken = this.signAccessToken(userId);

    return {
      accessToken,
      refreshToken,
      sessionId: session.id,
      refreshExpiresAt: expiresAt,
    };
  }

  verifyRefreshToken(refreshToken: string): RefreshPayload {
    try {
      return this.jwt.verify<RefreshPayload>(refreshToken, {
        secret: this.refreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * refresh 쿠키로 들어온 refreshToken으로:
   * - 검증
   * - DB 해시 비교
   * - 새 refresh + access 발급
   * - DB 해시 갱신(= rotation)
   */
  async rotateRefresh(refreshToken: string) {
    let payload: RefreshPayload;

    try {
      payload = this.jwt.verify<RefreshPayload>(refreshToken, {
        secret: this.refreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { sub: userId, sid: sessionId } = payload;

    const session = await this.sessionRepo.findById(sessionId);

    if (!session) throw new UnauthorizedException('Session not found');

    if (session.userId !== userId)
      throw new UnauthorizedException('Session mismatch');

    if (session.expiresAt.getTime() < Date.now()) {
      await this.sessionRepo.deleteById(session.id);
      throw new UnauthorizedException('Session expired');
    }

    const ok = await bcrypt.compare(refreshToken, session.refreshTokenHash);
    if (!ok) {
      await this.sessionRepo.deleteById(session.id);
      throw new UnauthorizedException('Refresh token reused/invalid');
    }

    // rotation: 새 refresh 발급 + 해시 갱신
    const newRefreshToken = this.signRefreshToken(userId, session.id);
    const newHash = await this.hashToken(newRefreshToken);

    await this.sessionRepo.updateRefreshHash(session.id, newHash);

    const newAccessToken = this.signAccessToken(userId);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      sessionId: session.id,
    };
  }

  async logout(sessionId: string) {
    await this.sessionRepo.deleteById(sessionId);
  }
}
