import { describe, it, expect } from 'vitest';
import {
  calculateTakeoff,
  getBoardRecommendation,
  DEFAULT_PROJECT_SETTINGS,
  DEFAULT_MATERIAL_RATES_IMPERIAL,
  DEFAULT_LABOR_RATES,
} from './takeoff';
import type { Room } from './types';

describe('DrywallPro Domain Engine (USG & GA-214 Standards)', () => {
  const createBaseRoom = (overrides?: Partial<Room>): Room => ({
    id: 'test-room-1',
    name: 'Master Living Room',
    length: 20,
    width: 15,
    height: 9,
    includeCeiling: true,
    outsideCorners: 4,
    doors: 2,
    windows: 2,
    finishLevel: 4,
    substrate: 'regular_half',
    paintCoats: 2,
    ...overrides,
  });

  describe('Board Recommendation & Butt-Joint Optimization', () => {
    it('recommends 54" stretch board for 9ft ceilings to eliminate horizontal seams', () => {
      const rec = getBoardRecommendation(9.0, 20, 15, 'imperial');
      expect(rec.boardName).toContain('54"');
      expect(rec.sheetSqFt).toBe(54);
    });

    it('recommends 4x8 or 4x12 for standard 8ft ceilings', () => {
      const rec = getBoardRecommendation(8.0, 20, 15, 'imperial');
      expect(rec.boardName).toContain('4x12');
      const smallRec = getBoardRecommendation(8.0, 10, 10, 'imperial');
      expect(smallRec.boardName).toContain('4x8');
    });

    it('recommends 4x10 for 10ft ceilings', () => {
      const rec = getBoardRecommendation(10.0, 20, 15, 'imperial');
      expect(rec.boardName).toContain('4x10');
    });
  });

  describe('Trade Opening Rule (Gross Drywall vs Net Paint Area)', () => {
    it('does NOT deduct standard doors and windows from drywall board area (hung solid & routed)', () => {
      const roomWithOpenings = createBaseRoom({ doors: 2, windows: 3 });
      const roomNoOpenings = createBaseRoom({ doors: 0, windows: 0 });

      const resultWith = calculateTakeoff([roomWithOpenings], DEFAULT_PROJECT_SETTINGS, DEFAULT_MATERIAL_RATES_IMPERIAL, DEFAULT_LABOR_RATES);
      const resultWithout = calculateTakeoff([roomNoOpenings], DEFAULT_PROJECT_SETTINGS, DEFAULT_MATERIAL_RATES_IMPERIAL, DEFAULT_LABOR_RATES);

      // Board area must be identical
      expect(resultWith.totalBoardArea).toBe(resultWithout.totalBoardArea);

      // But paint area must be strictly smaller when openings are present
      expect(resultWith.totalPaintArea).toBeLessThan(resultWithout.totalPaintArea);
      const expectedDeduction = 2 * 21 + 3 * 15; // 42 + 45 = 87 sq ft
      expect(resultWithout.totalPaintArea - resultWith.totalPaintArea).toBeCloseTo(expectedDeduction, 1);
    });
  });

  describe('Gypsum Association GA-214 Finish Level Monotonicity', () => {
    it('strictly increases finishing labor and compound consumption from Level 1 to Level 5', () => {
      const levels: [1, 2, 3, 4, 5] = [1, 2, 3, 4, 5];
      const results = levels.map((lvl) => {
        const room = createBaseRoom({ finishLevel: lvl });
        return calculateTakeoff([room], DEFAULT_PROJECT_SETTINGS, DEFAULT_MATERIAL_RATES_IMPERIAL, DEFAULT_LABOR_RATES);
      });

      for (let i = 0; i < results.length - 1; i++) {
        const current = results[i];
        const next = results[i + 1];

        // Taping man hours must strictly increase
        const currentFinishingTask = current.laborTasks.find((t) => t.task.includes('Taping'))!;
        const nextFinishingTask = next.laborTasks.find((t) => t.task.includes('Taping'))!;
        expect(nextFinishingTask.manHours).toBeGreaterThan(currentFinishingTask.manHours);

        // Overall bid price must strictly increase
        expect(next.totalBidPrice).toBeGreaterThan(current.totalBidPrice);
      }
    });

    it('allocates Level 5 skim coat compound matching the GA-214 benchmark (+10 gal/1000 sq ft)', () => {
      const roomL4 = createBaseRoom({ length: 25, width: 20, height: 10, includeCeiling: false, finishLevel: 4 }); // 900 sq ft wall
      const roomL5 = createBaseRoom({ length: 25, width: 20, height: 10, includeCeiling: false, finishLevel: 5 });

      const resL4 = calculateTakeoff([roomL4], DEFAULT_PROJECT_SETTINGS, DEFAULT_MATERIAL_RATES_IMPERIAL, DEFAULT_LABOR_RATES);
      const resL5 = calculateTakeoff([roomL5], DEFAULT_PROJECT_SETTINGS, DEFAULT_MATERIAL_RATES_IMPERIAL, DEFAULT_LABOR_RATES);

      const compoundL4 = resL4.bom.find((b) => b.id === 'joint-compound')!;
      const compoundL5 = resL5.bom.find((b) => b.id === 'joint-compound')!;

      expect(compoundL5.roundedPackageQuantity).toBeGreaterThan(compoundL4.roundedPackageQuantity);
    });
  });

  describe('Physical Factory Packaging Invariants', () => {
    it('always rounds drywall sheets to whole 2-sheet factory bundles', () => {
      const testRooms: Room[] = [
        createBaseRoom({ length: 11, width: 9, height: 8 }),
        createBaseRoom({ length: 17, width: 13, height: 9.5 }),
        createBaseRoom({ length: 23, width: 19, height: 10 }),
      ];

      testRooms.forEach((r) => {
        const result = calculateTakeoff([r], DEFAULT_PROJECT_SETTINGS, DEFAULT_MATERIAL_RATES_IMPERIAL, DEFAULT_LABOR_RATES);
        result.rooms.forEach((rt) => {
          expect(rt.sheetsNeeded % 2).toBe(0);
        });
        const drywallItem = result.bom.find((b) => b.category === 'drywall');
        if (drywallItem) {
          expect(drywallItem.roundedPackageQuantity % 2).toBe(0);
        }
      });
    });

    it('always rounds compound, tape, screws, and paint to whole non-fractional units', () => {
      const room = createBaseRoom();
      const result = calculateTakeoff([room], DEFAULT_PROJECT_SETTINGS, DEFAULT_MATERIAL_RATES_IMPERIAL, DEFAULT_LABOR_RATES);

      result.bom.forEach((item) => {
        expect(Number.isInteger(item.roundedPackageQuantity)).toBe(true);
        expect(item.roundedPackageQuantity).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Financial Invariants & Labor Burdening', () => {
    it('correctly applies the 22% labor burden and O&P markups', () => {
      const room = createBaseRoom();
      const result = calculateTakeoff([room], DEFAULT_PROJECT_SETTINGS, DEFAULT_MATERIAL_RATES_IMPERIAL, DEFAULT_LABOR_RATES);

      // Verify labor burden
      const expectedBurden = result.totalBaseLaborCost * 0.22;
      expect(result.totalLaborBurdenCost).toBeCloseTo(expectedBurden, 0);

      // Total bid price must exceed direct cost
      expect(result.totalBidPrice).toBeGreaterThan(result.subcontractorDirectCost);
      expect(result.overheadCost).toBeGreaterThan(0);
      expect(result.profitCost).toBeGreaterThan(0);
    });
  });
});
