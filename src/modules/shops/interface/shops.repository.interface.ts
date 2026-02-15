export type ShopLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type SearchShopsParams = {
  lat: number;
  lng: number;
  radiusKm: number;
  limit: number;
  offset: number;
  search?: string;
};

export type SearchShopCard = {
  id: string;
  name: string;
  heroImageUrl: string | null;
  region: string;
  latitude: number;
  longitude: number;
  avgRating: number;
  reviewCount: number;
  avgPrice: number | null;
  bestLabels: string[];
};
export type FindNearByParams = {
  lat: number;
  lng: number;
  radiusKm: number;
  limit: number;
  offset: number;
};

export type NearbyShopCard = {
  id: string;
  name: string;
  heroImageUrl: string | null;
  region: string;
  avgRating: number;
  reviewCount: number;
  avgPrice: number | null;
  bestLabels: string[];
};

export interface IShopsRepository {
  findAllLocations(): Promise<ShopLocation[]>;
  search(params: SearchShopsParams): Promise<SearchShopCard[]>;
  findNearby(params: FindNearByParams): Promise<NearbyShopCard[]>;
}

export const SHOPS_REPOSITORY = Symbol('SHOPS_REPOSITORY');
