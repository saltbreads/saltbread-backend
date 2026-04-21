import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import type {
  IShopsRepository,
  SearchShopsParams,
  ShopLocation,
  SearchShopCard,
  NearbyShopCard,
  ShopHomeRecord,
} from '../interface/shops.repository.interface';
import { toNumberSafe } from 'src/shared/utils/toNumberSafe';
import { Prisma, Shop } from '@prisma/client';

type NearbyShopCardRow = {
  id: string;
  name: string;
  heroImageUrl: string | null;
  region: string;
  avgRating: number | null;
  reviewCount: number | null;
  avgPrice: number | null;
  bestLabels: string[] | null;
};

type SearchShopCardRow = {
  id: string;
  name: string;
  heroImageUrl: string | null;
  region: string;
  latitude: Prisma.Decimal | number;
  longitude: Prisma.Decimal | number;
  distanceMeters: number | null;
  avgRating: number | null;
  reviewCount: number | null;
  avgPrice: number | null;
  bestLabels: string[] | null;
};

@Injectable()
export class ShopsPrismaRepository implements IShopsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(shopId: string): Promise<Shop | null> {
    return this.prisma.shop.findUnique({
      where: { id: shopId },
    });
  }

  async findAllLocations(): Promise<ShopLocation[]> {
    const shops = await this.prisma.shop.findMany({
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
      },
    });

    return shops.map((shop) => ({
      id: shop.id,
      name: shop.name,
      latitude: shop.latitude.toNumber(),
      longitude: shop.longitude.toNumber(),
    }));
  }

  async findNearby(params: {
    lat: number;
    lng: number;
    radiusKm: number;
    limit: number;
    offset: number;
  }): Promise<NearbyShopCard[]> {
    const { lat, lng, radiusKm, limit, offset } = params;

    const rows = await this.prisma.$queryRaw<NearbyShopCardRow[]>`
      SELECT
        s."id",
        s."name",
        s."heroImageUrl",
        s."region",
        COALESCE(r."reviewCount", 0)::int AS "reviewCount",
        COALESCE(r."avgRating", 0)::float8 AS "avgRating",
        m."avgPrice"::float8 AS "avgPrice",
        COALESCE(t."bestLabels", ARRAY[]::text[]) AS "bestLabels"
      FROM "Shop" s

      -- 리뷰 집계(숨김 제외)
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) AS "reviewCount",
          AVG("rating") AS "avgRating"
        FROM "Review"
        WHERE "shopId" = s."id"
          AND "isHidden" = false
      ) r ON true

      -- 평균 가격(메뉴 price 평균)
      LEFT JOIN LATERAL (
        SELECT AVG("price") AS "avgPrice"
        FROM "ShopMenu"
        WHERE "shopId" = s."id"
          AND "price" IS NOT NULL
      ) m ON true

      -- 베스트 라벨 top3 (count 기준)
      LEFT JOIN LATERAL (
        SELECT ARRAY(
          SELECT rt."label"
          FROM "ReviewTag" rt
          WHERE rt."shopId" = s."id"
            AND rt."isActive" = true
          ORDER BY rt."count" DESC
          LIMIT 3
        ) AS "bestLabels"
      ) t ON true

      WHERE s."isActive" = true
        AND s."geo" IS NOT NULL
        AND extensions.ST_DWithin(
          s."geo",
          extensions.ST_SetSRID(
            extensions.ST_MakePoint(${lng}, ${lat}),
            4326
          )::extensions.geography,
          ${radiusKm} * 1000
        )
      ORDER BY extensions.ST_Distance(
        s."geo",
        extensions.ST_SetSRID(
          extensions.ST_MakePoint(${lng}, ${lat}),
          4326
        )::extensions.geography
      ) ASC
      LIMIT ${limit}
      OFFSET ${offset};
    `;

    // null-safe + 타입 맞추기
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      heroImageUrl: r.heroImageUrl,
      region: r.region,
      avgRating: Number(r.avgRating ?? 0),
      reviewCount: Number(r.reviewCount ?? 0),
      avgPrice: r.avgPrice == null ? null : Number(r.avgPrice),
      bestLabels: Array.isArray(r.bestLabels) ? r.bestLabels : [],
    }));
  }

  async search(params: SearchShopsParams): Promise<{
    items: SearchShopCard[];
    hasNext: boolean;
  }> {
    const { lat, lng, radiusKm, limit, offset } = params;
    const search = (params.search ?? '').trim();

    const point = Prisma.sql`
      extensions.ST_SetSRID(
        extensions.ST_MakePoint(${lng}, ${lat}),
        4326
      )::extensions.geography
    `;

    // hasNext 판정용으로 1개 더 조회
    const take = limit + 1;

    // search가 있을 때만 WHERE 조건을 추가
    const searchWhere = search
      ? Prisma.sql`
          AND (
            s."name" ILIKE '%' || ${search} || '%'
            OR COALESCE(s."roadAddress", '') ILIKE '%' || ${search} || '%'
            OR COALESCE(s."jibunAddress", '') ILIKE '%' || ${search} || '%'
          )
        `
      : Prisma.empty;

    const rows = await this.prisma.$queryRaw<SearchShopCardRow[]>(
      Prisma.sql`
        SELECT
          s."id",
          s."name",
          s."heroImageUrl",
          s."region",
          s."latitude",
          s."longitude",

          -- query로 받은 좌표 기준 실제 거리(m)
          extensions.ST_Distance(s."geo", ${point})::float8 AS "distanceMeters",

          COALESCE(r."reviewCount", 0)::int AS "reviewCount",
          COALESCE(r."avgRating", 0)::float8 AS "avgRating",

          m."avgPrice"::float8 AS "avgPrice",

          COALESCE(t."bestLabels", ARRAY[]::text[]) AS "bestLabels"
        FROM "Shop" s

        LEFT JOIN LATERAL (
          SELECT
            COUNT(*) AS "reviewCount",
            AVG("rating") AS "avgRating"
          FROM "Review"
          WHERE "shopId" = s."id"
            AND "isHidden" = false
        ) r ON true

        LEFT JOIN LATERAL (
          SELECT AVG("price") AS "avgPrice"
          FROM "ShopMenu"
          WHERE "shopId" = s."id"
            AND "price" IS NOT NULL
        ) m ON true

        LEFT JOIN LATERAL (
          SELECT ARRAY(
            SELECT rt."label"
            FROM "ReviewTag" rt
            WHERE rt."shopId" = s."id"
              AND rt."isActive" = true
            ORDER BY rt."count" DESC
            LIMIT 3
          ) AS "bestLabels"
        ) t ON true

        WHERE s."isActive" = true
          AND s."geo" IS NOT NULL
          AND extensions.ST_DWithin(
            s."geo",
            ${point},
            ${radiusKm} * 1000
          )
          ${searchWhere}
        ORDER BY extensions.ST_Distance(s."geo", ${point}) ASC
        LIMIT ${take}
        OFFSET ${offset};
      `,
    );

    const hasNext = rows.length > limit;
    const items = hasNext ? rows.slice(0, limit) : rows;

    return {
      items: items.map((r) => ({
        id: r.id,
        name: r.name,
        heroImageUrl: r.heroImageUrl,
        region: r.region,
        latitude: toNumberSafe(r.latitude),
        longitude: toNumberSafe(r.longitude),
        distanceMeters: Number(r.distanceMeters ?? 0),
        avgRating: Number(r.avgRating ?? 0),
        reviewCount: Number(r.reviewCount ?? 0),
        avgPrice: r.avgPrice == null ? null : Number(r.avgPrice),
        bestLabels: Array.isArray(r.bestLabels) ? r.bestLabels : [],
      })),
      hasNext,
    };
  }

  async findShopHomeById(shopId: string): Promise<ShopHomeRecord | null> {
    return (await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        name: true,
        roadAddress: true,
        jibunAddress: true,
        telephone: true,
        hoursRaw: true,
        links: {
          select: {
            type: true,
            url: true,
            label: true,
            isPrimary: true,
          },
          orderBy: [{ isPrimary: 'desc' }, { id: 'asc' }],
        },
      },
    })) as ShopHomeRecord | null;
  }
}
