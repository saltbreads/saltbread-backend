import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, ShopLinkType, DessertCategory } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 빈 문자열("")이나 공백만 있는 문자열을 null로 정규화하는 함수
function normalizeEmpty(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s.length ? s : null;
}

// 필수 문자열 필드를 검증하는 함수
function requiredString(v: unknown, field: string): string {
  if (typeof v !== 'string') throw new Error(`${field} invalid`);
  const s = v.trim();
  if (!s) throw new Error(`${field} empty`);
  return s;
}

// 필수 숫자 필드를 검증하는 함수
function requiredNumber(v: unknown, field: string): number {
  const n = Number(requiredString(v, field));
  if (Number.isNaN(n)) throw new Error(`${field} not number`);
  return n;
}

// CSV의 dessert_category 값을 Prisma enum으로 변환하는 함수
function parseDessertCategory(v: unknown): DessertCategory {
  if (v === 'saltbread') return DessertCategory.saltbread;
  throw new Error(`Unsupported dessert_category: ${String(v)}`);
}

type ShopCsvRow = {
  dessert_category: string;
  name: string;
  region: string;
  road_address?: string;
  jibun_address?: string;
  phone?: string;
  hero_img_url?: string;
  hours_raw?: string;
  query?: string;
  category_text?: string;
  longitude: string; // CSV는 문자열로 들어오는 경우가 많아서 string 추천
  latitude: string;
  naver_place_id?: string;

  // 아래는 있으면 추가
  ai_briefing_json?: string;
  review_kw_json?: string;
  menu_items_json?: string;
  external_link?: string;
};

async function main() {
  // 현재 프로젝트의 루트 디렉토리(process.cwd())를 기준으로
  // prisma/data/shops.csv 파일의 절대 경로를 생성한다.
  const csvPath = path.join(process.cwd(), 'prisma', 'data', 'shops.csv');

  // 위에서 만든 csvPath 경로의 파일을
  // UTF-8 인코딩 방식으로 동기적으로 읽어서
  // 파일 전체 내용을 문자열로 가져온다.
  const raw = fs.readFileSync(csvPath, 'utf8');

  // CSV 문자열(raw)을 파싱해서
  // 각 행을 객체 형태의 배열로 변환한다.
  const records: ShopCsvRow[] = parse(raw, {
    // UTF-8 BOM(Byte Order Mark) 제거
    // 엑셀로 저장한 CSV에서 첫 컬럼명이 깨지는 문제 방지
    bom: true,
    // CSV 첫 줄을 컬럼 이름으로 사용하여
    // 각 행을 { columnName: value } 형태의 객체로 변환
    columns: true,
    // 빈 줄은 무시하여 불필요한 파싱 에러 방지
    skip_empty_lines: true,
    // 따옴표가 포함된 값(예: "5,000원")을 유연하게 처리
    // 메뉴 가격 등 쉼표가 포함된 데이터 파싱 안정성 확보
    relax_quotes: true,
    // 각 값의 앞뒤 공백을 제거하여 데이터 정규화
    trim: true,
  });

  for (const [idx, r] of records.entries()) {
    const rowNo = idx + 2;

    try {
      const shop = await prisma.shop.create({
        data: {
          dessertCategory: parseDessertCategory(r.dessert_category),
          name: requiredString(r.name, 'name'),
          region: requiredString(r.region, 'region'),
          roadAddress: requiredString(r.road_address, 'road_address'),
          jibunAddress: requiredString(r.jibun_address, 'jibun_address'),
          telephone: normalizeEmpty(r.phone),
          heroImageUrl: normalizeEmpty(r.hero_img_url),
          hoursRaw: normalizeEmpty(r.hours_raw),
          query: requiredString(r.query, 'query'),
          categoryText: normalizeEmpty(r.category_text),
          longitude: requiredNumber(r.longitude, 'longitude'),
          latitude: requiredNumber(r.latitude, 'latitude'),
          naverPlaceId: normalizeEmpty(r.naver_place_id),
        },
      });

      // -----------------------------
      // AI BRIEFING
      // -----------------------------
      if (
        typeof r.ai_briefing_json === 'string' &&
        r.ai_briefing_json.trim().length
      ) {
        let parsed: unknown = null;

        try {
          parsed = JSON.parse(r.ai_briefing_json);
        } catch (err) {
          console.warn(
            `[AI BRIEFING JSON PARSE FAIL] shop: ${shop.name} (row ${rowNo})`,
          );
          console.warn('원본 일부:', r.ai_briefing_json.slice(0, 300));
          console.warn(err);
        }

        if (!Array.isArray(parsed)) {
          console.warn(
            `[AI BRIEFING SKIPPED] shop: ${shop.name} (row ${rowNo}) - not array`,
          );
        } else {
          const briefings = parsed
            .filter((x): x is string => typeof x === 'string')
            .map((s) => s.replace(/\s+/g, ' ').trim())
            .filter(Boolean);

          if (!briefings.length) {
            console.warn(
              `[AI BRIEFING EMPTY] shop: ${shop.name} (row ${rowNo}) - array but no valid strings`,
            );
          } else {
            await prisma.aiBriefing.createMany({
              data: briefings.map((content, idx) => ({
                shopId: shop.id,
                content,
                order: idx + 1,
              })),
              skipDuplicates: true,
            });

            console.log(
              `[AI BRIEFING OK] shop: ${shop.name} (row ${rowNo}) - inserted ${briefings.length}`,
            );
          }
        }
      }

      // -----------------------------
      // REVIEW KEYWORD
      // -----------------------------
      if (
        typeof r.review_kw_json === 'string' &&
        r.review_kw_json.trim().length
      ) {
        let parsed: unknown = null;

        try {
          parsed = JSON.parse(r.review_kw_json);
        } catch (err) {
          console.warn(
            `[REVIEW KW JSON PARSE FAIL] shop: ${shop.name} (row ${rowNo})`,
          );
          console.warn('원본 일부:', r.review_kw_json.slice(0, 300));
          console.warn(err);
        }

        if (!Array.isArray(parsed)) {
          console.warn(
            `[REVIEW KW SKIPPED] shop: ${shop.name} (row ${rowNo}) - not array`,
          );
        } else {
          const seen = new Set<string>();

          const tags = parsed
            .filter(
              (x): x is { keyword?: unknown; count?: unknown } =>
                typeof x === 'object' && x !== null,
            )
            .map((k) => {
              const label =
                typeof k.keyword === 'string'
                  ? k.keyword.replace(/\s+/g, ' ').trim()
                  : '';

              const externalCount =
                typeof k.count === 'number'
                  ? k.count
                  : Number.isFinite(Number(k.count))
                    ? Number(k.count)
                    : null;

              return { label, externalCount };
            })
            .filter((t) => t.label.length > 0 && t.externalCount !== null);

          if (!tags.length) {
            console.warn(
              `[REVIEW KW EMPTY] shop: ${shop.name} (row ${rowNo}) - array but no valid items`,
            );
          } else {
            // 중복 경고 + 최종 insert에서 제외(같은 label 두 번 들어가면 unique 있을 때 깨짐)
            const uniqueTags = tags.filter((t) => {
              if (seen.has(t.label)) {
                console.warn(
                  `[DUPLICATE REVIEW TAG] shop: ${shop.name} (row ${rowNo}) label: ${t.label}`,
                );
                return false;
              }
              seen.add(t.label);
              return true;
            });

            if (!uniqueTags.length) {
              console.warn(
                `[REVIEW KW SKIPPED] shop: ${shop.name} (row ${rowNo}) - all duplicates`,
              );
            } else {
              await prisma.reviewTag.createMany({
                data: uniqueTags.map((t) => ({
                  shopId: shop.id,
                  label: t.label,
                  count: 0,
                  externalCount: t.externalCount!, // 위에서 null 제거
                })),
                // @@unique([shopId, label]) 같은 거 있으면 켜두는 게 안전
                skipDuplicates: true,
              });

              console.log(
                `[REVIEW KW OK] shop: ${shop.name} (row ${rowNo}) - inserted ${uniqueTags.length}`,
              );
            }
          }
        }
      } else {
        // 값이 비어있으면(빈 문자열/undefined/null) 스킵 로그 찍고 싶으면 켜
        // console.log(`[REVIEW KW SKIP] shop: ${shop.name} (row ${rowNo}) - empty`);
      }

      // -----------------------------
      // MENU
      // -----------------------------
      if (
        typeof r.menu_items_json === 'string' &&
        r.menu_items_json.trim().length
      ) {
        let parsed: unknown = null;

        try {
          parsed = JSON.parse(r.menu_items_json);
        } catch (err) {
          console.warn(
            `[MENU JSON PARSE FAIL] shop: ${shop.name} (row ${rowNo})`,
          );
          console.warn('원본 일부:', r.menu_items_json.slice(0, 300));
          console.warn(err);
        }

        if (!Array.isArray(parsed)) {
          // 파싱 실패 or 배열 아님 -> 이 shop의 메뉴만 스킵하고 다음 데이터 계속 진행
          console.warn(
            `[MENU SKIPPED] shop: ${shop.name} (row ${rowNo}) - not array`,
          );
        } else {
          const seen = new Set<string>();

          const menus = parsed
            .filter(
              (
                x,
              ): x is {
                idx?: unknown;
                name?: unknown;
                price?: unknown;
                img_url?: unknown;
              } => typeof x === 'object' && x !== null,
            )
            .map((m) => {
              const name =
                typeof m.name === 'string'
                  ? m.name.replace(/\s+/g, ' ').trim()
                  : '';

              const priceText =
                typeof m.price === 'string'
                  ? m.price.replace(/\s+/g, ' ').trim()
                  : null;

              const digits = priceText ? priceText.replace(/[^\d]/g, '') : '';
              const price = digits.length ? Number(digits) : null;

              const imageUrl =
                typeof m.img_url === 'string'
                  ? m.img_url.replace(/\s+/g, ' ').trim()
                  : null;

              const order =
                typeof m.idx === 'number' && Number.isFinite(m.idx) ? m.idx : 0;

              return { name, price, priceText, imageUrl, order };
            })
            .filter((m) => m.name.length > 0);

          for (const m of menus) {
            if (seen.has(m.name)) {
              console.warn(
                `[DUPLICATE MENU NAME] shop: ${shop.name}, name: ${m.name}`,
              );
            }
            seen.add(m.name);
          }

          if (menus.length) {
            await prisma.shopMenu.createMany({
              data: menus.map((m) => ({
                shopId: shop.id,
                name: m.name,
                price: m.price,
                priceText: m.priceText,
                imageUrl: m.imageUrl,
                order: m.order,
              })),
              skipDuplicates: true,
            });
          } else {
            console.warn(`[MENU EMPTY] shop: ${shop.name} (row ${rowNo})`);
          }
        }
      }

      // -----------------------------
      // EXTERNAL LINK
      // -----------------------------
      if (
        typeof r.external_link !== 'string' ||
        !r.external_link.trim().length
      ) {
        // 빈 값이면 조용히 넘어가도 되는데, 원하면 로그 남기기
        // console.warn(`[LINK EMPTY] shop: ${shop.name} (row ${rowNo})`);
      } else {
        // 1) 줄바꿈/공백 기준으로 링크 분리 + 정리
        const candidates = r.external_link
          .split(/\s+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((url) => url.replace(/\/+$/, ''));

        // 2) http/https만 통과
        const links = candidates.filter(
          (s) => s.startsWith('http://') || s.startsWith('https://'),
        );

        // http/https가 아닌 애들(있으면 로그)
        const invalid = candidates.filter(
          (s) => !(s.startsWith('http://') || s.startsWith('https://')),
        );
        if (invalid.length) {
          console.warn(
            `[LINK INVALID SKIP] shop: ${shop.name} (row ${rowNo}) ->`,
            invalid,
          );
        }

        if (!links.length) {
          console.warn(
            `[LINK SKIPPED] shop: ${shop.name} (row ${rowNo}) - no valid http/https`,
          );
        } else {
          const seen = new Set<string>();

          const rows = links
            .filter((url) => {
              if (seen.has(url)) {
                console.warn(
                  `[DUPLICATE LINK] shop: ${shop.name}, url: ${url}`,
                );
                return false;
              }
              seen.add(url);
              return true;
            })
            .map((url, idx) => {
              const lower = url.toLowerCase();

              let type: ShopLinkType;
              if (lower.includes('instagram.com'))
                type = ShopLinkType.INSTAGRAM;
              else if (
                lower.includes('youtube.com') ||
                lower.includes('youtu.be')
              )
                type = ShopLinkType.YOUTUBE;
              else if (lower.includes('place.naver.com'))
                type = ShopLinkType.NAVER_PLACE;
              else if (lower.includes('blog.naver.com'))
                type = ShopLinkType.NAVER_BLOG;
              else if (lower.includes('smartstore.naver.com'))
                type = ShopLinkType.NAVER_SMARTSTORE;
              else if (
                lower.includes('kakao.com') ||
                lower.includes('pf.kakao.com') ||
                lower.includes('map.kakao.com')
              )
                type = ShopLinkType.KAKAO;
              else type = ShopLinkType.WEBSITE; // ✅ 여기서 ETC 말고 WEBSITE로 귀결

              return {
                shopId: shop.id,
                url,
                type,
                isPrimary: idx === 0,
              };
            });

          if (!rows.length) {
            console.warn(
              `[LINK EMPTY AFTER DEDUPE] shop: ${shop.name} (row ${rowNo})`,
            );
          } else {
            try {
              await prisma.shopLink.createMany({
                data: rows,
                skipDuplicates: true,
              });
            } catch (err) {
              console.warn(
                `[LINK INSERT FAIL] shop: ${shop.name} (row ${rowNo})`,
              );
              console.warn('rows:', rows);
              console.warn(err);
            }
          }
        }
      }

      console.log(`[SEED OK] ${shop.name}`);
    } catch (e) {
      console.error(`\n[SEED ERROR] row ${rowNo}`);
      console.error(r);
      console.error(e);
      throw e;
    }
  }

  console.log('Seed done.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
