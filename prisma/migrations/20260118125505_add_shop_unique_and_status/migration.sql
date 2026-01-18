/*
  Warnings:

  - The `status` column on the `Shop` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[name,roadAddress,latitude,longitude]` on the table `Shop` will be added. If there are existing duplicate values, this will fail.
  - Made the column `region` on table `Shop` required. This step will fail if there are existing NULL values in that column.
  - Made the column `query` on table `Shop` required. This step will fail if there are existing NULL values in that column.
  - Made the column `roadAddress` on table `Shop` required. This step will fail if there are existing NULL values in that column.
  - Made the column `jibunAddress` on table `Shop` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ShopStatus" AS ENUM ('ACTIVE', 'PENDING', 'REJECTED');

-- AlterTable
ALTER TABLE "Shop" ALTER COLUMN "region" SET NOT NULL,
ALTER COLUMN "query" SET NOT NULL,
ALTER COLUMN "roadAddress" SET NOT NULL,
ALTER COLUMN "jibunAddress" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ShopStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX "Shop_name_roadAddress_latitude_longitude_key" ON "Shop"("name", "roadAddress", "latitude", "longitude");
