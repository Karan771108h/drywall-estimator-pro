import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileDown, SlidersHorizontal, ShieldCheck, Sparkles } from 'lucide-react';

interface HeaderProps {
  isPro: boolean;
  onOpenProModal: () => void;
  onOpenSettingsSheet: () => void;
  onDownloadPDF: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isPro,
  onOpenProModal,
  onOpenSettingsSheet,
  onDownloadPDF,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-[5px] bg-zinc-900 flex items-center justify-center text-zinc-50 font-bold text-xs tracking-tight">
            DP
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900 tracking-tight">
              DrywallPro
            </span>
            <span className="hidden sm:inline-block text-[10px] font-medium text-zinc-500 uppercase tracking-wider bg-zinc-100 border border-zinc-200/80 px-1.5 py-0.2 rounded-[4px]">
              GA-214
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Pro Status Badge / Trigger */}
          {isPro ? (
            <button
              type="button"
              onClick={onOpenProModal}
              className="inline-flex cursor-pointer"
            >
              <Badge variant="success" className="gap-1 font-medium">
                <ShieldCheck className="h-3 w-3" />
                <span className="hidden sm:inline">Pro Licensed</span>
                <span className="sm:hidden">Pro</span>
              </Badge>
            </button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenProModal}
              className="h-7 text-[11px] gap-1 text-zinc-700"
            >
              <Sparkles className="h-3 w-3 text-zinc-500" />
              <span>Unlock Pro</span>
            </Button>
          )}

          {/* Settings Sheet Trigger */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenSettingsSheet}
            className="h-7 px-2 text-zinc-600 hover:text-zinc-900"
            title="Project Settings & Rate Card"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden md:inline text-xs ml-1 font-medium">Settings</span>
          </Button>

          {/* Export PDF Button */}
          <Button
            type="button"
            size="sm"
            onClick={onDownloadPDF}
            className="h-7 px-3 text-xs font-semibold gap-1.5"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span>Export PDF</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
