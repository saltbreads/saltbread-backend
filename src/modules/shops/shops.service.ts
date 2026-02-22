import { Inject, Injectable } from '@nestjs/common';
import {
  SHOPS_REPOSITORY,
  type IShopsRepository,
} from './interface/shops.repository.interface';
import { GetNearbyShopsQueryDto } from './dto/get-nearby-shops.query.dto';
import { GetSearchShopsQueryDto } from './dto/get-search-shops.query.dto';
import { ShopLinkType } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { ShopMenuDto } from './dto/shop-menu.dto';
import { ShopHomeDto } from './dto/shop-home.dto';
import {
  type IShopMenuRepository,
  SHOP_MENU_REPOSITORY,
} from './interface/shop-menu.repository.interface';
import {
  type IReviewImagesRepository,
  REVIEW_IMAGES_REPOSITORY,
} from '../reviews/interface/review-images.repository.interface';
import { GetShopPhotosQueryDto } from './dto/get-shop-photos-query.dto';

@Injectable()
export class ShopsService {
  constructor(
    @Inject(SHOPS_REPOSITORY)
    private readonly shopsRepo: IShopsRepository,
    @Inject(SHOP_MENU_REPOSITORY)
    private readonly shopMenuRepo: IShopMenuRepository,
    @Inject(REVIEW_IMAGES_REPOSITORY)
    private readonly reviewImagesRepo: IReviewImagesRepository,
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

  async getShopHome(shopId: string): Promise<ShopHomeDto> {
    const shop = await this.shopsRepo.findShopHomeById(shopId);
    if (!shop) throw new NotFoundException('Shop not found');

    const mainTypes = new Set<ShopLinkType>([
      ShopLinkType.WEBSITE,
      ShopLinkType.INSTAGRAM,
      ShopLinkType.KAKAO,
    ]);

    const pickFirst = (type: ShopLinkType) =>
      shop.links.find((l) => l.type === type)?.url ?? null;

    const website = pickFirst(ShopLinkType.WEBSITE);
    const instagram = pickFirst(ShopLinkType.INSTAGRAM);
    const kakao = pickFirst(ShopLinkType.KAKAO);

    const etc = shop.links
      .filter((l) => !mainTypes.has(l.type))
      .map((l) => ({
        type: l.type,
        url: l.url,
        label: l.label,
        isPrimary: l.isPrimary,
      }));

    return {
      shopId: shop.id,
      name: shop.name,
      address: {
        road: shop.roadAddress,
        jibun: shop.jibunAddress,
      },
      telephone: shop.telephone,
      hoursRaw: shop.hoursRaw,
      links: {
        website,
        instagram,
        kakao,
        etc,
      },
    };
  }

  async getShopMenus(shopId: string): Promise<ShopMenuDto[]> {
    const shop = await this.shopsRepo.findById(shopId);
    if (!shop) throw new NotFoundException('Shop not found');

    const menus = await this.shopMenuRepo.findByShopId(shopId);

    return menus.map((m) => {
      const displayPrice =
        m.price !== null ? m.price : m.priceText !== null ? m.priceText : null;

      return {
        id: m.id,
        name: m.name,
        price: m.price,
        priceText: m.priceText,
        displayPrice,
        imageUrl: m.imageUrl,
      };
    });
  }

  async getPhotoHighlights(shopId: string) {
    const shop = await this.shopsRepo.findById(shopId);
    if (!shop) throw new NotFoundException('Shop not found');

    const heroUrl = shop.heroImageUrl ?? null;

    const need = heroUrl ? 4 : 5;

    const reviewImages = await this.reviewImagesRepo.findRecentByShopId(
      shopId,
      need,
    );

    return {
      hero: heroUrl ? { url: heroUrl } : null,
      items: reviewImages.map((img) => ({
        id: img.id,
        url: img.url,
        reviewId: img.reviewId,
        createdAt: img.createdAt,
      })),
      total: (heroUrl ? 1 : 0) + reviewImages.length,
    };
  }

  async getShopPhotos(shopId: string, query: GetShopPhotosQueryDto) {
    const shop = await this.shopsRepo.findById(shopId);
    if (!shop) throw new NotFoundException('Shop not found');

    const limit = query.limit ?? 20;
    const cursor = query.cursor;

    // 첫 페이지에서만 hero 포함
    const heroUrl = !cursor ? (shop.heroImageUrl ?? null) : null;

    // hasNext 판정하기 위해 서비스에서 take + 1 로 가져옴
    const take = limit + 1;
    const rows = await this.reviewImagesRepo.findCursorByShopId(shopId, {
      take,
      cursorId: cursor,
    });

    const hasNext = rows.length > limit;
    const items = hasNext ? rows.slice(0, limit) : rows;

    const lastItem = items[items.length - 1];
    const nextCursor = hasNext && lastItem ? lastItem.id : null;

    return {
      hero: heroUrl ? { url: heroUrl } : null,
      items: items.map((img) => ({
        id: img.id,
        url: img.url,
        reviewId: img.reviewId,
        createdAt: img.createdAt,
      })),
      nextCursor,
      hasNext,
    };
  }
}
