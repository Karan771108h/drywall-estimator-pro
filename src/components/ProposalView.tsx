import React from 'react';
import type {
  TakeoffResult,
  CompanyProfile,
  ClientInfo,
  ProjectSettings,
} from '@/engine/types';
import {
  FINISH_LEVEL_DESCRIPTIONS,
  SUBSTRATE_NAMES,
} from '@/engine/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { FileDown, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ProposalViewProps {
  takeoff: TakeoffResult;
  company: CompanyProfile;
  client: ClientInfo;
  onClientUpdate: (client: ClientInfo) => void;
  settings: ProjectSettings;
  isPro: boolean;
  onOpenProModal: () => void;
  onDownloadPDF: () => void;
}

export const ProposalView: React.FC<ProposalViewProps> = ({
  takeoff,
  company,
  client,
  onClientUpdate,
  settings,
  isPro,
  onOpenProModal,
  onDownloadPDF,
}) => {
  const sym = settings.currency;
  const isMetric = settings.unitSystem === 'metric';
  const areaUnit = isMetric ? 'm²' : 'sq ft';
  const unitLabel = isMetric ? 'm' : 'ft';

  // Subcontractor schedule items
  const drywallCost = takeoff.bom
    .filter((b) => b.category === 'drywall')
    .reduce((sum, b) => sum + b.totalCost, 0);
  const finishingMaterialsCost = takeoff.bom
    .filter((b) => b.category === 'finishing' || b.category === 'fasteners')
    .reduce((sum, b) => sum + b.totalCost, 0);
  const paintMaterialsCost = takeoff.bom
    .filter((b) => b.category === 'paint')
    .reduce((sum, b) => sum + b.totalCost, 0);

  const hangingTask = takeoff.laborTasks.find((t) => t.task.includes('Board Hanging'));
  const finishingTask = takeoff.laborTasks.find((t) => t.task.includes('Taping'));
  const paintingTask = takeoff.laborTasks.find((t) => t.task.includes('Painting'));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Proposal Metadata Editor Card */}
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-zinc-500" />
              Proposal Details & Client Metadata
            </h3>
            <Button
              type="button"
              size="sm"
              onClick={onDownloadPDF}
              className="h-7 text-xs font-semibold gap-1.5"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>Download PDF Quote</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-zinc-600 mb-1 text-[11px] font-medium">Client / General Contractor</label>
              <Input
                type="text"
                value={client.clientName}
                onChange={(e) => onClientUpdate({ ...client, clientName: e.target.value })}
                placeholder="e.g. Acme Builders / John Doe"
              />
            </div>

            <div>
              <label className="block text-zinc-600 mb-1 text-[11px] font-medium">Project Site Address</label>
              <Input
                type="text"
                value={client.projectAddress}
                onChange={(e) => onClientUpdate({ ...client, projectAddress: e.target.value })}
                placeholder="e.g. 742 Evergreen Terr, Springfield"
              />
            </div>

            <div>
              <label className="block text-zinc-600 mb-1 text-[11px] font-medium">Proposal Reference #</label>
              <Input
                type="text"
                value={client.quoteNumber}
                onChange={(e) => onClientUpdate({ ...client, quoteNumber: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-zinc-600 mb-1 text-[11px] font-medium">Validity Period</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="7"
                  max="90"
                  value={client.validDays}
                  onChange={(e) => onClientUpdate({ ...client, validDays: parseInt(e.target.value) || 30 })}
                  className="tabular-nums"
                />
                <span className="text-zinc-500 text-xs">days</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Free Mode Notice / Pro Banner */}
      {!isPro ? (
        <div className="rounded-[6px] border border-amber-200 bg-amber-50/60 p-3.5 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0" />
            <div>
              <span className="font-semibold text-amber-900">Free Mode:</span>{' '}
              <span className="text-amber-800">Generated PDF quotes contain a diagonal watermark.</span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenProModal}
            className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100/60 h-7 text-xs font-medium"
          >
            Unlock Pro (Custom Logo & Clean PDFs)
          </Button>
        </div>
      ) : (
        <div className="rounded-[6px] border border-emerald-200 bg-emerald-50/60 p-3 px-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Pro Mode Active: Custom Contractor Logo & Clean PDFs Unlocked</span>
          </div>
          <button
            type="button"
            onClick={onOpenProModal}
            className="text-emerald-800 hover:underline text-[11px] font-medium cursor-pointer"
          >
            Edit Company Profile
          </button>
        </div>
      )}

      {/* Printable Proposal Document Sheet */}
      <div className="bg-white rounded-[6px] shadow-sm p-6 sm:p-10 border border-zinc-200 relative overflow-hidden font-sans">
        {/* Free Mode Watermark Overlay on Preview */}
        {!isPro && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
            <div className="text-zinc-200 text-5xl sm:text-6xl font-black rotate-[-35deg] tracking-widest text-center opacity-40 leading-tight">
              DRYWALLPRO<br />FREE ESTIMATE
            </div>
          </div>
        )}

        {/* Paper Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-zinc-200">
          <div className="flex items-start gap-4">
            {isPro && company.logoDataUrl ? (
              <img
                src={company.logoDataUrl}
                alt="Company Logo"
                className="w-16 h-12 object-contain rounded-[4px] border border-zinc-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-[5px] bg-zinc-900 flex items-center justify-center text-white font-bold text-sm">
                DP
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-zinc-900 leading-tight">
                {isPro && company.companyName ? company.companyName : 'DRYWALL & PAINT SUBCONTRACTORS'}
              </h2>
              <div className="text-xs text-zinc-500 mt-1 space-y-0.5">
                {isPro && company.licenseNumber && (
                  <div>State Contractor License: #{company.licenseNumber}</div>
                )}
                <div>{isPro && company.phone ? `${company.phone} • ${company.email}` : 'office@drywallpro-contractors.com'}</div>
                {isPro && company.address && <div>{company.address}</div>}
              </div>
            </div>
          </div>

          <div className="sm:text-right bg-zinc-50 border border-zinc-200/80 rounded-[5px] p-3 min-w-[170px]">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">TRADE BID PROPOSAL</div>
            <div className="text-xs text-zinc-700 mt-1 space-y-0.5">
              <div>Ref: <strong className="font-mono">{client.quoteNumber || 'EST-1042'}</strong></div>
              <div>Date: {client.quoteDate || new Date().toLocaleDateString()}</div>
              <div>Valid: {client.validDays || 30} Days</div>
            </div>
          </div>
        </div>

        {/* Client & Project Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-zinc-200 text-xs">
          <div>
            <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">Prepared For</div>
            <div className="font-bold text-zinc-900 text-sm">{client.clientName || 'General Contractor / Client'}</div>
            <div className="text-zinc-600 mt-0.5">{client.projectAddress || 'Jobsite Location'}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">Takeoff Parameters</div>
            <div className="text-zinc-700">
              Board Scope: <strong className="tabular-nums">{takeoff.totalBoardArea.toLocaleString()} {areaUnit}</strong>
            </div>
            <div className="text-zinc-700">
              Net Architectural Paint: <strong className="tabular-nums">{takeoff.totalPaintArea.toLocaleString()} {areaUnit}</strong>
            </div>
          </div>
        </div>

        {/* Section 1: Scope of Work by Room Table */}
        <div className="my-6">
          <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-2">
            1. Scope of Work & Gypsum Specifications by Room
          </h4>

          <div className="border border-zinc-200 rounded-[5px] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room / Area</TableHead>
                  <TableHead>Board Scope</TableHead>
                  <TableHead>Substrate Specification</TableHead>
                  <TableHead>GA-214 Finish</TableHead>
                  <TableHead>Drywall Allocation</TableHead>
                  <TableHead>Corner Bead</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {takeoff.rooms.map((r) => (
                  <TableRow key={r.roomId}>
                    <TableCell className="font-medium text-zinc-900">{r.roomName}</TableCell>
                    <TableCell className="tabular-nums text-zinc-700">{r.totalBoardArea} {areaUnit}</TableCell>
                    <TableCell className="text-zinc-700">{SUBSTRATE_NAMES[r.substrate].split(' ')[0]} {r.substrate === 'type_x_five_eighth' ? '5/8" Type X' : '1/2"'}</TableCell>
                    <TableCell>
                      <span className="font-medium text-zinc-900">Level {r.finishLevel}</span>{' '}
                      <span className="text-[10px] text-zinc-500">({FINISH_LEVEL_DESCRIPTIONS[r.finishLevel].tag})</span>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] tabular-nums text-zinc-700">{r.sheetsNeeded} sheets ({r.recommendedBoardLength.split(' - ')[0]})</TableCell>
                    <TableCell className="tabular-nums text-zinc-700">{r.cornerBeadLinear} {unitLabel}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Section 2: Schedule of Values */}
        <div className="my-6">
          <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-2">
            2. Schedule of Values (Divisions 09 29 00 & 09 91 00)
          </h4>

          <div className="border border-zinc-200 rounded-[5px] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">Item</TableHead>
                  <TableHead>Division Scope & Description</TableHead>
                  <TableHead>Specification Summary</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-center font-bold text-zinc-400">01</TableCell>
                  <TableCell className="font-medium text-zinc-900">
                    Gypsum Panel Board Supply, Stocking & Hanging
                  </TableCell>
                  <TableCell className="text-zinc-600 text-[11px]">
                    {takeoff.totalBoardArea.toLocaleString()} {areaUnit} substrate hung to framing per ASTM C840
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums font-semibold text-zinc-900">
                    {sym}{((drywallCost + (hangingTask?.burdenedLaborCost || 0)) * 1.25).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-center font-bold text-zinc-400">02</TableCell>
                  <TableCell className="font-medium text-zinc-900">
                    Joint Treatment, Corner Bead & GA-214 Finishing
                  </TableCell>
                  <TableCell className="text-zinc-600 text-[11px]">
                    Tape, compound, corner bead, and multi-coat finishing per specified Levels 1-5
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums font-semibold text-zinc-900">
                    {sym}{((finishingMaterialsCost + (finishingTask?.burdenedLaborCost || 0)) * 1.25).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-center font-bold text-zinc-400">03</TableCell>
                  <TableCell className="font-medium text-zinc-900">
                    PVA Drywall Primer & Architectural Finish Coating
                  </TableCell>
                  <TableCell className="text-zinc-600 text-[11px]">
                    {takeoff.totalPaintArea.toLocaleString()} {areaUnit} unsealed sealer/primer + specified finish coats
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums font-semibold text-zinc-900">
                    {sym}{((paintMaterialsCost + (paintingTask?.burdenedLaborCost || 0)) * 1.25).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-center font-bold text-zinc-400">04</TableCell>
                  <TableCell className="font-medium text-zinc-900">
                    Jobsite Protection, Equipment & Daily Scrap Haul-Off
                  </TableCell>
                  <TableCell className="text-zinc-600 text-[11px]">
                    Dumpsters, floor protection, scaffold/lift safety allowances, broom-clean finish
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums font-semibold text-zinc-900">
                    {sym}${(takeoff.dumpAndEquipmentFee * 1.25).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Grand Total Box */}
          <div className="mt-4 flex justify-end">
            <div className="bg-zinc-900 text-white rounded-[5px] p-3 px-5 flex items-center gap-6">
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                Total Contract Bid Sum:
              </span>
              <span className="text-lg font-bold tracking-tight font-mono tabular-nums text-white">
                {sym}{takeoff.totalBidPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Payment Terms & Inclusions */}
        <div className="my-6 pt-4 border-t border-zinc-200 text-xs text-zinc-600 space-y-1.5">
          <h4 className="font-semibold text-zinc-900 uppercase text-[10px] tracking-wider">
            Terms of Payment & Warranty
          </h4>
          <p className="leading-relaxed text-[11px]">
            {company.paymentTerms ||
              '30% Deposit upon contract signing and mobilization; 40% upon completion of drywall hanging and first coat taping; 30% upon final sanding, painting inspection and sign-off. All work completed in strict accordance with ASTM C840 and Gypsum Association GA-214 standards.'}
          </p>
        </div>

        {/* Section 4: Signature Lines */}
        <div className="mt-8 pt-6 border-t border-zinc-200 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          <div>
            <div className="border-b border-zinc-300 pb-1 mb-1 font-semibold text-zinc-900">
              {isPro && company.companyName ? company.companyName : 'Authorized Drywall Subcontractor'}
            </div>
            <div className="text-[10px] text-zinc-500">Authorized Signature & Date</div>
          </div>

          <div>
            <div className="border-b border-zinc-300 pb-1 mb-1 font-semibold text-zinc-900">
              {client.clientName || 'Client / General Contractor'}
            </div>
            <div className="text-[10px] text-zinc-500">Approval & Notice to Proceed Signature & Date</div>
          </div>
        </div>
      </div>
    </div>
  );
};
