import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  verifyGumroadLicense,
  loadStoredLicense,
  saveStoredLicense,
  clearStoredLicense,
  computeSignature,
  PAGES_PROXY_ENDPOINT,
  DIRECT_GUMROAD_VERIFY_ENDPOINT,
  type StoredLicenseReceipt,
} from './license';

// Node test environment localStorage mock
const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => storageMap.set(key, String(value)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('License Verification & Anti-Tamper Service', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.restoreAllMocks();
  });

  describe('Default Visitor State & Zero-Trust', () => {
    it('defaults new visitors to Free Mode (isPro: false) when localStorage is empty', async () => {
      const state = await loadStoredLicense();
      expect(state.isPro).toBe(false);
      expect(state.receipt).toBeNull();
    });

    it('rejects legacy plain boolean localStorage.setItem("drywallpro_is_pro", "true") without cryptographic receipt', async () => {
      localStorageMock.setItem('drywallpro_is_pro', 'true');
      const state = await loadStoredLicense();
      expect(state.isPro).toBe(false);
      expect(state.receipt).toBeNull();
      // Should clean up the forged boolean flag
      expect(localStorageMock.getItem('drywallpro_is_pro')).toBeNull();
    });
  });

  describe('Pages Proxy & Direct Gumroad API Verification', () => {
    it('successfully verifies via Cloudflare Pages proxy (/api/verify-license)', async () => {
      const mockResponse = {
        success: true,
        uses: 1,
        purchase: {
          id: 'pur_proxy_12345',
          email: 'contractor@drywall.com',
          created_at: '2026-11-24T00:00:00Z',
          product_id: 'BrU_80eTAxZhgkxZItYj2g==',
          product_name: 'DrywallPro Commercial License',
          refunded: false,
          chargebacked: false,
          disputed: false,
        },
      };

      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url === PAGES_PROXY_ENDPOINT) {
          return {
            status: 200,
            json: async () => mockResponse,
          } as unknown as Response;
        }
        throw new Error('Unexpected URL');
      });

      const result = await verifyGumroadLicense('GUM-PROXY-KEY-100');
      expect(result.success).toBe(true);
      expect(result.receipt).toBeDefined();
      expect(result.receipt?.licenseKey).toBe('GUM-PROXY-KEY-100');
      expect(result.receipt?.purchaseId).toBe('pur_proxy_12345');
      expect(result.receipt?.email).toBe('contractor@drywall.com');
      expect(result.receipt?.signature).toBeDefined();
    });

    it('falls back to direct Gumroad API when proxy returns 404 (local Vite dev mode)', async () => {
      const mockGumroadResponse = {
        success: true,
        uses: 1,
        purchase: {
          id: 'pur_direct_67890',
          email: 'direct@buyer.com',
          refunded: false,
          chargebacked: false,
          disputed: false,
        },
      };

      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url === PAGES_PROXY_ENDPOINT) {
          return {
            status: 404,
            json: async () => ({ error: 'Not Found' }),
          } as unknown as Response;
        }
        if (url === DIRECT_GUMROAD_VERIFY_ENDPOINT) {
          return {
            status: 200,
            json: async () => mockGumroadResponse,
          } as unknown as Response;
        }
        throw new Error('Unexpected URL');
      });

      const result = await verifyGumroadLicense('GUM-DIRECT-KEY-200');
      expect(result.success).toBe(true);
      expect(result.receipt).toBeDefined();
      expect(result.receipt?.purchaseId).toBe('pur_direct_67890');
    });

    it('rejects refunded license keys with clear user notification', async () => {
      const mockResponse = {
        success: true,
        uses: 1,
        purchase: {
          id: 'pur_refunded_111',
          email: 'buyer@example.com',
          refunded: true,
          chargebacked: false,
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 200,
        json: async () => mockResponse,
      } as unknown as Response);

      const result = await verifyGumroadLicense('GUM-REFUNDED-KEY');
      expect(result.success).toBe(false);
      expect(result.message).toBe('This license was refunded and is no longer valid.');
      expect(result.receipt).toBeUndefined();
    });

    it('rejects chargebacked or disputed license keys', async () => {
      const mockResponse = {
        success: true,
        uses: 1,
        purchase: {
          id: 'pur_disputed_222',
          email: 'buyer@example.com',
          refunded: false,
          chargebacked: true,
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 200,
        json: async () => mockResponse,
      } as unknown as Response);

      const result = await verifyGumroadLicense('GUM-DISPUTED-KEY');
      expect(result.success).toBe(false);
      expect(result.message).toBe('License suspended due to payment dispute.');
    });

    it('handles Gumroad invalid license response', async () => {
      const mockResponse = {
        success: false,
        message: 'Invalid license key. Please check your purchase receipt.',
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 200,
        json: async () => mockResponse,
      } as unknown as Response);

      const result = await verifyGumroadLicense('INVALID-KEY');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid license key. Please check your purchase receipt.');
    });

    it('gracefully handles network errors without crashing', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

      const result = await verifyGumroadLicense('SOME-KEY');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Network error');
    });
  });

  describe('Anti-Tamper & Cryptographic Receipt Verification', () => {
    it('successfully loads a validly signed stored receipt (offline validation)', async () => {
      const key = 'OFFLINE-VALID-KEY';
      const purchaseId = 'pur_offline_123';
      const verifiedAt = Date.now();
      const signature = await computeSignature(key, purchaseId, verifiedAt);

      const validReceipt: StoredLicenseReceipt = {
        licenseKey: key,
        purchaseId,
        email: 'jobsite-contractor@field.com',
        verifiedAt,
        signature,
      };

      saveStoredLicense(validReceipt);

      // Simulating offline mode where network is unavailable
      const loaded = await loadStoredLicense();
      expect(loaded.isPro).toBe(true);
      expect(loaded.receipt?.licenseKey).toBe(key);
      expect(loaded.receipt?.purchaseId).toBe(purchaseId);
    });

    it('detects tampering and reverts to Free Mode if receipt signature is altered', async () => {
      const key = 'TAMPERED-KEY';
      const purchaseId = 'pur_xyz_789';
      const verifiedAt = Date.now();

      const fakeReceipt: StoredLicenseReceipt = {
        licenseKey: key,
        purchaseId,
        email: 'attacker@evil.com',
        verifiedAt,
        signature: 'forged_fake_signature_hash_12345',
      };

      localStorageMock.setItem('drywallpro_license_receipt', JSON.stringify(fakeReceipt));
      localStorageMock.setItem('drywallpro_is_pro', 'true');

      const loaded = await loadStoredLicense();
      expect(loaded.isPro).toBe(false);
      expect(loaded.receipt).toBeNull();
      // Storage should be cleared
      expect(localStorageMock.getItem('drywallpro_is_pro')).toBeNull();
    });

    it('detects tampering if licenseKey is modified in stored JSON', async () => {
      const originalKey = 'ORIGINAL-KEY-1';
      const purchaseId = 'pur_abc_123';
      const verifiedAt = Date.now();
      const validSignature = await computeSignature(originalKey, purchaseId, verifiedAt);

      // Hacker edits licenseKey in localStorage without recomputing signature
      const tamperedReceipt: StoredLicenseReceipt = {
        licenseKey: 'MODIFIED-UNLICENSED-KEY',
        purchaseId,
        email: 'user@example.com',
        verifiedAt,
        signature: validSignature,
      };

      localStorageMock.setItem('drywallpro_license_receipt', JSON.stringify(tamperedReceipt));

      const loaded = await loadStoredLicense();
      expect(loaded.isPro).toBe(false);
      expect(loaded.receipt).toBeNull();
    });

    it('clears stored license on clearStoredLicense()', () => {
      localStorageMock.setItem('drywallpro_license_receipt', '{"test": true}');
      localStorageMock.setItem('drywallpro_is_pro', 'true');
      clearStoredLicense();
      expect(localStorageMock.getItem('drywallpro_license_receipt')).toBeNull();
      expect(localStorageMock.getItem('drywallpro_is_pro')).toBeNull();
    });
  });
});
