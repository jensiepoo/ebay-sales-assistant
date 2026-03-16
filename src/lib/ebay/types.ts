export interface EbayTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface EbayUser {
  username: string;
  userId: string;
}

export interface SoldListing {
  itemId: string;
  title: string;
  price: number;
  currency: string;
  condition: string;
  soldDate: Date;
  imageUrl?: string;
  listingUrl: string;
}

export interface ListingDraft {
  title: string;
  description: string;
  price: number;
  condition: "NEW" | "LIKE_NEW" | "GOOD" | "ACCEPTABLE";
  category?: string;
  itemSpecifics?: Record<string, string>;
  images: string[]; // URLs or base64
  shippingPolicy?: "FREE" | "CALCULATED" | "FLAT";
  flatShippingCost?: number;
  returnPolicy?: "NO_RETURNS" | "30_DAYS" | "60_DAYS";
}

export interface EbayApiError {
  errors: Array<{
    errorId: number;
    domain: string;
    category: string;
    message: string;
  }>;
}
