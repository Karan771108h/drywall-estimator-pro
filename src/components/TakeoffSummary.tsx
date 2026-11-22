import React from 'react';
import type { TakeoffResult, ProjectSettings } from '../engine/types';
import { Package, Users, DollarSign, Calculator, Layers, AlertCircle } from 'lucide-react';

interface TakeoffSummaryProps {
  takeoff: TakeoffResult;
  settings: ProjectSettings;
}

export const TakeoffSummary: React.FC<TakeoffSummaryProps> = ({ takeoff, settings }) => {
  const sym = settings.currency;
  const isMetric = settings.unitSystem === 'metric';
  const areaUnit = isMetric ? 'm²' : 'sq ft';

  const grossMargin =
    takeoff.totalBidPrice > 0
      ? ((takeoff.totalBidPrice - takeoff.subcontractorDirectCost) / takeoff.totalBidPrice) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Executive Key Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Total Board Scope</span>
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {takeoff.totalBoardArea.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">{areaUnit}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            +{settings.wastePercent}% waste: {Math.round(takeoff.totalBoardArea * (1 + settings.wastePercent / 100)).toLocaleString()} {areaUnit}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
            <Calculator className="w-4 h-4 text-sky-400" />
            <span>Net Paint Scope</span>
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {takeoff.totalPaintArea.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">{areaUnit}</span>
          </div>
          <div className="text-[11px] text-sky-400/80 mt-0.5">
            Doors & windows deducted
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
            <Package className="w-4 h-4 text-emerald-400" />
            <span>Materials (BOM)</span>
          </div>
          <div className="text-xl font-bold text-emerald-400 tracking-tight">
            {sym}{takeoff.materialsCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {takeoff.bom.length} pack-rounded items
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Burdened Labor</span>
          </div>
          <div className="text-xl font-bold text-indigo-300 tracking-tight">
            {sym}{takeoff.totalLaborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Incl. +22% WC & FICA burden
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <span>Direct Job Cost</span>
          </div>
          <div className="text-xl font-bold text-slate-200 tracking-tight">
            {sym}{takeoff.subcontractorDirectCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Materials + Labor + Disposal
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-900 border border-amber-500/40 rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold mb-1">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>Contractor Bid Price</span>
          </div>
          <div className="text-xl font-black text-amber-400 tracking-tight">
            {sym}{takeoff.totalBidPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-amber-300/80 mt-0.5 font-medium">
            {grossMargin.toFixed(1)}% Gross Margin
          </div>
        </div>
      </div>

      {/* Bill of Materials (BOM) Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              Itemized Bill of Materials (BOM) & Physical Pack Rounding
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Calculated to USG reference consumption standards; rounded to standard factory packaging (bundles, buckets, rolls).
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            Total Materials: {sym}{takeoff.materialsCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Item Description</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Packaging Specification</th>
                <th className="px-4 py-3 text-right">Net Req.</th>
                <th className="px-4 py-3 text-right">Pack Order Qty</th>
                <th className="px-4 py-3 text-right">Unit Rate</th>
                <th className="px-5 py-3 text-right">Extended Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {takeoff.bom.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3 font-semibold text-white">
                    {item.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      item.category === 'drywall'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : item.category === 'finishing'
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        : item.category === 'fasteners'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                    {item.specification}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-400">
                    {item.netQuantity.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-amber-300">
                    {item.roundedPackageQuantity} <span className="text-[10px] font-normal text-slate-400">{item.packageUnit}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-300">
                    {sym}{item.unitCost.toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-bold text-white">
                    {sym}{item.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decomposed Crew Labor Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Burdened Trade Crew Labor Breakdown
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Production man-hours multiplied by trade base wages, plus 22% statutory labor burden (Workers' Comp Class 5445, FICA, General Liability).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Labor Operation</th>
                  <th className="px-4 py-3 text-right">Est. Man-Hours</th>
                  <th className="px-4 py-3 text-right">Base Payroll</th>
                  <th className="px-5 py-3 text-right">Burdened Labor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {takeoff.laborTasks.map((task) => (
                  <tr key={task.task} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3 font-medium text-white">
                      {task.task}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">
                      {task.manHours.toFixed(1)} hrs
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400">
                      {sym}{task.baseLaborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-indigo-300">
                      {sym}{task.burdenedLaborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-950/90 font-bold border-t border-slate-700">
                <tr>
                  <td className="px-5 py-3 text-white">Total Crew Labor</td>
                  <td className="px-4 py-3 text-right font-mono text-amber-300">
                    {takeoff.laborTasks.reduce((s, t) => s + t.manHours, 0).toFixed(1)} hrs
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-400">
                    {sym}{takeoff.totalBaseLaborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-indigo-300">
                    {sym}{takeoff.totalLaborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Financial Summary Waterfall */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-amber-400" />
              Job Costing & Profit Waterfall
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-300 pb-1.5 border-b border-slate-800">
                <span>Direct Materials Cost:</span>
                <span className="font-mono font-medium text-white">
                  {sym}{takeoff.materialsCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-300 pb-1.5 border-b border-slate-800">
                <span>Burdened Labor Cost:</span>
                <span className="font-mono font-medium text-white">
                  {sym}{takeoff.totalLaborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-300 pb-1.5 border-b border-slate-800">
                <span>Scrap Dump & Equipment Allowance:</span>
                <span className="font-mono font-medium text-white">
                  {sym}{takeoff.dumpAndEquipmentFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-200 font-semibold py-1 bg-slate-850 px-2 rounded">
                <span>Subcontractor Direct Cost:</span>
                <span className="font-mono text-white">
                  {sym}{takeoff.subcontractorDirectCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-300 pt-1">
                <span>Contractor Overhead ({settings.overheadPercent}%):</span>
                <span className="font-mono text-white">
                  +{sym}{takeoff.overheadCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>Net Profit Margin ({settings.profitPercent}%):</span>
                <span className="font-mono text-emerald-400 font-medium">
                  +{sym}{takeoff.profitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5">
              <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                Total Recommended Bid Price
              </div>
              <div className="text-2xl font-black text-amber-400 tracking-tight mt-1">
                {sym}{takeoff.totalBidPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Provides {grossMargin.toFixed(1)}% gross contract margin</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
