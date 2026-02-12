import { PrismaPg } from '@prisma/adapter-pg';
import { DessertCategory, PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Check your .env file.');
}

const pool = new Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function normalizeEmpty(v: unknown): string | null {
  if (typeof v !== 'string') return null;

  const s = v.trim();
  return s.length ? s : null;
}

function requiredString(v: unknown, fieldName: string): string {
  if (typeof v !== 'string') throw new Error(`${fieldName} is not a string`);
  const s = v.trim();
  if (!s) throw new Error(`${fieldName} is empty`);
  return s;
}

function requiredNumber(v: unknown, fieldName: string): number {
  const n = Number(requiredString(v, fieldName));
  if (Number.isNaN(n)) throw new Error(`${fieldName} is not a number`);
  return n;
}

function parseDessertCategory(v: unknown): DessertCategory {
  if (v == null) {
    throw new Error('dessert_category is missing');
  }

  if (typeof v !== 'string') {
    throw new Error(`dessert_category must be a string, got ${typeof v}`);
  }

  const value = v.trim();

  switch (value) {
    case 'saltbread':
      return DessertCategory.saltbread;
    default:
      throw new Error(`Unsupported dessert_category: ${value}`);
  }
}

async function main() {
  // CSV 파일 경로: 현재프로젝트위치/prisma/data/shops.csv
  const csvPath = path.join(process.cwd(), 'prisma', 'data', 'shops.csv');
  const raw = fs.readFileSync(csvPath, 'utf8');

  type CsvRow = {
    dessert_category?: string;
    region?: string;
    query?: string;
    name?: string;
    road_address?: string;
    jibun_address?: string;
    telephone?: string;
    naver_link?: string;
    category_text?: string;
    longitude?: string;
    latitude?: string;
    geocode_error?: string;
  };

  const records: CsvRow[] = parse(raw, {
    bom: true, // CSV 헤더에 BOM 붙어도 정상 인식
    columns: true, // CSV 첫 줄을 헤더로 사용 → 배열이 아니라 {컬럼명: 값} 객체로 파싱
    skip_empty_lines: true, // CSV 중간/끝에 있는 빈 줄 무시
    relax_quotes: true, // 따옴표 안에 쉼표(,)가 있어도 에러 없이 처리 (주소 데이터 필수 옵션)
    trim: true, // 각 필드의 앞뒤 공백 자동 제거
  });

  const data = records.map((r, idx) => {
    // CSV는 1줄이 헤더니까, 실제 데이터 1행은 보통 2번째 줄
    const rowNo = idx + 2;

    try {
      return {
        dessertCategory: parseDessertCategory(r.dessert_category),
        region: requiredString(r.region, `region (row ${rowNo})`),
        query: requiredString(r.query, `query (row ${rowNo})`),
        name: requiredString(r.name, `name (row ${rowNo})`),
        roadAddress: requiredString(
          r.road_address,
          `road_address (row ${rowNo})`,
        ),
        jibunAddress: requiredString(
          r.jibun_address,
          `jibun_address (row ${rowNo})`,
        ),
        telephone: normalizeEmpty(r.telephone),
        link: normalizeEmpty(r.naver_link),
        categoryText: normalizeEmpty(r.category_text),
        longitude: requiredNumber(r.longitude, `longitude (row ${rowNo})`),
        latitude: requiredNumber(r.latitude, `latitude (row ${rowNo})`),
        geocodeError: normalizeEmpty(r.geocode_error),
        status: 'ACTIVE' as const,
      };
    } catch (e) {
      console.error('\n[SEED] Invalid CSV row detected');
      console.error(`- row: ${rowNo}`);
      console.error('- raw record:', r);

      if (e instanceof Error) {
        console.error('- reason:', e.message);
        console.error('- stack:', e.stack);
      } else {
        console.error('- reason:', e);
      }

      throw e;
    }
  });

  const created = await prisma.shop.createMany({
    data,
    skipDuplicates: true,
  });

  console.log(`Seed done. inserted: ${created.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
