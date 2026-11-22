export type UnitSystem = 'imperial' | 'metric';

export type SubstrateType = 'regular_half' | 'type_x_five_eighth' | 'moisture_resistant';

export type FinishLevel = 1 | 2 | 3 | 4 | 5;

export interface Room {
  id: string;
  name: string;
  length: number; // ft or m
  width: number;  // ft or m
  height: number; // ft or m
  includeCeiling: boolean;
  outsideCorners: number; // count of 90 deg corners
  doors: number;          // count
  windows: number;        // count
  finishLevel: FinishLevel;
  substrate: SubstrateType;
  paintCoats: number;     // 1, 2, or 3
}

export interface MaterialCostRates {
  drywallSheetRegular: number;      // per sheet
  drywallSheetTypeX: number;        // per sheet
  drywallSheetMoisture: number;     // per sheet
  jointCompoundBucket: number;      // per 4.5 gal bucket
  jointTapeRoll: number;            // per 500 ft roll
  fastenersBox: number;             // per 5 lb box
  cornerBeadStick: number;          // per 8ft/10ft stick
  primerGallon: number;             // per gallon
  paintGallon: number;              // per gallon
}

export interface LaborProductionRates {
  hangingHourlyRate: number;        // $ / hour
  finishingHourlyRate: number;      // $ / hour
  paintingHourlyRate: number;       // $ / hour
  hangingHoursPer1000SqFt: number;  // man-hours per 1000 sq ft board
  finishingHoursPer1000SqFt: Record<FinishLevel, number>; // by finish level
  paintingHoursPer1000SqFt: number; // man-hours per 1000 sq ft net painted
  laborBurdenPercent: number;       // e.g. 22% for FICA, WC code 5445, GL
}

export interface ProjectSettings {
  unitSystem: UnitSystem;
  currency: string;
  wastePercent: number;             // default 10%
  dumpAndEquipmentFee: number;      // flat allowance
  overheadPercent: number;          // default 10%
  profitPercent: number;            // default 15%
}

export interface BOMItem {
  id: string;
  name: string;
  category: 'drywall' | 'finishing' | 'fasteners' | 'paint';
  specification: string;
  netQuantity: number;
  roundedPackageQuantity: number;
  packageUnit: string;
  unitCost: number;
  totalCost: number;
}

export interface RoomTakeoff {
  roomId: string;
  roomName: string;
  grossWallArea: number;   // sq ft or m²
  ceilingArea: number;     // sq ft or m²
  totalBoardArea: number;  // gross wall + ceiling (doors not deducted for board)
  netPaintArea: number;    // openings deducted
  recommendedBoardLength: string;
  sheetsNeeded: number;    // rounded to 2-sheet bundles
  cornerBeadLinear: number;// ft or m
  finishLevel: FinishLevel;
  substrate: SubstrateType;
}

export interface LaborTaskBreakdown {
  task: string;
  manHours: number;
  baseLaborCost: number;
  burdenedLaborCost: number;
}

export interface TakeoffResult {
  rooms: RoomTakeoff[];
  totalBoardArea: number;   // sq ft or m²
  totalPaintArea: number;   // sq ft or m²
  totalWasteArea: number;   // board area * waste %
  bom: BOMItem[];
  materialsCost: number;
  laborTasks: LaborTaskBreakdown[];
  totalBaseLaborCost: number;
  totalLaborBurdenCost: number;
  totalLaborCost: number;
  subcontractorDirectCost: number; // materials + burdened labor + equipment
  dumpAndEquipmentFee: number;
  overheadCost: number;
  profitCost: number;
  totalBidPrice: number;
}

export interface CompanyProfile {
  companyName: string;
  licenseNumber: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  logoDataUrl?: string;
  paymentTerms: string;
}

export interface ClientInfo {
  clientName: string;
  projectAddress: string;
  quoteNumber: string;
  quoteDate: string;
  validDays: number;
}

export const FINISH_LEVEL_DESCRIPTIONS: Record<
  FinishLevel,
  { name: string; tag: string; description: string; bestFor: string }
> = {
  1: {
    name: 'Level 1: Fire-Taping / Concealed',
    tag: 'Fire-Tape Only',
    description: 'Tape embedded in joint compound. Ridges and tool marks acceptable. Zero fasteners coated.',
    bestFor: 'Plenums, attics, mechanical chases, fire barriers above ceiling line.',
  },
  2: {
    name: 'Level 2: Utility / Tile Substrate',
    tag: 'Garages & Tile Backer',
    description: 'Tape embedded with thin wipe coat. Fastener heads and corner beads covered with one coat.',
    bestFor: 'Garages, warehouses, storage rooms, or substrate under tile.',
  },
  3: {
    name: 'Level 3: Heavy Texture Base',
    tag: 'Medium/Heavy Texture',
    description: 'Tape embedded plus two separate coats over joints and fastener heads. Smooth, free of tool marks.',
    bestFor: 'Walls to receive heavy knockdown, orange peel texture, or heavy commercial vinyl wallcoverings.',
  },
  4: {
    name: 'Level 4: Standard Architectural',
    tag: 'Standard Paint (Flat/Eggshell)',
    description: 'Industry standard: 3 separate coats over flat joints, 2 over angles, 3 over fasteners. Sanded smooth.',
    bestFor: 'Standard residential and commercial interiors receiving flat, eggshell, or satin paint.',
  },
  5: {
    name: 'Level 5: Premium Skim Coat',
    tag: 'Critical Light & Enamels',
    description: 'Level 4 plus a continuous thin skim coat of compound over all surfaces to equalize suction and texture.',
    bestFor: 'Critical side-lighting conditions, gloss/semi-gloss paints, dark vibrant colors, high-end residences.',
  },
};

export const SUBSTRATE_NAMES: Record<SubstrateType, string> = {
  regular_half: '1/2" Standard Drywall (ASTM C1396)',
  type_x_five_eighth: '5/8" Type X Fire-Code (UL Listed / Fire-Rated)',
  moisture_resistant: '1/2" Mold & Moisture Resistant (Purple/Green Board)',
};
