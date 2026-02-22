import { ShopLinkType } from '@prisma/client';

export type ShopHomeDto = {
  shopId: string;
  name: string;
  address: {
    road: string | null;
    jibun: string | null;
  };
  telephone: string | null;
  hoursRaw: string | null;
  links: {
    website: string | null;
    instagram: string | null;
    kakao: string | null;
    etc: Array<{
      type: ShopLinkType;
      url: string;
      label: string | null;
      isPrimary: boolean;
    }>;
  };
};
