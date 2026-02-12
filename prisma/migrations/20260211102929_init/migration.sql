-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('GOOGLE', 'NAVER', 'KAKAO');

-- CreateEnum
CREATE TYPE "DessertCategory" AS ENUM ('saltbread');

-- CreateEnum
CREATE TYPE "ShopLinkType" AS ENUM ('INSTAGRAM', 'WEBSITE', 'BLOG', 'RESERVATION', 'NAVER', 'ETC');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "provider" "OAuthProvider" NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "displayName" TEXT,
    "profileImageUrl" TEXT,
    "email" TEXT,
    "nickname" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "dessertCategory" "DessertCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "roadAddress" TEXT,
    "jibunAddress" TEXT,
    "telephone" TEXT,
    "heroImageUrl" TEXT,
    "hoursRaw" TEXT,
    "query" TEXT,
    "categoryText" TEXT,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "naverPlaceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiBriefing" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiBriefing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopMenu" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER,
    "priceText" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "authorId" TEXT,
    "rating" INTEGER NOT NULL,
    "content" TEXT,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewTag" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "externalCount" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewImage" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopLink" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "type" "ShopLinkType" NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ShopLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_provider_idx" ON "User"("provider");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_provider_providerUserId_key" ON "User"("provider", "providerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_naverPlaceId_key" ON "Shop"("naverPlaceId");

-- CreateIndex
CREATE INDEX "Shop_latitude_longitude_idx" ON "Shop"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_name_roadAddress_key" ON "Shop"("name", "roadAddress");

-- CreateIndex
CREATE INDEX "AiBriefing_shopId_idx" ON "AiBriefing"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "AiBriefing_shopId_order_key" ON "AiBriefing"("shopId", "order");

-- CreateIndex
CREATE INDEX "ShopMenu_shopId_idx" ON "ShopMenu"("shopId");

-- CreateIndex
CREATE INDEX "ShopMenu_price_idx" ON "ShopMenu"("price");

-- CreateIndex
CREATE UNIQUE INDEX "ShopMenu_shopId_name_key" ON "ShopMenu"("shopId", "name");

-- CreateIndex
CREATE INDEX "Review_shopId_createdAt_idx" ON "Review"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_shopId_rating_idx" ON "Review"("shopId", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewTag_shopId_label_key" ON "ReviewTag"("shopId", "label");

-- CreateIndex
CREATE INDEX "ReviewImage_reviewId_idx" ON "ReviewImage"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewImage_createdAt_idx" ON "ReviewImage"("createdAt");

-- CreateIndex
CREATE INDEX "ReviewImage_shopId_createdAt_idx" ON "ReviewImage"("shopId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewImage_reviewId_order_key" ON "ReviewImage"("reviewId", "order");

-- CreateIndex
CREATE INDEX "ShopLink_shopId_idx" ON "ShopLink"("shopId");

-- AddForeignKey
ALTER TABLE "AiBriefing" ADD CONSTRAINT "AiBriefing_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopMenu" ADD CONSTRAINT "ShopMenu_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewTag" ADD CONSTRAINT "ReviewTag_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewImage" ADD CONSTRAINT "ReviewImage_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewImage" ADD CONSTRAINT "ReviewImage_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewImage" ADD CONSTRAINT "ReviewImage_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopLink" ADD CONSTRAINT "ShopLink_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
