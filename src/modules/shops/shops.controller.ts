import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { GetNearbyShopsQueryDto } from './dto/get-nearby-shops.query.dto';
import { GetSearchShopsQueryDto } from './dto/get-search-shops.query.dto';
import { GetShopPhotosQueryDto } from './dto/get-shop-photos-query.dto';
@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get('locations')
  async getAllLocations() {
    const data = await this.shopsService.getAllLocations();
    return { success: true, data };
  }

  @Header('Cache-Control', 'no-store')
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

  @Get(':shopId/home')
  async getShopHome(@Param('shopId') shopId: string) {
    const data = await this.shopsService.getShopHome(shopId);
    return { success: true, data };
  }

  @Get(':shopId/menus')
  async getShopMenu(@Param('shopId') shopId: string) {
    const data = await this.shopsService.getShopMenus(shopId);
    return { success: true, data };
  }

  /**
   * 가게 사진 하이라이트 조회
   *
   * 정책:
   * - heroImageUrl이 존재하면 hero 1장 + 최신 리뷰 이미지 4장
   * - heroImageUrl이 없으면 최신 리뷰 이미지 5장
   *
   * 상단 미리보기 영역(UI) 최적화를 위한 경량 API
   */
  @Get(':shopId/photo-highlights')
  async getPhotoHighlights(@Param('shopId') shopId: string) {
    const data = await this.shopsService.getPhotoHighlights(shopId);

    return {
      success: true,
      data,
    };
  }

  @Get(':shopId/photos')
  async getShopPhotos(
    @Param('shopId') shopId: string,
    @Query() query: GetShopPhotosQueryDto,
  ) {
    const data = await this.shopsService.getShopPhotos(shopId, query);

    return {
      success: true,
      data,
    };
  }
}
