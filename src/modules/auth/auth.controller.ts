import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/auth/refresh',
    });
  }

  // GOOGLE
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const oauthUser = req.user;
    if (!oauthUser?.userId) {
      throw new UnauthorizedException('OAuth user missing');
    }

    const { accessToken, refreshToken, sessionId } =
      await this.authService.issueTokens(oauthUser.userId, {
        userAgent: req.headers['user-agent'] ?? '',
        ip: req.ip,
      });

    this.setRefreshCookie(res, refreshToken);

    return res.json({ accessToken, sessionId });
  }

  // KAKAO
  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  kakaoLogin() {}

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoCallback(@Req() req: Request, @Res() res: Response) {
    const oauthUser = req.user;

    if (!oauthUser?.userId) {
      throw new UnauthorizedException('OAuth user missing');
    }

    const { accessToken, refreshToken, sessionId } =
      await this.authService.issueTokens(oauthUser.userId, {
        userAgent: req.headers['user-agent'] ?? '',
        ip: req.ip,
      });

    this.setRefreshCookie(res, refreshToken);

    return res.json({ accessToken, sessionId });
  }

  // NAVER
  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  naverLogin() {}

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  async naverCallback(@Req() req: Request, @Res() res: Response) {
    const oauthUser = req.user;

    if (!oauthUser?.userId) {
      throw new UnauthorizedException('OAuth user missing');
    }

    const { accessToken, refreshToken, sessionId } =
      await this.authService.issueTokens(oauthUser.userId, {
        userAgent: req.headers['user-agent'] ?? '',
        ip: req.ip,
      });

    this.setRefreshCookie(res, refreshToken);

    return res.json({ accessToken, sessionId });
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
        // 토큰이 이미 만료되었거나 변조된 경우도 logout은 성공 처리
      }
    }

    res.clearCookie('refresh_token', { path: '/auth/refresh' });

    return res.json({ ok: true });
  }
}
