import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthPrincipal } from '../auth/types/auth-pricncipal';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: Request) {
    const user = req.user as AuthPrincipal;
    const data = await this.usersService.getMe(user.userId);
    return { success: true, data };
  }

  @Get('me/reviews')
  @UseGuards(JwtAuthGuard)
  async getMyReviews(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user = req.user as AuthPrincipal;
    const data = await this.usersService.getMyReviews(user.userId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    return { success: true, data };
  }
}
