import { useState, useMemo, useEffect } from 'react';
import type {
  Room,
  ProjectSettings,
  MaterialCostRates,
  LaborProductionRates,
  CompanyProfile,
  ClientInfo,
} from '@/engine/types';
import {
  calculateTakeoff,
  DEFAULT_PROJECT_SETTINGS,
  DEFAULT_MATERIAL_RATES_IMPERIAL,
  DEFAULT_MATERIAL_RATES_METRIC,
  DEFAULT_LABOR_RATES,
} from '@/engine/takeoff';
import {
  loadStoredLicense,
  saveStoredLicense,
  clearStoredLicense,
  type StoredLicenseReceipt,
} from '@/services/license';
import { Header } from '@/components/Header';
import { RoomCard } from '@/components/RoomCard';
import { TakeoffSummary } from '@/components/TakeoffSummary';
import { ProposalView } from '@/components/ProposalView';
import { SettingsSheet } from '@/components/SettingsSheet';
import { ProLicenseModal } from '@/components/ProLicenseModal';
import { generateQuotePDF } from '@/utils/pdfGenerator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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

  // Strict Free Mode default for new visitors
  const [isPro, setIsPro] = useState<boolean>(false);
  const [licenseKey, setLicenseKey] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'takeoff' | 'proposal'>('takeoff');
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  // Initialize and verify license with cryptographic signature on mount
  useEffect(() => {
    loadStoredLicense().then((result) => {
      setIsPro(result.isPro);
      if (result.receipt) {
        setLicenseKey(result.receipt.licenseKey);
      } else {
        setLicenseKey('');
      }
    });
  }, []);

  // Sync general state to localStorage
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

  // Unit switch handler
  const handleUnitChange = (newUnit: 'imperial' | 'metric') => {
    if (newUnit === settings.unitSystem) return;
    setSettings((prev) => ({ ...prev, unitSystem: newUnit }));
    setMaterialRates(
      newUnit === 'metric' ? { ...DEFAULT_MATERIAL_RATES_METRIC } : { ...DEFAULT_MATERIAL_RATES_IMPERIAL }
    );
  };

  // License Handlers
  const handleActivateSuccess = (receipt: StoredLicenseReceipt) => {
    saveStoredLicense(receipt);
    setIsPro(true);
    setLicenseKey(receipt.licenseKey);
  };

  const handleDeactivatePro = () => {
    clearStoredLicense();
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
    <div className="min-h-screen bg-[#f8fafc] text-zinc-900 flex flex-col font-sans">
      {/* Decluttered SaaS Top Bar */}
      <Header
        isPro={isPro}
        onOpenProModal={() => setIsProModalOpen(true)}
        onOpenSettingsSheet={() => setIsSettingsSheetOpen(true)}
        onDownloadPDF={handleDownloadPDF}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'takeoff' | 'proposal')}
          className="space-y-6"
        >
          {/* Navigation Bar & Real-Time Executive Metric Badge */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
            <TabsList className="bg-zinc-100 p-0.5 border border-zinc-200">
              <TabsTrigger value="takeoff" className="gap-1.5 font-medium">
                <Calculator className="h-3.5 w-3.5" />
                <span>Internal Takeoff & BOM ({rooms.length})</span>
              </TabsTrigger>
              <TabsTrigger value="proposal" className="gap-1.5 font-medium">
                <FileText className="h-3.5 w-3.5" />
                <span>Client Bid Proposal</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2.5 text-xs text-zinc-500 tabular-nums">
              <span>
                Direct: <strong className="text-zinc-900 font-semibold">{settings.currency}{takeoffResult.subcontractorDirectCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
              </span>
              <span className="text-zinc-300">•</span>
              <span>
                Bid: <strong className="text-zinc-900 font-bold">{settings.currency}{takeoffResult.totalBidPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
              </span>
            </div>
          </div>

          {/* Tab 1: Internal Takeoff & Multi-Room Engine */}
          <TabsContent value="takeoff" className="space-y-6 mt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">
                    Multi-Room Assembly & Gypsum Finish Schedules
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    GA-214 finish specifications and physical bundle allocation.
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={addRoom}
                  className="font-medium gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Room</span>
                </Button>
              </div>

              {/* Room Cards List */}
              <div className="space-y-3">
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
          </TabsContent>

          {/* Tab 2: Client-Facing Bid Proposal */}
          <TabsContent value="proposal" className="mt-0">
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
          </TabsContent>
        </Tabs>
      </main>

      {/* Clean Subcontractor SaaS Footer */}
      <footer className="border-t border-zinc-200 bg-white py-5 mt-12 text-center text-xs text-zinc-500 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-zinc-700">
            <span className="font-semibold text-zinc-900">DrywallPro Estimator</span>
            <span>•</span>
            <span>Client-Side Commercial Takeoff Platform</span>
          </div>
          <div className="flex items-center gap-3 text-zinc-500 text-[11px]">
            <span>Gypsum Association GA-214 Standards</span>
            <span>•</span>
            <span>ASTM C840 Assembly Guidelines</span>
            <span>•</span>
            <span className="text-zinc-700 flex items-center gap-1 font-medium">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Static Edge Deploy
            </span>
          </div>
        </div>
      </footer>

      {/* Slide-over Drawer for Settings & Rate Card */}
      <SettingsSheet
        isOpen={isSettingsSheetOpen}
        onOpenChange={setIsSettingsSheetOpen}
        settings={settings}
        onSettingsChange={setSettings}
        materialRates={materialRates}
        onMaterialRatesChange={setMaterialRates}
        laborRates={laborRates}
        onLaborRatesChange={setLaborRates}
        onUnitChange={handleUnitChange}
      />

      {/* Pro License Modal */}
      <ProLicenseModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        isPro={isPro}
        licenseKey={licenseKey}
        onActivateSuccess={handleActivateSuccess}
        onDeactivate={handleDeactivatePro}
        company={company}
        onCompanyChange={setCompany}
      />
    </div>
  );
}

export default App;
