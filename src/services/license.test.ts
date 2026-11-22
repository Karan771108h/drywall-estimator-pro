import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  verifyGumroadLicense,
  loadStoredLicense,
  saveStoredLicense,
  clearStoredLicense,
  computeSignature,
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

  describe('Default Visitor State', () => {
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
      // Should also clean up the invalid boolean flag
      expect(localStorageMock.getItem('drywallpro_is_pro')).toBeNull();
    });
  });

  describe('Gumroad API Verification', () => {
    it('activates Pro mode and returns a signed receipt on valid Gumroad response', async () => {
      const mockResponse = {
        success: true,
        uses: 1,
        purchase: {
          id: 'pur_test_987654',
          email: 'contractor@drywall.com',
          refunded: false,
          chargebacked: false,
          disputed: false,
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as unknown as Response);

      const result = await verifyGumroadLicense('GUM-VALID-KEY-1234');
      expect(result.success).toBe(true);
      expect(result.receipt).toBeDefined();
      expect(result.receipt?.licenseKey).toBe('GUM-VALID-KEY-1234');
      expect(result.receipt?.purchaseId).toBe('pur_test_987654');
      expect(result.receipt?.signature).toBeDefined();
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
        ok: true,
        json: async () => mockResponse,
      } as unknown as Response);

      const result = await verifyGumroadLicense('GUM-REFUNDED-KEY');
      expect(result.success).toBe(false);
      expect(result.message).toContain('refunded');
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
        ok: true,
        json: async () => mockResponse,
      } as unknown as Response);

      const result = await verifyGumroadLicense('GUM-DISPUTED-KEY');
      expect(result.success).toBe(false);
      expect(result.message).toContain('disputed or charged back');
    });

    it('handles Gumroad invalid license response', async () => {
      const mockResponse = {
        success: false,
        message: 'That license does not exist for the provided product.',
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as unknown as Response);

      const result = await verifyGumroadLicense('INVALID-KEY');
      expect(result.success).toBe(false);
      expect(result.message).toBe('That license does not exist for the provided product.');
    });

    it('gracefully handles network errors without crashing', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

      const result = await verifyGumroadLicense('SOME-KEY');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Network error');
    });
  });

  describe('Anti-Tamper & Cryptographic Receipt Verification', () => {
    it('successfully loads a validly signed stored receipt', async () => {
      const key = 'VALID-KEY-555';
      const purchaseId = 'pur_abc_123';
      const verifiedAt = Date.now();
      const signature = await computeSignature(key, purchaseId, verifiedAt);

      const validReceipt: StoredLicenseReceipt = {
        licenseKey: key,
        purchaseId,
        email: 'test@example.com',
        verifiedAt,
        signature,
      };

      saveStoredLicense(validReceipt);

      const loaded = await loadStoredLicense();
      expect(loaded.isPro).toBe(true);
      expect(loaded.receipt?.licenseKey).toBe(key);
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

    it('clears stored license on clearStoredLicense()', () => {
      localStorageMock.setItem('drywallpro_license_receipt', '{"test": true}');
      localStorageMock.setItem('drywallpro_is_pro', 'true');
      clearStoredLicense();
      expect(localStorageMock.getItem('drywallpro_license_receipt')).toBeNull();
      expect(localStorageMock.getItem('drywallpro_is_pro')).toBeNull();
    });
  });
});
