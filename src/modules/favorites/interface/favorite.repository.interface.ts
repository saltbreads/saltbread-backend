export const FAVORITE_REPOSITORY = Symbol('FAVORITE_REPOSITORY');

export type FavoriteShopItem = {
  shopId: string;
  name: string;
  heroImageUrl: string | null;
  region: string;
  roadAddress: string | null;
  avgRating: number | null;
  reviewCount: number;
  createdAt: Date;
};

export interface IFavoriteRepository {
  add(userId: string, shopId: string): Promise<void>;
  remove(userId: string, shopId: string): Promise<void>;
  findByUserId(userId: string): Promise<FavoriteShopItem[]>;
}
