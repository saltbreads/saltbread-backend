import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthPrincipal } from '../auth/types/auth-pricncipal';
import { FavoritesService } from './favorites.service';

@Controller()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post('shops/:shopId/favorite')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async addFavorite(@Req() req: Request, @Param('shopId') shopId: string) {
    const user = req.user as AuthPrincipal;
    await this.favoritesService.add(user.userId, shopId);
  }

  @Delete('shops/:shopId/favorite')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFavorite(@Req() req: Request, @Param('shopId') shopId: string) {
    const user = req.user as AuthPrincipal;
    await this.favoritesService.remove(user.userId, shopId);
  }

  @Get('users/me/favorites')
  @UseGuards(JwtAuthGuard)
  async getMyFavorites(@Req() req: Request) {
    const user = req.user as AuthPrincipal;
    const data = await this.favoritesService.getMyFavorites(user.userId);
    return { success: true, data };
  }
}
