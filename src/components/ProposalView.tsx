import React from 'react';
import type {
  TakeoffResult,
  CompanyProfile,
  ClientInfo,
  ProjectSettings,
} from '../engine/types';
import {
  FINISH_LEVEL_DESCRIPTIONS,
  SUBSTRATE_NAMES,
} from '../engine/types';
import { FileDown, Building, FileText, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';

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
      {/* Client & Proposal Metadata Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-amber-400" />
          Proposal Client & Project Metadata
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Client / General Contractor</label>
            <input
              type="text"
              value={client.clientName}
              onChange={(e) => onClientUpdate({ ...client, clientName: e.target.value })}
              placeholder="e.g. Acme Builders / John Doe"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Project Site Address</label>
            <input
              type="text"
              value={client.projectAddress}
              onChange={(e) => onClientUpdate({ ...client, projectAddress: e.target.value })}
              placeholder="e.g. 742 Evergreen Terr, Springfield"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Proposal Reference #</label>
            <input
              type="text"
              value={client.quoteNumber}
              onChange={(e) => onClientUpdate({ ...client, quoteNumber: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Validity Period</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="7"
                max="90"
                value={client.validDays}
                onChange={(e) => onClientUpdate({ ...client, validDays: parseInt(e.target.value) || 30 })}
                className="w-20 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <span className="text-slate-400">days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Free Mode Notice / Pro Banner */}
      {!isPro ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-300">Free Mode: PDF Quote Includes Watermark</div>
              <div className="text-[11px] text-slate-400">
                Unlock Pro to add your contractor logo, custom license number, phone, email, and generate clean un-watermarked PDFs.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenProModal}
            className="flex items-center gap-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg shrink-0 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Unlock Pro Branding</span>
          </button>
        </div>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 px-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Pro Mode Active: Custom Contractor Logo & Clean PDFs Unlocked</span>
          </div>
          <button
            type="button"
            onClick={onOpenProModal}
            className="text-emerald-300 hover:underline text-[11px]"
          >
            Edit Company Profile
          </button>
        </div>
      )}

      {/* Proposal Sheet Preview Paper */}
      <div className="bg-white text-slate-900 rounded-xl shadow-2xl p-6 sm:p-10 border border-slate-300 relative overflow-hidden font-sans">
        {/* Free Mode Watermark Overlay on Preview */}
        {!isPro && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
            <div className="text-slate-200 text-5xl sm:text-6xl font-black rotate-[-35deg] tracking-widest text-center opacity-60 leading-tight">
              DRYWALLPRO<br />FREE ESTIMATE
            </div>
          </div>
        )}

        {/* Paper Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-start gap-4">
            {isPro && company.logoDataUrl ? (
              <img
                src={company.logoDataUrl}
                alt="Company Logo"
                className="w-20 h-14 object-contain rounded border border-slate-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center text-amber-400 font-black text-xl">
                DP
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {isPro && company.companyName ? company.companyName : 'DRYWALL & PAINT SUBCONTRACTORS'}
              </h2>
              <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                {isPro && company.licenseNumber && (
                  <div>State Contractor License: #{company.licenseNumber}</div>
                )}
                <div>{isPro && company.phone ? `${company.phone} • ${company.email}` : 'office@drywallpro-contractors.com'}</div>
                {isPro && company.address && <div>{company.address}</div>}
              </div>
            </div>
          </div>

          <div className="sm:text-right bg-slate-50 border border-slate-200 rounded-lg p-3 min-w-[180px]">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">TRADE BID PROPOSAL</div>
            <div className="text-xs text-slate-600 mt-1">
              <div>Ref #: <strong>{client.quoteNumber || 'EST-1042'}</strong></div>
              <div>Date: {client.quoteDate || new Date().toLocaleDateString()}</div>
              <div>Valid: {client.validDays || 30} Days</div>
            </div>
          </div>
        </div>

        {/* Client & Project Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Prepared For</div>
            <div className="font-bold text-slate-900 text-sm">{client.clientName || 'General Contractor / Client'}</div>
            <div className="text-slate-600">{client.projectAddress || 'Jobsite Location'}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Takeoff Parameters</div>
            <div className="text-slate-700">
              Total Board Scope: <strong>{takeoff.totalBoardArea.toLocaleString()} {areaUnit}</strong>
            </div>
            <div className="text-slate-700">
              Net Architectural Paint: <strong>{takeoff.totalPaintArea.toLocaleString()} {areaUnit}</strong>
            </div>
          </div>
        </div>

        {/* Section 1: Scope of Work by Room Table */}
        <div className="my-6">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-600" />
            1. Scope of Work & Gypsum Specifications by Room
          </h4>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2">Room / Area</th>
                  <th className="px-3 py-2">Board Scope</th>
                  <th className="px-3 py-2">Substrate Specification</th>
                  <th className="px-3 py-2">GA-214 Finish</th>
                  <th className="px-3 py-2">Drywall Board Allocation</th>
                  <th className="px-3 py-2">Corner Bead</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {takeoff.rooms.map((r, i) => (
                  <tr key={r.roomId} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="px-3 py-2 font-medium text-slate-900">{r.roomName}</td>
                    <td className="px-3 py-2 text-slate-700">{r.totalBoardArea} {areaUnit}</td>
                    <td className="px-3 py-2 text-slate-700">{SUBSTRATE_NAMES[r.substrate].split(' ')[0]} {r.substrate === 'type_x_five_eighth' ? '5/8" Type X' : '1/2"'}</td>
                    <td className="px-3 py-2">
                      <span className="font-medium text-slate-900">Level {r.finishLevel}</span>{' '}
                      <span className="text-[10px] text-slate-500">({FINISH_LEVEL_DESCRIPTIONS[r.finishLevel].tag})</span>
                    </td>
                    <td className="px-3 py-2 text-slate-700 font-mono text-[11px]">{r.sheetsNeeded} sheets ({r.recommendedBoardLength.split(' - ')[0]})</td>
                    <td className="px-3 py-2 text-slate-700">{r.cornerBeadLinear} {unitLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Schedule of Values */}
        <div className="my-6">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            2. Schedule of Values (Divisions 09 29 00 & 09 91 00)
          </h4>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 w-12 text-center">Item</th>
                  <th className="px-3 py-2">Division Scope & Description</th>
                  <th className="px-3 py-2">Specification Summary</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="px-3 py-2.5 text-center font-bold text-slate-400">01</td>
                  <td className="px-3 py-2.5 font-medium text-slate-900">
                    Gypsum Panel Board Supply, Stocking & Hanging
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 text-[11px]">
                    {takeoff.totalBoardArea.toLocaleString()} {areaUnit} substrate hung to framing per ASTM C840
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                    {sym}{((drywallCost + (hangingTask?.burdenedLaborCost || 0)) * 1.25).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5 text-center font-bold text-slate-400">02</td>
                  <td className="px-3 py-2.5 font-medium text-slate-900">
                    Joint Treatment, Corner Bead & GA-214 Finishing
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 text-[11px]">
                    Tape, compound, corner bead, and multi-coat finishing per specified Levels 1-5
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                    {sym}{((finishingMaterialsCost + (finishingTask?.burdenedLaborCost || 0)) * 1.25).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5 text-center font-bold text-slate-400">03</td>
                  <td className="px-3 py-2.5 font-medium text-slate-900">
                    PVA Drywall Primer & Architectural Finish Coating
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 text-[11px]">
                    {takeoff.totalPaintArea.toLocaleString()} {areaUnit} unsealed sealer/primer + specified finish coats
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                    {sym}{((paintMaterialsCost + (paintingTask?.burdenedLaborCost || 0)) * 1.25).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5 text-center font-bold text-slate-400">04</td>
                  <td className="px-3 py-2.5 font-medium text-slate-900">
                    Jobsite Protection, Equipment & Daily Scrap Haul-Off
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 text-[11px]">
                    Dumpsters, floor protection, scaffold/lift safety allowances, broom-clean finish
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                    {sym}${(takeoff.dumpAndEquipmentFee * 1.25).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Grand Total Box */}
          <div className="mt-4 flex justify-end">
            <div className="bg-slate-900 text-white rounded-lg p-3.5 px-6 flex items-center gap-6">
              <span className="text-xs uppercase tracking-wider text-slate-300 font-bold">
                Total Contract Bid Sum:
              </span>
              <span className="text-xl font-black text-amber-400 tracking-tight font-mono">
                {sym}{takeoff.totalBidPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Payment Terms & Inclusions */}
        <div className="my-6 pt-4 border-t border-slate-200 text-xs text-slate-600 space-y-2">
          <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
            Terms of Payment & Warranty
          </h4>
          <p className="leading-relaxed">
            {company.paymentTerms ||
              '30% Deposit upon contract signing and mobilization; 40% upon completion of drywall hanging and first coat taping; 30% upon final sanding, painting inspection and sign-off. All work completed in strict accordance with ASTM C840 and Gypsum Association GA-214 standards.'}
          </p>
        </div>

        {/* Section 4: Signature Lines */}
        <div className="mt-10 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          <div>
            <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-900">
              {isPro && company.companyName ? company.companyName : 'Authorized Drywall Subcontractor'}
            </div>
            <div className="text-[10px] text-slate-500">Authorized Signature & Date</div>
          </div>

          <div>
            <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-900">
              {client.clientName || 'Client / General Contractor'}
            </div>
            <div className="text-[10px] text-slate-500">Approval & Notice to Proceed Signature & Date</div>
          </div>
        </div>
      </div>

      {/* Floating Download PDF Trigger Bar */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onDownloadPDF}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20 text-sm transition-all active:scale-95"
        >
          <FileDown className="w-5 h-5" />
          <span>Download PDF Bid Proposal</span>
        </button>
      </div>
    </div>
  );
};
