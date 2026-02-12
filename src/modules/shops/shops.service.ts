import { Inject, Injectable } from '@nestjs/common';
import {
  SHOPS_REPOSITORY,
  type IShopsRepository,
} from './interface/shops.repository.interface';

@Injectable()
export class ShopsService {
  constructor(
    @Inject(SHOPS_REPOSITORY) private readonly shopsRepo: IShopsRepository,
  ) {}

  async getAllLocations() {
    return this.shopsRepo.findAllLocations();
  }
}
