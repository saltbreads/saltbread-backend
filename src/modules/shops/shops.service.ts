import { Inject, Injectable } from '@nestjs/common';
import {
  SHOPS_REPOSITORY,
  type IShopsRepository,
} from './interface/shops.repository.interface';
import { GetNearbyShopsQueryDto } from './dto/get-nearby-shops.query.dto';
import { GetSearchShopsQueryDto } from './dto/get-search-shops.query.dto';

@Injectable()
export class ShopsService {
  constructor(
    @Inject(SHOPS_REPOSITORY) private readonly shopsRepo: IShopsRepository,
  ) {}

  async getAllLocations() {
    return this.shopsRepo.findAllLocations();
  }

  async searchShops(query: GetSearchShopsQueryDto) {
    return this.shopsRepo.search({
      lat: query.lat,
      lng: query.lng,
      radiusKm: query.radiusKm ?? 3,
      limit: query.limit ?? 10,
      offset: query.offset ?? 0,
      search: query.search,
    });
  }

  async getNearbyShops(query: GetNearbyShopsQueryDto) {
    const lat = query.lat;
    const lng = query.lng;

    const radiusKm = query.radiusKm ?? 3;
    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;

    return this.shopsRepo.findNearby({
      lat,
      lng,
      radiusKm,
      limit,
      offset,
    });
  }
}
