CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- AlterTable
ALTER TABLE "Shop"
ADD COLUMN "geo" extensions.geography(Point, 4326);

UPDATE "Shop"
SET "geo" = extensions.ST_SetSRID(
  extensions.ST_MakePoint(
    CAST("longitude" AS double precision),
    CAST("latitude"  AS double precision)
  ),
  4326
)::extensions.geography
WHERE "geo" IS NULL;

CREATE INDEX IF NOT EXISTS "Shop_geo_gix"
ON "Shop"
USING GIST ("geo");
-- CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;

-- -- AlterTable
-- ALTER TABLE "Shop"
-- ADD COLUMN "geo" public.geography(Point, 4326);

-- UPDATE "Shop"
-- SET "geo" = public.ST_SetSRID(
--   public.ST_MakePoint(
--     CAST("longitude" AS double precision),
--     CAST("latitude"  AS double precision)
--   ),
--   4326
-- )::public.geography
-- WHERE "geo" IS NULL;

-- CREATE INDEX IF NOT EXISTS "Shop_geo_gix"
-- ON "Shop"
-- USING GIST ("geo");