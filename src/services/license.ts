export interface GumroadPurchase {
  id: string;
  product_id?: string;
  product_name?: string;
  created_at?: string;
  refunded?: boolean;
  chargebacked?: boolean;
  disputed?: boolean;
  email?: string;
  license_key?: string;
}

export interface GumroadVerifyResponse {
  success: boolean;
  uses?: number;
  message?: string;
  purchase?: GumroadPurchase;
}

export interface StoredLicenseReceipt {
  licenseKey: string;
  purchaseId: string;
  email: string;
  verifiedAt: number;
  signature: string;
}

export const GUMROAD_PRODUCT_ID =
  (import.meta.env.VITE_GUMROAD_PRODUCT_ID as string) || 'BrU_80eTAxZhgkxZItYj2g==';

export const GUMROAD_PRODUCT_URL =
  (import.meta.env.VITE_GUMROAD_PRODUCT_URL as string) ||
  'https://veloxlogic.gumroad.com/l/drywallprolicense';

export const PAGES_PROXY_ENDPOINT = '/api/verify-license';
export const DIRECT_GUMROAD_VERIFY_ENDPOINT = 'https://api.gumroad.com/v2/licenses/verify';

const STORAGE_RECEIPT_KEY = 'drywallpro_license_receipt';
const CLIENT_SALT = 'drywallpro_salt_98421_c840_ga214';

/**
 * Computes a SHA-256 hash using native Web Crypto API (SubtleCrypto)
 */
export async function computeSignature(
  key: string,
  purchaseId: string,
  verifiedAt: number
): Promise<string> {
  const payload = `${key.trim()}::${purchaseId.trim()}::${verifiedAt}::${CLIENT_SALT}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback hash for environments where crypto.subtle is restricted
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  return `hash_${Math.abs(hash).toString(16)}`;
}

/**
 * Internal parser for Gumroad responses (from either Pages Function or direct API)
 */
export async function processGumroadVerificationResponse(
  data: GumroadVerifyResponse,
  licenseKey: string
): Promise<{ success: boolean; message?: string; receipt?: StoredLicenseReceipt }> {
  if (!data.success) {
    return {
      success: false,
      message: data.message || 'Invalid license key. Please check your purchase receipt.',
    };
  }

  const purchase = data.purchase;
  if (purchase?.refunded) {
    return {
      success: false,
      message: 'This license was refunded and is no longer valid.',
    };
  }

  if (purchase?.chargebacked || purchase?.disputed) {
    return {
      success: false,
      message: 'License suspended due to payment dispute.',
    };
  }

  const verifiedAt = Date.now();
  const purchaseId = purchase?.id || `pur_${verifiedAt}`;
  const email = purchase?.email || '';
  const signature = await computeSignature(licenseKey, purchaseId, verifiedAt);

  const receipt: StoredLicenseReceipt = {
    licenseKey,
    purchaseId,
    email,
    verifiedAt,
    signature,
  };

  return { success: true, receipt };
}

/**
 * Verifies a license key:
 * 1. Attempts Cloudflare Pages Function proxy (/api/verify-license)
 * 2. Falls back to direct Gumroad API POST if running in local Vite development mode
 */
export async function verifyGumroadLicense(
  licenseKey: string,
  productId = GUMROAD_PRODUCT_ID
): Promise<{ success: boolean; message?: string; receipt?: StoredLicenseReceipt }> {
  const cleanedKey = licenseKey.trim();
  if (!cleanedKey) {
    return { success: false, message: 'Please enter a valid license key.' };
  }

  // Attempt 1: Call Cloudflare Pages Functions proxy
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const proxyResponse = await fetch(PAGES_PROXY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        license_key: cleanedKey,
        product_id: productId,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // If endpoint exists and responded with JSON
    if (proxyResponse.status !== 404 && proxyResponse.status !== 405) {
      const data = (await proxyResponse.json()) as GumroadVerifyResponse;
      return await processGumroadVerificationResponse(data, cleanedKey);
    }
  } catch {
    // Proxy request failed (network error or 404 in local dev), proceed to direct fallback
  }

  // Attempt 2: Direct Gumroad API fallback
  try {
    const params = new URLSearchParams();
    params.append('product_id', productId);
    params.append('license_key', cleanedKey);
    params.append('increment_uses_count', 'false');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const directResponse = await fetch(DIRECT_GUMROAD_VERIFY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: params.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = (await directResponse.json()) as GumroadVerifyResponse;
    return await processGumroadVerificationResponse(data, cleanedKey);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        message: 'Verification request timed out. Please check your network connection.',
      };
    }
    return {
      success: false,
      message: 'Network error connecting to Gumroad verification server. Please try again.',
    };
  }
}

/**
 * Validates and loads stored license receipt from localStorage with tamper check.
 * New visitors or tampered records strictly return false.
 */
export async function loadStoredLicense(): Promise<{
  isPro: boolean;
  receipt: StoredLicenseReceipt | null;
}> {
  try {
    const raw = localStorage.getItem(STORAGE_RECEIPT_KEY);
    if (!raw) {
      // Clean up legacy insecure keys if any exist
      localStorage.removeItem('drywallpro_is_pro');
      return { isPro: false, receipt: null };
    }

    const receipt = JSON.parse(raw) as StoredLicenseReceipt;
    if (!receipt.licenseKey || !receipt.purchaseId || !receipt.signature || !receipt.verifiedAt) {
      clearStoredLicense();
      return { isPro: false, receipt: null };
    }

    // Verify cryptographic signature against tampering
    const expectedSignature = await computeSignature(
      receipt.licenseKey,
      receipt.purchaseId,
      receipt.verifiedAt
    );

    if (receipt.signature !== expectedSignature) {
      console.warn('DrywallPro: Stored license signature mismatch. Reverting to Free Mode.');
      clearStoredLicense();
      return { isPro: false, receipt: null };
    }

    return { isPro: true, receipt };
  } catch {
    clearStoredLicense();
    return { isPro: false, receipt: null };
  }
}

/**
 * Saves a verified license receipt to localStorage
 */
export function saveStoredLicense(receipt: StoredLicenseReceipt): void {
  try {
    localStorage.setItem(STORAGE_RECEIPT_KEY, JSON.stringify(receipt));
    localStorage.setItem('drywallpro_is_pro', 'true');
    localStorage.setItem('drywallpro_license_key', receipt.licenseKey);
  } catch (e) {
    console.error('Failed to save license receipt to storage', e);
  }
}

/**
 * Clears stored license, reverting application to Free Mode
 */
export function clearStoredLicense(): void {
  try {
    localStorage.removeItem(STORAGE_RECEIPT_KEY);
    localStorage.removeItem('drywallpro_is_pro');
    localStorage.removeItem('drywallpro_license_key');
  } catch (e) {
    console.error('Failed to clear stored license', e);
  }
}
