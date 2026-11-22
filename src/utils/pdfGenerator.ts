import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

export interface PDFExportOptions {
  takeoff: TakeoffResult;
  company: CompanyProfile;
  client: ClientInfo;
  settings: ProjectSettings;
  isPro: boolean;
}

export function generateQuotePDF({
  takeoff,
  company,
  client,
  settings,
  isPro,
}: PDFExportOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const sym = settings.currency;

  let currentY = margin;

  // 1. Watermark for Free Mode
  if (!isPro) {
    doc.saveGraphicsState();
    doc.setTextColor(210, 215, 225);
    doc.setFontSize(38);
    doc.setFont('helvetica', 'bold');
    
    // Rotate and print watermark across the page
    doc.text('FREE ESTIMATE - DRYWALLPRO', pageWidth / 2, pageHeight / 2 - 40, {
      align: 'center',
      angle: 45,
    });
    doc.text('UPGRADE TO PRO FOR BRANDED QUOTES', pageWidth / 2, pageHeight / 2 + 30, {
      align: 'center',
      angle: 45,
    });
    doc.restoreGraphicsState();
  }

  // 2. Header: Logo & Company Information
  let headerHeight = 70;
  if (isPro && company.logoDataUrl) {
    try {
      doc.addImage(company.logoDataUrl, 'PNG', margin, currentY, 80, 50);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(24, 30, 42);
      doc.text(company.companyName || 'Trade Drywall & Paint Contractors', margin + 95, currentY + 16);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(90, 100, 115);
      const licText = company.licenseNumber ? `Lic #${company.licenseNumber} • ` : '';
      doc.text(`${licText}${company.phone} • ${company.email}`, margin + 95, currentY + 30);
      if (company.address) {
        doc.text(company.address, margin + 95, currentY + 42);
      }
    } catch {
      // Fallback if image failed to load
      renderStandardCompanyHeader();
    }
  } else {
    renderStandardCompanyHeader();
  }

  function renderStandardCompanyHeader() {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text(
      isPro && company.companyName ? company.companyName : 'DRYWALLPRO ESTIMATOR',
      margin,
      currentY + 18
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    if (isPro && (company.licenseNumber || company.phone)) {
      const licText = company.licenseNumber ? `State Lic #${company.licenseNumber} | ` : '';
      doc.text(`${licText}${company.phone} | ${company.email}`, margin, currentY + 32);
      if (company.address) {
        doc.text(company.address, margin, currentY + 44);
      }
    } else {
      doc.text('Commercial & Residential Gypsum Board & Finishing Subcontractors', margin, currentY + 32);
      doc.text('Generated via DrywallPro Estimator (Client-Side Trade Engine)', margin, currentY + 44);
    }
  }

  // Quote Metadata Box (Right-aligned)
  const metaBoxX = pageWidth - margin - 180;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(metaBoxX, currentY, 180, 60, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('TRADE BID PROPOSAL', metaBoxX + 10, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Proposal #: ${client.quoteNumber || 'EST-1042'}`, metaBoxX + 10, currentY + 29);
  doc.text(`Date: ${client.quoteDate || new Date().toLocaleDateString()}`, metaBoxX + 10, currentY + 41);
  doc.text(`Valid For: ${client.validDays || 30} Days`, metaBoxX + 10, currentY + 53);

  currentY += headerHeight + 10;

  // Divider line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(1);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 16;

  // 3. Client & Project Details
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentWidth, 48, 4, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text('CLIENT & PROJECT INFORMATION', margin + 12, currentY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Client / Owner: ${client.clientName || 'Valued Client'}`, margin + 12, currentY + 28);
  doc.text(`Project Site: ${client.projectAddress || 'On-Site Location'}`, margin + 12, currentY + 40);

  const unitLabel = settings.unitSystem === 'imperial' ? 'Imperial (sq ft / 4x8-4x12)' : 'Metric (m² / 1.2x2.4m)';
  doc.text(`Takeoff Unit Standard: ${unitLabel}`, margin + contentWidth / 2, currentY + 28);
  doc.text(`Total Board Scope: ${takeoff.totalBoardArea.toLocaleString()} ${settings.unitSystem === 'imperial' ? 'sq ft' : 'm²'} (Net Paint: ${takeoff.totalPaintArea.toLocaleString()} ${settings.unitSystem === 'imperial' ? 'sq ft' : 'm²'})`, margin + contentWidth / 2, currentY + 40);

  currentY += 60;

  // 4. Room Scope of Work Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. SCOPE OF WORK & GYPSUM SPECIFICATIONS BY ROOM', margin, currentY);
  currentY += 8;

  const roomRows = takeoff.rooms.map((r, idx) => [
    `${idx + 1}. ${r.roomName}`,
    `${r.totalBoardArea} ${settings.unitSystem === 'imperial' ? 'sq ft' : 'm²'}`,
    SUBSTRATE_NAMES[r.substrate].split(' ')[0] + ' ' + (r.substrate === 'type_x_five_eighth' ? '5/8" Type X' : '1/2"'),
    `Level ${r.finishLevel} (${FINISH_LEVEL_DESCRIPTIONS[r.finishLevel].tag})`,
    `${r.sheetsNeeded} sheets (${r.recommendedBoardLength.split(' - ')[0]})`,
    `${r.cornerBeadLinear} ${settings.unitSystem === 'imperial' ? 'ft' : 'm'} bead`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Room / Area', 'Board Area', 'Substrate', 'GA-214 Finish', 'Drywall Specs', 'Corner Bead']],
    body: roomRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentY = (doc as any).lastAutoTable.finalY + 16;

  // 5. Schedule of Values (Cost Breakdown / Proposal Pricing)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. SCHEDULE OF VALUES & CONTRACT SUM', margin, currentY);
  currentY += 8;

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

  const scheduleRows = [
    [
      '01',
      'Gypsum Panel Board Supply, Stocking & Hanging',
      `${takeoff.totalBoardArea.toLocaleString()} ${settings.unitSystem === 'imperial' ? 'sq ft' : 'm²'} substrate hung to framing per ASTM C840`,
      `${sym}${((drywallCost + (hangingTask?.burdenedLaborCost || 0)) * 1.25).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ],
    [
      '02',
      'Joint Treatment, Corner Bead & GA-214 Finishing',
      `Tape, compound, corner bead, and multi-coat finishing per specified Levels 1-5`,
      `${sym}${((finishingMaterialsCost + (finishingTask?.burdenedLaborCost || 0)) * 1.25).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ],
    [
      '03',
      'PVA Drywall Primer & Architectural Finish Coating',
      `${takeoff.totalPaintArea.toLocaleString()} ${settings.unitSystem === 'imperial' ? 'sq ft' : 'm²'} unsealed sealer/primer + specified finish coats`,
      `${sym}${((paintMaterialsCost + (paintingTask?.burdenedLaborCost || 0)) * 1.25).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ],
    [
      '04',
      'Jobsite Protection, Equipment & Daily Scrap Haul-Off',
      'Dumpsters, floor protection, scaffold/lift safety allowances, broom-clean finish',
      `${sym}${(takeoff.dumpAndEquipmentFee * 1.25).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Item', 'Division Scope & Description', 'Specification Details', 'Amount']],
    body: scheduleRows,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 26, halign: 'center' },
      1: { cellWidth: 170 },
      2: { cellWidth: 240 },
      3: { halign: 'right', fontStyle: 'bold' },
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Total Bid Price Box
  const totalBoxWidth = 220;
  const totalBoxX = pageWidth - margin - totalBoxWidth;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(totalBoxX, currentY, totalBoxWidth, 34, 4, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(241, 245, 249);
  doc.text('TOTAL CONTRACT BID:', totalBoxX + 12, currentY + 21);

  doc.setFontSize(13);
  doc.setTextColor(56, 189, 248);
  doc.text(
    `${sym}${takeoff.totalBidPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    totalBoxX + totalBoxWidth - 12,
    currentY + 21,
    { align: 'right' }
  );

  currentY += 46;

  // 6. Terms, Inclusions & Payment Milestones
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('TERMS OF PAYMENT & TRADE INCLUSIONS', margin, currentY);
  currentY += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  const defaultTerms =
    company.paymentTerms ||
    '30% Deposit upon contract signing and material mobilization; 40% upon completion of drywall hanging and first coat taping; 30% upon final sanding, painting inspection and sign-off. All work guaranteed per ASTM C840 and Gypsum Association standards. Quote valid for 30 days.';
  
  const splitTerms = doc.splitTextToSize(defaultTerms, contentWidth);
  doc.text(splitTerms, margin, currentY);
  currentY += splitTerms.length * 9 + 12;

  // 7. Formal Acceptance Signature Block
  if (currentY > pageHeight - 90) {
    doc.addPage();
    currentY = margin + 20;
  }

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.75);
  
  // Client signature line
  const colW = (contentWidth - 20) / 2;
  doc.line(margin, currentY + 28, margin + colW, currentY + 28);
  doc.line(margin + colW + 20, currentY + 28, margin + contentWidth, currentY + 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('AUTHORIZED CONTRACTOR ACCEPTANCE', margin, currentY + 38);
  doc.text('CLIENT APPROVAL & NOTICE TO PROCEED', margin + colW + 20, currentY + 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Signature / Date', margin, currentY + 48);
  doc.text('Signature / Date', margin + colW + 20, currentY + 48);

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  const footerText = isPro
    ? `${company.companyName || 'Drywall & Paint Subcontractor'} • Professional Bid Proposal`
    : 'Generated by DrywallPro Estimator (Free Edition - Watermarked) • Upgrade to Pro for Clean Branded Proposals';
  doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: 'center' });

  // Save / Trigger Download
  const filename = `${(client.quoteNumber || 'Estimate').replace(/[^a-zA-Z0-9_-]/g, '')}_DrywallQuote.pdf`;
  doc.save(filename);
}
