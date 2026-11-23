/**
 * Cloudflare Pages Function: /api/verify-license
 * Proxies license verification requests to Gumroad's API v2,
 * eliminating browser CORS restrictions and sanitizing payloads.
 */

interface VerifyRequestPayload {
  license_key?: string;
  product_id?: string;
}

interface GumroadApiPurchase {
  id?: string;
  product_id?: string;
  product_name?: string;
  created_at?: string;
  refunded?: boolean;
  chargebacked?: boolean;
  disputed?: boolean;
  email?: string;
  license_key?: string;
}

interface GumroadApiResponse {
  success: boolean;
  uses?: number;
  message?: string;
  purchase?: GumroadApiPurchase;
}

const DEFAULT_PRODUCT_ID = 'BrU_80eTAxZhgkxZItYj2g==';
const GUMROAD_VERIFY_URL = 'https://api.gumroad.com/v2/licenses/verify';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
};

export const onRequestPost = async (context: { request: Request; env?: Record<string, unknown> }) => {
  try {
    let payload: VerifyRequestPayload = {};
    const contentType = context.request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      payload = (await context.request.json()) as VerifyRequestPayload;
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await context.request.formData();
      payload = {
        license_key: formData.get('license_key')?.toString(),
        product_id: formData.get('product_id')?.toString(),
      };
    }

    const licenseKey = payload.license_key?.trim();
    const productId = payload.product_id?.trim() || DEFAULT_PRODUCT_ID;

    if (!licenseKey) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Please enter a valid license key.',
        }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Prepare body for Gumroad v2 API
    const gumroadBody = new URLSearchParams();
    gumroadBody.append('product_id', productId);
    gumroadBody.append('license_key', licenseKey);
    gumroadBody.append('increment_uses_count', 'false');

    const gumroadResponse = await fetch(GUMROAD_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': 'DrywallPro-Estimator/1.0',
      },
      body: gumroadBody.toString(),
    });

    const data = (await gumroadResponse.json()) as GumroadApiResponse;

    if (!data.success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: data.message || 'Invalid license key. Please check your purchase receipt.',
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    const purchase = data.purchase;

    if (purchase?.refunded) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'This license was refunded and is no longer valid.',
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    if (purchase?.chargebacked || purchase?.disputed) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'License suspended due to payment dispute.',
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        uses: data.uses ?? 1,
        purchase: {
          id: purchase?.id || `pur_${Date.now()}`,
          email: purchase?.email || '',
          created_at: purchase?.created_at || new Date().toISOString(),
          product_id: purchase?.product_id || productId,
          product_name: purchase?.product_name || 'DrywallPro Commercial License',
        },
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        message: `Failed to connect to verification server: ${errorMsg}`,
      }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
};
