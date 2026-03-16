import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Body,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { OAuthCodeService } from './oauth.code.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly oauthCodeService: OAuthCodeService,
  ) {}

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/auth/refresh',
    });
  }

  private async handleOAuthCallback(req: Request, res: Response) {
    const oauthUser = req.user as { userId?: string } | undefined;

    if (!oauthUser?.userId) {
      throw new UnauthorizedException('OAuth user missing');
    }

    const code = await this.oauthCodeService.createCode({
      userId: oauthUser.userId,
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    if (!frontendUrl) {
      throw new UnauthorizedException('FRONTEND_URL missing');
    }

    const redirectUrl = new URL('/oauth/callback', frontendUrl);
    redirectUrl.searchParams.set('code', code);

    return res.redirect(redirectUrl.toString());
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleOAuthCallback(req, res);
  }

  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  kakaoLogin() {}

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleOAuthCallback(req, res);
  }

  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  naverLogin() {}

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  async naverCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleOAuthCallback(req, res);
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.['refresh_token'] as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh cookie');
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
      sessionId,
    } = await this.authService.rotateRefresh(refreshToken);

    this.setRefreshCookie(res, newRefreshToken);

    return res.json({ accessToken, sessionId });
  }

  @Post('exchange')
  async exchange(
    @Body('code') code: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!code) {
      throw new UnauthorizedException('No exchange code');
    }

    const payload = await this.oauthCodeService.consumeCode(code);

    if (!payload?.userId) {
      throw new UnauthorizedException('Invalid or expired exchange code');
    }

    const { accessToken, refreshToken, sessionId } =
      await this.authService.issueTokens(payload.userId, {
        userAgent: req.headers['user-agent'] ?? '',
        ip: req.ip,
      });

    this.setRefreshCookie(res, refreshToken);

    return res.json({
      accessToken,
      sessionId,
    });
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.['refresh_token'] as string | undefined;

    if (refreshToken) {
      try {
        const payload = this.authService.verifyRefreshToken(refreshToken);

        if (payload?.sid) {
          await this.authService.logout(payload.sid);
        }
      } catch {
        // 만료/변조되어도 로그아웃은 성공 처리
      }
    }

    res.clearCookie('refresh_token', {
      path: '/auth/refresh',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return res.json({ ok: true });
  }
}
