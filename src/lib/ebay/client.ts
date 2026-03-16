import { getValidAccessToken } from "./auth";
import { SoldListing, ListingDraft, EbayApiError } from "./types";
import { EbayApiError as EbayApiErrorClass } from "../utils/errors";

const API_BASE = process.env.EBAY_SANDBOX === "true"
  ? "https://api.sandbox.ebay.com"
  : "https://api.ebay.com";

async function ebayFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new EbayApiErrorClass("Not authenticated with eBay", 401);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as EbayApiError;
    throw new EbayApiErrorClass(
      errorData.errors?.[0]?.message || `eBay API error: ${response.status}`,
      response.status,
      errorData.errors?.map((e) => ({ errorId: e.errorId, message: e.message }))
    );
  }

  return response;
}

export async function searchSoldListings(
  query: string,
  limit: number = 10
): Promise<SoldListing[]> {
  const params = new URLSearchParams({
    q: query,
    filter: "buyingOptions:{FIXED_PRICE|AUCTION}",
    sort: "endDate",
    limit: limit.toString(),
  });

  // Using Browse API for sold items
  const response = await ebayFetch(
    `/buy/browse/v1/item_summary/search?${params.toString()}`
  );
  const data = await response.json();

  if (!data.itemSummaries) {
    return [];
  }

  return data.itemSummaries.map((item: Record<string, unknown>) => ({
    itemId: item.itemId,
    title: item.title,
    price: parseFloat((item.price as { value: string })?.value || "0"),
    currency: (item.price as { currency: string })?.currency || "USD",
    condition: item.condition || "Unknown",
    soldDate: new Date(item.itemEndDate as string),
    imageUrl: (item.image as { imageUrl: string })?.imageUrl,
    listingUrl: item.itemWebUrl,
  }));
}

export async function createListing(draft: ListingDraft): Promise<string> {
  // Step 1: Create inventory item
  const sku = `ITEM-${Date.now()}`;
  const inventoryItem = {
    availability: {
      shipToLocationAvailability: {
        quantity: 1,
      },
    },
    condition: draft.condition,
    product: {
      title: draft.title,
      description: draft.description,
      aspects: draft.itemSpecifics || {},
      imageUrls: draft.images,
    },
  };

  await ebayFetch(`/sell/inventory/v1/inventory_item/${sku}`, {
    method: "PUT",
    body: JSON.stringify(inventoryItem),
  });

  // Step 2: Create offer
  const offer = {
    sku,
    marketplaceId: "EBAY_US",
    format: "FIXED_PRICE",
    listingDuration: "GTC",
    pricingSummary: {
      price: {
        value: draft.price.toString(),
        currency: "USD",
      },
    },
    listingPolicies: {
      fulfillmentPolicyId: await getDefaultFulfillmentPolicy(),
      paymentPolicyId: await getDefaultPaymentPolicy(),
      returnPolicyId: await getDefaultReturnPolicy(),
    },
    categoryId: draft.category,
  };

  const offerResponse = await ebayFetch("/sell/inventory/v1/offer", {
    method: "POST",
    body: JSON.stringify(offer),
  });

  const offerData = await offerResponse.json();
  const offerId = offerData.offerId;

  // Step 3: Publish offer
  const publishResponse = await ebayFetch(
    `/sell/inventory/v1/offer/${offerId}/publish`,
    {
      method: "POST",
    }
  );

  const publishData = await publishResponse.json();
  return publishData.listingId;
}

async function getDefaultFulfillmentPolicy(): Promise<string> {
  const response = await ebayFetch(
    "/sell/account/v1/fulfillment_policy?marketplace_id=EBAY_US"
  );
  const data = await response.json();
  return data.fulfillmentPolicies?.[0]?.fulfillmentPolicyId || "";
}

async function getDefaultPaymentPolicy(): Promise<string> {
  const response = await ebayFetch(
    "/sell/account/v1/payment_policy?marketplace_id=EBAY_US"
  );
  const data = await response.json();
  return data.paymentPolicies?.[0]?.paymentPolicyId || "";
}

async function getDefaultReturnPolicy(): Promise<string> {
  const response = await ebayFetch(
    "/sell/account/v1/return_policy?marketplace_id=EBAY_US"
  );
  const data = await response.json();
  return data.returnPolicies?.[0]?.returnPolicyId || "";
}

export async function isConnected(): Promise<boolean> {
  try {
    const token = await getValidAccessToken();
    return !!token;
  } catch {
    return false;
  }
}
