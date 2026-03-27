import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { AuthPrincipal } from '../types/auth-pricncipal';

type AccessPayload = {
  sub: string;
};

type AuthenticatedRequest = Request & {
  user?: AuthPrincipal;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractAccessToken(request);

    if (!token) {
      throw new UnauthorizedException('Access token이 없습니다.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<AccessPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });

      request.user = {
        userId: payload.sub,
      };

      return true;
    } catch {
      throw new UnauthorizedException('유효하지 않은 access token입니다.');
    }
  }

  private extractAccessToken(request: Request): string | null {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return null;
    }

    const [type, token] = authorization.split(' ');

    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
