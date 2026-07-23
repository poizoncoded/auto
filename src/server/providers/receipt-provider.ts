import type { ReceiptQrPayload } from "@/shared/lib/receipt";

export interface ReceiptProviderResult {
  items: Array<{ name: string; quantityMilliUnits: number; totalKopecks: number }>;
  merchant: string | null;
}

export interface ReceiptProvider {
  key: string;
  lookup(payload: ReceiptQrPayload): Promise<ReceiptProviderResult | null>;
}

export const manualReviewProvider: ReceiptProvider = {
  key: "manual-review",
  async lookup(): Promise<null> {
    return null;
  }
};
