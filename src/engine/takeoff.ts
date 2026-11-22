import type {
  Room,
  UnitSystem,
  ProjectSettings,
  MaterialCostRates,
  LaborProductionRates,
  TakeoffResult,
  RoomTakeoff,
  BOMItem,
  LaborTaskBreakdown,
  FinishLevel,
} from './types';

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  unitSystem: 'imperial',
  currency: '$',
  wastePercent: 10,
  dumpAndEquipmentFee: 175,
  overheadPercent: 10,
  profitPercent: 15,
};

export const DEFAULT_MATERIAL_RATES_IMPERIAL: MaterialCostRates = {
  drywallSheetRegular: 16.50,    // 4x8 1/2" regular
  drywallSheetTypeX: 21.00,      // 4x8 5/8" Type X Fire-rated
  drywallSheetMoisture: 23.50,   // 4x8 1/2" Mold/Moisture Purple/Green
  jointCompoundBucket: 24.00,    // 4.5 gal all-purpose bucket
  jointTapeRoll: 9.50,           // 500 ft roll paper tape
  fastenersBox: 18.00,           // 5 lb box 1-1/4" screws
  cornerBeadStick: 4.25,         // 8ft/10ft stick vinyl/metal bead
  primerGallon: 28.00,           // PVA Drywall Sealer/Primer
  paintGallon: 48.00,            // Premium finish paint
};

export const DEFAULT_MATERIAL_RATES_METRIC: MaterialCostRates = {
  drywallSheetRegular: 15.20,    // 1.2x2.4m regular
  drywallSheetTypeX: 19.50,      // 1.2x2.4m Type X
  drywallSheetMoisture: 21.80,   // 1.2x2.4m Moisture-resistant
  jointCompoundBucket: 24.00,    // 15L bucket
  jointTapeRoll: 10.00,          // 150m roll
  fastenersBox: 18.00,           // 2.5kg box
  cornerBeadStick: 4.50,         // 2.4m/3m stick
  primerGallon: 30.00,           // per 5L can
  paintGallon: 52.00,            // per 5L can
};

export const DEFAULT_LABOR_RATES: LaborProductionRates = {
  hangingHourlyRate: 42.00,
  finishingHourlyRate: 48.00,
  paintingHourlyRate: 40.00,
  hangingHoursPer1000SqFt: 18.0, // 18 man-hours per 1000 sq ft board
  finishingHoursPer1000SqFt: {
    1: 8.0,   // Level 1: Fire-taping
    2: 12.0,  // Level 2: Garage/storage
    3: 18.0,  // Level 3: Heavy texture base
    4: 24.0,  // Level 4: Standard residential/commercial
    5: 42.0,  // Level 5: Architectural skim coat & fine sanding
  },
  paintingHoursPer1000SqFt: 14.0, // base painting per 1000 sq ft (primer + coats)
  laborBurdenPercent: 22.0,       // FICA, workers comp class 5445, GL
};

// Gypsum Association GA-214 joint compound consumption rates in 4.5-gal buckets per 1000 sq ft
export const COMPOUND_BUCKETS_PER_1000_SQFT: Record<FinishLevel, number> = {
  1: 0.8,  // Tape embed only
  2: 1.2,  // Tape embed + 1 coat fasteners
  3: 1.7,  // Tape embed + 2 coats
  4: 2.2,  // Standard USG benchmark (~138 lbs / ~2.2 buckets of 4.5 gal)
  5: 4.4,  // Level 4 + full skim coat (+10 gal/1000 sq ft)
};

/**
 * Determines optimal board dimension and area based on ceiling height and unit system.
 * Eliminates horizontal butt joints when possible (e.g. 54" board for 9ft ceilings).
 */
export function getBoardRecommendation(
  height: number,
  length: number,
  width: number,
  unitSystem: UnitSystem
): { boardName: string; sheetSqFt: number } {
  if (unitSystem === 'metric') {
    // Metric standards: 1.2m x 2.4m (2.88m²) or 1.2m x 3.0m (3.60m²)
    if (height <= 2.45) {
      return { boardName: '1.2m x 2.4m (2.88 m²)', sheetSqFt: 2.88 };
    }
    return { boardName: '1.2m x 3.0m (3.60 m²)', sheetSqFt: 3.60 };
  }

  // Imperial standards
  const maxRoomDimension = Math.max(length, width);

  if (height <= 8.2) {
    if (maxRoomDimension > 12) {
      return { boardName: '4x12 ft (48 sq ft) - Butt-Joint Reducer', sheetSqFt: 48 };
    }
    return { boardName: '4x8 ft (32 sq ft) - Standard Board', sheetSqFt: 32 };
  } else if (height > 8.2 && height <= 9.3) {
    // 54-inch (4.5 ft) stretch board eliminates horizontal seams on 9ft ceilings!
    return { boardName: '54" x 12 ft (54 sq ft) - 9ft Stretch Board (Zero Seam)', sheetSqFt: 54 };
  } else if (height > 9.3 && height <= 10.3) {
    return { boardName: '4x10 ft (40 sq ft) - 10ft Vertical/Horizontal Board', sheetSqFt: 40 };
  } else {
    return { boardName: '4x12 ft (48 sq ft) - Commercial High-Ceiling Board', sheetSqFt: 48 };
  }
}

/**
 * Core Pure Calculation Engine for Drywall & Painting Takeoff
 */
export function calculateTakeoff(
  rooms: Room[],
  settings: ProjectSettings,
  materialRates: MaterialCostRates,
  laborRates: LaborProductionRates
): TakeoffResult {
  const isMetric = settings.unitSystem === 'metric';
  const wasteMultiplier = 1 + settings.wastePercent / 100;

  let totalBoardArea = 0;
  let totalPaintArea = 0;

  // Breakdown aggregators
  let totalRegularBoardArea = 0;
  let totalTypeXBoardArea = 0;
  let totalMoistureBoardArea = 0;
  let totalCompoundGallonsRaw = 0;
  let totalOutsideCornerLinear = 0;

  // Man-hours by task
  let totalHangingManHours = 0;
  let totalFinishingManHours = 0;
  let totalPaintingManHours = 0;

  const roomTakeoffs: RoomTakeoff[] = rooms.map((room) => {
    // 1. Room Surface Dimensions
    const perimeter = 2 * (room.length + room.width);
    const grossWallArea = perimeter * room.height;
    const ceilingArea = room.includeCeiling ? room.length * room.width : 0;
    const totalRoomBoardArea = grossWallArea + ceilingArea;

    // 2. Trade Opening Rules:
    // Openings < 36 sq ft are NOT deducted from drywall (hung solid & routed on-site)
    // Standard door: 21 sq ft (1.89 m²), standard window: 15 sq ft (1.40 m²)
    const doorArea = isMetric ? 1.89 : 21.0;
    const windowArea = isMetric ? 1.40 : 15.0;
    const totalOpeningArea = room.doors * doorArea + room.windows * windowArea;

    // Paint deducts openings (painters do not paint glass or doors)
    const netPaintWallArea = Math.max(0, grossWallArea - totalOpeningArea);
    const roomNetPaintArea = netPaintWallArea + ceilingArea;

    totalBoardArea += totalRoomBoardArea;
    totalPaintArea += roomNetPaintArea;

    // Track substrate areas
    if (room.substrate === 'regular_half') {
      totalRegularBoardArea += totalRoomBoardArea;
    } else if (room.substrate === 'type_x_five_eighth') {
      totalTypeXBoardArea += totalRoomBoardArea;
    } else {
      totalMoistureBoardArea += totalRoomBoardArea;
    }

    // Outside corner bead
    const roomCornerBead = room.outsideCorners * room.height;
    totalOutsideCornerLinear += roomCornerBead;

    // Sheet calculation with factory bundle packaging (always even number of sheets)
    const boardRec = getBoardRecommendation(room.height, room.length, room.width, settings.unitSystem);
    const roomAreaWithWaste = totalRoomBoardArea * wasteMultiplier;
    const rawSheets = roomAreaWithWaste / boardRec.sheetSqFt;
    const sheetsNeeded = Math.max(2, Math.ceil(rawSheets / 2) * 2);

    // Compound by finish level
    const finishCompoundFactor = COMPOUND_BUCKETS_PER_1000_SQFT[room.finishLevel];
    // In Imperial: factor is in 4.5-gal buckets per 1000 sq ft. In Metric, scale accordingly.
    const areaInThousands = isMetric ? (totalRoomBoardArea * 10.7639) / 1000 : totalRoomBoardArea / 1000;
    const roomCompoundBuckets = areaInThousands * finishCompoundFactor * wasteMultiplier;
    totalCompoundGallonsRaw += roomCompoundBuckets * 4.5;

    // Labor calculation
    const roomHangingMh = (areaInThousands * laborRates.hangingHoursPer1000SqFt);
    const roomFinishingMh = (areaInThousands * laborRates.finishingHoursPer1000SqFt[room.finishLevel]);
    const paintAreaThousands = isMetric ? (roomNetPaintArea * 10.7639) / 1000 : roomNetPaintArea / 1000;
    const coatMultiplier = 1 + (room.paintCoats - 1) * 0.65; // primer base + discounted finish coats
    const roomPaintingMh = paintAreaThousands * (laborRates.paintingHoursPer1000SqFt * 0.5 * coatMultiplier);

    totalHangingManHours += roomHangingMh;
    totalFinishingManHours += roomFinishingMh;
    totalPaintingManHours += roomPaintingMh;

    return {
      roomId: room.id,
      roomName: room.name,
      grossWallArea: Math.round(grossWallArea * 10) / 10,
      ceilingArea: Math.round(ceilingArea * 10) / 10,
      totalBoardArea: Math.round(totalRoomBoardArea * 10) / 10,
      netPaintArea: Math.round(roomNetPaintArea * 10) / 10,
      recommendedBoardLength: boardRec.boardName,
      sheetsNeeded,
      cornerBeadLinear: Math.round(roomCornerBead * 10) / 10,
      finishLevel: room.finishLevel,
      substrate: room.substrate,
    };
  });

  const totalWasteArea = totalBoardArea * (settings.wastePercent / 100);
  const totalBoardAreaWithWaste = totalBoardArea * wasteMultiplier;
  const boardAreaSqFt = isMetric ? totalBoardAreaWithWaste * 10.7639 : totalBoardAreaWithWaste;
  const netPaintAreaSqFt = isMetric ? totalPaintArea * 10.7639 : totalPaintArea;

  // 3. Bill of Materials (BOM) Generation with Strict Pack Rounding
  const bom: BOMItem[] = [];

  // Drywall Boards by Substrate
  if (totalRegularBoardArea > 0) {
    const regArea = isMetric ? totalRegularBoardArea * 10.7639 : totalRegularBoardArea;
    const rawSheets = (regArea * wasteMultiplier) / (isMetric ? 31.0 : 32.0);
    const sheets = Math.max(2, Math.ceil(rawSheets / 2) * 2);
    bom.push({
      id: 'drywall-regular',
      name: 'Drywall Sheets - 1/2" Standard (ASTM C1396)',
      category: 'drywall',
      specification: isMetric ? '1.2m x 2.4m sheets (2-sheet factory bundle)' : '4x8 ft sheets (2-sheet factory bundle)',
      netQuantity: rawSheets,
      roundedPackageQuantity: sheets,
      packageUnit: 'sheets (paired bundles)',
      unitCost: materialRates.drywallSheetRegular,
      totalCost: sheets * materialRates.drywallSheetRegular,
    });
  }

  if (totalTypeXBoardArea > 0) {
    const typeXArea = isMetric ? totalTypeXBoardArea * 10.7639 : totalTypeXBoardArea;
    const rawSheets = (typeXArea * wasteMultiplier) / (isMetric ? 31.0 : 32.0);
    const sheets = Math.max(2, Math.ceil(rawSheets / 2) * 2);
    bom.push({
      id: 'drywall-type-x',
      name: 'Drywall Sheets - 5/8" Type X Fire-Code',
      category: 'drywall',
      specification: isMetric ? '1.2m x 2.4m Type X (UL Listed Fire-Rated)' : '4x8 ft 5/8" Type X Fire-Rated',
      netQuantity: rawSheets,
      roundedPackageQuantity: sheets,
      packageUnit: 'sheets (paired bundles)',
      unitCost: materialRates.drywallSheetTypeX,
      totalCost: sheets * materialRates.drywallSheetTypeX,
    });
  }

  if (totalMoistureBoardArea > 0) {
    const moistureArea = isMetric ? totalMoistureBoardArea * 10.7639 : totalMoistureBoardArea;
    const rawSheets = (moistureArea * wasteMultiplier) / (isMetric ? 31.0 : 32.0);
    const sheets = Math.max(2, Math.ceil(rawSheets / 2) * 2);
    bom.push({
      id: 'drywall-moisture',
      name: 'Drywall Sheets - 1/2" Mold/Moisture Resistant',
      category: 'drywall',
      specification: isMetric ? '1.2m x 2.4m Purple/Green Board' : '4x8 ft Moisture-Resistant Board',
      netQuantity: rawSheets,
      roundedPackageQuantity: sheets,
      packageUnit: 'sheets (paired bundles)',
      unitCost: materialRates.drywallSheetMoisture,
      totalCost: sheets * materialRates.drywallSheetMoisture,
    });
  }

  // Joint Compound (4.5 gal / ~61 lb buckets)
  const compoundBucketsNeeded = Math.max(1, Math.ceil(totalCompoundGallonsRaw / 4.5));
  bom.push({
    id: 'joint-compound',
    name: 'All-Purpose Ready-Mix Joint Compound',
    category: 'finishing',
    specification: '4.5-gallon (approx 61 lb / 28 kg) bucket',
    netQuantity: totalCompoundGallonsRaw / 4.5,
    roundedPackageQuantity: compoundBucketsNeeded,
    packageUnit: '4.5-gal buckets',
    unitCost: materialRates.jointCompoundBucket,
    totalCost: compoundBucketsNeeded * materialRates.jointCompoundBucket,
  });

  // Joint Tape (375 linear ft per 1000 sq ft board, sold in 500 ft rolls)
  const tapeLinearFt = (boardAreaSqFt / 1000) * 375;
  const tapeRollsNeeded = Math.max(1, Math.ceil(tapeLinearFt / 500));
  bom.push({
    id: 'joint-tape',
    name: 'Drywall Joint Tape (High-Tensile Paper)',
    category: 'finishing',
    specification: isMetric ? '150-meter rolls' : '500-foot commercial rolls',
    netQuantity: tapeLinearFt / 500,
    roundedPackageQuantity: tapeRollsNeeded,
    packageUnit: isMetric ? '150m rolls' : '500-ft rolls',
    unitCost: materialRates.jointTapeRoll,
    totalCost: tapeRollsNeeded * materialRates.jointTapeRoll,
  });

  // Fasteners: 1,000 screws per 1,000 sq ft board (approx 5 lbs per 1,000 screws, sold in 5-lb boxes)
  const rawScrewBoxes = (boardAreaSqFt / 1000);
  const screwBoxesNeeded = Math.max(1, Math.ceil(rawScrewBoxes));
  bom.push({
    id: 'drywall-fasteners',
    name: '1-1/4" Bugle Head Drywall Screws',
    category: 'fasteners',
    specification: isMetric ? '2.5kg box (approx 1,000 screws)' : '5-lb box (approx 1,000 screws)',
    netQuantity: rawScrewBoxes,
    roundedPackageQuantity: screwBoxesNeeded,
    packageUnit: '5-lb boxes',
    unitCost: materialRates.fastenersBox,
    totalCost: screwBoxesNeeded * materialRates.fastenersBox,
  });

  // Corner Bead (outside corners, 8ft/10ft sticks)
  if (totalOutsideCornerLinear > 0) {
    const stickLength = isMetric ? 2.5 : 8.0;
    const sticksNeeded = Math.max(1, Math.ceil(totalOutsideCornerLinear / stickLength));
    bom.push({
      id: 'corner-bead',
      name: 'Outside Corner Bead (Vinyl/Galvanized)',
      category: 'finishing',
      specification: isMetric ? `${stickLength}m sticks` : `${stickLength}ft sticks`,
      netQuantity: totalOutsideCornerLinear / stickLength,
      roundedPackageQuantity: sticksNeeded,
      packageUnit: 'sticks',
      unitCost: materialRates.cornerBeadStick,
      totalCost: sticksNeeded * materialRates.cornerBeadStick,
    });
  }

  // PVA Drywall Sealer/Primer: 275 sq ft / gal on fresh porous unsealed gypsum
  const rawPrimerGallons = netPaintAreaSqFt / 275;
  const primerGallonsNeeded = Math.max(1, Math.ceil(rawPrimerGallons));
  bom.push({
    id: 'pva-primer',
    name: 'PVA Drywall Sealer & Primer',
    category: 'paint',
    specification: 'High-solids unsealed drywall sealer (275 sq ft/gal coverage)',
    netQuantity: rawPrimerGallons,
    roundedPackageQuantity: primerGallonsNeeded,
    packageUnit: 'gallons',
    unitCost: materialRates.primerGallon,
    totalCost: primerGallonsNeeded * materialRates.primerGallon,
  });

  // Finish Paint: 350 sq ft / gal per coat
  const avgPaintCoats = rooms.reduce((acc, r) => acc + r.paintCoats, 0) / Math.max(1, rooms.length);
  const rawPaintGallons = (netPaintAreaSqFt * avgPaintCoats) / 350;
  const paintGallonsNeeded = Math.max(1, Math.ceil(rawPaintGallons));
  bom.push({
    id: 'finish-paint',
    name: 'Premium Interior Architectural Finish Paint',
    category: 'paint',
    specification: `Eggshell/Satin enamel (${avgPaintCoats.toFixed(1)} avg coats, 350 sq ft/gal)`,
    netQuantity: rawPaintGallons,
    roundedPackageQuantity: paintGallonsNeeded,
    packageUnit: 'gallons',
    unitCost: materialRates.paintGallon,
    totalCost: paintGallonsNeeded * materialRates.paintGallon,
  });

  const materialsCost = bom.reduce((acc, item) => acc + item.totalCost, 0);

  // 4. Labor Tasks & Burden Calculation
  const laborBurdenMultiplier = 1 + laborRates.laborBurdenPercent / 100;

  const baseHangingCost = totalHangingManHours * laborRates.hangingHourlyRate;
  const baseFinishingCost = totalFinishingManHours * laborRates.finishingHourlyRate;
  const basePaintingCost = totalPaintingManHours * laborRates.paintingHourlyRate;

  const laborTasks: LaborTaskBreakdown[] = [
    {
      task: 'Drywall Stocking & Board Hanging',
      manHours: Math.round(totalHangingManHours * 10) / 10,
      baseLaborCost: Math.round(baseHangingCost * 100) / 100,
      burdenedLaborCost: Math.round(baseHangingCost * laborBurdenMultiplier * 100) / 100,
    },
    {
      task: 'GA-214 Taping & Joint Treatment',
      manHours: Math.round(totalFinishingManHours * 10) / 10,
      baseLaborCost: Math.round(baseFinishingCost * 100) / 100,
      burdenedLaborCost: Math.round(baseFinishingCost * laborBurdenMultiplier * 100) / 100,
    },
    {
      task: 'PVA Primer & Architectural Finish Painting',
      manHours: Math.round(totalPaintingManHours * 10) / 10,
      baseLaborCost: Math.round(basePaintingCost * 100) / 100,
      burdenedLaborCost: Math.round(basePaintingCost * laborBurdenMultiplier * 100) / 100,
    },
  ];

  const totalBaseLaborCost = laborTasks.reduce((acc, t) => acc + t.baseLaborCost, 0);
  const totalLaborCost = laborTasks.reduce((acc, t) => acc + t.burdenedLaborCost, 0);
  const totalLaborBurdenCost = totalLaborCost - totalBaseLaborCost;

  // 5. Total Job Costing & Subcontractor Bid Price
  const directCost = materialsCost + totalLaborCost + settings.dumpAndEquipmentFee;
  const overheadCost = directCost * (settings.overheadPercent / 100);
  const subtotalWithOverhead = directCost + overheadCost;
  const profitCost = subtotalWithOverhead * (settings.profitPercent / 100);
  const totalBidPrice = subtotalWithOverhead + profitCost;

  return {
    rooms: roomTakeoffs,
    totalBoardArea: Math.round(totalBoardArea * 10) / 10,
    totalPaintArea: Math.round(totalPaintArea * 10) / 10,
    totalWasteArea: Math.round(totalWasteArea * 10) / 10,
    bom,
    materialsCost: Math.round(materialsCost * 100) / 100,
    laborTasks,
    totalBaseLaborCost: Math.round(totalBaseLaborCost * 100) / 100,
    totalLaborBurdenCost: Math.round(totalLaborBurdenCost * 100) / 100,
    totalLaborCost: Math.round(totalLaborCost * 100) / 100,
    subcontractorDirectCost: Math.round(directCost * 100) / 100,
    dumpAndEquipmentFee: settings.dumpAndEquipmentFee,
    overheadCost: Math.round(overheadCost * 100) / 100,
    profitCost: Math.round(profitCost * 100) / 100,
    totalBidPrice: Math.round(totalBidPrice * 100) / 100,
  };
}
