import { Controller, Get } from '@nestjs/common';
import { ShopsService } from './shops.service';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get('locations')
  async getAllLocations() {
    const data = await this.shopsService.getAllLocations();
    return { success: true, data };
  }
}
