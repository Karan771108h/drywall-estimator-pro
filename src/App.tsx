import { useState, useMemo, useEffect } from 'react';
import type {
  Room,
  ProjectSettings,
  MaterialCostRates,
  LaborProductionRates,
  CompanyProfile,
  ClientInfo,
} from './engine/types';
import {
  calculateTakeoff,
  DEFAULT_PROJECT_SETTINGS,
  DEFAULT_MATERIAL_RATES_IMPERIAL,
  DEFAULT_MATERIAL_RATES_METRIC,
  DEFAULT_LABOR_RATES,
} from './engine/takeoff';
import { Header } from './components/Header';
import { RoomCard } from './components/RoomCard';
import { TakeoffSummary } from './components/TakeoffSummary';
import { ProposalView } from './components/ProposalView';
import { RatesModal } from './components/RatesModal';
import { ProLicenseModal } from './components/ProLicenseModal';
import { generateQuotePDF } from './utils/pdfGenerator';
import { Plus, Calculator, FileText, CheckCircle2 } from 'lucide-react';

const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-1',
    name: 'Great Room / Main Living',
    length: 22,
    width: 16,
    height: 9,
    includeCeiling: true,
    outsideCorners: 4,
    doors: 2,
    windows: 3,
    finishLevel: 5,
    substrate: 'regular_half',
    paintCoats: 2,
  },
  {
    id: 'room-2',
    name: 'Attached 2-Car Garage',
    length: 20,
    width: 20,
    height: 9.5,
    includeCeiling: true,
    outsideCorners: 2,
    doors: 2,
    windows: 1,
    finishLevel: 2,
    substrate: 'type_x_five_eighth',
    paintCoats: 1,
  },
];

const INITIAL_COMPANY: CompanyProfile = {
  companyName: 'Apex Drywall & Acoustical Systems',
  licenseNumber: 'CS-894102-B',
  contactName: 'Marcus Vance',
  phone: '(555) 349-2100',
  email: 'bids@apexdrywall.com',
  address: '1420 Commercial Parkway, Suite 100',
  paymentTerms:
    '30% Deposit upon contract signing and mobilization; 40% upon completion of drywall hanging and first coat taping; 30% upon final sanding, painting inspection and sign-off. Work conforms to ASTM C840 and Gypsum Association GA-214 standards. Quote valid for 30 days.',
};

const INITIAL_CLIENT: ClientInfo = {
  clientName: 'Summit Construction Group / John Reynolds',
  projectAddress: '4820 Highland Ridge Estates, Austin, TX',
  quoteNumber: 'EST-1048',
  quoteDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  validDays: 30,
};

export function App() {
  // Persistence state
  const [settings, setSettings] = useState<ProjectSettings>(() => {
    const saved = localStorage.getItem('drywallpro_settings');
    return saved ? JSON.parse(saved) : DEFAULT_PROJECT_SETTINGS;
  });

  const [materialRates, setMaterialRates] = useState<MaterialCostRates>(() => {
    const saved = localStorage.getItem('drywallpro_material_rates');
    if (saved) return JSON.parse(saved);
    return settings.unitSystem === 'metric'
      ? DEFAULT_MATERIAL_RATES_METRIC
      : DEFAULT_MATERIAL_RATES_IMPERIAL;
  });

  const [laborRates, setLaborRates] = useState<LaborProductionRates>(() => {
    const saved = localStorage.getItem('drywallpro_labor_rates');
    return saved ? JSON.parse(saved) : DEFAULT_LABOR_RATES;
  });

  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('drywallpro_rooms');
    return saved ? JSON.parse(saved) : INITIAL_ROOMS;
  });

  const [company, setCompany] = useState<CompanyProfile>(() => {
    const saved = localStorage.getItem('drywallpro_company');
    return saved ? JSON.parse(saved) : INITIAL_COMPANY;
  });

  const [client, setClient] = useState<ClientInfo>(() => {
    const saved = localStorage.getItem('drywallpro_client');
    return saved ? JSON.parse(saved) : INITIAL_CLIENT;
  });

  const [isPro, setIsPro] = useState<boolean>(() => {
    return localStorage.getItem('drywallpro_is_pro') === 'true';
  });

  const [licenseKey, setLicenseKey] = useState<string>(() => {
    return localStorage.getItem('drywallpro_license_key') || '';
  });

  const [activeTab, setActiveTab] = useState<'takeoff' | 'proposal'>('takeoff');
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('drywallpro_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('drywallpro_material_rates', JSON.stringify(materialRates));
  }, [materialRates]);

  useEffect(() => {
    localStorage.setItem('drywallpro_labor_rates', JSON.stringify(laborRates));
  }, [laborRates]);

  useEffect(() => {
    localStorage.setItem('drywallpro_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('drywallpro_company', JSON.stringify(company));
  }, [company]);

  useEffect(() => {
    localStorage.setItem('drywallpro_client', JSON.stringify(client));
  }, [client]);

  useEffect(() => {
    localStorage.setItem('drywallpro_is_pro', String(isPro));
  }, [isPro]);

  useEffect(() => {
    localStorage.setItem('drywallpro_license_key', licenseKey);
  }, [licenseKey]);

  // Unit switch handler
  const handleUnitChange = (newUnit: 'imperial' | 'metric') => {
    if (newUnit === settings.unitSystem) return;
    setSettings((prev) => ({ ...prev, unitSystem: newUnit }));
    setMaterialRates(
      newUnit === 'metric' ? { ...DEFAULT_MATERIAL_RATES_METRIC } : { ...DEFAULT_MATERIAL_RATES_IMPERIAL }
    );
  };

  // Pro Key Activation
  const handleActivateKey = (key: string): boolean => {
    const cleaned = key.trim().toUpperCase();
    if (cleaned.length >= 8) {
      setIsPro(true);
      setLicenseKey(cleaned);
      return true;
    }
    return false;
  };

  const handleDeactivatePro = () => {
    setIsPro(false);
    setLicenseKey('');
  };

  // Room management
  const addRoom = () => {
    const isMetric = settings.unitSystem === 'metric';
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      name: `Room Area ${rooms.length + 1}`,
      length: isMetric ? 4.5 : 15,
      width: isMetric ? 3.6 : 12,
      height: isMetric ? 2.45 : 8.0,
      includeCeiling: true,
      outsideCorners: 2,
      doors: 1,
      windows: 1,
      finishLevel: 4,
      substrate: 'regular_half',
      paintCoats: 2,
    };
    setRooms((prev) => [...prev, newRoom]);
  };

  const updateRoom = (updated: Room) => {
    setRooms((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const removeRoom = (id: string) => {
    if (rooms.length <= 1) {
      alert('Project must have at least one room.');
      return;
    }
    setRooms((prev) => prev.filter((r) => r.id !== id));
  };

  // Core Pure Takeoff Result
  const takeoffResult = useMemo(() => {
    return calculateTakeoff(rooms, settings, materialRates, laborRates);
  }, [rooms, settings, materialRates, laborRates]);

  const handleDownloadPDF = () => {
    generateQuotePDF({
      takeoff: takeoffResult,
      company,
      client,
      settings,
      isPro,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        unitSystem={settings.unitSystem}
        onUnitChange={handleUnitChange}
        currency={settings.currency}
        onCurrencyChange={(c) => setSettings((prev) => ({ ...prev, currency: c }))}
        isPro={isPro}
        onOpenProModal={() => setIsProModalOpen(true)}
        onOpenRatesModal={() => setIsRatesModalOpen(true)}
        onDownloadPDF={handleDownloadPDF}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('takeoff')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'takeoff'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Internal Takeoff & BOM ({rooms.length} Rooms)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('proposal')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'proposal'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Client Bid Proposal</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>
              Direct Cost: <strong className="text-white">{settings.currency}{takeoffResult.subcontractorDirectCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span>
              Bid Price: <strong className="text-amber-400 font-bold">{settings.currency}{takeoffResult.totalBidPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
            </span>
          </div>
        </div>

        {/* Tab 1: Internal Takeoff & Multi-Room Engine */}
        {activeTab === 'takeoff' && (
          <div className="space-y-6">
            {/* Multi-Room Takeoff Assembly */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Multi-Room Assembly & GA-214 Finish Engine
                  </h2>
                  <p className="text-xs text-slate-400">
                    Trade opening rule: Doors & windows &lt; 36 sq ft are hung solid (0 board deduction); deducted from paint.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addRoom}
                  className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white font-semibold px-3.5 py-2 rounded-xl border border-slate-700 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Add Room</span>
                </button>
              </div>

              {/* Room Cards List */}
              <div className="space-y-4">
                {rooms.map((room, idx) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    index={idx}
                    unitSystem={settings.unitSystem}
                    onUpdate={updateRoom}
                    onRemove={removeRoom}
                    wastePercent={settings.wastePercent}
                  />
                ))}
              </div>
            </div>

            {/* Comprehensive Takeoff Summary & BOM */}
            <TakeoffSummary takeoff={takeoffResult} settings={settings} />
          </div>
        )}

        {/* Tab 2: Client-Facing Bid Proposal */}
        {activeTab === 'proposal' && (
          <ProposalView
            takeoff={takeoffResult}
            company={company}
            client={client}
            onClientUpdate={setClient}
            settings={settings}
            isPro={isPro}
            onOpenProModal={() => setIsProModalOpen(true)}
            onDownloadPDF={handleDownloadPDF}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-6 mt-12 text-center text-xs text-slate-400 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">DrywallPro Estimator</span>
            <span>•</span>
            <span>100% Client-Side Trade Takeoff Software</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>Gypsum Association GA-214 Standards</span>
            <span>•</span>
            <span>ASTM C840 Assembly Guidelines</span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Static Zero-Backend Deploy
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <RatesModal
        isOpen={isRatesModalOpen}
        onClose={() => setIsRatesModalOpen(false)}
        materialRates={materialRates}
        onMaterialRatesChange={setMaterialRates}
        laborRates={laborRates}
        onLaborRatesChange={setLaborRates}
        settings={settings}
        onSettingsChange={setSettings}
      />

      <ProLicenseModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        isPro={isPro}
        licenseKey={licenseKey}
        onActivateKey={handleActivateKey}
        onDeactivate={handleDeactivatePro}
        company={company}
        onCompanyChange={setCompany}
      />
    </div>
  );
}

export default App;
