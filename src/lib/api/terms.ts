import { apiClient } from "./client";

export interface TermsContent {
  content: string;
  updated_at?: string;
}

const MOCK_TERMS = `
## Terms & Conditions

**Last updated: April 2026**

Welcome to XPOSE Distributors. By using our platform, you agree to the following terms and conditions.

### 1. General

XPOSE Distributors is a hybrid wholesale and retail marketplace operating in Kenya. We offer products at both wholesale and retail pricing.

### 2. Orders & Payment

- Orders are placed through our online platform or directly via WhatsApp.
- Payment is accepted via M-Pesa (Till Number: 711714), bank transfer, or cash on delivery.
- Orders above KES 75,000 qualify for free shipping across Kenya.
- We reserve the right to cancel any order at our discretion.

### 3. Shipping & Delivery

- We deliver Kenya-wide through reputable transport companies.
- Delivery timelines depend on your location and chosen transport company.
- Free shipping is available for orders over KES 75,000.
- For large bulk orders, we coordinate directly with transport companies.

### 4. Product Quality

- All products sold on XPOSE Distributors are authentic and sourced directly from manufacturers or verified suppliers.
- We do not sell counterfeit goods.
- Product images may differ slightly from actual products due to photography conditions.

### 5. Pricing

- Prices are listed in Kenyan Shillings (KES).
- Wholesale pricing is available for bulk purchases.
- Flash sale prices are valid only during the specified sale period.
- Prices are subject to change without prior notice.

### 6. Customer Support

- Our customer care team is available 24 hours a day.
- Contact us via WhatsApp: 0701377869
- We strive to respond to all queries within 1 hour during business hours.

### 7. Privacy Policy

- We collect only the information necessary to process your orders.
- Your personal data is not shared with third parties except as required for delivery.
- We use secure encryption to protect your data.

### 8. Limitation of Liability

XPOSE Distributors shall not be liable for any indirect, incidental, or consequential damages arising from the use of our platform or products purchased.

### 9. Changes to Terms

We reserve the right to update these terms at any time. Continued use of our platform constitutes acceptance of the updated terms.

### 10. Contact

For any questions regarding these terms, contact us at:
- WhatsApp: 0701377869
- Till Number: 711714

*XPOSE Distributors — A Hybrid Company. Everyday Feels Like BLACK FRIDAY.*
`;

export async function getTerms(): Promise<TermsContent> {
  try {
    const { data } = await apiClient.get("/terms");
    return data?.data || data || { content: MOCK_TERMS };
  } catch {
    return { content: MOCK_TERMS };
  }
}
