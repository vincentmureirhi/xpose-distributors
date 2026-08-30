import { apiClient } from './client';

export interface StkPushResult {
  payment_id?: number | string;
  checkout_request_id?: string;
  merchant_request_id?: string;
  message?: string;
}

export interface PaymentStatus {
  id?: number | string;
  status?: string;
  result_desc?: string;
  mpesa_receipt?: string;
  received_amount?: number | string;
  order_payment_status?: string;
  order_amount_paid?: number | string;
  order_balance_due?: number | string;
}

export async function initiateMpesaStk(params: {
  orderId: string;
  amount: number;
  phone?: string;
}): Promise<StkPushResult> {
  const { data } = await apiClient.post('/payments/stk-push', {
    order_id: params.orderId,
    amount: params.amount,
    ...(params.phone ? { phone: params.phone } : {}),
  });
  return data?.data || data;
}

export async function getMpesaPaymentStatus(checkoutRequestId: string): Promise<PaymentStatus> {
  const { data } = await apiClient.get(`/payments/status/${encodeURIComponent(checkoutRequestId)}`);
  return data?.data || data;
}
