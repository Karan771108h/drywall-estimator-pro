import React from 'react';
import type {
  UnitSystem,
  MaterialCostRates,
  LaborProductionRates,
  ProjectSettings,
} from '@/engine/types';
import {
  DEFAULT_MATERIAL_RATES_IMPERIAL,
  DEFAULT_MATERIAL_RATES_METRIC,
  DEFAULT_LABOR_RATES,
  DEFAULT_PROJECT_SETTINGS,
} from '@/engine/takeoff';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RotateCcw } from 'lucide-react';

interface SettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ProjectSettings;
  onSettingsChange: (settings: ProjectSettings) => void;
  materialRates: MaterialCostRates;
  onMaterialRatesChange: (rates: MaterialCostRates) => void;
  laborRates: LaborProductionRates;
  onLaborRatesChange: (rates: LaborProductionRates) => void;
  onUnitChange: (unit: UnitSystem) => void;
}

export const SettingsSheet: React.FC<SettingsSheetProps> = ({
  isOpen,
  onOpenChange,
  settings,
  onSettingsChange,
  materialRates,
  onMaterialRatesChange,
  laborRates,
  onLaborRatesChange,
  onUnitChange,
}) => {
  const sym = settings.currency;
  const isMetric = settings.unitSystem === 'metric';

  const resetDefaults = () => {
    onMaterialRatesChange(
      isMetric ? { ...DEFAULT_MATERIAL_RATES_METRIC } : { ...DEFAULT_MATERIAL_RATES_IMPERIAL }
    );
    onLaborRatesChange({ ...DEFAULT_LABOR_RATES });
    onSettingsChange({
      ...settings,
      wastePercent: DEFAULT_PROJECT_SETTINGS.wastePercent,
      dumpAndEquipmentFee: DEFAULT_PROJECT_SETTINGS.dumpAndEquipmentFee,
      overheadPercent: DEFAULT_PROJECT_SETTINGS.overheadPercent,
      profitPercent: DEFAULT_PROJECT_SETTINGS.profitPercent,
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <div className="p-5 border-b border-zinc-200">
          <SheetHeader>
            <SheetTitle>Project & Takeoff Settings</SheetTitle>
            <SheetDescription>
              Configure units, currency, production wages, and subcontractor markups.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
          {/* Unit & Currency */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              System Units & Currency
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-600 mb-1 font-medium">Unit System</label>
                <div className="flex rounded-[6px] border border-zinc-200 p-0.5 bg-zinc-50">
                  <button
                    type="button"
                    onClick={() => onUnitChange('imperial')}
                    className={`flex-1 py-1 rounded-[4px] font-medium text-xs transition-all ${
                      settings.unitSystem === 'imperial'
                        ? 'bg-white text-zinc-900 shadow-2xs'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    Imperial (ft)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUnitChange('metric')}
                    className={`flex-1 py-1 rounded-[4px] font-medium text-xs transition-all ${
                      settings.unitSystem === 'metric'
                        ? 'bg-white text-zinc-900 shadow-2xs'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    Metric (m)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 font-medium">Currency Symbol</label>
                <select
                  value={settings.currency}
                  onChange={(e) => onSettingsChange({ ...settings, currency: e.target.value })}
                  className="w-full h-8 rounded-[6px] border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 font-medium focus:outline-none focus:ring-1 focus:ring-zinc-950"
                >
                  <option value="$">$ (USD / CAD)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="A$">A$ (AUD)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Markups & Waste */}
          <div className="space-y-3 pt-3 border-t border-zinc-100">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Contractor Margins & Allowances
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-600 mb-1 font-medium">Waste Factor (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="30"
                  value={settings.wastePercent}
                  onChange={(e) =>
                    onSettingsChange({ ...settings, wastePercent: parseFloat(e.target.value) || 0 })
                  }
                  className="tabular-nums"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 font-medium">Dump / Equip Fee ({sym})</label>
                <Input
                  type="number"
                  min="0"
                  value={settings.dumpAndEquipmentFee}
                  onChange={(e) =>
                    onSettingsChange({
                      ...settings,
                      dumpAndEquipmentFee: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="tabular-nums"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 font-medium">Overhead (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={settings.overheadPercent}
                  onChange={(e) =>
                    onSettingsChange({
                      ...settings,
                      overheadPercent: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="tabular-nums"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 font-medium">Net Profit (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={settings.profitPercent}
                  onChange={(e) =>
                    onSettingsChange({
                      ...settings,
                      profitPercent: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Material Unit Rates */}
          <div className="space-y-3 pt-3 border-t border-zinc-100">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Material Rate Card ({sym})
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-600 mb-1 text-[11px]">1/2" Regular Sheet</label>
                <Input
                  type="number"
                  step="0.5"
                  value={materialRates.drywallSheetRegular}
                  onChange={(e) =>
                    onMaterialRatesChange({
                      ...materialRates,
                      drywallSheetRegular: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="tabular-nums"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 text-[11px]">5/8" Type X Fire-Code</label>
                <Input
                  type="number"
                  step="0.5"
                  value={materialRates.drywallSheetTypeX}
                  onChange={(e) =>
                    onMaterialRatesChange({
                      ...materialRates,
                      drywallSheetTypeX: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="tabular-nums"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 text-[11px]">1/2" Moisture Purple</label>
                <Input
                  type="number"
                  step="0.5"
                  value={materialRates.drywallSheetMoisture}
                  onChange={(e) =>
                    onMaterialRatesChange({
                      ...materialRates,
                      drywallSheetMoisture: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="tabular-nums"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 text-[11px]">Compound 4.5g Bucket</label>
                <Input
                  type="number"
                  step="0.5"
                  value={materialRates.jointCompoundBucket}
                  onChange={(e) =>
                    onMaterialRatesChange({
                      ...materialRates,
                      jointCompoundBucket: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="tabular-nums"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 text-[11px]">Tape 500ft Roll</label>
                <Input
                  type="number"
                  step="0.25"
                  value={materialRates.jointTapeRoll}
                  onChange={(e) =>
                    onMaterialRatesChange({
                      ...materialRates,
                      jointTapeRoll: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="tabular-nums"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 text-[11px]">Screws 5-lb Box</label>
                <Input
                  type="number"
                  step="0.5"
                  value={materialRates.fastenersBox}
                  onChange={(e) =>
                    onMaterialRatesChange({
                      ...materialRates,
                      fastenersBox: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="tabular-nums"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 text-[11px]">PVA Primer (gal)</label>
                <Input
                  type="number"
                  step="1"
                  value={materialRates.primerGallon}
                  onChange={(e) =>
                    onMaterialRatesChange({
                      ...materialRates,
                      primerGallon: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="tabular-nums"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 text-[11px]">Finish Paint (gal)</label>
                <Input
                  type="number"
                  step="1"
                  value={materialRates.paintGallon}
                  onChange={(e) =>
                    onMaterialRatesChange({
                      ...materialRates,
                      paintGallon: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Trade Labor Wages */}
          <div className="space-y-3 pt-3 border-t border-zinc-100">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Crew Hourly Wages & Burden
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-600 mb-1 text-[11px]">Hanger Wage ({sym}/hr)</label>
                <Input
                  type="number"
                  value={laborRates.hangingHourlyRate}
                  onChange={(e) =>
                    onLaborRatesChange({
                      ...laborRates,
                      hangingHourlyRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="tabular-nums"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 text-[11px]">Taper Wage ({sym}/hr)</label>
                <Input
                  type="number"
                  value={laborRates.finishingHourlyRate}
                  onChange={(e) =>
                    onLaborRatesChange({
                      ...laborRates,
                      finishingHourlyRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="tabular-nums"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 text-[11px]">Painter Wage ({sym}/hr)</label>
                <Input
                  type="number"
                  value={laborRates.paintingHourlyRate}
                  onChange={(e) =>
                    onLaborRatesChange({
                      ...laborRates,
                      paintingHourlyRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="tabular-nums"
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1 text-[11px]">Labor Burden % (WC/FICA)</label>
                <Input
                  type="number"
                  value={laborRates.laborBurdenPercent}
                  onChange={(e) =>
                    onLaborRatesChange({
                      ...laborRates,
                      laborBurdenPercent: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="tabular-nums"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetDefaults}
            className="text-zinc-500 hover:text-zinc-900"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset Defaults
          </Button>

          <Button type="button" size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
