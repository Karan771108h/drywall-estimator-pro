import React from 'react';
import type { TakeoffResult, ProjectSettings } from '@/engine/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Package, Users, DollarSign, Calculator, Layers } from 'lucide-react';

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
      {/* Key Metric Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-medium">
              <Layers className="h-3.5 w-3.5" />
              <span>Board Scope</span>
            </div>
            <div className="text-lg font-bold text-zinc-900 tracking-tight tabular-nums">
              {takeoff.totalBoardArea.toLocaleString()}{' '}
              <span className="text-[11px] font-normal text-zinc-500">{areaUnit}</span>
            </div>
            <div className="text-[10px] text-zinc-400 tabular-nums">
              +{settings.wastePercent}%: {Math.round(takeoff.totalBoardArea * (1 + settings.wastePercent / 100)).toLocaleString()} {areaUnit}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-medium">
              <Calculator className="h-3.5 w-3.5" />
              <span>Net Paint</span>
            </div>
            <div className="text-lg font-bold text-zinc-900 tracking-tight tabular-nums">
              {takeoff.totalPaintArea.toLocaleString()}{' '}
              <span className="text-[11px] font-normal text-zinc-500">{areaUnit}</span>
            </div>
            <div className="text-[10px] text-zinc-400">
              Openings deducted
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-medium">
              <Package className="h-3.5 w-3.5" />
              <span>Materials (BOM)</span>
            </div>
            <div className="text-lg font-bold text-zinc-900 tracking-tight tabular-nums">
              {sym}{takeoff.materialsCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-zinc-400">
              {takeoff.bom.length} pack-rounded items
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-medium">
              <Users className="h-3.5 w-3.5" />
              <span>Burdened Labor</span>
            </div>
            <div className="text-lg font-bold text-zinc-900 tracking-tight tabular-nums">
              {sym}{takeoff.totalLaborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-zinc-400">
              Incl. +22% WC & FICA
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-medium">
              <DollarSign className="h-3.5 w-3.5" />
              <span>Direct Job Cost</span>
            </div>
            <div className="text-lg font-bold text-zinc-900 tracking-tight tabular-nums">
              {sym}{takeoff.subcontractorDirectCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-zinc-400">
              Materials + Labor + Disp
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 text-white border-zinc-900">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-300 text-[11px] font-medium">
              <DollarSign className="h-3.5 w-3.5 text-zinc-400" />
              <span>Bid Proposal Price</span>
            </div>
            <div className="text-lg font-bold text-white tracking-tight tabular-nums">
              {sym}{takeoff.totalBidPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-zinc-300 font-medium tabular-nums">
              {grossMargin.toFixed(1)}% Gross Margin
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bill of Materials (BOM) Table Card */}
      <Card>
        <CardHeader className="py-3.5 px-5 border-b border-zinc-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-zinc-700" />
              Itemized Bill of Materials (BOM) & Physical Packaging
            </CardTitle>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Strict pack-size rounding to factory units (2-sheet bundles, 4.5-gal buckets, 500-ft rolls, 5-lb boxes).
            </p>
          </div>
          <Badge variant="outline" className="font-mono tabular-nums text-xs">
            Total Materials: {sym}{takeoff.materialsCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Badge>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-5">Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Packaging Specification</TableHead>
              <TableHead className="text-right">Net Calc</TableHead>
              <TableHead className="text-right">Order Pack Qty</TableHead>
              <TableHead className="text-right">Unit Rate</TableHead>
              <TableHead className="text-right px-5">Extended Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {takeoff.bom.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="px-5 font-medium text-zinc-900">
                  {item.name}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize text-[10px] px-1.5 py-0 font-normal">
                    {item.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-500 font-mono text-[11px]">
                  {item.specification}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-zinc-500">
                  {item.netQuantity.toFixed(1)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums font-semibold text-zinc-900">
                  {item.roundedPackageQuantity} <span className="text-[10px] font-normal text-zinc-500">{item.packageUnit}</span>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-zinc-600">
                  {sym}{item.unitCost.toFixed(2)}
                </TableCell>
                <TableCell className="text-right px-5 font-mono tabular-nums font-semibold text-zinc-900">
                  {sym}{item.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={6} className="px-5 font-semibold text-zinc-900">
                Total Materials Cost
              </TableCell>
              <TableCell className="text-right px-5 font-mono tabular-nums font-bold text-zinc-900">
                {sym}{takeoff.materialsCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>

      {/* Decomposed Crew Labor Table & Waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8">
          <CardHeader className="py-3.5 px-5 border-b border-zinc-100">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-zinc-700" />
              Burdened Trade Crew Labor Breakdown
            </CardTitle>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Production man-hours multiplied by trade base wages, plus 22% statutory labor burden (Workers' Comp Class 5445, FICA).
            </p>
          </CardHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-5">Operation</TableHead>
                <TableHead className="text-right">Est. Man-Hours</TableHead>
                <TableHead className="text-right">Base Payroll</TableHead>
                <TableHead className="text-right px-5">Burdened Labor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {takeoff.laborTasks.map((task) => (
                <TableRow key={task.task}>
                  <TableCell className="px-5 font-medium text-zinc-900">
                    {task.task}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-zinc-600">
                    {task.manHours.toFixed(1)} hrs
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-zinc-500">
                    {sym}{task.baseLaborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right px-5 font-mono tabular-nums font-semibold text-zinc-900">
                    {sym}{task.burdenedLaborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="px-5 font-semibold text-zinc-900">Total Crew Labor</TableCell>
                <TableCell className="text-right font-mono tabular-nums font-semibold text-zinc-900">
                  {takeoff.laborTasks.reduce((s, t) => s + t.manHours, 0).toFixed(1)} hrs
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-zinc-500">
                  {sym}{takeoff.totalBaseLaborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right px-5 font-mono tabular-nums font-bold text-zinc-900">
                  {sym}{takeoff.totalLaborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </Card>

        {/* Financial Summary Waterfall */}
        <Card className="lg:col-span-4 flex flex-col justify-between">
          <CardHeader className="py-3.5 px-5 border-b border-zinc-100">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-zinc-700" />
              Contract Financial Waterfall
            </CardTitle>
          </CardHeader>

          <CardContent className="p-5 space-y-3 text-xs flex-1">
            <div className="flex justify-between items-center text-zinc-600 pb-2 border-b border-zinc-100">
              <span>Materials Cost:</span>
              <span className="font-mono tabular-nums text-zinc-900 font-medium">
                {sym}{takeoff.materialsCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center text-zinc-600 pb-2 border-b border-zinc-100">
              <span>Burdened Labor (+22%):</span>
              <span className="font-mono tabular-nums text-zinc-900 font-medium">
                {sym}{takeoff.totalLaborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center text-zinc-600 pb-2 border-b border-zinc-100">
              <span>Dump & Equipment Allowance:</span>
              <span className="font-mono tabular-nums text-zinc-900 font-medium">
                {sym}{takeoff.dumpAndEquipmentFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center text-zinc-900 font-semibold py-1.5 px-2.5 rounded-[4px] bg-zinc-50 border border-zinc-200/80">
              <span>Subcontractor Direct Cost:</span>
              <span className="font-mono tabular-nums">
                {sym}{takeoff.subcontractorDirectCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center text-zinc-600 pt-1">
              <span>Overhead ({settings.overheadPercent}%):</span>
              <span className="font-mono tabular-nums text-zinc-900 font-medium">
                +{sym}{takeoff.overheadCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center text-zinc-600">
              <span>Net Profit ({settings.profitPercent}%):</span>
              <span className="font-mono tabular-nums text-zinc-900 font-medium">
                +{sym}{takeoff.profitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="pt-3 border-t border-zinc-200">
              <div className="rounded-[6px] bg-zinc-900 text-white p-3.5 space-y-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Recommended Bid Price
                </div>
                <div className="text-xl font-bold tracking-tight font-mono tabular-nums">
                  {sym}{takeoff.totalBidPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-zinc-300">
                  Yields <strong className="text-white tabular-nums">{grossMargin.toFixed(1)}%</strong> gross contract margin
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
