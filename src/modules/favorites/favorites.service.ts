import { Inject, Injectable } from '@nestjs/common';
import type { IFavoriteRepository } from './interface/favorite.repository.interface';
import { FAVORITE_REPOSITORY } from './interface/favorite.repository.interface';

@Injectable()
export class FavoritesService {
  constructor(
    @Inject(FAVORITE_REPOSITORY)
    private readonly favoriteRepository: IFavoriteRepository,
  ) {}

  async add(userId: string, shopId: string): Promise<void> {
    return this.favoriteRepository.add(userId, shopId);
  }

  async remove(userId: string, shopId: string): Promise<void> {
    return this.favoriteRepository.remove(userId, shopId);
  }

  async getMyFavorites(userId: string) {
    return this.favoriteRepository.findByUserId(userId);
  }
}
