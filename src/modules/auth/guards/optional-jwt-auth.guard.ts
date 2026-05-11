import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { AuthPrincipal } from '../types/auth-pricncipal';

type AccessPayload = { sub: string };
type AuthenticatedRequest = Request & { user?: AuthPrincipal };

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization) return true;

    const [type, token] = authorization.split(' ');
    if (type !== 'Bearer' || !token) return true;

    try {
      const payload = await this.jwtService.verifyAsync<AccessPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      request.user = { userId: payload.sub };
    } catch {
      // 만료/위조된 토큰도 에러 없이 통과 (isLikedByMe: false 처리)
    }

    return true;
  }
}
