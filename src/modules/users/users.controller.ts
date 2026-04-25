import { Controller, Get, Req, UseGuards } from '@nestjs/common';
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
}
