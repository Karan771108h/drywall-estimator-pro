import React from 'react';
import type {
  Room,
  UnitSystem,
  FinishLevel,
  SubstrateType,
} from '@/engine/types';
import {
  FINISH_LEVEL_DESCRIPTIONS,
  SUBSTRATE_NAMES,
} from '@/engine/types';
import { getBoardRecommendation } from '@/engine/takeoff';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Layers } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  index: number;
  unitSystem: UnitSystem;
  onUpdate: (updated: Room) => void;
  onRemove: (id: string) => void;
  wastePercent: number;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  index,
  unitSystem,
  onUpdate,
  onRemove,
  wastePercent,
}) => {
  const isMetric = unitSystem === 'metric';
  const unitLabel = isMetric ? 'm' : 'ft';
  const areaUnit = isMetric ? 'm²' : 'sq ft';

  // Instant calculated metrics for this room
  const perimeter = 2 * (room.length + room.width);
  const grossWallArea = perimeter * room.height;
  const ceilingArea = room.includeCeiling ? room.length * room.width : 0;
  const totalBoardArea = grossWallArea + ceilingArea;

  const doorArea = isMetric ? 1.89 : 21.0;
  const windowArea = isMetric ? 1.40 : 15.0;
  const totalOpeningArea = room.doors * doorArea + room.windows * windowArea;
  const netPaintArea = Math.max(0, grossWallArea - totalOpeningArea) + ceilingArea;

  const boardRec = getBoardRecommendation(room.height, room.length, room.width, unitSystem);
  const rawSheets = (totalBoardArea * (1 + wastePercent / 100)) / boardRec.sheetSqFt;
  const sheetsNeeded = Math.max(2, Math.ceil(rawSheets / 2) * 2);
  const cornerBeadLinear = room.outsideCorners * room.height;

  const applyPreset = (preset: string) => {
    if (preset === 'living_l5') {
      onUpdate({
        ...room,
        name: 'Great Room / Living Room',
        length: isMetric ? 6.5 : 22,
        width: isMetric ? 5.0 : 16,
        height: isMetric ? 2.75 : 9.0,
        includeCeiling: true,
        outsideCorners: 4,
        doors: 2,
        windows: 3,
        finishLevel: 5,
        substrate: 'regular_half',
        paintCoats: 2,
      });
    } else if (preset === 'garage_l2') {
      onUpdate({
        ...room,
        name: 'Attached 2-Car Garage',
        length: isMetric ? 6.0 : 20,
        width: isMetric ? 6.0 : 20,
        height: isMetric ? 2.9 : 9.5,
        includeCeiling: true,
        outsideCorners: 2,
        doors: 2,
        windows: 1,
        finishLevel: 2,
        substrate: 'type_x_five_eighth',
        paintCoats: 1,
      });
    } else if (preset === 'bed_l4') {
      onUpdate({
        ...room,
        name: 'Master Suite Bedroom',
        length: isMetric ? 4.8 : 16,
        width: isMetric ? 4.2 : 14,
        height: isMetric ? 2.45 : 8.0,
        includeCeiling: true,
        outsideCorners: 2,
        doors: 2,
        windows: 2,
        finishLevel: 4,
        substrate: 'regular_half',
        paintCoats: 2,
      });
    } else if (preset === 'bath_moisture') {
      onUpdate({
        ...room,
        name: 'Primary Bathroom & Utility',
        length: isMetric ? 3.6 : 12,
        width: isMetric ? 3.0 : 10,
        height: isMetric ? 2.45 : 8.0,
        includeCeiling: true,
        outsideCorners: 4,
        doors: 1,
        windows: 1,
        finishLevel: 4,
        substrate: 'moisture_resistant',
        paintCoats: 2,
      });
    }
  };

  return (
    <Card className="hover:border-zinc-300 transition-colors">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="flex items-center justify-center w-5 h-5 rounded-[4px] bg-zinc-100 text-zinc-700 font-semibold text-[11px] border border-zinc-200">
              {index + 1}
            </span>
            <Input
              type="text"
              value={room.name}
              onChange={(e) => onUpdate({ ...room, name: e.target.value })}
              className="h-7 text-xs font-semibold text-zinc-900 w-full sm:w-60 focus-visible:ring-1"
              placeholder="Room Name"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <select
              onChange={(e) => {
                applyPreset(e.target.value);
                e.target.value = '';
              }}
              defaultValue=""
              className="h-7 rounded-[5px] border border-zinc-200 bg-white px-2 text-[11px] font-medium text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-950"
            >
              <option value="" disabled>
                Load Trade Preset...
              </option>
              <option value="living_l5">Great Room (Level 5 Skim)</option>
              <option value="bed_l4">Master Bedroom (Level 4 Standard)</option>
              <option value="garage_l2">Garage (Level 2 Type X)</option>
              <option value="bath_moisture">Bathroom (Moisture Resistant)</option>
            </select>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onRemove(room.id)}
              className="text-zinc-400 hover:text-red-600 hover:bg-red-50"
              title="Remove Room"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Geometry Dimensions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Length ({unitLabel})
            </label>
            <Input
              type="number"
              min="1"
              step="0.1"
              value={room.length || ''}
              onChange={(e) => onUpdate({ ...room, length: parseFloat(e.target.value) || 0 })}
              className="tabular-nums"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Width ({unitLabel})
            </label>
            <Input
              type="number"
              min="1"
              step="0.1"
              value={room.width || ''}
              onChange={(e) => onUpdate({ ...room, width: parseFloat(e.target.value) || 0 })}
              className="tabular-nums"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Height ({unitLabel})
            </label>
            <Input
              type="number"
              min="1"
              step="0.1"
              value={room.height || ''}
              onChange={(e) => onUpdate({ ...room, height: parseFloat(e.target.value) || 0 })}
              className="tabular-nums"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Corners (90°)
            </label>
            <Input
              type="number"
              min="0"
              value={room.outsideCorners}
              onChange={(e) => onUpdate({ ...room, outsideCorners: parseInt(e.target.value) || 0 })}
              className="tabular-nums"
              title="Outside 90 deg corners for corner bead"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Doors (Solid)
            </label>
            <Input
              type="number"
              min="0"
              value={room.doors}
              onChange={(e) => onUpdate({ ...room, doors: parseInt(e.target.value) || 0 })}
              className="tabular-nums"
              title="Not deducted from drywall board; deducted from paint"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Windows
            </label>
            <Input
              type="number"
              min="0"
              value={room.windows}
              onChange={(e) => onUpdate({ ...room, windows: parseInt(e.target.value) || 0 })}
              className="tabular-nums"
            />
          </div>

          <div className="flex flex-col justify-end">
            <div className="flex items-center justify-between h-8 px-2.5 rounded-[6px] border border-zinc-200 bg-zinc-50/60">
              <span className="text-[11px] font-medium text-zinc-700">Ceiling</span>
              <Switch
                checked={room.includeCeiling}
                onCheckedChange={(checked) => onUpdate({ ...room, includeCeiling: checked })}
              />
            </div>
          </div>
        </div>

        {/* Substrate & Finish Level Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2 border-t border-zinc-100">
          {/* Substrate & Paint Coats */}
          <div className="lg:col-span-5 space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-zinc-500" />
                Gypsum Board Substrate
              </label>
              <select
                value={room.substrate}
                onChange={(e) => onUpdate({ ...room, substrate: e.target.value as SubstrateType })}
                className="w-full h-8 rounded-[6px] border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 font-medium focus:outline-none focus:ring-1 focus:ring-zinc-950"
              >
                {(Object.keys(SUBSTRATE_NAMES) as SubstrateType[]).map((key) => (
                  <option key={key} value={key}>
                    {SUBSTRATE_NAMES[key]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Paint Finish Coats
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[1, 2, 3].map((coats) => (
                  <button
                    key={coats}
                    type="button"
                    onClick={() => onUpdate({ ...room, paintCoats: coats })}
                    className={`py-1 text-xs rounded-[5px] border font-medium transition-colors ${
                      room.paintCoats === coats
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    {coats} {coats === 1 ? 'Coat' : 'Coats'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* GA-214 Finish Level Selector */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-700">
                Gypsum Association GA-214 Finish Level
              </label>
              <span className="text-[11px] font-semibold text-zinc-900">
                Level {room.finishLevel}: {FINISH_LEVEL_DESCRIPTIONS[room.finishLevel].tag}
              </span>
            </div>

            {/* Level Buttons */}
            <div className="grid grid-cols-5 gap-1.5">
              {([1, 2, 3, 4, 5] as FinishLevel[]).map((lvl) => {
                const isActive = room.finishLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onUpdate({ ...room, finishLevel: lvl })}
                    className={`p-1.5 rounded-[5px] border text-center transition-all ${
                      isActive
                        ? 'bg-zinc-900 text-white border-zinc-900 font-semibold shadow-2xs'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <div className="text-xs font-bold leading-tight">L{lvl}</div>
                    <div className={`text-[9px] line-clamp-1 ${isActive ? 'text-zinc-200' : 'text-zinc-500'}`}>
                      {lvl === 1 ? 'Fire-Tape' : lvl === 2 ? 'Garage' : lvl === 3 ? 'Texture' : lvl === 4 ? 'Standard' : 'Skim'}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Level Detail Box */}
            <div className="mt-2 p-2 rounded-[5px] bg-zinc-50 border border-zinc-200/80 text-[11px] space-y-0.5">
              <div className="text-zinc-700 font-normal leading-tight">
                {FINISH_LEVEL_DESCRIPTIONS[room.finishLevel].description}
              </div>
              <div className="text-zinc-500 text-[10px]">
                <strong className="text-zinc-700">Best for:</strong> {FINISH_LEVEL_DESCRIPTIONS[room.finishLevel].bestFor}
              </div>
            </div>
          </div>
        </div>

        {/* Live Metrics Footer Pills */}
        <div className="pt-2.5 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded-[4px] bg-zinc-50 border border-zinc-200 text-zinc-600 text-[11px]">
              Board Scope: <strong className="text-zinc-900 tabular-nums">{Math.round(totalBoardArea).toLocaleString()}</strong> {areaUnit}
            </span>
            <span className="px-2 py-0.5 rounded-[4px] bg-zinc-50 border border-zinc-200 text-zinc-600 text-[11px]" title="Doors & Windows deducted">
              Net Paint: <strong className="text-zinc-900 tabular-nums">{Math.round(netPaintArea).toLocaleString()}</strong> {areaUnit}
            </span>
            {cornerBeadLinear > 0 && (
              <span className="px-2 py-0.5 rounded-[4px] bg-zinc-50 border border-zinc-200 text-zinc-600 text-[11px]">
                Corner Bead: <strong className="text-zinc-900 tabular-nums">{cornerBeadLinear}</strong> {unitLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="font-medium text-[11px] text-zinc-700">
              {boardRec.boardName.split(' - ')[0]}: <span className="font-bold text-zinc-900 tabular-nums ml-1">{sheetsNeeded} sheets</span>
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
