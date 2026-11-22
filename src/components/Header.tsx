import React from 'react';
import type { UnitSystem } from '../engine/types';
import { ShieldCheck, Sparkles, Sliders, FileDown } from 'lucide-react';

interface HeaderProps {
  unitSystem: UnitSystem;
  onUnitChange: (unit: UnitSystem) => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
  isPro: boolean;
  onOpenProModal: () => void;
  onOpenRatesModal: () => void;
  onDownloadPDF: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  unitSystem,
  onUnitChange,
  currency,
  onCurrencyChange,
  isPro,
  onOpenProModal,
  onOpenRatesModal,
  onDownloadPDF,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xl tracking-tighter">
            DP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight leading-none">
                DrywallPro <span className="text-amber-400 font-medium">Estimator</span>
              </h1>
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                USG & GA-214
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Trade Takeoff, Pack-Rounding & Burdened Labor Bid Proposal Engine
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto justify-end">
          {/* Unit Toggle */}
          <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => onUnitChange('imperial')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                unitSystem === 'imperial'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Imperial (ft)
            </button>
            <button
              type="button"
              onClick={() => onUnitChange('metric')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                unitSystem === 'metric'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Metric (m)
            </button>
          </div>

          {/* Currency Selector */}
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            <option value="$">$ (USD/CAD)</option>
            <option value="€">€ (EUR)</option>
            <option value="£">£ (GBP)</option>
            <option value="A$">A$ (AUD)</option>
          </select>

          {/* Rates Drawer Button */}
          <button
            type="button"
            onClick={onOpenRatesModal}
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Rate Card & Margins</span>
            <span className="sm:hidden">Rates</span>
          </button>

          {/* Pro Mode Badge / Modal Button */}
          {isPro ? (
            <button
              type="button"
              onClick={onOpenProModal}
              className="flex items-center gap-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Pro Licensed</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenProModal}
              className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Unlock Pro (Logo & Clean PDF)</span>
            </button>
          )}

          {/* Export PDF Button */}
          <button
            type="button"
            onClick={onDownloadPDF}
            className="flex items-center gap-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            <FileDown className="w-4 h-4" />
            <span>Generate PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
};
