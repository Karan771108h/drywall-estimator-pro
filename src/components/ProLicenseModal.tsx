import React, { useState } from 'react';
import type { CompanyProfile } from '@/engine/types';
import {
  GUMROAD_PRODUCT_URL,
  verifyGumroadLicense,
  type StoredLicenseReceipt,
} from '@/services/license';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  CheckCircle2,
  Upload,
  Trash2,
  KeyRound,
  ExternalLink,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface ProLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPro: boolean;
  licenseKey: string;
  onActivateSuccess: (receipt: StoredLicenseReceipt) => void;
  onDeactivate: () => void;
  company: CompanyProfile;
  onCompanyChange: (profile: CompanyProfile) => void;
}

export const ProLicenseModal: React.FC<ProLicenseModalProps> = ({
  isOpen,
  onClose,
  isPro,
  licenseKey,
  onActivateSuccess,
  onDeactivate,
  company,
  onCompanyChange,
}) => {
  const [inputKey, setInputKey] = useState(licenseKey);
  const [isVerifying, setIsVerifying] = useState(false);
  const [keyError, setKeyError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError('');
    setSuccessMessage('');

    if (!inputKey.trim()) {
      setKeyError('Please enter a valid Gumroad license key.');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifyGumroadLicense(inputKey.trim());
      if (result.success && result.receipt) {
        setSuccessMessage('License verified successfully! Commercial un-watermarked PDFs unlocked.');
        onActivateSuccess(result.receipt);
      } else {
        setKeyError(result.message || 'Invalid license key. Please check and try again.');
      }
    } catch {
      setKeyError('Unable to connect to verification server. Please verify your internet connection.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onCompanyChange({ ...company, logoDataUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    onCompanyChange({ ...company, logoDataUrl: undefined });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-zinc-900" />
            <DialogTitle>
              {isPro ? 'Pro Commercial License & Profile' : 'Unlock Pro Commercial Edition'}
            </DialogTitle>
          </div>
          <DialogDescription>
            Unlock un-watermarked client-ready PDF quotes, custom contractor branding, and company logo insertion.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1 text-xs">
          {/* Purchase CTA Banner for Free Users */}
          {!isPro && (
            <div className="rounded-[6px] border border-zinc-200 bg-zinc-50 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-zinc-700" />
                  Commercial Lifetime License
                </div>
                <div className="text-[11px] text-zinc-500">
                  Instant license key delivery via Gumroad. One-time payment ($29).
                </div>
              </div>
              <Button asChild size="sm" className="shrink-0 gap-1 font-medium">
                <a href={GUMROAD_PRODUCT_URL} target="_blank" rel="noopener noreferrer">
                  <span>Buy Commercial License ($29)</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          )}

          {/* License Activation Form */}
          <div className="rounded-[6px] border border-zinc-200 bg-white p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-zinc-600" />
                Gumroad License Key
              </label>
              {isPro && (
                <Badge variant="success" className="gap-1 font-medium text-[10px]">
                  <CheckCircle2 className="h-3 w-3" />
                  Active Pro License
                </Badge>
              )}
            </div>

            <form onSubmit={handleKeySubmit} className="flex gap-2">
              <Input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Enter license key (e.g. XXXXXXXX-XXXXXXXX-...)"
                className="font-mono text-xs"
                disabled={isVerifying}
              />
              <Button type="submit" size="sm" disabled={isVerifying} className="shrink-0 font-medium min-w-20">
                {isVerifying ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span className="sr-only">Verifying...</span>
                  </>
                ) : isPro ? (
                  'Re-verify'
                ) : (
                  'Activate'
                )}
              </Button>
            </form>

            {keyError && (
              <div className="flex items-start gap-1.5 text-red-600 text-[11px] font-medium pt-0.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{keyError}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-medium pt-0.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {isPro && (
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={onDeactivate}
                  className="text-red-600 hover:underline text-[11px] cursor-pointer"
                >
                  Deactivate License (Switch to Free Mode)
                </button>
              </div>
            )}
          </div>

          {/* Contractor Company Profile Form */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Contractor Company Branding & Quote Header
            </h4>

            {/* Logo Upload */}
            <div>
              <label className="block text-zinc-600 mb-1 text-[11px] font-medium">Company Logo</label>
              <div className="flex items-center gap-3">
                {company.logoDataUrl ? (
                  <div className="relative w-20 h-14 bg-white rounded-[4px] border border-zinc-200 p-1 flex items-center justify-center">
                    <img
                      src={company.logoDataUrl}
                      alt="Uploaded Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 shadow-xs cursor-pointer"
                      title="Remove Logo"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-1.5 cursor-pointer rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 px-3 py-1.5 text-xs font-medium transition-colors">
                    <Upload className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Upload Logo Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                )}
                <span className="text-[11px] text-zinc-400">
                  Embeds in the header of the exported proposal PDF.
                </span>
              </div>
            </div>

            {/* Company Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-zinc-600 mb-1 text-[11px] font-medium">Company Name</label>
                <Input
                  type="text"
                  value={company.companyName}
                  onChange={(e) => onCompanyChange({ ...company, companyName: e.target.value })}
                  placeholder="e.g. Apex Drywall & Acoustical"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 text-[11px] font-medium">State Contractor License #</label>
                <Input
                  type="text"
                  value={company.licenseNumber}
                  onChange={(e) => onCompanyChange({ ...company, licenseNumber: e.target.value })}
                  placeholder="e.g. CS-894102-B"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 text-[11px] font-medium">Business Phone</label>
                <Input
                  type="text"
                  value={company.phone}
                  onChange={(e) => onCompanyChange({ ...company, phone: e.target.value })}
                  placeholder="e.g. (555) 349-2100"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 text-[11px] font-medium">Business Email</label>
                <Input
                  type="email"
                  value={company.email}
                  onChange={(e) => onCompanyChange({ ...company, email: e.target.value })}
                  placeholder="e.g. bids@apexdrywall.com"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-600 mb-1 text-[11px] font-medium">Physical Address</label>
                <Input
                  type="text"
                  value={company.address}
                  onChange={(e) => onCompanyChange({ ...company, address: e.target.value })}
                  placeholder="e.g. 1420 Commercial Parkway, Austin, TX"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-600 mb-1 text-[11px] font-medium">Terms of Payment & Warranty</label>
                <textarea
                  rows={2}
                  value={company.paymentTerms}
                  onChange={(e) => onCompanyChange({ ...company, paymentTerms: e.target.value })}
                  className="w-full rounded-[6px] border border-zinc-200 bg-white p-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950 font-normal"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" size="sm" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
