import React, { useState } from 'react';
import type { CompanyProfile } from '../engine/types';
import { X, Sparkles, CheckCircle2, Upload, Trash2, KeyRound } from 'lucide-react';

interface ProLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPro: boolean;
  licenseKey: string;
  onActivateKey: (key: string) => boolean;
  onDeactivate: () => void;
  company: CompanyProfile;
  onCompanyChange: (profile: CompanyProfile) => void;
}

export const ProLicenseModal: React.FC<ProLicenseModalProps> = ({
  isOpen,
  onClose,
  isPro,
  licenseKey,
  onActivateKey,
  onDeactivate,
  company,
  onCompanyChange,
}) => {
  const [inputKey, setInputKey] = useState(licenseKey);
  const [keyError, setKeyError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError('');
    setSuccessMessage('');

    if (!inputKey.trim()) {
      setKeyError('Please enter a valid license key.');
      return;
    }

    const success = onActivateKey(inputKey.trim());
    if (success) {
      setSuccessMessage('Pro license successfully verified! Branded PDFs unlocked.');
    } else {
      setKeyError('Invalid license key. Use any standard key like "DRYWALLPRO-2026" or "GUM-XXXX".');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isPro ? 'Pro Contractor Profile & License' : 'Unlock Pro: Branded Contractor Proposals'}
              </h2>
              <p className="text-xs text-slate-400">
                Generate clean, un-watermarked PDF quotes with custom logo, contractor license #, and payment terms.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-xs text-slate-300">
          {/* License Activation Box */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Gumroad License Key
              </label>
              {isPro && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active Pro License
                </span>
              )}
            </div>

            <form onSubmit={handleKeySubmit} className="flex gap-2">
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Enter Gumroad key (e.g. DRYWALLPRO-2026)"
                className="flex-1 bg-slate-800 border border-slate-700 text-white font-mono px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition-colors shrink-0"
              >
                {isPro ? 'Update Key' : 'Activate Pro'}
              </button>
            </form>

            {keyError && <div className="text-rose-400 text-[11px] mt-2">{keyError}</div>}
            {successMessage && <div className="text-emerald-400 text-[11px] mt-2">{successMessage}</div>}

            <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
              <span>Test Key: <code className="text-amber-400 font-mono">DRYWALLPRO-2026</code></span>
              {isPro && (
                <button
                  type="button"
                  onClick={onDeactivate}
                  className="text-rose-400 hover:underline"
                >
                  Deactivate Pro (Switch to Free Mode)
                </button>
              )}
            </div>
          </div>

          {/* Contractor Company Profile Form */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Contractor Company Branding & PDF Header
            </h3>

            {/* Logo Upload */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-medium">Company Logo (PNG, JPG, SVG)</label>
              <div className="flex items-center gap-4">
                {company.logoDataUrl ? (
                  <div className="relative w-24 h-16 bg-white rounded-lg border border-slate-300 p-1 flex items-center justify-center">
                    <img
                      src={company.logoDataUrl}
                      alt="Uploaded Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600 shadow"
                      title="Remove Logo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-lg text-xs font-medium transition-colors">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>Upload Logo Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                )}
                <span className="text-[11px] text-slate-400">
                  Renders in the top header of the downloaded client proposal.
                </span>
              </div>
            </div>

            {/* Company Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Company / Subcontractor Name</label>
                <input
                  type="text"
                  value={company.companyName}
                  onChange={(e) => onCompanyChange({ ...company, companyName: e.target.value })}
                  placeholder="e.g. Apex Drywall & Acoustical Systems"
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">State Contractor License #</label>
                <input
                  type="text"
                  value={company.licenseNumber}
                  onChange={(e) => onCompanyChange({ ...company, licenseNumber: e.target.value })}
                  placeholder="e.g. CS-894102-B"
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Business Phone</label>
                <input
                  type="text"
                  value={company.phone}
                  onChange={(e) => onCompanyChange({ ...company, phone: e.target.value })}
                  placeholder="e.g. (555) 349-2100"
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Business Email</label>
                <input
                  type="email"
                  value={company.email}
                  onChange={(e) => onCompanyChange({ ...company, email: e.target.value })}
                  placeholder="e.g. bids@apexdrywall.com"
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">Business Physical Address</label>
                <input
                  type="text"
                  value={company.address}
                  onChange={(e) => onCompanyChange({ ...company, address: e.target.value })}
                  placeholder="e.g. 1420 Commercial Parkway, Suite 100, Austin, TX"
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">Custom Payment Terms & Warranty</label>
                <textarea
                  rows={3}
                  value={company.paymentTerms}
                  onChange={(e) => onCompanyChange({ ...company, paymentTerms: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end sticky bottom-0 bg-slate-900/95 backdrop-blur">
          <button
            type="button"
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
