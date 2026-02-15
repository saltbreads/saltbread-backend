import { Controller, Get, Query } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { GetNearbyShopsQueryDto } from './dto/get-nearby-shops.query.dto';
import { GetSearchShopsQueryDto } from './dto/get-search-shops.query.dto';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get('locations')
  async getAllLocations() {
    const data = await this.shopsService.getAllLocations();
    return { success: true, data };
  }

  @Get('search')
  async searchShops(@Query() query: GetSearchShopsQueryDto) {
    const data = await this.shopsService.searchShops(query);
    return { success: true, data };
  }

  @Get('nearby')
  async getNearbyShops(@Query() query: GetNearbyShopsQueryDto) {
    const data = await this.shopsService.getNearbyShops(query);
    return { success: true, data };
  }
}
