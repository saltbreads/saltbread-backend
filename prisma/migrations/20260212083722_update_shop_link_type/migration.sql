/*
  Warnings:

  - The values [BLOG,RESERVATION,NAVER] on the enum `ShopLinkType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[shopId,url]` on the table `ShopLink` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ShopLinkType_new" AS ENUM ('INSTAGRAM', 'YOUTUBE', 'NAVER_PLACE', 'NAVER_BLOG', 'NAVER_SMARTSTORE', 'KAKAO', 'WEBSITE', 'ETC');
ALTER TABLE "ShopLink" ALTER COLUMN "type" TYPE "ShopLinkType_new" USING ("type"::text::"ShopLinkType_new");
ALTER TYPE "ShopLinkType" RENAME TO "ShopLinkType_old";
ALTER TYPE "ShopLinkType_new" RENAME TO "ShopLinkType";
DROP TYPE "public"."ShopLinkType_old";
COMMIT;

-- CreateIndex
CREATE UNIQUE INDEX "ShopLink_shopId_url_key" ON "ShopLink"("shopId", "url");
