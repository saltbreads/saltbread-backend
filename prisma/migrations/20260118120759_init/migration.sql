-- CreateEnum
CREATE TYPE "DessertCategory" AS ENUM ('saltbread');

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "dessertCategory" "DessertCategory" NOT NULL,
    "region" TEXT,
    "query" TEXT,
    "name" TEXT NOT NULL,
    "roadAddress" TEXT,
    "jibunAddress" TEXT,
    "telephone" TEXT,
    "link" TEXT,
    "categoryText" TEXT,
    "longitude" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "geocodeError" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Shop_region_idx" ON "Shop"("region");

-- CreateIndex
CREATE INDEX "Shop_name_idx" ON "Shop"("name");

-- CreateIndex
CREATE INDEX "Shop_latitude_longitude_idx" ON "Shop"("latitude", "longitude");
