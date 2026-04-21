import type { ShopLinkType } from '@prisma/client';
import { Shop } from '@prisma/client';

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

  distanceMeters: number;

  avgRating: number;
  reviewCount: number;
  avgPrice: number | null;
  bestLabels: string[];
};

export type SearchShopsResult = {
  items: SearchShopCard[];
  hasNext: boolean;
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

export const SHOP_REPOSITORY = Symbol('SHOP_REPOSITORY');

export type ShopHomeLinkRecord = {
  type: ShopLinkType;
  url: string;
  label: string | null;
  isPrimary: boolean;
};

export type ShopHomeRecord = {
  id: string;
  name: string;
  roadAddress: string | null;
  jibunAddress: string | null;
  telephone: string | null;
  hoursRaw: string | null;
  links: ShopHomeLinkRecord[];
};

export interface IShopsRepository {
  findById(shopId: string): Promise<Shop | null>;
  findAllLocations(): Promise<ShopLocation[]>;
  search(params: SearchShopsParams): Promise<SearchShopsResult>;
  findNearby(params: FindNearByParams): Promise<NearbyShopCard[]>;
  findShopHomeById(shopId: string): Promise<ShopHomeRecord | null>;
}

export const SHOPS_REPOSITORY = Symbol('SHOPS_REPOSITORY');
