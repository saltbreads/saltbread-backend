export const SHOP_MENU_REPOSITORY = Symbol('SHOP_MENU_REPOSITORY');

export type ShopMenuRecord = {
  id: string;
  name: string;
  price: number | null;
  priceText: string | null;
  imageUrl: string | null;
  order: number;
};

export interface IShopMenuRepository {
  findByShopId(shopId: string): Promise<ShopMenuRecord[]>;
}
