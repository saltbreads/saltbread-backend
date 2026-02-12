export type ShopLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export interface IShopsRepository {
  findAllLocations(): Promise<ShopLocation[]>;
}

export const SHOPS_REPOSITORY = Symbol('SHOPS_REPOSITORY');
