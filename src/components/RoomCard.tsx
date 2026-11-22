import React from 'react';
import type {
  Room,
  UnitSystem,
  FinishLevel,
  SubstrateType,
} from '../engine/types';
import {
  FINISH_LEVEL_DESCRIPTIONS,
  SUBSTRATE_NAMES,
} from '../engine/types';
import { getBoardRecommendation } from '../engine/takeoff';
import { Trash2, Info, Layers, CheckCircle2 } from 'lucide-react';

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
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 shadow-lg transition-all">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 font-bold text-xs border border-amber-500/30">
            {index + 1}
          </span>
          <input
            type="text"
            value={room.name}
            onChange={(e) => onUpdate({ ...room, name: e.target.value })}
            className="bg-slate-800/80 border border-slate-700 font-semibold text-sm text-white px-2.5 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400 w-full sm:w-56"
            placeholder="Room Name"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Presets */}
          <select
            onChange={(e) => {
              applyPreset(e.target.value);
              e.target.value = '';
            }}
            defaultValue=""
            className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            <option value="" disabled>
              Load Trade Preset...
            </option>
            <option value="living_l5">Great Room (Level 5 Skim)</option>
            <option value="bed_l4">Master Bedroom (Level 4 Standard)</option>
            <option value="garage_l2">Garage (Level 2 Fire-Code Type X)</option>
            <option value="bath_moisture">Bathroom (Moisture Resistant)</option>
          </select>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onRemove(room.id)}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Remove Room"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Geometry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 my-4">
        <div>
          <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
            Length ({unitLabel})
          </label>
          <input
            type="number"
            min="1"
            step="0.1"
            value={room.length || ''}
            onChange={(e) => onUpdate({ ...room, length: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
            Width ({unitLabel})
          </label>
          <input
            type="number"
            min="1"
            step="0.1"
            value={room.width || ''}
            onChange={(e) => onUpdate({ ...room, width: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
            Height ({unitLabel})
          </label>
          <input
            type="number"
            min="1"
            step="0.1"
            value={room.height || ''}
            onChange={(e) => onUpdate({ ...room, height: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
            Outside Corners
          </label>
          <input
            type="number"
            min="0"
            value={room.outsideCorners}
            onChange={(e) => onUpdate({ ...room, outsideCorners: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
            title="Outside 90 deg corners for corner bead"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
            Doors (Hung Solid)
          </label>
          <input
            type="number"
            min="0"
            value={room.doors}
            onChange={(e) => onUpdate({ ...room, doors: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
            Windows
          </label>
          <input
            type="number"
            min="0"
            value={room.windows}
            onChange={(e) => onUpdate({ ...room, windows: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </div>

        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 cursor-pointer bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-750">
            <input
              type="checkbox"
              checked={room.includeCeiling}
              onChange={(e) => onUpdate({ ...room, includeCeiling: e.target.checked })}
              className="rounded text-amber-500 focus:ring-amber-400"
            />
            <span className="font-medium">Ceiling</span>
          </label>
        </div>
      </div>

      {/* Substrate & Finish Level Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3 border-t border-slate-800/80">
        {/* Substrate & Paint Coats (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Gypsum Board Substrate
            </label>
            <select
              value={room.substrate}
              onChange={(e) => onUpdate({ ...room, substrate: e.target.value as SubstrateType })}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              {(Object.keys(SUBSTRATE_NAMES) as SubstrateType[]).map((key) => (
                <option key={key} value={key}>
                  {SUBSTRATE_NAMES[key]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Architectural Paint Finish Coats
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((coats) => (
                <button
                  key={coats}
                  type="button"
                  onClick={() => onUpdate({ ...room, paintCoats: coats })}
                  className={`py-1.5 px-2 text-xs rounded-lg border font-medium transition-colors ${
                    room.paintCoats === coats
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {coats} {coats === 1 ? 'Coat' : 'Coats'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* GA-214 Finish Level Selector (7 cols) */}
        <div className="lg:col-span-7">
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              Gypsum Association GA-214 Finish Level
            </span>
            <span className="text-[11px] text-amber-400 font-semibold">
              Level {room.finishLevel}: {FINISH_LEVEL_DESCRIPTIONS[room.finishLevel].tag}
            </span>
          </label>

          {/* Level Buttons */}
          <div className="grid grid-cols-5 gap-1.5">
            {([1, 2, 3, 4, 5] as FinishLevel[]).map((lvl) => {
              const isActive = room.finishLevel === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onUpdate({ ...room, finishLevel: lvl })}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20 scale-[1.02]'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-750'
                  }`}
                >
                  <div className="text-xs font-black">Lvl {lvl}</div>
                  <div className={`text-[9px] line-clamp-1 ${isActive ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                    {lvl === 1 ? 'Fire-Tape' : lvl === 2 ? 'Garage' : lvl === 3 ? 'Texture' : lvl === 4 ? 'Standard' : 'Skim'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Level Detail Box */}
          <div className="mt-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] space-y-1">
            <div className="text-slate-300 font-medium leading-tight">
              {FINISH_LEVEL_DESCRIPTIONS[room.finishLevel].description}
            </div>
            <div className="text-slate-400 text-[10px]">
              <span className="text-amber-400/90 font-semibold">Best For: </span>
              {FINISH_LEVEL_DESCRIPTIONS[room.finishLevel].bestFor}
            </div>
          </div>
        </div>
      </div>

      {/* Live Room Takeoff Footer Pills */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
            Board Area: <strong className="text-white">{Math.round(totalBoardArea)}</strong> {areaUnit}
          </span>
          <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700" title="Doors & Windows deducted">
            Net Paint: <strong className="text-white">{Math.round(netPaintArea)}</strong> {areaUnit}
          </span>
          {cornerBeadLinear > 0 && (
            <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
              Corner Bead: <strong className="text-white">{cornerBeadLinear}</strong> {unitLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-md font-medium text-xs flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {boardRec.boardName.split(' - ')[0]}: <strong>{sheetsNeeded} sheets</strong> (paired bundle)
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};
