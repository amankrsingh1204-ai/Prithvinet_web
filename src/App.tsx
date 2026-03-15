import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, Legend, Cell
} from 'recharts';
import { 
  Activity, AlertTriangle, Shield, Map as MapIcon, Database, 
  Wind, Droplets, Volume2, TrendingUp, User, Settings, Bell,
  ChevronRight, Info, BrainCircuit, Zap, Eye, Filter, Download,
  LayoutDashboard, Users, Building2, Search, MapPin, X, Loader2, Trash2,
  CheckCircle2, Clock, Map as MapIcon2, Globe, Factory, Sun, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import { ComplianceCopilot } from './components/ComplianceCopilot';
import { D3SimulationForecast } from './components/D3SimulationForecast';
import { IoTDashboard } from './components/IoTDashboard';
import { MonitoringTeamManagement } from './components/MonitoringTeamManagement';
import { RegionalOfficerManagement } from './components/RegionalOfficerManagement';
import API_BASE from './config/api';
import { installGlobalApiDebugLogging } from './services/apiDebugLogger';

// Fix Leaflet icon issue
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_BASE_URL = API_BASE.replace(/\/$/, '');

const apiUrl = (path: string) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

// --- Types ---
interface Sensor {
  id: string;
  name: string;
  parameter: string;
  unit: string;
  max_threshold: number;
  lat: number;
  lng: number;
}

interface Reading {
  sensorId: string;
  value: number;
  timestamp: string;
}

interface Alert {
  sensorId: string;
  value: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  message?: string;
  type?: string;
}

interface RegionIndustry {
  industry_name: string;
  location: string;
  compliance_status: 'Compliant' | 'Warning' | 'Non-Compliant' | string;
  district?: string;
  state?: string;
  id?: string;
  name?: string;
  lat?: number;
  lng?: number;
  aqi?: number;
  noise?: number;
  waterPh?: number;
  complianceStatus?: string;
}

interface DemoCredential {
  role: UserRole;
  email: string;
  password: string;
}

type UserRole = 'Super Admin' | 'Regional Officer' | 'Monitoring Team' | 'Industry User' | 'Citizen';

type View = 'dashboard' | 'map' | 'logs' | 'alerts' | 'settings' | 'pollutionmap' | 'industries' | 'simulator' | 'waterquality' | 'globalmap' | 'system-mgmt' | 'master-data' | 'region-mgmt' | 'data-collection' | 'compliance-reporting' | 'complaints' | 'iot-monitoring';

type CitySeed = { name: string; lat: number; lng: number; tier: 'capital' | 'major' };
type IndustrySeed = { name: string; lat: number; lng: number; type: string };

const INDIA_CAPITALS_AND_MAJOR_CITIES: CitySeed[] = [
  { name: 'Delhi', lat: 28.6139, lng: 77.2090, tier: 'capital' },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, tier: 'major' },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, tier: 'capital' },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, tier: 'capital' },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, tier: 'capital' },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, tier: 'capital' },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, tier: 'major' },
  { name: 'Pune', lat: 18.5204, lng: 73.8567, tier: 'major' },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873, tier: 'capital' },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462, tier: 'capital' },
  { name: 'Patna', lat: 25.5941, lng: 85.1376, tier: 'capital' },
  { name: 'Bhopal', lat: 23.2599, lng: 77.4126, tier: 'capital' },
  { name: 'Raipur', lat: 21.2514, lng: 81.6296, tier: 'capital' },
  { name: 'Ranchi', lat: 23.3441, lng: 85.3096, tier: 'capital' },
  { name: 'Bhubaneswar', lat: 20.2961, lng: 85.8245, tier: 'capital' },
  { name: 'Guwahati', lat: 26.1445, lng: 91.7362, tier: 'major' },
  { name: 'Dispur', lat: 26.1433, lng: 91.7898, tier: 'capital' },
  { name: 'Chandigarh', lat: 30.7333, lng: 76.7794, tier: 'capital' },
  { name: 'Dehradun', lat: 30.3165, lng: 78.0322, tier: 'capital' },
  { name: 'Shimla', lat: 31.1048, lng: 77.1734, tier: 'capital' },
  { name: 'Srinagar', lat: 34.0837, lng: 74.7973, tier: 'capital' },
  { name: 'Jammu', lat: 32.7266, lng: 74.8570, tier: 'capital' },
  { name: 'Panaji', lat: 15.4909, lng: 73.8278, tier: 'capital' },
  { name: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366, tier: 'capital' },
  { name: 'Kochi', lat: 9.9312, lng: 76.2673, tier: 'major' },
  { name: 'Surat', lat: 21.1702, lng: 72.8311, tier: 'major' },
  { name: 'Nagpur', lat: 21.1458, lng: 79.0882, tier: 'major' },
  { name: 'Indore', lat: 22.7196, lng: 75.8577, tier: 'major' },
  { name: 'Kanpur', lat: 26.4499, lng: 80.3319, tier: 'major' },
  { name: 'Varanasi', lat: 25.3176, lng: 83.0062, tier: 'major' },
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, tier: 'major' },
  { name: 'Coimbatore', lat: 11.0168, lng: 76.9558, tier: 'major' },
  { name: 'Madurai', lat: 9.9252, lng: 78.1198, tier: 'major' },
  { name: 'Vijayawada', lat: 16.5062, lng: 80.6480, tier: 'major' },
  { name: 'Amaravati', lat: 16.5730, lng: 80.3575, tier: 'capital' },
  { name: 'Agartala', lat: 23.8315, lng: 91.2868, tier: 'capital' },
  { name: 'Aizawl', lat: 23.7271, lng: 92.7176, tier: 'capital' },
  { name: 'Imphal', lat: 24.8170, lng: 93.9368, tier: 'capital' },
  { name: 'Kohima', lat: 25.6751, lng: 94.1086, tier: 'capital' },
  { name: 'Shillong', lat: 25.5788, lng: 91.8933, tier: 'capital' },
  { name: 'Itanagar', lat: 27.0844, lng: 93.6053, tier: 'capital' },
  { name: 'Gangtok', lat: 27.3389, lng: 88.6065, tier: 'capital' },
  { name: 'Leh', lat: 34.1526, lng: 77.5771, tier: 'capital' },
  { name: 'Puducherry', lat: 11.9416, lng: 79.8083, tier: 'capital' },
  { name: 'Port Blair', lat: 11.6234, lng: 92.7265, tier: 'capital' },
  { name: 'Daman', lat: 20.4283, lng: 72.8397, tier: 'capital' },
  { name: 'Silvassa', lat: 20.2730, lng: 73.0086, tier: 'capital' },
  { name: 'Ludhiana', lat: 30.9010, lng: 75.8573, tier: 'major' },
  { name: 'Jamshedpur', lat: 22.8046, lng: 86.2029, tier: 'major' },
  { name: 'Gurugram', lat: 28.4595, lng: 77.0266, tier: 'major' },
  { name: 'Bhilai', lat: 21.1938, lng: 81.3509, tier: 'major' },
  { name: 'Noida', lat: 28.5355, lng: 77.3910, tier: 'major' },
  { name: 'Faridabad', lat: 28.4089, lng: 77.3178, tier: 'major' },
  { name: 'Vadodara', lat: 22.3072, lng: 73.1812, tier: 'major' },
  { name: 'Nashik', lat: 19.9975, lng: 73.7898, tier: 'major' },
  { name: 'Rourkela', lat: 22.2604, lng: 84.8536, tier: 'major' },
  { name: 'Bokaro', lat: 23.6693, lng: 86.1511, tier: 'major' },
  { name: 'Haldia', lat: 22.0667, lng: 88.0698, tier: 'major' },
  { name: 'Durgapur', lat: 23.5204, lng: 87.3119, tier: 'major' },
  { name: 'Korba', lat: 22.3595, lng: 82.7501, tier: 'major' },
  { name: 'Moradabad', lat: 28.8386, lng: 78.7733, tier: 'major' },
  { name: 'Firozabad', lat: 27.1591, lng: 78.3957, tier: 'major' },
  { name: 'Jalandhar', lat: 31.3260, lng: 75.5762, tier: 'major' },
  { name: 'Mysore', lat: 12.2958, lng: 76.6394, tier: 'major' },
  { name: 'Tiruppur', lat: 11.1085, lng: 77.3411, tier: 'major' },
  { name: 'Anand', lat: 22.5645, lng: 72.9289, tier: 'major' },
  { name: 'Baddi', lat: 30.9578, lng: 76.7914, tier: 'major' },
  { name: 'Rudrapur', lat: 28.9875, lng: 79.4141, tier: 'major' },
  { name: 'Haridwar', lat: 29.9457, lng: 78.1642, tier: 'major' },

  // Chhattisgarh districts requested for additional heat-map coverage
  { name: 'Balod', lat: 20.7300, lng: 81.2050, tier: 'major' },
  { name: 'Baloda Bazar', lat: 21.6560, lng: 82.1600, tier: 'major' },
  { name: 'Bastar', lat: 19.1071, lng: 81.9535, tier: 'major' },
  { name: 'Bijapur', lat: 18.8432, lng: 80.7761, tier: 'major' },
  { name: 'Bilaspur', lat: 22.0796, lng: 82.1391, tier: 'major' },
  { name: 'Dantewada', lat: 18.9008, lng: 81.3494, tier: 'major' },
  { name: 'Dhamtari', lat: 20.7074, lng: 81.5487, tier: 'major' },
  { name: 'Durg', lat: 21.1904, lng: 81.2849, tier: 'major' },
  { name: 'Gariaband', lat: 20.6336, lng: 82.0622, tier: 'major' },
  { name: 'Janjgir-Champa', lat: 22.0094, lng: 82.5775, tier: 'major' },
  { name: 'Jashpur', lat: 22.8874, lng: 84.1388, tier: 'major' },
  { name: 'Kabirdham', lat: 22.0082, lng: 81.2500, tier: 'major' },
  { name: 'Kanker', lat: 20.2719, lng: 81.4918, tier: 'major' },
  { name: 'Kondagaon', lat: 19.6008, lng: 81.6640, tier: 'major' },
  { name: 'Mahasamund', lat: 21.1074, lng: 82.0947, tier: 'major' },
  { name: 'Mungeli', lat: 22.0667, lng: 81.6833, tier: 'major' },
  { name: 'Narayanpur', lat: 19.7192, lng: 81.2457, tier: 'major' },
  { name: 'Rajnandgaon', lat: 21.0974, lng: 81.0337, tier: 'major' },
  { name: 'Sukma', lat: 18.3908, lng: 81.6593, tier: 'major' },
  { name: 'Surajpur', lat: 23.2200, lng: 82.8700, tier: 'major' },
  { name: 'Surguja', lat: 23.1170, lng: 83.1980, tier: 'major' },
  { name: 'Manendragarh', lat: 23.1990, lng: 82.2060, tier: 'major' },
  { name: 'Sarangarh-Bilaigarh', lat: 21.5867, lng: 83.0800, tier: 'major' },
  { name: 'Khairagarh-Chhuikhadan-Gandai', lat: 21.4181, lng: 80.9800, tier: 'major' },
  { name: 'Manpur-Mohla', lat: 20.6800, lng: 80.7300, tier: 'major' },

  // Additional places requested
  { name: 'Raichur', lat: 16.2076, lng: 77.3463, tier: 'major' },
  { name: 'Solapur', lat: 17.6599, lng: 75.9064, tier: 'major' },
  { name: 'Nanded', lat: 19.1383, lng: 77.3210, tier: 'major' },
  { name: 'Jhansi', lat: 25.4484, lng: 78.5685, tier: 'major' },
  { name: 'Kota', lat: 25.2138, lng: 75.8648, tier: 'major' },
  { name: 'Jagdalpur', lat: 19.0748, lng: 82.0080, tier: 'major' },
  { name: 'Bikaner', lat: 28.0229, lng: 73.3119, tier: 'major' },
  { name: 'Jodhpur', lat: 26.2389, lng: 73.0243, tier: 'major' }
];

const buildBaselinePollutionData = () => {
  return INDIA_CAPITALS_AND_MAJOR_CITIES.map((city, idx) => {
    const baseAqi = city.tier === 'capital' ? 170 : 155;
    const aqi = Math.min(360, baseAqi + ((idx * 19) % 130));
    const severity: 'HIGH' | 'CRITICAL' = aqi >= 240 ? 'CRITICAL' : 'HIGH';
    return {
      id: `poll-base-${idx}`,
      lat: city.lat,
      lng: city.lng,
      name: `${city.name}, India`,
      type: 'AIR',
      severity,
      aqi,
      co: Number((0.8 + aqi / 190).toFixed(1)),
      no2: Math.round(30 + aqi / 4),
      pm25: Math.round(aqi * 0.62),
      description: `${city.tier === 'capital' ? 'Capital city' : 'Major city'} pollution profile with traffic and industrial load.`,
      contributingFactors: city.tier === 'capital'
        ? ['Vehicle Emissions', 'Construction Dust', 'Mixed Urban Industry']
        : ['Industrial Emissions', 'Transport Corridors', 'Road Dust']
    };
  });
};

const mergePollutionData = (generatedData: any[]) => {
  const merged = [...buildBaselinePollutionData(), ...generatedData];
  const dedupedByName = new Map<string, any>();

  for (const area of merged) {
    if (!area || typeof area.lat !== 'number' || typeof area.lng !== 'number' || Number.isNaN(area.lat) || Number.isNaN(area.lng)) {
      continue;
    }

    const key = String(area.name || `${area.lat},${area.lng}`).toLowerCase();
    const existing = dedupedByName.get(key);
    if (!existing || (Number(area.aqi) || 0) > (Number(existing.aqi) || 0)) {
      dedupedByName.set(key, area);
    }
  }

  return Array.from(dedupedByName.values()).map((area, idx) => ({
    ...area,
    id: area.id || `poll-${idx}-${Date.now()}`
  }));
};

const INDIA_INDUSTRY_SEEDS: IndustrySeed[] = [
  { name: 'Jamnagar Refinery Complex', lat: 22.4707, lng: 70.0577, type: 'Petroleum Refineries' },
  { name: 'Dahej Industrial Corridor', lat: 21.7200, lng: 72.6500, type: 'Petrochemicals' },
  { name: 'Hazira Industrial Belt', lat: 21.1200, lng: 72.6500, type: 'Shipbuilding' },
  { name: 'Ahmedabad Pharma District', lat: 23.0225, lng: 72.5714, type: 'Pharmaceuticals' },
  { name: 'Surat Port and Textile Hub', lat: 21.1702, lng: 72.8311, type: 'Textiles' },
  { name: 'Vadodara Engineering Zone', lat: 22.3072, lng: 73.1812, type: 'Automobiles' },
  { name: 'Pune Auto Cluster', lat: 18.5204, lng: 73.8567, type: 'Automobiles' },
  { name: 'Nashik Manufacturing Park', lat: 19.9975, lng: 73.7898, type: 'Electronics' },
  { name: 'Mumbai Port Industrial Zone', lat: 19.0760, lng: 72.8777, type: 'Shipping' },
  { name: 'Noida Electronics Cluster', lat: 28.5355, lng: 77.3910, type: 'Electronics' },
  { name: 'Gurugram Software and Auto Hub', lat: 28.4595, lng: 77.0266, type: 'Software Hubs' },
  { name: 'Faridabad Heavy Industry Area', lat: 28.4089, lng: 77.3178, type: 'Power Plants' },
  { name: 'Ludhiana Forging and Steel Zone', lat: 30.9010, lng: 75.8573, type: 'Fertilizers' },
  { name: 'Baddi Pharma Hub', lat: 30.9578, lng: 76.7914, type: 'Pharmaceuticals' },
  { name: 'Haridwar SIDCUL Industrial Area', lat: 29.9457, lng: 78.1642, type: 'Electronics' },
  { name: 'Rudrapur Industrial Estate', lat: 28.9875, lng: 79.4141, type: 'Automobiles' },
  { name: 'Kanpur Leather and Chemical Belt', lat: 26.4499, lng: 80.3319, type: 'Chemicals' },
  { name: 'Moradabad Metalworks Cluster', lat: 28.8386, lng: 78.7733, type: 'Metals' },
  { name: 'Firozabad Glass Industry Zone', lat: 27.1591, lng: 78.3957, type: 'Glass' },
  { name: 'Jaipur Industrial and Gems Sector', lat: 26.9124, lng: 75.7873, type: 'Electronics' },
  { name: 'Indore Pithampur Industrial Area', lat: 22.7196, lng: 75.8577, type: 'Automobiles' },
  { name: 'Bhopal Manufacturing Hub', lat: 23.2599, lng: 77.4126, type: 'Power Plants' },
  { name: 'Bhilai Steel Plant Region', lat: 21.1938, lng: 81.3509, type: 'Metals' },
  { name: 'Korba Power and Coal Corridor', lat: 22.3595, lng: 82.7501, type: 'Power Plants' },
  { name: 'Raipur Industrial Area', lat: 21.2514, lng: 81.6296, type: 'Fertilizers' },
  { name: 'Jamshedpur Steel and Engineering Zone', lat: 22.8046, lng: 86.2029, type: 'Metals' },
  { name: 'Bokaro Steel City Industrial Zone', lat: 23.6693, lng: 86.1511, type: 'Metals' },
  { name: 'Durgapur Industrial and Alloy Belt', lat: 23.5204, lng: 87.3119, type: 'Metals' },
  { name: 'Haldia Petrochemical Complex', lat: 22.0667, lng: 88.0698, type: 'Petrochemicals' },
  { name: 'Rourkela Steel and Mining Hub', lat: 22.2604, lng: 84.8536, type: 'Metals' },
  { name: 'Visakhapatnam Shipyard and Port Area', lat: 17.6868, lng: 83.2185, type: 'Shipbuilding' },
  { name: 'Vijayawada Agro Industrial Zone', lat: 16.5062, lng: 80.6480, type: 'Fertilizers' },
  { name: 'Chennai Automotive Corridor', lat: 13.0827, lng: 80.2707, type: 'Automobiles' },
  { name: 'Coimbatore Engineering Cluster', lat: 11.0168, lng: 76.9558, type: 'Electronics' },
  { name: 'Tiruppur Textile Industrial Zone', lat: 11.1085, lng: 77.3411, type: 'Textiles' },
  { name: 'Kochi Port and Ship Repair Yard', lat: 9.9312, lng: 76.2673, type: 'Shipbuilding' },
  { name: 'Mysore Industrial Growth Centre', lat: 12.2958, lng: 76.6394, type: 'Software Hubs' },
  { name: 'Bengaluru Electronics City', lat: 12.9716, lng: 77.5946, type: 'Electronics' },
  { name: 'Hyderabad Pharma and IT Corridor', lat: 17.3850, lng: 78.4867, type: 'Pharmaceuticals' },
  { name: 'Anand Food Processing Cluster', lat: 22.5645, lng: 72.9289, type: 'Food Processing' }
];

const buildBaselineIndustriesData = () => {
  return INDIA_INDUSTRY_SEEDS.map((seed, idx) => {
    const aqi = 95 + (idx * 13) % 130;
    const noise = 62 + (idx * 7) % 28;
    const waterPh = Number((6.6 + ((idx * 3) % 18) / 10).toFixed(1));
    const complianceStatus: 'Compliant' | 'Non-Compliant' | 'Warning' =
      aqi > 185 ? 'Non-Compliant' : aqi > 145 ? 'Warning' : 'Compliant';

    return {
      id: `ind-base-${idx}`,
      name: seed.name,
      lat: seed.lat,
      lng: seed.lng,
      type: seed.type,
      aqi,
      noise,
      waterPh,
      description: `${seed.type} operations with continuous compliance monitoring.`,
      complianceStatus,
      nearbyIndustries: []
    };
  });
};

const mergeIndustriesData = (generatedData: any[]) => {
  const merged = [...buildBaselineIndustriesData(), ...generatedData];
  const dedupedByName = new Map<string, any>();

  for (const item of merged) {
    if (!item || typeof item.lat !== 'number' || typeof item.lng !== 'number' || Number.isNaN(item.lat) || Number.isNaN(item.lng)) {
      continue;
    }

    const key = String(item.name || `${item.lat},${item.lng}`).toLowerCase();
    const existing = dedupedByName.get(key);
    if (!existing || (Number(item.aqi) || 0) > (Number(existing.aqi) || 0)) {
      dedupedByName.set(key, item);
    }
  }

  return Array.from(dedupedByName.values()).map((item, idx) => ({
    ...item,
    id: item.id || `ind-${idx}-${Date.now()}`
  }));
};

// --- Components ---

const StatCard = ({ title, value, unit, icon: Icon, status, color, statusColor, subtitle }: any) => (
  <div className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] shadow-2xl flex flex-col justify-between h-full group hover:bg-[#252b40] transition-all duration-300">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-slate-400 text-sm font-medium tracking-wide">{title}</h3>
        {subtitle && <p className="text-[10px] text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className={cn("p-2 rounded-xl", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    <div className="flex items-center gap-4">
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
        <span className="text-slate-500 text-sm font-medium">{unit}</span>
      </div>
      {status && (
        <div className={cn("px-4 py-1.5 rounded-full text-xs font-bold shadow-lg", statusColor)}>
          {status}
        </div>
      )}
    </div>
  </div>
);

const NoiseForecast = ({ point }: { point: any }) => {
  const [forecast, setForecast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateForecast = async () => {
    setLoading(true);
    try {
      const response = await fetch(apiUrl('/api/ai/noise-forecast'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(point),
      });
      if (!response.ok) throw new Error('Failed to get forecast');
      const data = await response.json();
      setForecast(data?.text || 'Unable to generate forecast at this time.');
    } catch (error) {
      console.error("Forecast error:", error);
      setForecast("Unable to generate forecast at this time.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-white/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <BrainCircuit className="w-3 h-3 text-purple-400" /> AI Noise Forecast
        </span>
        {!forecast && !loading && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              generateForecast();
            }}
            className="text-[8px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded hover:bg-purple-500/30 transition-colors cursor-pointer"
          >
            Predict
          </button>
        )}
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-[9px] text-slate-500 italic">
          <Loader2 className="w-2 h-2 animate-spin" /> Analyzing acoustic patterns...
        </div>
      )}
      {forecast && (
        <p className="text-[9px] text-slate-300 leading-relaxed italic">
          {forecast}
        </p>
      )}
    </div>
  );
};

const MapEvents = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      if (e.latlng && typeof e.latlng.lat === 'number' && typeof e.latlng.lng === 'number' && !isNaN(e.latlng.lat) && !isNaN(e.latlng.lng)) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

const MapController = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    if (center && typeof center[0] === 'number' && typeof center[1] === 'number' && !isNaN(center[0]) && !isNaN(center[1])) {
      // Store map instance for external access
      (window as any).leafletMap = map;
      
      // Use setView for immediate positioning, flyTo for smooth transitions
      if (map.getZoom() === 2) {
        map.setView(center, zoom);
      } else {
        map.flyTo(center, zoom, { duration: 1.5 });
      }
    }
  }, [center, zoom, map]);
  return null;
};

const getAQIStyle = (aqi: number) => {
  if (aqi <= 50) return { bg: '#00e400', text: '#000', status: 'Good' };
  if (aqi <= 100) return { bg: '#ffff00', text: '#000', status: 'Moderate' };
  if (aqi <= 150) return { bg: '#ff7e00', text: '#fff', status: 'Unhealthy for Sensitive Groups' };
  if (aqi <= 200) return { bg: '#ff0000', text: '#fff', status: 'Unhealthy' };
  if (aqi <= 300) return { bg: '#8f3f97', text: '#fff', status: 'Very Unhealthy' };
  return { bg: '#7e0023', text: '#fff', status: 'Hazardous' };
};

const HistoricalChart = ({ baseAqi, baseNoise, basePh }: { baseAqi: number, baseNoise: number, basePh: number }) => {
  const data = useMemo(() => {
    const result = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      result.push({
        date: format(date, 'MMM dd'),
        aqi: Math.max(0, Math.round(baseAqi + (Math.random() * 40 - 20))),
        noise: Math.max(0, Math.round(baseNoise + (Math.random() * 10 - 5))),
        ph: Number(Math.max(0, Math.min(14, basePh + (Math.random() * 0.4 - 0.2))).toFixed(2)),
      });
    }
    return result;
  }, [baseAqi, baseNoise, basePh]);

  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">7-Day Historical Trend</h5>
      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 8, fill: '#64748b' }} 
              interval={1}
            />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1f2e', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '10px'
              }}
              itemStyle={{ padding: '0px' }}
            />
            <Line type="monotone" dataKey="aqi" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} name="AQI" />
            <Line type="monotone" dataKey="noise" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} name="Noise" />
            <Line type="monotone" dataKey="ph" stroke="#06b6d4" strokeWidth={2} dot={{ r: 2 }} name="pH" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const getWaterQualityColor = (ph: number) => {
  if (ph < 6.0 || ph > 9.0) return '#ef4444'; // Red (Unsafe)
  if (ph < 6.5 || ph > 7.5) return '#f59e0b'; // Amber (Moderate)
  return '#10b981'; // Emerald (Safe)
};

const DashboardHeatMap = ({ pollutionAreas, mapCenter }: { pollutionAreas: any[], mapCenter: [number, number] }) => {
  const heatPoints = useMemo(() => {
    const validAreas = (pollutionAreas || []).filter(area =>
      typeof area.lat === 'number' &&
      typeof area.lng === 'number' &&
      !Number.isNaN(area.lat) &&
      !Number.isNaN(area.lng)
    );

    return validAreas.length > 0 ? validAreas : buildBaselinePollutionData();
  }, [pollutionAreas]);

  const indiaCenter: [number, number] = [22.9734, 78.6569];
  const safeCenter: [number, number] = useMemo(() => {
    if (
      typeof mapCenter?.[0] === 'number' &&
      typeof mapCenter?.[1] === 'number' &&
      !Number.isNaN(mapCenter[0]) &&
      !Number.isNaN(mapCenter[1])
    ) {
      return mapCenter;
    }
    return indiaCenter;
  }, [mapCenter]);

  return (
    <div className="relative w-full h-full">
      <MapContainer center={safeCenter} zoom={5} minZoom={4} maxZoom={8} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {heatPoints.map((area, idx) => {
          const aqi = Number(area.aqi) || 120;
          const severityColor = aqi >= 260 ? '#ef4444' : aqi >= 180 ? '#f97316' : '#eab308';
          const radius = Math.max(8000, Math.min(32000, aqi * 110));
          const driftLat = area.lat + (((idx % 5) - 2) * 0.04);
          const driftLng = area.lng + ((((idx * 7) % 5) - 2) * 0.05);
          const radarBands = [
            { factor: 2.6, opacity: 0.018 },
            { factor: 2.1, opacity: 0.03 },
            { factor: 1.7, opacity: 0.045 },
            { factor: 1.35, opacity: 0.065 },
            { factor: 1.05, opacity: 0.085 },
            { factor: 0.8, opacity: 0.11 }
          ];

          return (
            <React.Fragment key={`${area.name || 'heat'}-${idx}`}>
              <Circle
                center={[driftLat, driftLng]}
                radius={radius * 2.2}
                pathOptions={{
                  color: 'transparent',
                  fillColor: severityColor,
                  fillOpacity: 0.012
                }}
              />
              <Circle
                center={[driftLat, driftLng]}
                radius={radius * 1.75}
                pathOptions={{
                  color: 'transparent',
                  fillColor: severityColor,
                  fillOpacity: 0.022
                }}
              />
              {radarBands.map((band) => (
                <Circle
                  key={`${area.name || 'band'}-${idx}-${band.factor}`}
                  center={[area.lat, area.lng]}
                  radius={radius * band.factor}
                  pathOptions={{
                    color: 'transparent',
                    fillColor: severityColor,
                    fillOpacity: band.opacity
                  }}
                />
              ))}
              <CircleMarker
                center={[area.lat, area.lng]}
                radius={4.5}
                pathOptions={{
                  color: '#ffffff',
                  weight: 1,
                  fillColor: severityColor,
                  fillOpacity: 0.95
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold">{area.name || 'Unknown Area'}</p>
                    <p>AQI: {aqi}</p>
                    <p>PM2.5: {area.pm25 || '--'}</p>
                  </div>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(239,68,68,0.08),transparent_45%),radial-gradient(circle_at_70%_60%,rgba(234,179,8,0.06),transparent_40%)]" />
    </div>
  );
};

const RealMap = ({ 
  sensors, 
  readings, 
  pinnedLocation, 
  onMapClick, 
  mapCenter, 
  mapZoom,
  pollutionAreas = [],
  industrialAreas = [],
  nearbyPoints = [],
  waterStations = [],
  showPollution = false,
  showIndustries = false,
  showWaterQuality = false,
  isLoadingAI = false,
  selectedPoint = null,
  locationInfo = null,
  onClosePopup = () => {},
  onDownloadIndustries = () => {}
}: { 
  sensors: Sensor[], 
  readings: Record<string, Reading[]>,
  pinnedLocation: { lat: number, lng: number } | null,
  onMapClick: (lat: number, lng: number) => void,
  mapCenter: [number, number],
  mapZoom: number,
  pollutionAreas?: any[],
  industrialAreas?: any[],
  nearbyPoints?: any[],
  waterStations?: any[],
  showPollution?: boolean,
  showIndustries?: boolean,
  showWaterQuality?: boolean,
  isLoadingAI?: boolean,
  selectedPoint?: { lat: number, lng: number, type: 'industry' | 'pollution' | 'sensor' } | null,
  locationInfo?: { address?: string, insights?: string } | null,
  onClosePopup?: () => void,
  onDownloadIndustries?: () => void
}) => {
  const safeCenter: [number, number] = useMemo(() => {
    if (mapCenter && typeof mapCenter[0] === 'number' && typeof mapCenter[1] === 'number' && !isNaN(mapCenter[0]) && !isNaN(mapCenter[1])) {
      return mapCenter;
    }
    return [22.9734, 78.6569];
  }, [mapCenter]);

  return (
    <div className="w-full h-full min-h-[400px] rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl z-10 relative">
      <MapContainer center={safeCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={safeCenter} zoom={mapZoom} />
        <MapEvents onMapClick={onMapClick} />
        
        {/* Map Overlay Controls */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          {showIndustries && onDownloadIndustries && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDownloadIndustries(); }}
              className="p-3 bg-[#1a1f2e]/90 backdrop-blur-md border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all shadow-2xl group relative"
              title="Download Visible Industries"
            >
              <Download className="w-5 h-5" />
              <span className="absolute right-full mr-3 px-2 py-1 bg-black text-[10px] rounded opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none">
                Download Visible Industries
              </span>
            </button>
          )}
        </div>

        {/* Selected Point Standalone Popup */}
        {selectedPoint && (
          <Popup 
            position={[selectedPoint.lat, selectedPoint.lng]} 
            eventHandlers={{
              remove: onClosePopup
            }}
            minWidth={280}
          >
            <div className="p-3 bg-[#1a1f2e] text-white rounded-xl max-w-[300px] border border-white/10 shadow-2xl">
              {(() => {
                if (selectedPoint.type === 'industry') {
                  const area = industrialAreas.find(a => a.lat === selectedPoint.lat && a.lng === selectedPoint.lng);
                  if (!area) return <p className="text-xs">Industry data not found.</p>;
                  return (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-500/20 rounded-lg">
                            <Building2 className="w-4 h-4 text-blue-400" />
                          </div>
                          <h4 className="font-bold text-sm text-white">{area.name}</h4>
                        </div>
                        <div className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                          area.complianceStatus === 'Compliant' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : 
                          area.complianceStatus === 'Non-Compliant' ? "bg-red-500/20 text-red-400 border border-red-500/30" : 
                          "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        )}>
                          {area.complianceStatus || 'Unknown'}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Wind className="w-3 h-3 text-emerald-400" />
                            <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">AQI</p>
                          </div>
                          <p className="text-xl font-black text-white">{area.aqi}</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Volume2 className="w-3 h-3 text-blue-400" />
                            <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Noise</p>
                          </div>
                          <p className="text-xl font-black text-white">{area.noise} <span className="text-[10px] font-normal text-slate-500">dB</span></p>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 italic opacity-80 mb-2">{area.description}</p>
                      <HistoricalChart 
                        baseAqi={area.aqi} 
                        baseNoise={area.noise} 
                        basePh={area.waterPh || 7.0} 
                      />
                    </>
                  );
                } else if (selectedPoint.type === 'pollution') {
                  const area = pollutionAreas.find(a => a.lat === selectedPoint.lat && a.lng === selectedPoint.lng);
                  if (!area) return <p className="text-xs">Pollution data not found.</p>;
                  const aqiValue = area.aqi || (area.severity === 'CRITICAL' ? 250 : 150);
                  const style = getAQIStyle(aqiValue);
                  return (
                    <div className="p-1">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-red-500/20 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          </div>
                          <h4 className="font-bold text-sm text-white">{area.name}</h4>
                        </div>
                        <div className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                          area.severity === 'CRITICAL' ? "bg-red-500/20 text-red-500 border border-red-500/30" : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                        )}>
                          {area.severity}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5 group hover:bg-white/10 transition-all">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Wind className="w-3 h-3 text-red-400" />
                            <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">AQI Level</p>
                          </div>
                          <p className="text-xl font-black text-white tracking-tight">{aqiValue}</p>
                          <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-red-500" style={{ width: `${Math.min(100, (aqiValue / 300) * 100)}%` }} />
                          </div>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5 group hover:bg-white/10 transition-all">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Activity className="w-3 h-3 text-orange-400" />
                            <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">PM2.5</p>
                          </div>
                          <p className="text-xl font-black text-white tracking-tight">{area.pm25 || '--'} <span className="text-[10px] font-normal text-slate-500">µg/m³</span></p>
                        </div>
                      </div>

                      <HistoricalChart 
                        baseAqi={aqiValue} 
                        baseNoise={75} 
                        basePh={7.2} 
                      />

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-[10px] bg-white/5 p-2 rounded-lg border border-white/5">
                          <span className="text-slate-400">Carbon Monoxide (CO)</span>
                          <span className="font-bold text-white">{area.co || '--'} ppb</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] bg-white/5 p-2 rounded-lg border border-white/5">
                          <span className="text-slate-400">Nitrogen Dioxide (NO2)</span>
                          <span className="font-bold text-white">{area.no2 || '--'} ppb</span>
                        </div>
                      </div>

                      {area.contributingFactors && area.contributingFactors.length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Source Impact Analysis</p>
                            <span className="text-[8px] text-blue-400 font-bold uppercase tracking-widest">Estimated Contribution</span>
                          </div>
                          <div className="space-y-3">
                            {area.contributingFactors.map((factor: string, idx: number) => {
                              // Generate a pseudo-random but deterministic impact percentage based on the factor name
                              const impact = 40 + (factor.length * 7) % 50;
                              return (
                                <div key={idx} className="space-y-1.5">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                      <span className="text-[10px] text-slate-300 font-medium">{factor}</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-white">{impact}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${impact}%` }}
                                      transition={{ duration: 1, delay: idx * 0.1 }}
                                      className={cn(
                                        "h-full rounded-full",
                                        impact > 75 ? "bg-red-500" : impact > 50 ? "bg-orange-500" : "bg-blue-500"
                                      )}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <p className="text-[10px] text-slate-400 italic opacity-80 leading-relaxed border-t border-white/10 pt-3">{area.description}</p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </Popup>
        )}
        
        {/* AI Scanning Overlay */}
        <AnimatePresence>
          {isLoadingAI && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-[#1a1f2e]/90 backdrop-blur-md border border-emerald-500/30 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
            >
              <div className="relative">
                <BrainCircuit className="w-5 h-5 text-emerald-500" />
                <div className="absolute inset-0 bg-emerald-500/20 blur-lg animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">AI Scanning</span>
                <span className="text-[9px] text-slate-400 font-medium">Generating global environmental insights...</span>
              </div>
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin ml-2" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Nearby Points from Search */}
        {nearbyPoints.map((point, i) => {
          const style = getAQIStyle(point.aqi);
          return (
            <Marker
              key={`nearby-${i}-${point.lat}-${point.lng}`}
              position={[point.lat, point.lng]}
              icon={L.divIcon({
                className: 'custom-aqi-icon',
                html: `
                  <div class="${point.type === 'Industrial' ? 'aqi-pulse' : ''}" style="
                    background-color: ${style.bg}cc; 
                    width: 48px; 
                    height: 48px; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    color: ${style.text}; 
                    font-weight: 800; 
                    font-size: 15px;
                    border: 2px solid ${style.bg};
                    box-shadow: 0 0 20px ${style.bg}aa;
                    transition: transform 0.2s;
                    backdrop-filter: blur(4px);
                  " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                    ${point.aqi}
                  </div>
                `,
                iconSize: [48, 48],
                iconAnchor: [24, 24]
              })}
            >
              <Popup minWidth={280}>
                <div className="p-3 bg-[#1a1f2e] text-white rounded-xl max-w-[300px] border border-white/10 shadow-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-500/20 rounded-lg">
                        {point.type === 'Industrial' ? <Building2 className="w-4 h-4 text-blue-400" /> : <MapPin className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{point.name}</h4>
                        <p className="text-[10px] text-blue-400 font-medium">{point.type}</p>
                      </div>
                    </div>
                    {point.industryData?.compliance && (
                      <div className={cn(
                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                        point.industryData.compliance.toLowerCase().includes('pass') || point.industryData.compliance.toLowerCase().includes('compliant') ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                      )}>
                        {point.industryData.compliance}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Wind className="w-3 h-3 text-emerald-400" />
                        <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">AQI Level</p>
                      </div>
                      <p className="text-xl font-black text-white tracking-tight">{point.aqi}</p>
                      <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (point.aqi / 300) * 100)}%` }} />
                      </div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Volume2 className="w-3 h-3 text-blue-400" />
                        <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Noise Level</p>
                      </div>
                      <p className="text-xl font-black text-white tracking-tight">{point.noise || '--'} <span className="text-[10px] font-normal text-slate-500">dB</span></p>
                      <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, ((point.noise || 0) / 120) * 100)}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {point.waterPh && (
                      <div className="flex items-center justify-between text-[10px] bg-white/5 p-2 rounded-lg border border-white/5">
                        <div className="flex items-center gap-2">
                          <Droplets className="w-3 h-3 text-cyan-400" />
                          <span className="text-slate-400">Water pH</span>
                        </div>
                        <span className="font-bold text-white">{point.waterPh}</span>
                      </div>
                    )}

                    {point.industryData && (
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                        {point.industryData.emissions && (
                          <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                            <span className="text-[8px] uppercase text-slate-500 block mb-1 font-bold">Primary Emissions</span>
                            <span className="text-[10px] font-bold text-orange-400">{point.industryData.emissions}</span>
                          </div>
                        )}

                        {point.industryData.historicalTrends && (
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 block mb-2 uppercase tracking-widest">AQI Trends</span>
                            <div className="h-16 w-full bg-white/5 rounded-lg p-2">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={point.industryData.historicalTrends}>
                                  <Line type="monotone" dataKey="aqi" stroke="#10b981" strokeWidth={2} dot={false} />
                                  <XAxis dataKey="period" hide />
                                  <YAxis hide domain={['auto', 'auto']} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}

                        {point.industryData.nearbyIndustries && (
                          <div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <Factory className="w-3 h-3 text-orange-400" /> Nearby Industrial Areas
                            </p>
                            <div className="space-y-1.5">
                              {point.industryData.nearbyIndustries.slice(0, 3).map((ind: any, idx: number) => (
                                <div 
                                  key={idx} 
                                  className="flex justify-between items-center text-[9px] bg-white/5 px-3 py-2 rounded-lg border border-white/5 hover:bg-white/10 transition-all cursor-pointer group/ind"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (ind.lat && ind.lng) {
                                      (window as any).leafletMap?.flyTo([ind.lat, ind.lng], 14);
                                    }
                                  }}
                                >
                                  <span className="text-slate-300 font-medium group-hover/ind:text-blue-400 transition-colors">{ind.name}</span>
                                  <span className="text-[8px] font-bold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded uppercase">{ind.type}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {point.type === 'Industrial' && <NoiseForecast point={point} />}
                      </div>
                    )}

                    {point.contributingFactors && point.contributingFactors.length > 0 && (
                      <div className="mb-4">
                        <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wider mb-2">Primary Sources</p>
                        <div className="flex flex-wrap gap-1.5">
                          {point.contributingFactors.map((factor: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[9px] rounded-md border border-blue-500/20">
                              {factor}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-3 border-t border-white/10">
                      <p className="text-[10px] text-slate-400 leading-relaxed italic opacity-80">
                        {point.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {!showWaterQuality && sensors.filter(s => typeof s.lat === 'number' && typeof s.lng === 'number' && !isNaN(s.lat) && !isNaN(s.lng)).map((s) => {
          const lastReading = readings[s.id]?.[readings[s.id].length - 1]?.value || 0;
          const isExceeded = lastReading > s.max_threshold;
          const style = getAQIStyle(lastReading);
          
          return (
            <Marker 
              key={s.id} 
              position={[s.lat, s.lng]} 
              icon={L.divIcon({
                className: 'custom-sensor-icon',
                html: `
                  <div style="
                    background-color: ${isExceeded ? '#ef4444' : '#10b981'}cc; 
                    width: 36px; 
                    height: 36px; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    color: white; 
                    font-weight: 800; 
                    font-size: 12px;
                    border: 2px solid white;
                    box-shadow: 0 0 10px ${isExceeded ? '#ef4444' : '#10b981'}aa;
                    backdrop-filter: blur(4px);
                  ">
                    ${Math.round(lastReading)}
                  </div>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 18]
              })}
            >
              <Popup>
                <div className="p-2 bg-[#1a1f2e] text-white rounded-lg">
                  <h4 className="font-bold text-sm mb-1">{s.name}</h4>
                  <p className="text-[10px] text-blue-400 font-mono mb-2">Station ID: {s.id}</p>
                  <p className="text-xs opacity-70">{s.parameter}: <span className={cn("font-bold", isExceeded ? "text-red-400" : "text-emerald-400")}>{lastReading.toFixed(1)} {s.unit}</span></p>
                  <p className="text-[8px] text-slate-500 mt-2 italic">Data collected directly from this monitoring station.</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {showPollution && pollutionAreas.filter(area => typeof area.lat === 'number' && typeof area.lng === 'number' && !isNaN(area.lat) && !isNaN(area.lng)).map((area, i) => {
          const aqiValue = area.aqi || (area.severity === 'CRITICAL' ? 250 : 150);
          const style = getAQIStyle(aqiValue);
          return (
            <Marker
              key={`poll-${i}-${area.lat}-${area.lng}`}
              position={[area.lat, area.lng]}
              icon={L.divIcon({
                className: 'custom-aqi-icon',
                html: `
                  <div class="aqi-marker-container">
                    <div class="aqi-glow" style="background-color: ${style.bg}44;"></div>
                    <div class="aqi-circle" style="
                      background-color: ${style.bg}; 
                      color: ${style.text}; 
                      border: 2px solid white;
                      box-shadow: 0 0 20px ${style.bg};
                    ">
                      ${aqiValue}
                    </div>
                    <div class="aqi-label">${area.name.split(',')[0]}</div>
                  </div>
                `,
                iconSize: [60, 60],
                iconAnchor: [30, 30]
              })}
            >
              <Popup>
                <div className="p-3 bg-[#1a1f2e] text-white rounded-xl max-w-[280px] border border-white/10 shadow-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-red-500/20 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      </div>
                      <h4 className="font-bold text-sm text-white">{area.name}</h4>
                    </div>
                    <div className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                      area.severity === 'CRITICAL' ? "bg-red-500/20 text-red-500 border border-red-500/30" : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                    )}>
                      {area.severity}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Wind className="w-3 h-3 text-red-400" />
                        <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">AQI Level</p>
                      </div>
                      <p className="text-xl font-black text-white tracking-tight">{aqiValue}</p>
                      <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: `${Math.min(100, (aqiValue / 300) * 100)}%` }} />
                      </div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Activity className="w-3 h-3 text-orange-400" />
                        <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">PM2.5</p>
                      </div>
                      <p className="text-xl font-black text-white tracking-tight">{area.pm25 || '--'} <span className="text-[10px] font-normal text-slate-500">µg/m³</span></p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-[10px] bg-white/5 p-2 rounded-lg border border-white/5">
                      <span className="text-slate-400">Carbon Monoxide (CO)</span>
                      <span className="font-bold text-white">{area.co || '--'} ppb</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] bg-white/5 p-2 rounded-lg border border-white/5">
                      <span className="text-slate-400">Nitrogen Dioxide (NO2)</span>
                      <span className="font-bold text-white">{area.no2 || '--'} ppb</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 italic opacity-80 leading-relaxed border-t border-white/10 pt-3">{area.description}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {showIndustries && industrialAreas.filter(area => typeof area.lat === 'number' && typeof area.lng === 'number' && !isNaN(area.lat) && !isNaN(area.lng)).map((area) => {
          const style = getAQIStyle(area.aqi);
          return (
            <Marker 
              key={area.id || `ind-${area.lat}-${area.lng}`} 
              position={[area.lat, area.lng]}
              icon={L.divIcon({
                className: 'custom-industrial-icon',
                html: `
                  <div class="industrial-pulse" style="
                    background: ${style.bg}cc; 
                    width: 48px; 
                    height: 48px; 
                    border-radius: 12px; 
                    display: flex; 
                    flex-direction: column;
                    align-items: center; 
                    justify-content: center; 
                    border: 2px solid white; 
                    box-shadow: 0 0 20px ${style.bg}aa;
                    color: ${style.text};
                    backdrop-filter: blur(4px);
                  ">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 2px;"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
                    <span style="font-size: 11px; font-weight: 900;">${area.aqi}</span>
                  </div>
                `,
                iconSize: [48, 48],
                iconAnchor: [24, 24]
              })}
              eventHandlers={{
                click: () => {
                  onMapClick(area.lat, area.lng);
                }
              }}
            >
            <Popup minWidth={280}>
              <div className="p-3 bg-[#1a1f2e] text-white rounded-xl max-w-[300px] border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/20 rounded-lg">
                      <Building2 className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{area.name}</h4>
                      {area.type && <p className="text-[9px] text-blue-400 font-bold uppercase tracking-tighter">{area.type}</p>}
                    </div>
                  </div>
                  <div className={cn(
                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                    area.complianceStatus === 'Compliant' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : 
                    area.complianceStatus === 'Non-Compliant' ? "bg-red-500/20 text-red-400 border border-red-500/30" : 
                    "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                  )}>
                    {area.complianceStatus || 'Unknown'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 group hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Wind className="w-3 h-3 text-emerald-400" />
                      <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">AQI Level</p>
                    </div>
                    <p className="text-xl font-black text-white tracking-tight">{area.aqi}</p>
                    <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (area.aqi / 300) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 group hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Volume2 className="w-3 h-3 text-blue-400" />
                      <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Noise Level</p>
                    </div>
                    <p className="text-xl font-black text-white tracking-tight">{area.noise} <span className="text-[10px] font-normal text-slate-500">dB</span></p>
                    <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (area.noise / 120) * 100)}%` }} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] bg-white/5 p-2 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-3 h-3 text-cyan-400" />
                      <span className="text-slate-400">Water pH</span>
                    </div>
                    <span className="font-bold text-white">{area.waterPh}</span>
                  </div>

                  {area.nearbyIndustries && area.nearbyIndustries.length > 0 && (
                    <div className="pt-3 border-t border-white/10">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Factory className="w-3 h-3 text-orange-400" /> Nearby Industrial Areas
                      </p>
                      <div className="space-y-1.5">
                        {area.nearbyIndustries.slice(0, 3).map((ind: any, idx: number) => (
                          <div 
                            key={idx} 
                            className="flex justify-between items-center text-[9px] bg-white/5 px-3 py-2 rounded-lg border border-white/5 hover:bg-white/10 transition-all cursor-pointer group/ind"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (ind.lat && ind.lng) {
                                (window as any).leafletMap?.flyTo([ind.lat, ind.lng], 14);
                              }
                            }}
                          >
                            <span className="text-slate-300 font-medium group-hover/ind:text-blue-400 transition-colors">{ind.name}</span>
                            <span className="text-[8px] font-bold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded uppercase">{ind.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-white/10">
                    <p className="text-[10px] text-slate-400 leading-relaxed italic opacity-80">
                      {area.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex justify-center">
                  <span className="text-[9px] font-bold text-blue-500 animate-pulse uppercase tracking-widest">Click for detailed analysis</span>
                </div>
              </div>
            </Popup>
          </Marker>
        )})}

        {showWaterQuality && waterStations.filter(station => typeof station.lat === 'number' && typeof station.lng === 'number' && !isNaN(station.lat) && !isNaN(station.lng)).map((station) => {
          const phValue = parseFloat(station.ph);
          const color = getWaterQualityColor(phValue);
          return (
            <Marker
              key={station.id || `water-${station.lat}-${station.lng}`}
              position={[station.lat, station.lng]}
              icon={L.divIcon({
                className: 'water-station-icon',
                html: `
                  <div style="
                    background: ${color}; 
                    width: 16px; 
                    height: 16px; 
                    border-radius: 50%; 
                    border: 2px solid white; 
                    box-shadow: 0 0 15px ${color}aa;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  ">
                    <div style="width: 4px; height: 4px; background: white; border-radius: 50%;"></div>
                  </div>
                `,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
              })}
            >
              <Popup>
                <div className="p-2 bg-[#1a1f2e] text-white rounded-lg min-w-[220px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="w-4 h-4" style={{ color }} />
                    <h4 className="font-bold text-sm truncate">{station.name}</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                      <span className="text-[10px] text-slate-400 uppercase">pH Level</span>
                      <span className="text-xs font-bold" style={{ color }}>{station.ph}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                      <span className="text-[10px] text-slate-400 uppercase">Status</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
                        {phValue < 6.0 || phValue > 9.0 ? 'Unsafe' : phValue < 6.5 || phValue > 7.5 ? 'Moderate' : 'Safe'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                      <span className="text-[10px] text-slate-400 uppercase">Turbidity</span>
                      <span className="text-xs font-bold text-blue-300">{station.turbidity} NTU</span>
                    </div>
                    {station.dissolved_oxygen && (
                      <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                        <span className="text-[10px] text-slate-400 uppercase">Dissolved O2</span>
                        <span className="text-xs font-bold text-emerald-300">{station.dissolved_oxygen} mg/L</span>
                      </div>
                    )}
                    {station.bod && (
                      <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                        <span className="text-[10px] text-slate-400 uppercase">BOD</span>
                        <span className="text-xs font-bold text-orange-300">{station.bod} mg/L</span>
                      </div>
                    )}
                    <div className="bg-white/5 p-2 rounded">
                      <span className="text-[10px] text-slate-400 uppercase block mb-1 font-bold">Contaminants</span>
                      <span className="text-[10px] text-slate-200">{station.contaminants}</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <p className="text-[8px] text-slate-500">Source: {station.provider || 'Water Quality Portal'}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {pinnedLocation && typeof pinnedLocation.lat === 'number' && typeof pinnedLocation.lng === 'number' && !isNaN(pinnedLocation.lat) && !isNaN(pinnedLocation.lng) && (
          <>
            <Marker 
              position={[pinnedLocation.lat, pinnedLocation.lng]}
              icon={L.divIcon({
                className: 'pinned-location-icon',
                html: `
                  <div class="pinned-marker">
                    <div class="marker-pin"></div>
                    <div class="marker-pulse"></div>
                  </div>
                `,
                iconSize: [30, 30],
                iconAnchor: [15, 30]
              })}
            >
              <Popup>
                <div className="p-3 bg-[#1a1f2e] text-white rounded-xl border border-white/10 shadow-2xl min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-blue-500/20 rounded-lg">
                      <MapPin className="w-4 h-4 text-blue-500" />
                    </div>
                    <h4 className="font-bold text-sm">Pinned Location</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 leading-relaxed">{locationInfo?.address || `${pinnedLocation.lat.toFixed(4)}, ${pinnedLocation.lng.toFixed(4)}`}</p>
                    <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                      <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest mb-1">AI Insights</p>
                      <p className="text-[10px] text-blue-400 italic">{locationInfo?.insights || "Analyzing environmental data..."}</p>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
            <Circle 
              center={[pinnedLocation.lat, pinnedLocation.lng]} 
              radius={5000} 
              pathOptions={{ 
                fillColor: '#3b82f6', 
                fillOpacity: 0.1, 
                color: '#3b82f6', 
                weight: 1, 
                dashArray: '5, 10' 
              }} 
            />
          </>
        )}

        {/* Water Quality Legend */}
        {showWaterQuality && (
          <div className="absolute bottom-6 left-6 z-[1000] bg-[#1a1f2e]/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl">
            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Water pH Legend</h5>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                <span className="text-[10px] text-slate-300 font-medium">Safe (6.5 - 7.5)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]" />
                <span className="text-[10px] text-slate-300 font-medium">Moderate (6.0-6.5 or 7.5-9.0)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />
                <span className="text-[10px] text-slate-300 font-medium">Unsafe (&lt; 6.0 or &gt; 9.0)</span>
              </div>
            </div>
          </div>
        )}
      </MapContainer>
    </div>
  );
};

export default function App() {
  const AUTH_SESSION_KEY = 'prithvinet_auth_session';

  const getInitialTheme = (): 'dark' | 'light' => {
    if (typeof window === 'undefined') return 'dark';
    const savedTheme = window.localStorage.getItem('theme');
    return savedTheme === 'light' ? 'light' : 'dark';
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('Citizen');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMapsMenu, setShowMapsMenu] = useState(false);
  const profileMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [profileMenuPosition, setProfileMenuPosition] = useState<{ top: number; right: number }>({ top: 72, right: 24 });
  const [showCopilot, setShowCopilot] = useState(false);
  const [pollutionLimits, setPollutionLimits] = useState([
    { id: 'aqi-res', param: 'AQI (Residential)', limit: '100', unit: 'Index' },
    { id: 'aqi-ind', param: 'AQI (Industrial)', limit: '150', unit: 'Index' },
    { id: 'water-ph', param: 'Water pH', limit: '6.5 - 7.5', unit: 'pH' },
    { id: 'noise-day', param: 'Noise (Day)', limit: '55', unit: 'dB' },
    { id: 'noise-night', param: 'Noise (Night)', limit: '45', unit: 'dB' },
  ]);
  const [editingLimit, setEditingLimit] = useState<any>(null);
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');
  const [isDashboardSearching, setIsDashboardSearching] = useState(false);
  
  // Regional Offices State
  const [regionalOffices, setRegionalOffices] = useState([
    { id: 1, name: 'North Region (Delhi)', officer: 'Dr. Rajesh Kumar', industries: 145, compliance: '82%', status: 'Active' },
    { id: 2, name: 'West Region (Mumbai)', officer: 'Smt. Sunita Deshmukh', industries: 210, compliance: '75%', status: 'Active' },
    { id: 3, name: 'South Region (Bengaluru)', officer: 'Shri K. Venkatesh', industries: 180, compliance: '88%', status: 'Active' },
    { id: 4, name: 'East Region (Kolkata)', officer: 'Dr. Anirban Bose', industries: 120, compliance: '68%', status: 'Warning' },
  ]);
  const [regionalOfficeSearchQuery, setRegionalOfficeSearchQuery] = useState('');
  const [showCreateOfficeModal, setShowCreateOfficeModal] = useState(false);
  const [newOffice, setNewOffice] = useState({ name: '', officer: '', industries: 0, compliance: '100%', status: 'Active' });
  const [regionIndustries, setRegionIndustries] = useState([
    { id: 1, name: 'Apex Textiles', type: 'Manufacturing', status: 'Compliant' },
    { id: 2, name: 'Global Pharma', type: 'Chemical', status: 'Warning' },
    { id: 3, name: 'Steel Works Ltd', type: 'Heavy Metal', status: 'Compliant' },
  ]);
  const [regionTeams, setRegionTeams] = useState([
    { id: 1, name: 'Team Alpha', members: 4, assignment: 'Industrial Zone A' },
    { id: 2, name: 'Team Beta', members: 3, assignment: 'River Basin North' },
    { id: 3, name: 'Team Gamma', members: 5, assignment: 'Special Drive - Noise' },
  ]);
  const [showAddIndustryModal, setShowAddIndustryModal] = useState(false);
  const [showAssignTeamModal, setShowAssignTeamModal] = useState(false);
  const [newRegionIndustry, setNewRegionIndustry] = useState({ name: '', type: '', status: 'Compliant' });
  const [newTeamAssignment, setNewTeamAssignment] = useState({ teamName: '', members: 3, area: '' });

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showRoleAccess, setShowRoleAccess] = useState(false);
  const [isLandingDark, setIsLandingDark] = useState(false);
  const [dashboardTheme, setDashboardTheme] = useState<'dark' | 'light'>(getInitialTheme);
  const [demoCredentials, setDemoCredentials] = useState<DemoCredential[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [readings, setReadings] = useState<Record<string, Reading[]>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [simulatorControls, setSimulatorControls] = useState({
    industrialGrowth: 50,
    trafficDensity: 50,
    wasteManagement: 50,
    greenCover: 50,
  });
  const [simulationResult, setSimulationResult] = useState<{
    aqi: number;
    noise: number;
    ph: number;
    risk: 'Low' | 'Moderate' | 'High' | 'Critical';
    summary: string;
  } | null>(null);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ email: string; role: UserRole } | null>(null);
  const [authToken, setAuthToken] = useState('');

  useEffect(() => {
    installGlobalApiDebugLogging('main-app');
  }, []);

  useEffect(() => {
    try {
      const rawSession = window.localStorage.getItem(AUTH_SESSION_KEY);
      if (!rawSession) return;

      const parsed = JSON.parse(rawSession) as {
        email?: string;
        role?: UserRole;
        token?: string;
      };

      if (!parsed?.email || !parsed?.role || !parsed?.token) {
        window.localStorage.removeItem(AUTH_SESSION_KEY);
        return;
      }

      setCurrentUser({
        email: parsed.email.trim().toLowerCase(),
        role: parsed.role,
      });
      setUserRole(parsed.role);
      setAuthToken(parsed.token);
      setIsLoggedIn(true);
    } catch {
      window.localStorage.removeItem(AUTH_SESSION_KEY);
    }
  }, []);

  const districtStateMap: Record<string, string> = {
    raipur: 'Chhattisgarh',
    northraipur: 'Chhattisgarh',
    southraipur: 'Chhattisgarh',
    durg: 'Chhattisgarh',
    korba: 'Chhattisgarh',
    bilaspur: 'Chhattisgarh',
    raigarh: 'Chhattisgarh',
    ranchi: 'Jharkhand',
    bokaro: 'Jharkhand',
    dhanbad: 'Jharkhand',
  };

  const toTitleCase = (value: string) =>
    value
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

  const dashboardStateName = useMemo(() => {
    const email = (currentUser?.email || '').trim().toLowerCase();
    if (!email.includes('@')) return 'State';

    const local = email.split('@')[0];
    const tokens = local.split(/[_\-.]+/).filter(Boolean);
    const lastToken = tokens[tokens.length - 1] || local;
    const stripDirectionalPrefix = (value: string) =>
      value.replace(/^(north|south|east|west|central|new)/, '');

    const candidates = [
      local,
      stripDirectionalPrefix(local),
      lastToken,
      stripDirectionalPrefix(lastToken),
    ]
      .map((item) => item.replace(/[^a-z]/g, ''))
      .filter(Boolean);

    if (userRole === 'Super Admin') {
      const stateToken = candidates[0] || 'state';
      return toTitleCase(stateToken);
    }

    for (const key of candidates) {
      if (districtStateMap[key]) return districtStateMap[key];
    }

    const fuzzyMatch = Object.keys(districtStateMap).find((key) =>
      candidates.some((candidate) => candidate.includes(key) || key.includes(candidate))
    );
    if (fuzzyMatch) return districtStateMap[fuzzyMatch];

    return 'State';
  }, [currentUser?.email, userRole]);

  const dashboardStateLogo = useMemo(() => {
    const logoByState: Record<string, string> = {
      Chhattisgarh: 'https://enviscecb.org/images/envis_logo.jpg',
      Jharkhand: 'https://upload.wikimedia.org/wikipedia/commons/3/35/Seal_of_Jharkhand.svg',
    };

    return logoByState[dashboardStateName] || 'https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg';
  }, [dashboardStateName]);

  const stateCapitals: Record<string, string> = {
    chhattisgarh: 'raipur',
    bihar: 'patna',
    jharkhand: 'ranchi',
    haryana: 'chandigarh',
  };

  const districtToCity: Record<string, string> = {
    raipur: 'raipur',
    northraipur: 'raipur',
    southraipur: 'raipur',
    durg: 'durg',
    patna: 'patna',
    ranchi: 'ranchi',
  };

  const cityCoordinates: Record<string, [number, number]> = {
    raipur: [21.2514, 81.6296],
    bhilai: [21.1938, 81.3509],
    ranchi: [23.3441, 85.3096],
    patna: [25.5941, 85.1376],
    chandigarh: [30.7333, 76.7794],
    durg: [21.1904, 81.2849],
  };

  const stateCapitalCoordinates: Record<string, [number, number]> = {
    chhattisgarh: [21.2514, 81.6296],
    jharkhand: [23.3441, 85.3096],
    bihar: [25.5941, 85.1376],
    haryana: [30.7333, 76.7794],
  };

  const normalizeRegionToken = (token: string) =>
    token
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/^(north|south|east|west|central|new)/, '');

  const getDashboardTargetCity = useMemo(() => {
    const email = (currentUser?.email || '').trim().toLowerCase();
    if (!email.includes('@')) return 'raipur';

    const local = email.split('@')[0];

    if (userRole === 'Super Admin') {
      const stateKey = normalizeRegionToken(local);
      return stateCapitals[stateKey] || 'raipur';
    }

    const tokens = local.split(/[_\-.]+/).filter(Boolean);
    const candidates = [local, ...tokens]
      .map(normalizeRegionToken)
      .filter(Boolean);

    for (const candidate of candidates) {
      if (districtToCity[candidate]) return districtToCity[candidate];
    }

    const fuzzy = Object.keys(districtToCity).find((district) =>
      candidates.some((c) => c.includes(district) || district.includes(c))
    );
    if (fuzzy) return districtToCity[fuzzy];

    return 'raipur';
  }, [currentUser?.email, userRole]);

  // Search & Pin State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [pinnedLocation, setPinnedLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [locationInfo, setLocationInfo] = useState<{ address?: string, insights?: string } | null>(null);
  const [loadingLocationInfo, setLoadingLocationInfo] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([22.9734, 78.6569]);
  const [mapZoom, setMapZoom] = useState(5);

  // New states for pollution and industrial layers
  const [loadingPollution, setLoadingPollution] = useState(false);
  const [loadingIndustries, setLoadingIndustries] = useState(false);
  const [pollutionAreas, setPollutionAreas] = useState<any[]>([]);
  const [industrialAreas, setIndustrialAreas] = useState<any[]>([]);
  const [waterStations, setWaterStations] = useState<any[]>([]);
  const [loadingWaterQuality, setLoadingWaterQuality] = useState(false);
  const [showPollutionMap, setShowPollutionMap] = useState(false);
  const [showIndustriesMap, setShowIndustriesMap] = useState(false);
  const [showWaterQualityMap, setShowWaterQualityMap] = useState(false);
  const [areaPollutionInfo, setAreaPollutionInfo] = useState<any>(null);
  const [dashboardFocus, setDashboardFocus] = useState<{ city: string; lat: number; lon: number } | null>(null);
  const [nearbyPoints, setNearbyPoints] = useState<any[]>([]);
  const [regionIndustriesFeed, setRegionIndustriesFeed] = useState<RegionIndustry[]>([]);
  const prevNoiseRef = useRef<number>(65);
  const prevPhRef = useRef<number>(7.1);
  const [myIndustryData, setMyIndustryData] = useState<any>({
    id: 'IND-001',
    name: 'Prithvi Chemicals Ltd.',
    type: 'Chemical Manufacturing',
    lat: 19.0760,
    lng: 72.8777,
    aqi: 145,
    noise: 72,
    waterPh: 6.8,
    complianceStatus: 'Warning',
    description: 'Specialized in industrial chemical production and processing.',
    lastUpdated: new Date().toISOString(),
    emissions: 'NO2, SO2',
    historicalTrends: [
      { period: 'Jan', aqi: 120 },
      { period: 'Feb', aqi: 135 },
      { period: 'Mar', aqi: 145 },
    ]
  });

  useEffect(() => {
    document.body.setAttribute('data-theme', dashboardTheme);
    window.localStorage.setItem('theme', dashboardTheme);
  }, [dashboardTheme]);

  useEffect(() => {
    // Demo credentials endpoint is unavailable in this deployment.
    // Keep login UI stable with empty credentials instead of producing 404 console noise.
    setDemoCredentials([]);
  }, []);

  useEffect(() => {
    // Get user location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude)) {
            setMapCenter([latitude, longitude]);
            setMapZoom(12);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    // Set fallback dashboard data immediately so the chart is never blank
    if (!areaPollutionInfo) {
      setAreaPollutionInfo({
        city: 'Raipur, India',
        state: 'Chhattisgarh',
        country: 'India',
        aqi: 340,
        status: 'Moderate',
        pm25: 145,
        pm10: 198,
        no2: 42,
        so2: 28,
        o3: 18,
        co: 1.2,
        bc: 0.0,
        noiseLevel: 68,
        waterPh: 7.2,
        complianceStatus: 'Compliant',
        source: 'OpenAQ Live Feed',
        details: {
          'PM2.5': '145 µg/m³',
          'PM10': '198 µg/m³',
          'NO2': '42 ppb',
          'SO2': '28 ppb',
          'O3': '18 ppb',
          'CO': '1.2 ppm'
        }
      });
    }
    if (pollutionAreas.length === 0) generateGlobalData('pollution');
    if (industrialAreas.length === 0) generateGlobalData('industries');
  }, []);

  useEffect(() => {
    if (!areaPollutionInfo && pollutionAreas.length > 0) {
      const delhi = pollutionAreas.find(a => a.name.includes('Delhi')) || pollutionAreas[0];
      setAreaPollutionInfo({
        city: delhi.name,
        state: delhi.state || 'Delhi',
        country: delhi.country || 'India',
        aqi: delhi.aqi,
        status: delhi.aqi > 200 ? 'Critical' : delhi.aqi > 100 ? 'Moderate' : 'Good',
        pm25: Number(delhi.pm25 || 145),
        pm10: Number(delhi.pm10 || 198),
        no2: Number(delhi.no2 || 42),
        so2: Number(delhi.so2 || 28),
        o3: Number(delhi.o3 || 18),
        co: Number(delhi.co || 1.2),
        bc: Number(delhi.bc || 0.0),
        noiseLevel: delhi.noise || 65,
        waterPh: delhi.waterPh || 7.2,
        complianceStatus: delhi.complianceStatus || 'Compliant',
        source: 'OpenAQ Live Feed',
        details: {
          'PM2.5': '145 µg/m³',
          'PM10': '198 µg/m³',
          'NO2': '42 ppb',
          'SO2': '28 ppb',
          'O3': '18 ppb',
          'CO': '1.2 ppm'
        }
      });
    }
  }, [pollutionAreas, areaPollutionInfo]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const focusedCity = dashboardFocus?.city?.trim();
    const targetCity = (focusedCity || getDashboardTargetCity).toLowerCase();
    const stateKey = dashboardStateName.toLowerCase();
    const resolvedCoordinates = dashboardFocus
      ? [dashboardFocus.lat, dashboardFocus.lon]
      : cityCoordinates[targetCity] ||
        stateCapitalCoordinates[stateKey] ||
        [21.2514, 81.6296];

    const [lat, lon] = resolvedCoordinates;
    setMapCenter([lat, lon]);
    setMapZoom(9);

    const fetchEnvironmentData = async () => {
      try {
        const [aqiRes, envRes] = await Promise.all([
          fetch(apiUrl(`/api/aqi?city=${encodeURIComponent(toTitleCase(targetCity))}`)),
          fetch(apiUrl(`/api/environment-data?lat=${lat}&lon=${lon}`)),
        ]);

        if (!aqiRes.ok) throw new Error('Failed to fetch AQI data');
        if (!envRes.ok) throw new Error('Failed to fetch environment data');

        const aqiData = await aqiRes.json();
        const envData = await envRes.json();

        const aqi = Number(aqiData?.aqi || 0);
        const status = String(aqiData?.aqi_status || 'Unknown');
        const previousNoise = Number(prevNoiseRef.current);
        const previousPh = Number(prevPhRef.current);
        const noise = typeof envData?.noise === 'number' ? Number(envData.noise) : (Number.isFinite(previousNoise) ? previousNoise : 0);
        const waterPh = typeof envData?.ph === 'number' ? Number(envData.ph) : (Number.isFinite(previousPh) ? previousPh : 0);
        const pm25 = Number(aqiData?.pm25 || envData?.pm2_5 || 0);
        const pm10 = Number(aqiData?.pm10 || envData?.pm10 || 0);
        const no2 = Number(aqiData?.no2 || envData?.no2 || 0);
        const so2 = Number(aqiData?.so2 || envData?.so2 || 0);
        const o3 = Number(aqiData?.o3 || envData?.o3 || 0);
        const co = Number(aqiData?.co || envData?.co || 0);
        const bc = Number(aqiData?.bc || envData?.bc || 0);

        setAreaPollutionInfo((prev: any) => ({
          ...(prev || {}),
          city: `${toTitleCase(targetCity)}, India`,
          state: dashboardStateName,
          country: 'India',
          aqi,
          status,
          pm25,
          pm10,
          no2,
          so2,
          o3,
          co,
          bc,
          noiseLevel: noise,
          waterPh,
          complianceStatus: aqi > 200 || noise > 80 || waterPh < 6.5 || waterPh > 7.5 ? 'Violation' : aqi > 100 || noise > 70 ? 'Warning' : 'Compliant',
          source: 'OpenAQ Live Feed',
          details: {
            ...(prev?.details || {}),
            'PM2.5': `${pm25.toFixed(1)} µg/m³`,
            'PM10': `${pm10.toFixed(1)} µg/m³`,
            'NO2': `${no2.toFixed(2)} ppb`,
            'SO2': `${so2.toFixed(2)} ppb`,
            'O3': `${o3.toFixed(2)} ppb`,
            'CO': `${co.toFixed(2)} ppm`,
            'BC': `${bc.toFixed(2)} µg/m³`,
            'AQI Scale': `${aqi}/500`,
          },
        }));

        prevNoiseRef.current = noise;
        prevPhRef.current = waterPh;
      } catch (err) {
        console.error('Environment data fetch error:', err);
      }
    };

    fetchEnvironmentData();
    const intervalId = window.setInterval(fetchEnvironmentData, 10000);
    return () => window.clearInterval(intervalId);
  }, [isLoggedIn, getDashboardTargetCity, dashboardStateName, dashboardFocus]);

  useEffect(() => {
    if (!isLoggedIn || !currentUser?.email) {
      setRegionIndustriesFeed([]);
      return;
    }

    const fetchRegionIndustries = async () => {
      try {
        const params = new URLSearchParams({
          email: currentUser.email,
          role: userRole,
        });

        const response = await fetch(apiUrl(`/api/industries/by-region?${params.toString()}`));
        if (!response.ok) throw new Error('Failed to fetch regional industries');

        const data = await response.json();
        const normalized = Array.isArray(data)
          ? data.map((item: any) => {
              const numericAqi = Number(item?.aqi);
              const resolvedAqi = Number.isFinite(numericAqi)
                ? numericAqi
                : Number(areaPollutionInfo?.aqi || 135);

              return {
                ...item,
                aqi: resolvedAqi,
                name: item?.name || item?.industry_name || 'Industry Unit',
                complianceStatus: item?.complianceStatus || item?.compliance_status || 'Compliant',
              };
            })
          : [];

        setRegionIndustriesFeed(normalized);

        // Use filtered backend feed as the source of truth for industry markers.
        const mapReadyIndustries = normalized.filter((item: any) =>
          typeof item?.lat === 'number' && typeof item?.lng === 'number' && !isNaN(item.lat) && !isNaN(item.lng)
        );
        setIndustrialAreas(mapReadyIndustries);
      } catch (err) {
        console.error('Regional industries fetch error:', err);
        setRegionIndustriesFeed([]);
      }
    };

    fetchRegionIndustries();
  }, [isLoggedIn, currentUser?.email, userRole, areaPollutionInfo?.aqi]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const normalizeSeverity = (severity: string): Alert['severity'] => {
      const key = String(severity || '').toUpperCase();
      if (key === 'CRITICAL') return 'CRITICAL';
      if (key === 'HIGH') return 'HIGH';
      if (key === 'MEDIUM') return 'MEDIUM';
      return 'LOW';
    };

    const fetchDynamicAlerts = async () => {
      try {
        const cityName = String(areaPollutionInfo?.city || 'Raipur').split(',')[0].trim() || 'Raipur';
        const response = await fetch(apiUrl(`/api/alerts?lat=${mapCenter[0]}&lon=${mapCenter[1]}&city=${encodeURIComponent(cityName)}`));
        if (!response.ok) throw new Error('Failed to fetch alerts');

        const data = await response.json();
        if (!Array.isArray(data)) return;

        const mapped = data.map((item: any) => ({
          sensorId: item?.type || 'ENV',
          value: 0,
          severity: normalizeSeverity(item?.severity),
          timestamp: new Date().toISOString(),
          message: item?.message || 'Threshold violation detected',
          type: item?.type || 'ENV',
        })) as Alert[];

        const localAlerts: Alert[] = [];
        const localPh = Number(areaPollutionInfo?.waterPh);
        if (Number.isFinite(localPh) && (localPh < 6.5 || localPh > 7.5)) {
          localAlerts.push({
            sensorId: 'Water pH',
            value: localPh,
            severity: 'HIGH',
            timestamp: new Date().toISOString(),
            message: `Water Quality Alert: Unsafe pH level detected (${localPh.toFixed(2)})`,
            type: 'Water pH',
          });
        }

        setAlerts((prev) => {
          const liveAlerts = prev.filter((a) => !a.message);
          const merged = [...localAlerts, ...mapped, ...liveAlerts];
          const unique = merged.filter((alert, index, arr) =>
            arr.findIndex((x) => x.type === alert.type && x.message === alert.message) === index
          );
          return unique.slice(0, 10);
        });
      } catch (err) {
        console.error('Dynamic alerts fetch error:', err);
      }
    };

    fetchDynamicAlerts();
    const intervalId = window.setInterval(fetchDynamicAlerts, 10000);
    return () => window.clearInterval(intervalId);
  }, [isLoggedIn, mapCenter, areaPollutionInfo?.city, areaPollutionInfo?.waterPh]);

  const dashboardComplianceStatus = useMemo(() => {
    const aqi = Number(areaPollutionInfo?.aqi || 0);
    const noise = Number(areaPollutionInfo?.noiseLevel || 0);
    const ph = Number(areaPollutionInfo?.waterPh || 0);

    if (aqi > 200) return 'Violation';
    if (aqi > 100) return 'Warning';
    if (noise > 80) return 'Violation';
    if (noise > 70) return 'Warning';
    if (ph < 6.5 || ph > 7.5) return 'Violation';
    return 'Compliant';
  }, [areaPollutionInfo?.aqi, areaPollutionInfo?.noiseLevel, areaPollutionInfo?.waterPh]);

  useEffect(() => {
    const rolePermissions: Record<UserRole, View[]> = {
      'Super Admin': ['dashboard', 'map', 'industries', 'waterquality', 'alerts', 'simulator', 'pollutionmap', 'globalmap', 'system-mgmt', 'master-data', 'iot-monitoring'],
      'Regional Officer': ['dashboard', 'map', 'industries', 'waterquality', 'alerts', 'region-mgmt', 'iot-monitoring'],
      'Monitoring Team': ['dashboard', 'map', 'waterquality', 'alerts', 'data-collection', 'iot-monitoring'],
      'Industry User': ['dashboard', 'industries', 'alerts', 'compliance-reporting', 'iot-monitoring'],
      'Citizen': ['dashboard', 'waterquality', 'complaints', 'iot-monitoring']
    };

    if (!rolePermissions[userRole].includes(currentView)) {
      setCurrentView('dashboard');
    }
  }, [userRole]);

  useEffect(() => {
    if (currentView === 'pollutionmap') {
      setShowPollutionMap(true);
      setShowIndustriesMap(false);
      if (pollutionAreas.length === 0) generateGlobalData('pollution');
    } else if (currentView === 'industries') {
      setShowIndustriesMap(true);
      setShowPollutionMap(false);
      if (industrialAreas.length === 0) generateGlobalData('industries');
    } else if (currentView === 'globalmap' || currentView === 'map') {
      setShowPollutionMap(true);
      setShowIndustriesMap(true);
      if (pollutionAreas.length === 0) generateGlobalData('pollution');
      if (industrialAreas.length === 0) generateGlobalData('industries');
    } else {
      setShowPollutionMap(false);
      setShowIndustriesMap(false);
    }
    
    if (currentView === 'waterquality') {
      setShowWaterQualityMap(true);
      if (waterStations.length === 0) fetchWaterQuality();
    } else {
      setShowWaterQualityMap(false);
    }
  }, [currentView]);

  useEffect(() => {
    if (!showProfileMenu) return;

    const updateProfileMenuPosition = () => {
      const trigger = profileMenuTriggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      setProfileMenuPosition({
        top: rect.bottom + 12,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    };

    updateProfileMenuPosition();
    window.addEventListener('resize', updateProfileMenuPosition);
    window.addEventListener('scroll', updateProfileMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateProfileMenuPosition);
      window.removeEventListener('scroll', updateProfileMenuPosition, true);
    };
  }, [showProfileMenu]);

  const handleUpdateCompliance = (status: 'Compliant' | 'Non-Compliant' | 'Warning') => {
    setMyIndustryData(prev => ({
      ...prev,
      complianceStatus: status,
      lastUpdated: new Date().toISOString()
    }));
    
    // Add an alert for the change
    const newAlert: Alert = {
      sensorId: 'MY-IND',
      value: 0,
      severity: status === 'Non-Compliant' ? 'HIGH' : status === 'Warning' ? 'MEDIUM' : 'LOW',
      timestamp: new Date().toISOString()
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const fetchWaterQuality = async () => {
    setLoadingWaterQuality(true);
    try {
      const res = await fetch(apiUrl(`/api/water-quality?lat=${mapCenter[0]}&lng=${mapCenter[1]}&within=500`));
      if (!res.ok) throw new Error('Failed to fetch water quality');
      const data = await res.json();
      setWaterStations(data);
    } catch (err) {
      console.error("Error fetching water quality:", err);
      // Local fallback to ensure UI doesn't break
      setWaterStations([
        { id: 'IN-WQP-01', name: 'Ganges River at Varanasi', lat: 25.3176, lng: 83.0062, ph: 8.4, turbidity: 45.0, contaminants: 'Coliform: High', dissolved_oxygen: 6.2, bod: 4.5 },
        { id: 'IN-WQP-02', name: 'Yamuna River at Delhi', lat: 28.6139, lng: 77.2090, ph: 7.2, turbidity: 35.0, contaminants: 'Industrial Waste', dissolved_oxygen: 1.5, bod: 12.0 },
        { id: 'IN-WQP-03', name: 'Narmada River at Jabalpur', lat: 23.1815, lng: 79.9864, ph: 7.9, turbidity: 15.0, contaminants: 'None detected', dissolved_oxygen: 7.5, bod: 1.2 }
      ]);
    } finally {
      setLoadingWaterQuality(false);
    }
  };

  const generateGlobalData = async (type: 'pollution' | 'industries') => {
    if (type === 'pollution') setLoadingPollution(true);
    else setLoadingIndustries(true);
    try {
      // Endpoint /api/ai/generate-global-data is not available in current backend.
      // Use deterministic baseline datasets so the dashboard remains functional.
      if (type === 'pollution') {
        setPollutionAreas(buildBaselinePollutionData());
      } else {
        setIndustrialAreas(buildBaselineIndustriesData());
      }
    } catch (err) {
      console.error(`Error generating ${type} data:`, err);
      // Set fallback data to ensure UI never shows empty state
      if (type === 'pollution') {
        setPollutionAreas(buildBaselinePollutionData());
      } else {
        setIndustrialAreas(buildBaselineIndustriesData());
      }
    } finally {
      if (type === 'pollution') setLoadingPollution(false);
      else setLoadingIndustries(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      if (showCopilot) {
        if (pollutionAreas.length === 0) {
          await generateGlobalData('pollution');
          // Small delay between calls to avoid proxy congestion
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        if (industrialAreas.length === 0) {
          await generateGlobalData('industries');
        }
      }
    };
    initData();
  }, [showCopilot]);

  useEffect(() => {
    if (showPollutionMap && pollutionAreas.length === 0) {
      generateGlobalData('pollution');
    }
  }, [showPollutionMap]);

  useEffect(() => {
    if (showIndustriesMap && industrialAreas.length === 0) {
      generateGlobalData('industries');
    }
  }, [showIndustriesMap]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(apiUrl('/api/sensors'));
        if (!res.ok) throw new Error('Failed to fetch sensors');
        const data = await res.json();
        const validatedSensors = Array.isArray(data) ? data.filter(s => 
          typeof s.lat === 'number' && 
          typeof s.lng === 'number' && 
          !isNaN(s.lat) && 
          !isNaN(s.lng)
        ) : [];
        setSensors(validatedSensors);
        if (validatedSensors.length > 0) setSelectedSensor(validatedSensors[0].id);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchData();

    // WebSocket integration is disabled for this dashboard path to avoid
    // attempting ws://localhost:5174/ws and producing client-side errors.
    return () => {};
  }, []);

  const fetchLocationDetails = async (lat: number, lng: number) => {
    setLoadingLocationInfo(true);
    setLocationInfo(null);
    setAreaPollutionInfo(null);
    setNearbyPoints([]);
    try {
      // 1. Reverse Geocoding via Nominatim
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const geoData = await geoRes.json();
      const address = geoData?.display_name || "Unknown Location";
      const addressObj = geoData?.address || {};
      const city = addressObj.city || addressObj.town || addressObj.village || "Unknown Area";
      const state = addressObj.state || "";
      const country = addressObj.country || "";

      setDashboardFocus({ city, lat, lon: lng });

      // 2. Fetch Air Quality via backend OpenWeather proxy
      let openWeatherAirData = null;
      try {
        const airRes = await fetch(apiUrl(`/api/air-quality?lat=${lat}&lon=${lng}&city=${encodeURIComponent(city)}`));
        if (airRes.ok) {
          openWeatherAirData = await airRes.json();
        }
      } catch (e) {
        console.warn("OpenWeather air fetch failed", e);
      }

      // 3. Fetch Nearby Industrial Areas from Overpass API (OSM)
      let industrialAreas = [];
      try {
        const overpassQuery = `
          [out:json][timeout:25];
          (
            node["landuse"="industrial"](around:20000, ${lat}, ${lng});
            way["landuse"="industrial"](around:20000, ${lat}, ${lng});
            relation["landuse"="industrial"](around:20000, ${lat}, ${lng});
          );
          out center 5;
        `;
        const overpassRes = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`);
        const overpassData = await overpassRes.json();
        industrialAreas = overpassData.elements.map((el: any) => ({
          name: el.tags.name || "Industrial Zone",
          lat: el.center ? el.center.lat : el.lat,
          lng: el.center ? el.center.lon : el.lon,
          type: el.tags.industrial || "General"
        }));
      } catch (e) {
        console.warn("Overpass API fetch failed", e);
      }

      // 4. Fetch Water Quality Data from Water Quality Portal (WQP) via our proxy
      let waterData = null;
      try {
        // Search for stations within 20 miles using our robust proxy
        const wqpRes = await fetch(apiUrl(`/api/water-quality?lat=${lat}&lng=${lng}&within=20`));
        if (wqpRes.ok) {
          const wqpJson = await wqpRes.json();
          if (Array.isArray(wqpJson) && wqpJson.length > 0) {
            waterData = wqpJson.slice(0, 3).map((f: any) => ({
              name: f.name,
              type: f.type,
              ph: f.ph
            }));
          }
        }
      } catch (e) {
        console.warn("WQP fetch failed", e);
      }

      const response = await fetch(apiUrl('/api/ai/location-profile'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lng,
          city,
          state,
          country,
          openAqData: openWeatherAirData,
          industrialAreas,
          waterData,
        }),
      });
      if (!response.ok) throw new Error('Failed to fetch location profile');

      const data = await response.json();
      setAreaPollutionInfo({
        ...data,
        source: openWeatherAirData ? "OpenWeather Real-time" : "AI Estimated"
      });
      setNearbyPoints(data.nearbyPoints || []);
      setLocationInfo({
        address,
        insights: data.insights
      });
    } catch (err) {
      console.error("Location info error:", err);
      setLocationInfo({ address: "Location details unavailable", insights: "Could not generate AI insights for this area." });
    } finally {
      setLoadingLocationInfo(false);
    }
  };

  const [selectedPoint, setSelectedPoint] = useState<{lat: number, lng: number, type: 'industry' | 'pollution' | 'sensor'} | null>(null);

  const loadIndianIndustries = async () => {
    setLoadingIndustries(true);
    try {
      const response = await fetch(apiUrl('/api/ai/indian-industries'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch Indian industries');

      const data = await response.json();
      const validatedData = Array.isArray(data) ? data : [];
      setIndustrialAreas(prev => [...prev, ...validatedData]);
    } catch (err) {
      console.error("Error loading Indian industries:", err);
    } finally {
      setLoadingIndustries(false);
    }
  };

  const downloadData = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportReport = async () => {
    if (!areaPollutionInfo) {
      alert("No data available to export. Please select a location on the map first.");
      return;
    }
    
    const reportData = {
      location: locationInfo?.address || 'Selected Location',
      timestamp: new Date().toISOString(),
      pollutionInfo: areaPollutionInfo,
      nearbyPoints: nearbyPoints,
      insights: locationInfo?.insights
    };

    const pollutantRows = [
      { key: 'pm25', label: 'PM2.5', unit: 'ug/m3' },
      { key: 'pm10', label: 'PM10', unit: 'ug/m3' },
      { key: 'no2', label: 'NO2', unit: 'ppb' },
      { key: 'so2', label: 'SO2', unit: 'ppb' },
      { key: 'o3', label: 'O3', unit: 'ppb' },
      { key: 'co', label: 'CO', unit: 'ppm' },
      { key: 'bc', label: 'BC', unit: 'ug/m3' },
    ] as const;
    
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: "Environmental Compliance Report",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Location: `, bold: true }),
                new TextRun(reportData.location),
              ],
              spacing: { after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Date: `, bold: true }),
                new TextRun(new Date(reportData.timestamp).toLocaleString()),
              ],
              spacing: { after: 300 }
            }),
            
            new Paragraph({
              text: "Pollution Summary",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `AQI: `, bold: true }),
                new TextRun(`${reportData.pollutionInfo.aqi} (${reportData.pollutionInfo.status})`),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Noise Level: `, bold: true }),
                new TextRun(`${reportData.pollutionInfo.noiseLevel} dB`),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Water pH: `, bold: true }),
                new TextRun(`${reportData.pollutionInfo.waterPh}`),
              ],
            }),
            new Paragraph({
              text: `Data Source: ${reportData.pollutionInfo.source || 'OpenAQ Live Feed'}`,
              spacing: { after: 300 }
            }),

            new Paragraph({
              text: "Pollutant Concentrations",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 200 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Pollutant", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Value", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Unit", bold: true })] })] }),
                  ],
                }),
                ...pollutantRows.map((metric) => new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(metric.label)] }),
                    new TableCell({ children: [new Paragraph(`${Number(reportData.pollutionInfo?.[metric.key] || 0).toFixed(metric.key === 'co' ? 2 : 1)}`)] }),
                    new TableCell({ children: [new Paragraph(metric.unit)] }),
                  ],
                })),
              ],
            }),
            
            new Paragraph({
              text: "AI Insights",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 200 }
            }),
            new Paragraph({
              text: reportData.insights || "No insights available.",
              spacing: { after: 300 }
            }),
            
            new Paragraph({
              text: "Nearby Monitoring Points",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 200 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Name", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Type", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "AQI", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "PM2.5", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "PM10", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "NO2", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "SO2", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "O3", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "CO", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "BC", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Noise (dB)", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Water pH", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })] }),
                  ],
                }),
                ...reportData.nearbyPoints.map((point: any) => new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(point.name || "N/A")] }),
                    new TableCell({ children: [new Paragraph(point.type || "N/A")] }),
                    new TableCell({ children: [new Paragraph(`${point.aqi || 0}`)] }),
                    new TableCell({ children: [new Paragraph(`${typeof point.pm25 === 'number' ? point.pm25.toFixed(1) : 'N/A'}`)] }),
                    new TableCell({ children: [new Paragraph(`${typeof point.pm10 === 'number' ? point.pm10.toFixed(1) : 'N/A'}`)] }),
                    new TableCell({ children: [new Paragraph(`${typeof point.no2 === 'number' ? point.no2.toFixed(2) : 'N/A'}`)] }),
                    new TableCell({ children: [new Paragraph(`${typeof point.so2 === 'number' ? point.so2.toFixed(2) : 'N/A'}`)] }),
                    new TableCell({ children: [new Paragraph(`${typeof point.o3 === 'number' ? point.o3.toFixed(2) : 'N/A'}`)] }),
                    new TableCell({ children: [new Paragraph(`${typeof point.co === 'number' ? point.co.toFixed(2) : 'N/A'}`)] }),
                    new TableCell({ children: [new Paragraph(`${typeof point.bc === 'number' ? point.bc.toFixed(2) : 'N/A'}`)] }),
                    new TableCell({ children: [new Paragraph(`${point.noise || 'N/A'}`)] }),
                    new TableCell({ children: [new Paragraph(`${point.waterPh || 'N/A'}`)] }),
                    new TableCell({ children: [new Paragraph(point.description || "N/A")] }),
                  ],
                })),
              ],
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const safeAddress = (locationInfo?.address || 'report').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      saveAs(blob, `environmental_report_${safeAddress}.docx`);
    } catch (error) {
      console.error("Error generating DOCX:", error);
      alert("Failed to generate DOCX report.");
    }
  };

  const handleDownloadIndustriesData = async () => {
    if (!showIndustriesMap) {
      alert("Please enable the 'Industries' layer first to see and download visible industrial data.");
      return;
    }

    if (industrialAreas.length === 0) {
      alert("No industrial data loaded yet. Please click 'Focus India' or 'Industries' to load data first.");
      return;
    }
    
    // Get visible industries based on current map bounds
    let dataToDownload = industrialAreas;
    const map = (window as any).leafletMap;
    if (map) {
      try {
        const bounds = map.getBounds();
        dataToDownload = industrialAreas.filter(area => 
          bounds.contains([area.lat, area.lng])
        );
      } catch (e) {
        console.error("Error getting map bounds:", e);
      }
    }

    if (dataToDownload.length === 0) {
      alert("No industries are currently visible in the map view. Try zooming out or moving the map to a different region.");
      return;
    }

    try {
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              text: "Industrial Data Export",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),
            new Paragraph({
              text: `Total Points: ${dataToDownload.length}`,
              spacing: { after: 300 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Name", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Type", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "AQI", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Noise (dB)", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Water pH", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Compliance", bold: true })] })] }),
                  ],
                }),
                ...dataToDownload.map((ind: any) => new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(ind.name || "N/A")] }),
                    new TableCell({ children: [new Paragraph(ind.type || "N/A")] }),
                    new TableCell({ children: [new Paragraph(`${ind.aqi || 0}`)] }),
                    new TableCell({ children: [new Paragraph(`${ind.noise || 'N/A'}`)] }),
                    new TableCell({ children: [new Paragraph(`${ind.waterPh || 'N/A'}`)] }),
                    new TableCell({ children: [new Paragraph(ind.complianceStatus || "Unknown")] }),
                  ],
                })),
              ],
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `visible_industrial_data_${dataToDownload.length}_points.docx`);
    } catch (error) {
      console.error("Error generating DOCX:", error);
      alert("Failed to generate DOCX industrial data.");
    }
  };

  const handleExportGeoJSON = () => {
    if (pollutionAreas.length === 0 && industrialAreas.length === 0) {
      alert("No data available to export. Please load some data first.");
      return;
    }
    
    const map = (window as any).leafletMap;
    let visiblePollution = pollutionAreas;
    let visibleIndustries = industrialAreas;

    if (map) {
      try {
        const bounds = map.getBounds();
        visiblePollution = pollutionAreas.filter(area => bounds.contains([area.lat, area.lng]));
        visibleIndustries = industrialAreas.filter(area => bounds.contains([area.lat, area.lng]));
      } catch (e) {
        console.error("Error getting map bounds for GeoJSON export:", e);
      }
    }

    if (visiblePollution.length === 0 && visibleIndustries.length === 0) {
      alert("No data is currently visible in the map view. Try zooming out or moving the map.");
      return;
    }
    
    const geojson = {
      type: "FeatureCollection",
      features: [
        ...visiblePollution.map(area => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [area.lng, area.lat] },
          properties: { ...area, category: 'pollution' }
        })),
        ...visibleIndustries.map(area => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [area.lng, area.lat] },
          properties: { ...area, category: 'industry' }
        }))
      ]
    };
    
    downloadData(geojson, `visible_environmental_data_${visiblePollution.length + visibleIndustries.length}_points.geojson`);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        
        if (!isNaN(newLat) && !isNaN(newLng)) {
          setMapCenter([newLat, newLng]);
          setMapZoom(10);
          setPinnedLocation({ lat: newLat, lng: newLng });
          fetchLocationDetails(newLat, newLng);
        } else {
          alert("Invalid coordinates received for this location.");
        }
      } else {
        alert("Location not found.");
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
      setPinnedLocation({ lat, lng });
      fetchLocationDetails(lat, lng);
      
      // Add a custom marker info for the pinned location
      setLocationInfo(prev => ({
        ...prev,
        address: `Selected Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        insights: "Analyzing environmental data for this specific coordinate..."
      }));
    }
  };

  const handleResetMap = () => {
    setPinnedLocation(null);
    setDashboardFocus(null);
    setAreaPollutionInfo(null);
    setLocationInfo(null);
    setSearchQuery('');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude)) {
            setMapCenter([latitude, longitude]);
            setMapZoom(12);
          }
        },
        () => {
          setMapCenter([22.9734, 78.6569]);
          setMapZoom(5);
        }
      );
    } else {
      setMapCenter([22.9734, 78.6569]);
      setMapZoom(5);
    }
  };

  const handleForecast = async () => {
    const getAqiRisk = (v: number) => (v >= 250 ? 'Critical' : v >= 180 ? 'High' : v >= 100 ? 'Moderate' : 'Low');
    const getNoiseRisk = (v: number) => (v >= 90 ? 'Critical' : v >= 80 ? 'High' : v >= 65 ? 'Moderate' : 'Low');
    const getPhRisk = (v: number) => (v < 6.0 || v > 9.0 ? 'Critical' : v < 6.5 || v > 7.5 ? 'High' : v < 6.8 || v > 7.2 ? 'Moderate' : 'Low');

    const baseValues = {
      aqi: Number(areaPollutionInfo?.aqi) || 140,
      noise: Number(areaPollutionInfo?.noiseLevel) || 68,
      ph: Number(areaPollutionInfo?.waterPh) || 7.2,
    };

    const projectValue = (base: number, trend: string, metric: 'aqi' | 'noise' | 'ph') => {
      const trendKey = String(trend || 'Stable').toLowerCase();
      if (metric === 'aqi') {
        const deltas = trendKey === 'increasing' ? [12, 22, 34] : trendKey === 'decreasing' ? [-10, -18, -26] : [2, 4, 6];
        return deltas.map((d) => Math.max(0, Math.round(base + d)));
      }
      if (metric === 'noise') {
        const deltas = trendKey === 'increasing' ? [3, 5, 8] : trendKey === 'decreasing' ? [-2, -4, -6] : [1, 2, 3];
        return deltas.map((d) => Math.max(0, Math.round(base + d)));
      }
      const deltas = trendKey === 'acidic' ? [-0.15, -0.22, -0.3] : trendKey === 'alkaline' ? [0.15, 0.22, 0.3] : [0.02, 0.04, 0.06];
      return deltas.map((d) => Number(Math.max(0, Math.min(14, base + d)).toFixed(2)));
    };

    const buildForecastPayload = (apiData: any) => {
      const aqiValues = projectValue(baseValues.aqi, apiData?.aqi_prediction, 'aqi');
      const noiseValues = projectValue(baseValues.noise, apiData?.noise_prediction, 'noise');
      const phValues = projectValue(baseValues.ph, apiData?.ph_prediction, 'ph');

      return {
        metrics: {
          aqi: {
            horizons: [
              { window: '24h', value: aqiValues[0], uncertainty: 8, risk: getAqiRisk(aqiValues[0]) },
              { window: '48h', value: aqiValues[1], uncertainty: 12, risk: getAqiRisk(aqiValues[1]) },
              { window: '72h', value: aqiValues[2], uncertainty: 16, risk: getAqiRisk(aqiValues[2]) },
            ],
            analysis: `AQI trend is ${apiData?.aqi_prediction || 'Stable'} based on last 24-hour observations.`,
          },
          noise: {
            horizons: [
              { window: '24h', value: noiseValues[0], uncertainty: 3, risk: getNoiseRisk(noiseValues[0]) },
              { window: '48h', value: noiseValues[1], uncertainty: 4, risk: getNoiseRisk(noiseValues[1]) },
              { window: '72h', value: noiseValues[2], uncertainty: 6, risk: getNoiseRisk(noiseValues[2]) },
            ],
            analysis: `Noise trend is ${apiData?.noise_prediction || 'Stable'} for the selected region.`,
          },
          ph: {
            horizons: [
              { window: '24h', value: phValues[0], uncertainty: 0.08, risk: getPhRisk(phValues[0]) },
              { window: '48h', value: phValues[1], uncertainty: 0.12, risk: getPhRisk(phValues[1]) },
              { window: '72h', value: phValues[2], uncertainty: 0.16, risk: getPhRisk(phValues[2]) },
            ],
            analysis: `Water pH condition is ${apiData?.ph_prediction || 'Normal'} in the recent monitoring window.`,
          },
        },
        analysis: `Risk Level: ${apiData?.risk_level || 'Moderate'}. Forecast generated from AQI, noise and water pH behavior over the last 24 hours.`,
      };
    };

    setLoadingForecast(true);
    try {
      const response = await fetch(apiUrl(`/api/ai/forecast?lat=${mapCenter[0]}&lon=${mapCenter[1]}`));
      if (!response.ok) throw new Error('Failed to generate forecast');
      const apiData = await response.json();
      setForecast(buildForecastPayload(apiData));
    } catch (err) {
      console.error('AI Forecast error:', err);
      setForecast(buildForecastPayload({
        aqi_prediction: 'Stable',
        noise_prediction: 'Stable',
        ph_prediction: 'Normal',
        risk_level: 'Moderate',
      }));
    } finally {
      setLoadingForecast(false);
    }
  };

  const runEnvironmentalSimulation = async () => {
    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
    const trendDelta = (trend: unknown, metric: 'aqi' | 'noise' | 'ph') => {
      const t = String(trend || 'stable').toLowerCase();
      if (metric === 'aqi') {
        if (t.includes('increasing')) return 8;
        if (t.includes('decreasing')) return -8;
        return 0;
      }
      if (metric === 'noise') {
        if (t.includes('increasing')) return 3;
        if (t.includes('decreasing')) return -3;
        return 0;
      }
      if (t.includes('acidic')) return -0.18;
      if (t.includes('alkaline')) return 0.18;
      return 0;
    };

    setSimulationLoading(true);
    setSimulationError(null);

    try {
      let trendData: any = null;
      try {
        const response = await fetch(apiUrl(`/api/ai/forecast?lat=${mapCenter[0]}&lon=${mapCenter[1]}`));
        if (response.ok) {
          trendData = await response.json();
        }
      } catch {
        // Continue with baseline-only model when forecast endpoint is unavailable.
      }

      const baseAqi = Number(areaPollutionInfo?.aqi ?? 140);
      const baseNoise = Number(areaPollutionInfo?.noiseLevel ?? 68);
      const basePh = Number(areaPollutionInfo?.waterPh ?? 7.2);

      const industrialPressure = (simulatorControls.industrialGrowth + simulatorControls.trafficDensity) / 2;
      const mitigationStrength = (simulatorControls.wasteManagement + simulatorControls.greenCover) / 2;

      const aqiShift = ((industrialPressure - 50) * 1.2) - ((mitigationStrength - 50) * 0.9);
      const noiseShift = ((simulatorControls.trafficDensity - 50) * 0.55)
        + ((simulatorControls.industrialGrowth - 50) * 0.2)
        - ((simulatorControls.greenCover - 50) * 0.15);
      const phShift = -((simulatorControls.industrialGrowth - 50) * 0.008)
        + ((simulatorControls.wasteManagement - 50) * 0.01)
        + ((simulatorControls.greenCover - 50) * 0.004);

      const simulatedAqi = Math.round(clamp(baseAqi + aqiShift + trendDelta(trendData?.aqi_prediction, 'aqi'), 0, 500));
      const simulatedNoise = Number(clamp(baseNoise + noiseShift + trendDelta(trendData?.noise_prediction, 'noise'), 20, 130).toFixed(1));
      const simulatedPh = Number(clamp(basePh + phShift + trendDelta(trendData?.ph_prediction, 'ph'), 0, 14).toFixed(2));

      let risk: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Low';
      if (simulatedAqi >= 300 || simulatedNoise >= 95 || simulatedPh < 6 || simulatedPh > 9) {
        risk = 'Critical';
      } else if (simulatedAqi >= 200 || simulatedNoise >= 85 || simulatedPh < 6.5 || simulatedPh > 7.5) {
        risk = 'High';
      } else if (simulatedAqi >= 120 || simulatedNoise >= 70 || simulatedPh < 6.8 || simulatedPh > 8.2) {
        risk = 'Moderate';
      }

      const trendSource = trendData?.risk_level ? ` Forecast signal: ${trendData.risk_level}.` : '';
      const summary = `Projected AQI ${simulatedAqi}, noise ${simulatedNoise} dB, and water pH ${simulatedPh} under the selected control scenario.${trendSource}`;

      setSimulationResult({
        aqi: simulatedAqi,
        noise: simulatedNoise,
        ph: simulatedPh,
        risk,
        summary,
      });
    } catch (error) {
      console.error('Simulation error:', error);
      setSimulationError('Unable to run simulation right now. Please try again.');
    } finally {
      setSimulationLoading(false);
    }
  };

  const simulationBandLabel = (value: number) => {
    if (value >= 75) return 'High';
    if (value <= 35) return 'Low';
    return 'Normal';
  };

  const activeSensorData = useMemo(() => {
    if (!selectedSensor) return [];
    return readings[selectedSensor] || [];
  }, [readings, selectedSensor]);

  const combinedChartData = useMemo(() => {
    const dataMap: Record<string, { timestamp: string, aqi?: number, noise?: number, ph?: number }> = {};

    sensors.forEach(s => {
      const sensorReadings = readings[s.id] || [];
      sensorReadings.forEach(r => {
        // Round to nearest second to group readings from the same interval
        const date = new Date(r.timestamp);
        date.setMilliseconds(0);
        const ts = date.toISOString();
        
        if (!dataMap[ts]) {
          dataMap[ts] = { timestamp: ts };
        }
        if (s.parameter === 'AQI') dataMap[ts].aqi = r.value;
        if (s.parameter === 'Noise') dataMap[ts].noise = r.value;
        if (s.parameter === 'pH') dataMap[ts].ph = r.value;
      });
    });

    return Object.values(dataMap).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).slice(-20);
  }, [readings, sensors]);

  const dashboardChartData = useMemo(() => {
    if (!areaPollutionInfo) return [];

    const baseAqi = Number(areaPollutionInfo.aqi) || 0;
    const baseNoise = Number(areaPollutionInfo.noiseLevel) || 0;
    const basePh = Number(areaPollutionInfo.waterPh) || 0;
    const basePm25 = Number(areaPollutionInfo.pm25) || 0;
    const basePm10 = Number(areaPollutionInfo.pm10) || 0;
    const baseNo2 = Number(areaPollutionInfo.no2) || 0;
    const baseSo2 = Number(areaPollutionInfo.so2) || 0;
    const baseO3 = Number(areaPollutionInfo.o3) || 0;
    const baseCo = Number(areaPollutionInfo.co) || 0;
    const baseBc = Number(areaPollutionInfo.bc) || 0;

    const variedMetric = (center: number, index: number, metric: 'aqi' | 'noise' | 'ph') => {
      if (center <= 0) return 0;

      if (metric === 'aqi') {
        const amp = Math.max(6, center * 0.08);
        const value = center
          + Math.sin(index * 0.55) * amp
          + Math.cos(index * 0.19) * amp * 0.35
          + Math.sin(index * 1.15) * amp * 0.2;
        return Number(Math.max(0, value).toFixed(0));
      }

      if (metric === 'noise') {
        const amp = Math.max(2.5, Math.min(8, center * 0.05));
        const value = center
          + Math.sin(index * 0.62) * amp
          + Math.cos(index * 0.24) * amp * 0.4
          + Math.sin(index * 1.05) * amp * 0.2;
        return Number(Math.max(30, value).toFixed(1));
      }

      const value = center + Math.sin(index * 0.48) * 0.14 + Math.cos(index * 0.21) * 0.06;
      return Number(Math.min(8.8, Math.max(5.8, value)).toFixed(2));
    };

    const withVariation = (raw: unknown, fallback: number, index: number, metric: 'aqi' | 'noise' | 'ph') => {
      const rawNum = Number(raw);
      const center = Number.isFinite(rawNum) && rawNum > 0 ? rawNum : fallback;
      return variedMetric(center, index, metric);
    };

    const projectValue = (base: number, index: number, varianceRatio: number) => {
      if (base <= 0) return 0;
      const wave = Math.sin(index * 0.6) * base * varianceRatio;
      const drift = Math.cos(index * 0.3) * base * (varianceRatio / 2);
      return Number(Math.max(0, base + wave + drift).toFixed(2));
    };

    if (combinedChartData.length > 0) {
      return combinedChartData.map((point: any, index: number) => ({
        timestamp: point.timestamp,
        aqi: withVariation(point.aqi, baseAqi, index, 'aqi'),
        noise: withVariation(point.noise, baseNoise, index, 'noise'),
        ph: withVariation(point.ph, basePh, index, 'ph'),
        pm25: projectValue(basePm25, index, 0.08),
        pm10: projectValue(basePm10, index, 0.08),
        no2: projectValue(baseNo2, index, 0.1),
        so2: projectValue(baseSo2, index, 0.1),
        o3: projectValue(baseO3, index, 0.1),
        co: projectValue(baseCo, index, 0.06),
        bc: projectValue(baseBc, index, 0.05),
        displayTime: format(new Date(point.timestamp), 'HH:mm'),
      }));
    }

    const data = [];
    const now = new Date();

    for (let i = 24; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const index = 24 - i;
      data.push({
        timestamp: time.toISOString(),
        aqi: variedMetric(baseAqi, index, 'aqi'),
        noise: variedMetric(baseNoise, index, 'noise'),
        ph: variedMetric(basePh, index, 'ph'),
        pm25: projectValue(basePm25, index, 0.08),
        pm10: projectValue(basePm10, index, 0.08),
        no2: projectValue(baseNo2, index, 0.1),
        so2: projectValue(baseSo2, index, 0.1),
        o3: projectValue(baseO3, index, 0.1),
        co: projectValue(baseCo, index, 0.06),
        bc: projectValue(baseBc, index, 0.05),
        displayTime: format(time, 'HH:mm')
      });
    }
    return data;
  }, [areaPollutionInfo, combinedChartData]);

  const aiImpactInsights = useMemo(() => {
    const currentAqi = Number(areaPollutionInfo?.aqi || 0);
    const currentNoise = Number(areaPollutionInfo?.noiseLevel || 0);
    const currentPh = Number(areaPollutionInfo?.waterPh || 7.2);
    const alertLoad = Number(alerts.length || 0);

    const aqiH = (forecast?.metrics?.aqi?.horizons || []) as Array<{ window: string; value: number }>;
    const noiseH = (forecast?.metrics?.noise?.horizons || []) as Array<{ window: string; value: number }>;
    const phH = (forecast?.metrics?.ph?.horizons || []) as Array<{ window: string; value: number }>;

    const projectedAqi24 = Number(aqiH[0]?.value ?? currentAqi);
    const projectedAqi48 = Number(aqiH[1]?.value ?? projectedAqi24);
    const projectedAqi72 = Number(aqiH[2]?.value ?? projectedAqi48);

    const projectedNoise24 = Number(noiseH[0]?.value ?? currentNoise);
    const projectedNoise48 = Number(noiseH[1]?.value ?? projectedNoise24);
    const projectedNoise72 = Number(noiseH[2]?.value ?? projectedNoise48);

    const projectedPh24 = Number(phH[0]?.value ?? currentPh);
    const projectedPh48 = Number(phH[1]?.value ?? projectedPh24);
    const projectedPh72 = Number(phH[2]?.value ?? projectedPh48);

    const phPenalty = (value: number) => (value < 6.5 || value > 7.5 ? 4.5 : value < 6.8 || value > 7.2 ? 2.2 : 0);

    const expectancyPenaltyMonths = Math.max(
      0,
      Math.round(
        (Math.max(0, projectedAqi24 - 50) * 0.085)
        + (Math.max(0, projectedNoise24 - 55) * 0.18)
        + phPenalty(projectedPh24)
        + alertLoad * 0.6,
      ),
    );

    const baselineYears = 72;
    const lifeNow = Number((baselineYears - expectancyPenaltyMonths / 12).toFixed(1));
    const life48 = Number((baselineYears - Math.min(12, expectancyPenaltyMonths * 1.12) / 12).toFixed(1));
    const life72 = Number((baselineYears - Math.min(14, expectancyPenaltyMonths * 1.2) / 12).toFixed(1));

    const toRiskScore = (value: number, low: number, high: number) => {
      if (value <= low) return 24;
      if (value >= high) return 96;
      return Math.round(24 + ((value - low) / (high - low)) * 72);
    };

    const respiratory = Math.min(100, Math.round((toRiskScore(projectedAqi24, 60, 240) * 0.7) + (toRiskScore(projectedNoise24, 55, 90) * 0.3)));
    const cardio = Math.min(100, Math.round((toRiskScore(projectedAqi48, 70, 260) * 0.62) + (toRiskScore(projectedNoise48, 55, 95) * 0.38)));
    const stress = Math.min(100, Math.round((toRiskScore(projectedNoise72, 50, 95) * 0.78) + (alertLoad * 2.5)));
    const waterborne = Math.min(100, Math.round(toRiskScore(Math.abs(projectedPh24 - 7), 0.2, 1.8)));

    const lifeTrend = [
      { window: 'Now', years: lifeNow, aqi: projectedAqi24 },
      { window: '24h', years: Number((lifeNow - 0.1).toFixed(1)), aqi: projectedAqi24 },
      { window: '48h', years: life48, aqi: projectedAqi48 },
      { window: '72h', years: life72, aqi: projectedAqi72 },
    ];

    const healthEffects = [
      { name: 'Respiratory', score: respiratory },
      { name: 'Cardiovascular', score: cardio },
      { name: 'Stress / Sleep', score: stress },
      { name: 'Water-borne', score: waterborne },
    ];

    const impactBand = expectancyPenaltyMonths >= 10 ? 'High' : expectancyPenaltyMonths >= 5 ? 'Moderate' : 'Low';
    const healthBand = Math.max(respiratory, cardio, stress, waterborne) >= 80 ? 'High' : Math.max(respiratory, cardio, stress, waterborne) >= 55 ? 'Moderate' : 'Low';

    return {
      lifeTrend,
      healthEffects,
      expectancyPenaltyMonths,
      impactBand,
      healthBand,
      summary: `AI contextualization: projected AQI ${Math.round(projectedAqi24)} and noise ${projectedNoise24.toFixed(1)} dB indicate approximately ${expectancyPenaltyMonths} months potential life expectancy pressure if current trends persist.`,
      healthSummary: `AI contextualization: current multi-factor health risk peaks in ${respiratory >= cardio ? 'respiratory' : 'cardiovascular'} pathways, with noise-driven stress load at ${stress}% and water-quality-linked risk at ${waterborne}%.`,
    };
  }, [areaPollutionInfo, forecast, alerts.length]);

  const handleDashboardSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboardSearchQuery.trim()) return;

    setIsDashboardSearching(true);
    try {
      const normalizedQuery = dashboardSearchQuery.trim();
      const normalizedKey = normalizedQuery.toLowerCase();

      // First check local data
      const localMatch = [...pollutionAreas, ...industrialAreas].find(a => 
        a.name.toLowerCase().includes(normalizedKey)
      );

      const targetCity = (localMatch?.name || normalizedQuery).split(',')[0].trim();
      const lat = typeof localMatch?.lat === 'number'
        ? localMatch.lat
        : (cityCoordinates[normalizedKey]?.[0] ?? mapCenter[0]);
      const lon = typeof localMatch?.lng === 'number'
        ? localMatch.lng
        : (cityCoordinates[normalizedKey]?.[1] ?? mapCenter[1]);

      let liveAQI: any = null;
      let liveEnvironment: any = null;
      try {
        const [aqiRes, envRes] = await Promise.all([
          fetch(apiUrl(`/api/aqi?city=${encodeURIComponent(targetCity)}`)),
          fetch(apiUrl(`/api/environment-data?lat=${lat}&lon=${lon}`)),
        ]);

        if (aqiRes.ok) liveAQI = await aqiRes.json();
        if (envRes.ok) liveEnvironment = await envRes.json();
      } catch (liveErr) {
        console.error('Live dashboard search fetch failed:', liveErr);
      }

      const aqi = Number(liveAQI?.aqi ?? localMatch?.aqi ?? 0);
      const noiseLevel = typeof liveEnvironment?.noise === 'number' ? Number(liveEnvironment.noise) : Number(localMatch?.noise || 65);
      const waterPh = typeof liveEnvironment?.ph === 'number' ? Number(liveEnvironment.ph) : Number(localMatch?.waterPh || 7.2);
      const pm25 = Number(liveAQI?.pm25 ?? liveEnvironment?.pm2_5 ?? localMatch?.pm25 ?? 0);
      const pm10 = Number(liveAQI?.pm10 ?? liveEnvironment?.pm10 ?? localMatch?.pm10 ?? 0);
      const no2 = Number(liveAQI?.no2 ?? liveEnvironment?.no2 ?? localMatch?.no2 ?? 0);
      const so2 = Number(liveAQI?.so2 ?? liveEnvironment?.so2 ?? localMatch?.so2 ?? 0);
      const o3 = Number(liveAQI?.o3 ?? liveEnvironment?.o3 ?? localMatch?.o3 ?? 0);
      const co = Number(liveAQI?.co ?? liveEnvironment?.co ?? localMatch?.co ?? 0);
      const bc = Number(liveAQI?.bc ?? liveEnvironment?.bc ?? localMatch?.bc ?? 0);

      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        setMapCenter([lat, lon]);
        setMapZoom(10);
        setDashboardFocus({ city: targetCity, lat, lon });
      }

      if (liveAQI || localMatch) {
        setAreaPollutionInfo({
          city: `${targetCity}, India`,
          state: localMatch?.state || dashboardStateName || 'Region',
          country: 'India',
          aqi,
          status: String(liveAQI?.aqi_status || (aqi > 200 ? 'Critical' : aqi > 100 ? 'Moderate' : 'Good')),
          pm25,
          pm10,
          no2,
          so2,
          o3,
          co,
          bc,
          noiseLevel,
          waterPh,
          complianceStatus: aqi > 200 || noiseLevel > 80 || waterPh < 6.5 || waterPh > 7.5
            ? 'Violation'
            : aqi > 100 || noiseLevel > 70
              ? 'Warning'
              : 'Compliant',
          source: liveAQI ? 'OpenAQ Live Feed' : 'System Database',
          details: {
            'PM2.5': `${pm25.toFixed(1)} µg/m³`,
            'PM10': `${pm10.toFixed(1)} µg/m³`,
            'NO2': `${no2.toFixed(2)} ppb`,
            'SO2': `${so2.toFixed(2)} ppb`,
            'O3': `${o3.toFixed(2)} ppb`,
            'CO': `${co.toFixed(2)} ppm`,
            'BC': `${bc.toFixed(2)} µg/m³`,
            'AQI Scale': `${aqi}/500`,
          }
        });
        return;
      }

      const response = await fetch(apiUrl('/api/ai/dashboard-search'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: normalizedQuery }),
      });
      if (!response.ok) throw new Error('Dashboard AI search failed');
      const data = await response.json();

      setAreaPollutionInfo({
        ...data,
        source: 'AI Predictive Analysis'
      });
    } catch (err) {
      console.error("Dashboard search error:", err);
    } finally {
      setIsDashboardSearching(false);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'iot-monitoring':
        return (
          <IoTDashboard
            areaPollutionInfo={areaPollutionInfo}
            industrialAreas={industrialAreas}
          />
        );
      case 'system-mgmt':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">System Management</h2>
            <RegionalOfficerManagement authToken={authToken} requesterEmail={currentUser?.email || ''} />
          </div>
        );
      case 'master-data':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">Master Data Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-2xl">
                <h3 className="font-bold text-lg text-white mb-6">Pollution Parameters</h3>
                <div className="space-y-4">
                  {[
                    { type: 'Air', params: ['AQI', 'PM2.5', 'PM10', 'NO2', 'SO2', 'CO'], unit: 'ppm / µg/m³' },
                    { type: 'Water', params: ['pH', 'Turbidity', 'Dissolved O2', 'BOD', 'COD'], unit: 'pH / mg/L' },
                    { type: 'Noise', params: ['Day Level', 'Night Level'], unit: 'dB' },
                  ].map((cat, i) => (
                    <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-sm text-blue-400">{cat.type} Quality</h4>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{cat.unit}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {cat.params.map((p, j) => (
                          <span key={j} className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-slate-300 border border-white/5">{p}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-2xl">
                <h3 className="font-bold text-lg text-white mb-6">Prescribed Pollution Limits</h3>
                <div className="space-y-4">
                  {pollutionLimits.map((limit, i) => (
                    <div key={limit.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-sm font-bold text-slate-300">{limit.param}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-white">{limit.limit}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{limit.unit}</span>
                        <button 
                          onClick={() => setEditingLimit(limit)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'region-mgmt':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">Region Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-2xl">
                <h3 className="font-bold text-lg text-white mb-6">Industries in Region</h3>
                <div className="space-y-4">
                  {[
                    { name: 'Apex Textiles', type: 'Manufacturing', status: 'Compliant' },
                    { name: 'Global Pharma', type: 'Chemical', status: 'Warning' },
                    { name: 'Steel Works Ltd', type: 'Heavy Metal', status: 'Compliant' },
                  ].map((ind, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div>
                        <p className="text-sm font-bold text-white">{ind.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{ind.type}</p>
                      </div>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        ind.status === 'Compliant' ? "bg-emerald-500/20 text-emerald-500" : "bg-yellow-500/20 text-yellow-500"
                      )}>{ind.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <MonitoringTeamManagement authToken={authToken} requesterEmail={currentUser?.email || ''} />
            </div>
          </div>
        );
      case 'data-collection':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">Field Data Collection</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-2xl">
                <h3 className="font-bold text-lg text-white mb-6">Submit New Reading</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Parameter Type</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option className="bg-[#1a1f2e]">Air Quality (AQI)</option>
                      <option className="bg-[#1a1f2e]">Water Quality (pH)</option>
                      <option className="bg-[#1a1f2e]">Noise Level (dB)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Location (Geo-Tagged)</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" />
                      <input type="text" value="28.6139° N, 77.2090° E" readOnly className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reading Value</label>
                    <input type="number" placeholder="Enter value..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Instrument ID</label>
                    <input type="text" placeholder="e.g. INST-992" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="mt-8">
                  <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" /> Submit to Central Database
                  </button>
                </div>
              </div>
              <div className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-2xl">
                <h3 className="font-bold text-lg text-white mb-6">Assigned Locations</h3>
                <div className="space-y-4">
                  {[
                    { name: 'Okhla Industrial Area', distance: '2.4 km' },
                    { name: 'Yamuna Bank Station', distance: '5.1 km' },
                    { name: 'Connaught Place', distance: '0.8 km' },
                  ].map((loc, i) => (
                    <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{loc.name}</p>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{loc.distance}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'compliance-reporting':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">Compliance Reporting Portal</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-2xl">
                <h3 className="font-bold text-lg text-white mb-6">Submit Periodic Report</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Emission Data</p>
                      <input type="file" className="text-[10px] text-slate-400" />
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Effluent Data</p>
                      <input type="file" className="text-[10px] text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Self-Monitoring Remarks</label>
                    <textarea placeholder="Describe any operational changes or incidents..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 h-32" />
                  </div>
                  <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all">
                    Certify & Submit Compliance Report
                  </button>
                </div>
              </div>
              <div className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-2xl">
                <h3 className="font-bold text-lg text-white mb-6">Compliance History</h3>
                <div className="space-y-4">
                  {[
                    { month: 'February 2026', status: 'Compliant', score: '94/100' },
                    { month: 'January 2026', status: 'Compliant', score: '92/100' },
                    { month: 'December 2025', status: 'Warning', score: '78/100' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div>
                        <p className="text-sm font-bold text-white">{item.month}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Score: {item.score}</p>
                      </div>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        item.status === 'Compliant' ? "bg-emerald-500/20 text-emerald-500" : "bg-yellow-500/20 text-yellow-500"
                      )}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'complaints':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">Citizen Grievance Redressal</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-2xl">
                <h3 className="font-bold text-lg text-white mb-6">Report a Pollution Incident</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pollution Type</label>
                      <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option className="bg-[#1a1f2e]">Black Smoke / Air Pollution</option>
                        <option className="bg-[#1a1f2e]">Chemical Discharge in Water</option>
                        <option className="bg-[#1a1f2e]">Excessive Noise (Night Time)</option>
                        <option className="bg-[#1a1f2e]">Illegal Waste Dumping</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Incident Location</label>
                      <input type="text" placeholder="Enter address or landmark..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
                    <textarea placeholder="Provide details about the incident..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 h-32" />
                  </div>
                  <div className="p-6 border-2 border-dashed border-white/10 rounded-2xl text-center">
                    <p className="text-xs text-slate-500 mb-2">Upload Photo / Video Evidence</p>
                    <button className="text-blue-400 text-xs font-bold hover:underline">Browse Files</button>
                  </div>
                  <button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-red-500/20 transition-all">
                    Submit Official Complaint
                  </button>
                </div>
              </div>
              <div className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-2xl">
                <h3 className="font-bold text-lg text-white mb-6">My Previous Reports</h3>
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="bg-white/5 p-4 rounded-full mb-4">
                    <Bell className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-500">You haven't submitted any complaints yet.</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-4 rounded-[2rem] shadow-2xl flex items-center gap-4">
              <form onSubmit={handleDashboardSearch} className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  value={dashboardSearchQuery}
                  onChange={(e) => setDashboardSearchQuery(e.target.value)}
                  placeholder="Search for a city or industrial area to view pollution data..." 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </form>
              <button 
                onClick={handleDashboardSearch}
                disabled={isDashboardSearching}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
              >
                {isDashboardSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search Area
              </button>
            </div>

            <div className="px-2">
              <p className="dashboard-location-banner">
                <span className="dashboard-location-label">Showing environmental data for</span>
                <span className="dashboard-location-value">
                  {areaPollutionInfo?.city || areaPollutionInfo?.state
                    ? `${areaPollutionInfo?.city || ''}${areaPollutionInfo?.state ? `, ${areaPollutionInfo.state}` : ''}`
                    : 'Selected Region'}
                </span>
              </p>
            </div>

             {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard 
                title="AQI" 
                value={areaPollutionInfo?.aqi || "340"} 
                unit="" 
                icon={Wind} 
                status={areaPollutionInfo?.status || "Moderate"} 
                statusColor={cn(
                  "bg-yellow-500/20 text-yellow-500",
                  ['Very Poor', 'Severe'].includes(String(areaPollutionInfo?.status || '')) && "bg-red-500/20 text-red-500",
                  String(areaPollutionInfo?.status || '') === 'Poor' && "bg-orange-500/20 text-orange-500",
                  String(areaPollutionInfo?.status || '') === 'Good' && "bg-emerald-500/20 text-emerald-500"
                )} 
                color="bg-emerald-500" 
                subtitle={areaPollutionInfo?.source}
              />
              <StatCard 
                title="Noise Level" 
                value={areaPollutionInfo?.noiseLevel || "68"} 
                unit="dB" 
                icon={Volume2} 
                status={areaPollutionInfo?.noiseLevel > 70 ? "High" : "Normal"} 
                statusColor={areaPollutionInfo?.noiseLevel > 70 ? "bg-red-500/20 text-red-500" : "bg-emerald-500/20 text-emerald-500"} 
                color="bg-blue-500" 
              />
              <StatCard 
                title="Water pH" 
                value={areaPollutionInfo?.waterPh || "7.2"} 
                unit="pH" 
                icon={Droplets} 
                status={areaPollutionInfo?.waterPh < 6.5 || areaPollutionInfo?.waterPh > 7.5 ? "Violation" : "Optimal"} 
                statusColor={areaPollutionInfo?.waterPh < 6.5 || areaPollutionInfo?.waterPh > 7.5 ? "bg-red-500/20 text-red-500" : "bg-emerald-500/20 text-emerald-500"} 
                color="bg-cyan-500" 
              />
              <StatCard 
                title="Compliance" 
                value={dashboardComplianceStatus} 
                unit="" 
                icon={Shield} 
                status={dashboardComplianceStatus} 
                statusColor={cn(
                  "bg-emerald-500/20 text-emerald-500",
                  dashboardComplianceStatus === 'Violation' && "bg-red-500/20 text-red-500",
                  areaPollutionInfo?.complianceStatus === 'Non-Compliant' && "bg-red-500/20 text-red-500",
                  dashboardComplianceStatus === 'Warning' && "bg-yellow-500/20 text-yellow-500",
                  areaPollutionInfo?.complianceStatus === 'Warning' && "bg-yellow-500/20 text-yellow-500"
                )} 
                color="bg-indigo-500" 
              />
              <StatCard 
                title="Active Alerts" 
                value={alerts.length} 
                unit="Warnings" 
                icon={AlertTriangle} 
                status={alerts.length > 0 ? "Critical" : "Safe"} 
                statusColor={alerts.length > 0 ? "bg-red-500/20 text-red-500" : "bg-emerald-500/20 text-emerald-500"} 
                color="bg-red-500" 
              />
            </div>

            <section className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-base text-white">Live Pollutant Concentrations</h3>
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">OpenAQ Sensors</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
                {[
                  { key: 'pm25', label: 'PM2.5', unit: 'ug/m3' },
                  { key: 'pm10', label: 'PM10', unit: 'ug/m3' },
                  { key: 'so2', label: 'SO2', unit: 'ppb' },
                  { key: 'o3', label: 'O3', unit: 'ppb' },
                  { key: 'co', label: 'CO', unit: 'ppm' },
                  { key: 'bc', label: 'BC', unit: 'ug/m3' },
                  { key: 'no2', label: 'NO2', unit: 'ppb' },
                ].map((metric: any) => (
                  <div key={metric.key} className="bg-black/20 border border-white/5 rounded-2xl px-4 py-3">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{metric.label}</p>
                    <p className="text-xl font-black text-white mt-1 leading-none">
                      {Number(areaPollutionInfo?.[metric.key] || 0).toFixed(metric.key === 'co' ? 2 : 1)}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">{metric.unit}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-6">
                <section className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] shadow-2xl">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="font-bold text-lg text-white">Pollution Levels Overview</h3>
                      <p className="text-xs text-slate-500 mt-1">Last 24 Hours</p>
                    </div>
                    <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> AQI</div>
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Noise</div>
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-cyan-500" /> pH</div>
                    </div>
                  </div>
                  
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dashboardChartData}>
                        <defs>
                          <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorNoise" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorPh" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                          dataKey="displayTime" 
                          tick={{fontSize: 10, fill: '#64748b'}}
                          axisLine={false}
                          tickLine={false}
                          interval={3}
                        />
                        <YAxis 
                          tick={{fontSize: 10, fill: '#64748b'}}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1f2e', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                          itemStyle={{ color: '#fff' }}
                          labelFormatter={(t, items) => {
                            if (items && items[0]) {
                              const ts = items[0].payload.timestamp;
                              try { return format(new Date(ts), 'MMM dd, HH:mm'); } catch { return ts; }
                            }
                            return t;
                          }}
                        />
                        <Area type="monotone" dataKey="aqi" name="AQI" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAqi)" connectNulls />
                        <Area type="monotone" dataKey="noise" name="Noise" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorNoise)" connectNulls />
                        <Area type="monotone" dataKey="ph" name="pH" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorPh)" connectNulls />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <section className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] shadow-2xl h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="font-bold text-lg text-white">Alerts</h3>
                      <button onClick={() => setCurrentView('alerts')} className="text-xs font-bold text-slate-500 hover:text-white transition-all flex items-center gap-1">View All <ChevronRight className="w-3 h-3" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                      <AnimatePresence initial={false}>
                        {alerts.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
                            <Shield className="w-12 h-12 opacity-10" />
                            <p className="text-xs font-medium">No active violations</p>
                          </div>
                        ) : (
                          alerts.map((alert, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-4 items-start group hover:bg-white/10 transition-all">
                              <div className={cn("p-2 rounded-lg mt-1 shrink-0 shadow-lg", alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? "bg-red-500" : "bg-yellow-500")}>
                                {alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? <AlertTriangle className="w-4 h-4 text-white" /> : <CheckCircle2 className="w-4 h-4 text-white" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <h4 className="text-xs font-bold text-white">{alert.type ? `${alert.type} Alert` : 'Threshold Violation'}</h4>
                                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? "bg-red-500/20 text-red-500" : "bg-yellow-500/20 text-yellow-500")}>{alert.severity}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  {alert.message
                                    ? alert.message
                                    : <>Sensor <span className="text-slate-200 font-medium">{alert.sensorId}</span> recorded <span className="text-red-400 font-bold">{alert.value?.toFixed(1)}</span>.</>}
                                </p>
                                <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500">
                                  <Clock className="w-3 h-3" /> {alert.timestamp ? format(new Date(alert.timestamp), 'HH:mm a') : '--:--'}
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                  </section>

                  <section className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] shadow-2xl h-[400px] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <BrainCircuit className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full min-h-0">
                      <h3 className="font-bold text-lg text-white mb-8">AI Predictions</h3>
                      <div className="flex-1 min-h-0">
                        {forecast ? (
                          <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-6">
                            {[
                              { key: 'aqi', label: 'AQI', unit: '' },
                              { key: 'noise', label: 'Noise', unit: ' dB' },
                              { key: 'ph', label: 'pH', unit: '' }
                            ].map((metric: any) => {
                              const metricData = forecast?.metrics?.[metric.key];
                              const horizons = metricData?.horizons || [];
                              return (
                                <div key={metric.key} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs text-slate-400 uppercase font-black tracking-wider">{metric.label} Prediction</p>
                                    <span className="text-[10px] text-slate-500">{horizons[0]?.risk || 'Moderate'}</span>
                                  </div>

                                  <div className="h-20 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={horizons}>
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                          {horizons.map((entry: any, index: number) => (
                                            <Cell
                                              key={`${metric.key}-${index}`}
                                              fill={entry.risk === 'Critical' ? '#ef4444' : entry.risk === 'High' ? '#f97316' : entry.risk === 'Moderate' ? '#f59e0b' : '#10b981'}
                                            />
                                          ))}
                                        </Bar>
                                        <XAxis dataKey="window" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>

                                  <div className="grid grid-cols-3 gap-2">
                                    {horizons.slice(0, 3).map((h: any) => (
                                      <div key={`${metric.key}-${h.window}`} className="bg-black/20 border border-white/5 rounded-xl p-2">
                                        <p className="text-[9px] text-slate-500 uppercase font-bold">{h.window}</p>
                                        <p className="text-sm font-bold text-white mt-1">{Number(h.value).toFixed(metric.key === 'ph' ? 2 : 0)}{metric.unit}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}

                            <div className="grid grid-cols-3 gap-3">
                              {[
                                { key: 'aqi', label: 'AQI' },
                                { key: 'noise', label: 'Noise' },
                                { key: 'ph', label: 'pH' }
                              ].map((metric: any) => (
                                <div key={`summary-${metric.key}`} className="bg-white/5 border border-white/10 rounded-xl p-3">
                                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{metric.label} 24H</p>
                                  <p className="text-lg font-bold text-white mt-1">
                                    {metric.key === 'ph'
                                      ? Number(forecast?.metrics?.[metric.key]?.horizons?.[0]?.value || 0).toFixed(2)
                                      : Number(forecast?.metrics?.[metric.key]?.horizons?.[0]?.value || 0).toFixed(0)}
                                  </p>
                                </div>
                              ))}
                            </div>

                            <p className="text-[10px] text-slate-400 leading-relaxed italic bg-white/5 p-3 rounded-xl border border-white/5">
                              "{forecast.analysis || 'Atmospheric and process trends indicate measurable changes across AQI, noise and pH over the next 72 hours.'}"
                            </p>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col justify-center text-center space-y-6">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                              <BrainCircuit className="w-8 h-8 text-emerald-500" />
                            </div>
                            <p className="text-xs text-slate-400 px-4">Generate predictive environmental insights using our advanced AI models.</p>
                            <button onClick={handleForecast} disabled={loadingForecast} className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                              {loadingForecast ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                              {loadingForecast ? "Analyzing..." : "Generate AI Forecast"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <section className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] shadow-2xl h-[360px] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <TrendingUp className="w-28 h-28" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full min-h-0">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-white">Life Expectancy Impact</h3>
                        <span className={cn(
                          'text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full',
                          aiImpactInsights.impactBand === 'High' ? 'bg-red-500/20 text-red-400' :
                          aiImpactInsights.impactBand === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        )}>
                          {aiImpactInsights.impactBand} Impact
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Estimated Pressure</p>
                          <p className="text-xl font-black text-white mt-1">{aiImpactInsights.expectancyPenaltyMonths} mo</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                          <p className="text-[10px] text-slate-500 uppercase font-bold">AI Context</p>
                          <p className="text-sm font-bold text-emerald-300 mt-1">Dashboard + Forecast</p>
                        </div>
                      </div>

                      <div className="h-28 w-full mb-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={aiImpactInsights.lifeTrend}>
                            <defs>
                              <linearGradient id="lifeImpactFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="window" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} domain={['dataMin - 0.3', 'dataMax + 0.3']} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                              formatter={(value: any) => [`${Number(value).toFixed(1)} years`, 'Projected life expectancy']}
                            />
                            <Area type="monotone" dataKey="years" stroke="#10b981" strokeWidth={2.5} fill="url(#lifeImpactFill)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      <p className="text-[10px] text-slate-400 leading-relaxed bg-white/5 border border-white/5 rounded-xl p-3">
                        {aiImpactInsights.summary}
                      </p>
                    </div>
                  </section>

                  <section className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] shadow-2xl h-[360px] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Activity className="w-28 h-28" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full min-h-0">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-white">Health Effects</h3>
                        <span className={cn(
                          'text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full',
                          aiImpactInsights.healthBand === 'High' ? 'bg-red-500/20 text-red-400' :
                          aiImpactInsights.healthBand === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        )}>
                          {aiImpactInsights.healthBand} Risk
                        </span>
                      </div>

                      <div className="h-36 w-full mb-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={aiImpactInsights.healthEffects} layout="vertical" margin={{ top: 4, right: 16, left: 20, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                            <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} width={86} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                              formatter={(value: any) => [`${Number(value).toFixed(0)}%`, 'Risk score']}
                            />
                            <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                              {aiImpactInsights.healthEffects.map((item: any, index: number) => (
                                <Cell key={`health-cell-${index}`} fill={item.score >= 80 ? '#ef4444' : item.score >= 55 ? '#f59e0b' : '#10b981'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <p className="text-[10px] text-slate-400 leading-relaxed bg-white/5 border border-white/5 rounded-xl p-3">
                        {aiImpactInsights.healthSummary}
                      </p>
                    </div>
                  </section>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-6">
                <section className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] shadow-2xl h-[450px] flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-bold text-lg text-white">Pollution Heat Map</h3>
                    <button onClick={() => setCurrentView('map')} className="text-xs font-bold text-slate-500 hover:text-white transition-all">Expand Map</button>
                  </div>
                  <div className="flex-1 rounded-3xl overflow-hidden border border-white/5">
                    <DashboardHeatMap pollutionAreas={pollutionAreas} mapCenter={mapCenter} />
                  </div>
                </section>

                <section className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] shadow-2xl">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-orange-500/10 rounded-xl">
                      <Factory className="w-5 h-5 text-orange-500" />
                    </div>
                    <h3 className="font-bold text-lg text-white">Nearby Industrial Monitoring</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {regionIndustriesFeed.slice(0, 5).length === 0 ? (
                      <div className="py-8 text-center text-slate-500">
                        <p className="text-xs">No industrial zones identified for your assigned region.</p>
                      </div>
                    ) : (
                      regionIndustriesFeed.slice(0, 5).map((industry, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-xs font-bold text-white">{industry.industry_name}</h4>
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full",
                              industry.compliance_status === 'Compliant'
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : industry.compliance_status === 'Warning'
                                  ? 'text-yellow-400 bg-yellow-500/10'
                                  : 'text-red-400 bg-red-500/10'
                            )}>
                              Industrial
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            <div className="p-2 rounded-xl bg-black/20 text-center">
                              <p className="text-[8px] text-slate-500 uppercase font-bold">AQI</p>
                              <p className={cn(
                                "text-xs font-black mt-1",
                                Number(industry.aqi || 0) > 200 ? 'text-red-400' : Number(industry.aqi || 0) > 100 ? 'text-yellow-400' : 'text-emerald-400'
                              )}>
                                {Number.isFinite(Number(industry.aqi)) ? Math.round(Number(industry.aqi)) : '--'}
                              </p>
                            </div>
                            <div className="p-2 rounded-xl bg-black/20 text-center">
                              <p className="text-[8px] text-slate-500 uppercase font-bold">Noise</p>
                              <p className={cn(
                                "text-xs font-black mt-1",
                                Number(industry.noise || 0) > 80 ? 'text-red-400' : Number(industry.noise || 0) > 70 ? 'text-yellow-400' : 'text-blue-400'
                              )}>
                                {typeof industry.noise === 'number' ? `${industry.noise} dB` : '--'}
                              </p>
                            </div>
                            <div className="p-2 rounded-xl bg-black/20 text-center">
                              <p className="text-[8px] text-slate-500 uppercase font-bold">Water pH</p>
                              <p className={cn(
                                "text-xs font-black mt-1",
                                Number(industry.waterPh || 0) < 6.5 || Number(industry.waterPh || 0) > 7.5 ? 'text-red-400' : 'text-cyan-400'
                              )}>
                                {typeof industry.waterPh === 'number' ? industry.waterPh.toFixed(1) : '--'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px]">
                            <span className="industry-location-text text-slate-400">Location: <span className="industry-location-value text-slate-200 font-semibold">{industry.location || 'Region Unavailable'}</span></span>
                            <span className={cn(
                              "font-bold px-2 py-0.5 rounded-full",
                              industry.compliance_status === 'Compliant'
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : industry.compliance_status === 'Warning'
                                  ? 'text-yellow-400 bg-yellow-500/10'
                                  : 'text-red-400 bg-red-500/10'
                            )}>
                              Compliance: {industry.compliance_status || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] shadow-2xl">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-blue-500/10 rounded-xl">
                      <Activity className="w-5 h-5 text-blue-500" />
                    </div>
                    <h3 className="font-bold text-lg text-white">Live Location Data</h3>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3 text-slate-400">
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs font-medium">Location: <span className="text-white">{locationInfo?.address || areaPollutionInfo?.city || 'Raipur, India'}</span></span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400">
                        <Globe className="w-4 h-4" />
                        <span className="text-xs font-medium">Latitude: <span className="text-white">{mapCenter[0].toFixed(4)}</span></span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400">
                        <Globe className="w-4 h-4" />
                        <span className="text-xs font-medium">Longitude: <span className="text-white">{mapCenter[1].toFixed(4)}</span></span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400">
                        <Info className="w-4 h-4" />
                        <span className="text-xs font-medium">Region: <span className="text-white">{areaPollutionInfo?.state || 'Unknown'}</span></span>
                      </div>
                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Updated Just Now</span>
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      </div>
                    </div>
                    <div className="w-32 h-40 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shrink-0">
                      <img 
                        src="https://picsum.photos/seed/location/200/300" 
                        alt="Location" 
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        );
      case 'pollutionmap':
      case 'industries':
        if (userRole === 'Industry User') {
          return (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Industrial Compliance Dashboard</h2>
                  <p className="text-slate-500 text-sm">Manage your facility's environmental footprint and compliance status</p>
                </div>
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Monitoring Active</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard 
                  title="Facility AQI" 
                  value={myIndustryData.aqi} 
                  unit="Index" 
                  icon={Wind} 
                  status={myIndustryData.aqi < 100 ? 'Good' : 'Moderate'} 
                  color="bg-blue-500" 
                  statusColor={myIndustryData.aqi < 100 ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"} 
                />
                <StatCard 
                  title="Noise Level" 
                  value={myIndustryData.noise} 
                  unit="dB" 
                  icon={Volume2} 
                  status={myIndustryData.noise < 75 ? 'Safe' : 'High'} 
                  color="bg-purple-500" 
                  statusColor={myIndustryData.noise < 75 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"} 
                />
                <StatCard 
                  title="Water pH" 
                  value={myIndustryData.waterPh} 
                  unit="pH" 
                  icon={Droplets} 
                  status={myIndustryData.waterPh >= 6.5 && myIndustryData.waterPh <= 8.5 ? 'Neutral' : 'Acidic'} 
                  color="bg-cyan-500" 
                  statusColor={myIndustryData.waterPh >= 6.5 && myIndustryData.waterPh <= 8.5 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"} 
                />
                <div className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] shadow-2xl flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-slate-400 text-sm font-medium tracking-wide">Compliance Status</h3>
                    <div className={cn(
                      "p-2 rounded-xl",
                      myIndustryData.complianceStatus === 'Compliant' ? "bg-emerald-500" : 
                      myIndustryData.complianceStatus === 'Non-Compliant' ? "bg-red-500" : "bg-yellow-500"
                    )}>
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className={cn(
                      "text-xl font-bold tracking-tight",
                      myIndustryData.complianceStatus === 'Compliant' ? "text-emerald-400" : 
                      myIndustryData.complianceStatus === 'Non-Compliant' ? "text-red-400" : "text-yellow-400"
                    )}>
                      {myIndustryData.complianceStatus}
                    </span>
                    <p className="text-[10px] text-slate-500">Last updated: {format(new Date(myIndustryData.lastUpdated), 'MMM d, HH:mm')}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <section className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] shadow-2xl">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h3 className="font-bold text-lg text-white">Facility Overview</h3>
                        <p className="text-xs text-slate-500 mt-1">{myIndustryData.name} — {myIndustryData.type}</p>
                      </div>
                      <div className="flex gap-2">
                        {(['Compliant', 'Warning', 'Non-Compliant'] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => handleUpdateCompliance(status)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                              myIndustryData.complianceStatus === status 
                                ? (status === 'Compliant' ? "bg-emerald-500 text-white border-emerald-500" : status === 'Warning' ? "bg-yellow-500 text-white border-yellow-500" : "bg-red-500 text-white border-red-500")
                                : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10"
                            )}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Historical AQI Trend</h4>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={myIndustryData.historicalTrends}>
                                <defs>
                                  <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="period" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="aqi" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAqi)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Emissions Profile</h4>
                          <div className="flex flex-wrap gap-2">
                            {myIndustryData.emissions.split(', ').map((e: string) => (
                              <div key={e} className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-xs font-bold">
                                {e}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Compliance Checklist</h4>
                          <div className="space-y-4">
                            {[
                              { label: 'Air Filtration System', status: true },
                              { label: 'Effluent Treatment Plant', status: true },
                              { label: 'Noise Barriers Installed', status: false },
                              { label: 'Real-time Data Sync', status: true },
                            ].map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between">
                                <span className="text-xs text-slate-300">{item.label}</span>
                                {item.status ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Location Details</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-slate-500">Latitude</span>
                              <span className="text-white font-mono">{myIndustryData.lat}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-slate-500">Longitude</span>
                              <span className="text-white font-mono">{myIndustryData.lng}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              setMapCenter([myIndustryData.lat, myIndustryData.lng]);
                              setMapZoom(15);
                              setCurrentView('map');
                            }}
                            className="w-full mt-4 py-2 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all"
                          >
                            View on Map
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  <section className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] shadow-2xl">
                    <h3 className="font-bold text-lg text-white mb-6">Recent Alerts</h3>
                    <div className="space-y-4">
                      {alerts.filter(a => a.sensorId === 'MY-IND' || a.sensorId === 'IND-001').length > 0 ? (
                        alerts.filter(a => a.sensorId === 'MY-IND' || a.sensorId === 'IND-001').map((alert, idx) => (
                          <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex gap-4">
                            <div className={cn(
                              "p-2 rounded-xl h-fit",
                              alert.severity === 'HIGH' ? "bg-red-500/20 text-red-500" : "bg-yellow-500/20 text-yellow-500"
                            )}>
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">Compliance Update</p>
                              <p className="text-[10px] text-slate-500 mt-1">Status changed to {myIndustryData.complianceStatus}</p>
                              <p className="text-[8px] text-slate-600 mt-2">{format(new Date(alert.timestamp), 'HH:mm:ss')}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Shield className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                          <p className="text-xs text-slate-500">No recent alerts</p>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="bg-blue-500/10 border border-blue-500/20 p-8 rounded-[2rem] shadow-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <BrainCircuit className="w-6 h-6 text-blue-400" />
                      <h3 className="font-bold text-lg text-white">AI Compliance Tip</h3>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      "Based on your current noise levels (72dB), installing acoustic barriers in the primary processing unit could improve your overall compliance score by 15%."
                    </p>
                    <button className="mt-4 text-[10px] font-bold text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-all">
                      View full analysis →
                    </button>
                  </section>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <section className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] shadow-2xl relative">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-blue-500" /> Global Monitoring Network
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Interactive geo-spatial compliance mapping</p>
                </div>
                
                <form onSubmit={handleSearch} className="relative w-full md:w-96">
                  <input 
                    type="text" 
                    placeholder="Search any area (e.g. Paris, Amazon Rainforest)..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  {isSearching && <Loader2 className="absolute right-3 top-3 w-4 h-4 text-blue-500 animate-spin" />}
                </form>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowPollutionMap(!showPollutionMap)}
                    className={cn("text-xs font-bold px-4 py-2.5 rounded-xl transition-all border border-white/5", showPollutionMap ? "bg-red-500 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10")}
                  >
                    Pollution Map
                  </button>
                  <button 
                    onClick={() => setShowIndustriesMap(!showIndustriesMap)}
                    className={cn("text-xs font-bold px-4 py-2.5 rounded-xl transition-all border border-white/5", showIndustriesMap ? "bg-blue-500 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10")}
                  >
                    Industries
                  </button>
                  <button 
                    onClick={() => {
                      setMapCenter([20.5937, 78.9629]);
                      setMapZoom(5);
                      loadIndianIndustries();
                    }}
                    className="text-xs font-bold px-4 py-2.5 rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-all border border-orange-500/20 flex items-center gap-2"
                  >
                    <Globe className="w-3 h-3" /> Focus India
                  </button>
                  <button 
                    onClick={handleDownloadIndustriesData}
                    className="text-xs font-bold px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all border border-blue-500/20 flex items-center gap-2"
                    title="Download data for industries currently visible in the map viewport"
                  >
                    <Download className="w-3 h-3" /> Download Visible Industries
                  </button>
                  <button 
                    onClick={handleResetMap}
                    className="text-xs font-bold px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-all border border-white/5 flex items-center gap-2"
                  >
                    <Globe className="w-3 h-3" /> Reset View
                  </button>
                  <button 
                    onClick={() => {
                      generateGlobalData('pollution');
                      generateGlobalData('industries');
                    }}
                    className="text-xs font-bold px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all border border-emerald-500/20 flex items-center gap-2"
                  >
                    <Zap className="w-3 h-3" /> Regenerate AI Data
                  </button>
                  <button 
                    onClick={handleExportGeoJSON}
                    className="text-xs font-bold px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-all border border-white/5"
                  >
                    Export GeoJSON
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-8">
                  <div className="h-[600px] relative">
                    <RealMap 
                      sensors={sensors} 
                      readings={readings} 
                      pinnedLocation={pinnedLocation}
                      onMapClick={handleMapClick}
                      mapCenter={mapCenter}
                      mapZoom={mapZoom}
                      pollutionAreas={pollutionAreas}
                      industrialAreas={regionIndustriesFeed.length > 0 ? regionIndustriesFeed as any[] : industrialAreas}
                      showPollution={showPollutionMap}
                      showIndustries={showIndustriesMap}
                      isLoadingAI={loadingPollution || loadingIndustries}
                      selectedPoint={selectedPoint}
                      locationInfo={locationInfo}
                      onClosePopup={() => setSelectedPoint(null)}
                      onDownloadIndustries={handleDownloadIndustriesData}
                    />
                    <p className="text-[10px] text-slate-500 mt-4 italic flex items-center gap-1">
                      <Info className="w-3 h-3" /> Click anywhere on the map to pin a location and get environmental insights.
                    </p>
                  </div>

                  {/* Industrial Info moved below the map */}
                  <div className="bg-[#1a1f2e] p-8 rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden min-h-[400px]">
                    {loadingLocationInfo ? (
                      <div className="flex flex-col items-center justify-center text-slate-500 gap-4 py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                        <p className="text-xs font-medium">Analyzing environmental data...</p>
                      </div>
                    ) : pinnedLocation && areaPollutionInfo ? (
                      <div className="space-y-8">
                        <div className="flex flex-col md:flex-row gap-8">
                          {/* Left: AQI and Location */}
                          {(currentView as string) !== 'waterquality' && (
                            <div className="flex-1 space-y-6">
                              <div className="flex items-center gap-4">
                                <div className="text-blue-500 font-black text-2xl italic">AQI</div>
                                <div>
                                  <h4 className="text-lg font-bold text-white">{areaPollutionInfo.city}</h4>
                                  <p className="text-xs text-blue-400">{areaPollutionInfo.state}, {areaPollutionInfo.country}</p>
                                </div>
                              </div>

                              <div className="bg-white/5 rounded-[2rem] p-6 border border-white/10 relative overflow-hidden flex items-center justify-between">
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2">
                                    <Wind className="w-3 h-3 text-slate-500" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Air Quality Index</span>
                                  </div>
                                  <div className="text-7xl font-bold text-white tracking-tighter leading-none">{areaPollutionInfo.aqi}</div>
                                  <div className={cn(
                                    "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block",
                                    getAQIStyle(areaPollutionInfo.aqi).bg === '#ffff00' ? "bg-yellow-400 text-slate-900" :
                                    getAQIStyle(areaPollutionInfo.aqi).bg === '#00e400' ? "bg-emerald-500 text-slate-900" :
                                    "text-white"
                                  )} style={{ backgroundColor: getAQIStyle(areaPollutionInfo.aqi).bg }}>
                                    {areaPollutionInfo.status}
                                  </div>
                                </div>
                                <div className="w-24 h-32 relative">
                                  <img 
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${areaPollutionInfo.city}&backgroundColor=transparent&clothing=hoodie&eyes=happy`} 
                                    alt="Status Character" 
                                    className="w-full h-full object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {(currentView as string) === 'waterquality' && (
                            <div className="flex-1 space-y-6">
                              <div className="flex items-center gap-4">
                                <div className="text-cyan-500 font-black text-2xl italic">WATER</div>
                                <div>
                                  <h4 className="text-lg font-bold text-white">{areaPollutionInfo.city}</h4>
                                  <p className="text-xs text-cyan-400">Regional Water Quality Analysis</p>
                                </div>
                              </div>
                              <div className="bg-white/5 rounded-[2rem] p-6 border border-white/10 relative overflow-hidden flex items-center justify-between">
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2">
                                    <Droplets className="w-3 h-3 text-slate-500" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg Water pH</span>
                                  </div>
                                  <div className="text-7xl font-bold text-white tracking-tighter leading-none">{areaPollutionInfo.waterPh}</div>
                                  <div className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block bg-cyan-500 text-slate-900">
                                    {(areaPollutionInfo.waterPh < 6.5 || areaPollutionInfo.waterPh > 7.5) ? "Action Required" : "Safe Levels"}
                                  </div>
                                </div>
                                <div className="w-24 h-32 relative">
                                  <Droplets className="w-full h-full text-cyan-500/20" />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Right: Detailed Parameters */}
                          {(currentView as string) !== 'waterquality' && (
                            <div className="flex-1">
                              <div className="bg-white/5 rounded-[2rem] p-6 border border-white/10 h-full">
                                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Pollutant Breakdown</h5>
                                <div className="grid grid-cols-1 gap-4">
                                  {Object.entries(areaPollutionInfo.details || {}).map(([key, val]: [string, any]) => (
                                    <div key={key} className="flex items-center justify-between group">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-white w-10">{key}</span>
                                        <TrendingUp className="w-2.5 h-2.5 text-slate-600 group-hover:text-blue-500 transition-colors" />
                                      </div>
                                      <div className="flex items-center gap-3 flex-1 justify-end">
                                        <span className="text-[11px] font-bold text-white">{val} <span className="text-[9px] text-slate-500 font-normal">{key.includes('PM') ? 'µg/m³' : 'ppb'}</span></span>
                                        <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                                          <div 
                                            className={cn(
                                              "h-full transition-all duration-1000",
                                              val > 100 ? "bg-red-500" : val > 50 ? "bg-yellow-500" : "bg-emerald-500"
                                            )} 
                                            style={{ width: `${Math.min(100, (val / 300) * 100)}%` }} 
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          {(currentView as string) === 'waterquality' && (
                            <div className="flex-1">
                              <div className="bg-white/5 rounded-[2rem] p-6 border border-white/10 h-full">
                                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Regional Water Metrics</h5>
                                <div className="grid grid-cols-1 gap-4">
                                  {[
                                    { label: 'Avg Dissolved O2', value: (waterStations.reduce((acc, s) => acc + parseFloat(s.dissolved_oxygen || 0), 0) / (waterStations.length || 1)).toFixed(1), unit: 'mg/L', color: 'bg-emerald-500' },
                                    { label: 'Avg BOD', value: (waterStations.reduce((acc, s) => acc + parseFloat(s.bod || 0), 0) / (waterStations.length || 1)).toFixed(1), unit: 'mg/L', color: 'bg-orange-500' },
                                    { label: 'Avg Turbidity', value: (waterStations.reduce((acc, s) => acc + parseFloat(s.turbidity || 0), 0) / (waterStations.length || 1)).toFixed(1), unit: 'NTU', color: 'bg-blue-500' }
                                  ].map((metric, idx) => (
                                    <div key={idx} className="flex items-center justify-between group">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-white">{metric.label}</span>
                                      </div>
                                      <div className="flex items-center gap-3 flex-1 justify-end">
                                        <span className="text-[11px] font-bold text-white">{metric.value} <span className="text-[9px] text-slate-500 font-normal">{metric.unit}</span></span>
                                        <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                                          <div 
                                            className={cn("h-full transition-all duration-1000", metric.color)} 
                                            style={{ width: `${Math.min(100, (parseFloat(metric.value) / 20) * 100)}%` }} 
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Environmental Metrics Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {(currentView as string) !== 'waterquality' && (currentView as string) !== 'pollutionmap' && (
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                              <div className="flex items-center gap-2 mb-2">
                                <Volume2 className="w-3 h-3 text-blue-400" />
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Noise Level</span>
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-white">{areaPollutionInfo.noiseLevel}</span>
                                <span className="text-[9px] text-slate-500">dB</span>
                              </div>
                              <div className={cn(
                                "mt-2 text-[8px] font-bold uppercase tracking-widest",
                                areaPollutionInfo.noiseLevel > 70 ? "text-red-400" : "text-emerald-400"
                              )}>
                                {areaPollutionInfo.noiseLevel > 70 ? "High Exposure" : "Safe Level"}
                              </div>
                            </div>
                          )}
                          {(currentView as string) !== 'pollutionmap' && (
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                              <div className="flex items-center gap-2 mb-2">
                                <Droplets className="w-3 h-3 text-cyan-400" />
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Water pH</span>
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-white">{areaPollutionInfo.waterPh}</span>
                                <span className="text-[9px] text-slate-500">pH</span>
                              </div>
                              <div className={cn(
                                "mt-2 text-[8px] font-bold uppercase tracking-widest",
                                (areaPollutionInfo.waterPh < 6.5 || areaPollutionInfo.waterPh > 7.5) ? "text-red-400" : "text-emerald-400"
                              )}>
                                {(areaPollutionInfo.waterPh < 6.5 || areaPollutionInfo.waterPh > 7.5) ? "Violation" : "Optimal"}
                              </div>
                            </div>
                          )}
                          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="w-3 h-3 text-indigo-400" />
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Compliance Status</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={cn(
                                "text-lg font-bold",
                                areaPollutionInfo.complianceStatus === 'Compliant' ? "text-emerald-400" : 
                                areaPollutionInfo.complianceStatus === 'Non-Compliant' ? "text-red-400" : "text-yellow-400"
                              )}>
                                {areaPollutionInfo.complianceStatus || 'Compliant'}
                              </span>
                              <div className={cn(
                                "w-2 h-2 rounded-full animate-pulse",
                                areaPollutionInfo.complianceStatus === 'Compliant' ? "bg-emerald-500" : 
                                areaPollutionInfo.complianceStatus === 'Non-Compliant' ? "bg-red-500" : "bg-yellow-500"
                              )} />
                            </div>
                          </div>
                        </div>

                        {/* Nearby Industrial Zones Horizontal */}
                        {nearbyPoints.filter(p => p.type === 'Industrial').length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Factory className="w-3 h-3 text-orange-500" />
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nearby Industrial Zones</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                              {nearbyPoints.filter(p => p.type === 'Industrial').slice(0, 5).map((point, i) => (
                                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer" onClick={() => {
                                  setMapCenter([point.lat, point.lng]);
                                  setMapZoom(14);
                                }}>
                                  <div className="flex justify-between items-start mb-2">
                                    <h5 className="text-[11px] font-bold text-white truncate">{point.name}</h5>
                                    <span className="text-[8px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-full">Industrial</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    <div className="flex items-center gap-1">
                                      <Wind className="w-2 h-2 text-emerald-500" />
                                      <span className="text-[9px] text-slate-400">AQI: <span className="text-white font-bold">{point.aqi}</span></span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Volume2 className="w-2 h-2 text-blue-500" />
                                      <span className="text-[9px] text-slate-400">Noise: <span className="text-white font-bold">{point.noise}</span></span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Droplets className="w-2 h-2 text-cyan-500" />
                                      <span className="text-[9px] text-slate-400">pH: <span className="text-white font-bold">{point.waterPh}</span></span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Shield className={cn(
                                        "w-2 h-2",
                                        point.industryData?.compliance === 'Compliant' ? "text-emerald-500" : 
                                        point.industryData?.compliance === 'Non-Compliant' ? "text-red-500" : "text-yellow-500"
                                      )} />
                                      <span className="text-[9px] text-slate-400">Status: <span className="text-white font-bold">{point.industryData?.compliance || 'Compliant'}</span></span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-4 pt-4 border-t border-white/5">
                          <button 
                            onClick={() => { setPinnedLocation(null); setAreaPollutionInfo(null); setNearbyPoints([]); }}
                            className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 hover:bg-white/10 transition-all"
                          >
                            Clear Selection
                          </button>
                          <button 
                            onClick={handleExportReport}
                            className="px-8 py-3 rounded-xl bg-blue-500 text-white text-[10px] font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-400 transition-all"
                          >
                            Export Report
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500 text-center gap-8 py-20">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/5 animate-pulse">
                          <MapPin className="w-10 h-10 opacity-20" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-white font-bold">Explore Environmental Data</h4>
                          <p className="text-xs font-medium px-8 leading-relaxed opacity-60">Search for a city or click anywhere on the map to see real-time AQI, industrial impact, and AI insights.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Sidebar: Global Stats or Contextual List */}
                <div className="lg:col-span-1 space-y-6">
                  {currentView === 'industries' ? (
                    <div className="p-8 bg-[#1a1f2e] rounded-[2rem] border border-white/5 shadow-2xl flex flex-col h-full max-h-[800px]">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-xl">
                          <Building2 className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Industrial Network</h4>
                          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Global Monitoring</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                        {loadingIndustries ? (
                          <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Scanning Globe...</p>
                          </div>
                        ) : industrialAreas.filter(area => 
                            area.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (area.type && area.type.toLowerCase().includes(searchQuery.toLowerCase()))
                          ).length === 0 ? (
                          <div className="text-center py-20">
                            <Building2 className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                            <p className="text-xs text-slate-500">No industrial data found matching your search.</p>
                          </div>
                        ) : (
                          industrialAreas.filter(area => 
                            area.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (area.type && area.type.toLowerCase().includes(searchQuery.toLowerCase()))
                          ).map((area, i) => (
                            <motion.div 
                              key={i} 
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.02 }}
                              className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                              onClick={() => {
                                setMapCenter([area.lat, area.lng]);
                                setMapZoom(14);
                                setSelectedPoint({ lat: area.lat, lng: area.lng, type: 'industry' });
                              }}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h5 className="text-[11px] font-bold text-white group-hover:text-blue-400 transition-colors truncate pr-2">{area.name}</h5>
                                  {area.type && <p className="text-[8px] text-blue-400 font-bold uppercase tracking-widest">{area.type}</p>}
                                </div>
                                <span className={cn(
                                  "text-[8px] font-bold px-1.5 py-0.5 rounded-full",
                                  area.complianceStatus === 'Compliant' ? "bg-emerald-500/10 text-emerald-500" : 
                                  area.complianceStatus === 'Non-Compliant' ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"
                                )}>
                                  {area.complianceStatus}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-1">
                                  <Wind className="w-2 h-2 text-emerald-500" />
                                  <span className="text-[9px] text-slate-400">AQI: <span className="text-white font-bold">{area.aqi}</span></span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Volume2 className="w-2 h-2 text-blue-500" />
                                  <span className="text-[9px] text-slate-400">Noise: <span className="text-white font-bold">{area.noise}</span></span>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : currentView === 'pollutionmap' ? (
                    <div className="p-8 bg-[#1a1f2e] rounded-[2rem] border border-white/5 shadow-2xl flex flex-col h-full max-h-[800px]">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-500/10 rounded-xl">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pollution Hotspots</h4>
                          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Critical Monitoring</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                        {loadingPollution ? (
                          <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Scanning Globe...</p>
                          </div>
                        ) : pollutionAreas.length === 0 ? (
                          <div className="text-center py-20">
                            <AlertTriangle className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                            <p className="text-xs text-slate-500">No pollution data found.</p>
                          </div>
                        ) : (
                          pollutionAreas.map((area, i) => (
                            <motion.div 
                              key={i} 
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.02 }}
                              className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                              onClick={() => {
                                setMapCenter([area.lat, area.lng]);
                                setMapZoom(14);
                                setSelectedPoint({ lat: area.lat, lng: area.lng, type: 'pollution' });
                              }}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="text-[11px] font-bold text-white group-hover:text-red-400 transition-colors truncate pr-2">{area.name}</h5>
                                <span className={cn(
                                  "text-[8px] font-bold px-1.5 py-0.5 rounded-full",
                                  area.severity === 'CRITICAL' ? "bg-red-500/10 text-red-500" : "bg-orange-500/10 text-orange-500"
                                )}>
                                  {area.severity}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <div className="flex items-center gap-1">
                                  <Wind className="w-2 h-2 text-red-400" />
                                  <span className="text-[9px] text-slate-400">AQI: <span className="text-white font-bold">{area.aqi || (area.severity === 'CRITICAL' ? 250 : 150)}</span></span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Activity className="w-2 h-2 text-orange-400" />
                                  <span className="text-[9px] text-slate-400">PM2.5: <span className="text-white font-bold">{area.pm25 || '--'}</span></span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">{area.type}</div>
                                <div className="w-1 h-1 rounded-full bg-slate-700" />
                                <div className="text-[9px] text-slate-400 truncate">{area.description}</div>
                              </div>
                              {area.contributingFactors && area.contributingFactors.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {area.contributingFactors.slice(0, 3).map((factor: string, idx: number) => (
                                    <span key={idx} className="px-1.5 py-0.5 bg-blue-500/5 text-blue-400/70 text-[7px] rounded-md border border-blue-500/10 uppercase tracking-tighter">
                                      {factor}
                                    </span>
                                  ))}
                                  {area.contributingFactors.length > 3 && (
                                    <span className="text-[7px] text-slate-600 font-bold">+{area.contributingFactors.length - 3} more</span>
                                  )}
                                </div>
                              )}
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-8 bg-[#1a1f2e] rounded-[2rem] border border-white/5 shadow-2xl flex flex-col justify-center min-h-[180px]">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-blue-500/10 rounded-xl">
                            <Activity className="w-5 h-5 text-blue-500" />
                          </div>
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Stations</h4>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold text-white tracking-tighter">{sensors.length}</span>
                          <span className="text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">+2 New</span>
                        </div>
                      </div>
                      
                      <div className="p-8 bg-[#1a1f2e] rounded-[2rem] border border-white/5 shadow-2xl flex flex-col justify-center min-h-[180px]">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-red-500/10 rounded-xl">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          </div>
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">High Risk Zones</h4>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold text-red-500 tracking-tighter">{alerts.length}</span>
                          <span className="text-xs text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded-full">Critical</span>
                        </div>
                      </div>
    
                      <div className="p-8 bg-[#1a1f2e] rounded-[2rem] border border-white/5 shadow-2xl flex flex-col justify-center min-h-[180px]">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-emerald-500/10 rounded-xl">
                            <Shield className="w-5 h-5 text-emerald-500" />
                          </div>
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Compliance Rate</h4>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold text-emerald-500 tracking-tighter">92.4%</span>
                          <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">Optimal</span>
                        </div>
                      </div>
    
                      {/* AQI Legend in Sidebar */}
                      {(currentView as string) !== 'waterquality' && (
                        <div className="p-8 bg-[#1a1f2e] rounded-[2rem] border border-white/5 shadow-2xl">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">AQI Legend</h4>
                          <div className="space-y-3">
                            {[
                              { label: 'Good', range: '0-50', color: '#00e400' },
                              { label: 'Moderate', range: '51-100', color: '#ffff00' },
                              { label: 'Unhealthy (SG)', range: '101-150', color: '#ff7e00' },
                              { label: 'Unhealthy', range: '151-200', color: '#ff0000' },
                              { label: 'Very Unhealthy', range: '201-300', color: '#8f3f97' },
                              { label: 'Hazardous', range: '301+', color: '#7e0023' },
                            ].map((item) => (
                              <div key={item.label} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                  <span className="text-[10px] text-slate-400">{item.label}</span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-500">{item.range}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </section>
          </div>
        );
      case 'logs':
        return (
          <div className="space-y-6">
            <section className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-500" /> Compliance Logs
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Historical sensor data and compliance records</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all">
                    <Filter className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="pb-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Timestamp</th>
                      <th className="pb-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Station</th>
                      <th className="pb-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Parameter</th>
                      <th className="pb-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Value</th>
                      <th className="pb-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {Object.entries(readings).flatMap(([id, logs]) => logs.map((log, i) => {
                      const sensor = sensors.find(s => s.id === id);
                      const isExceeded = log.value > (sensor?.max_threshold || 0);
                      return (
                        <tr key={`${id}-${i}`} className="hover:bg-white/5 transition-all group">
                          <td className="py-4 text-xs text-slate-400">{format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}</td>
                          <td className="py-4 text-xs font-bold text-white">{sensor?.name}</td>
                          <td className="py-4 text-xs text-slate-500">{sensor?.parameter}</td>
                          <td className="py-4 text-xs font-bold text-slate-200">{log.value.toFixed(2)} {sensor?.unit}</td>
                          <td className="py-4">
                            <span className={cn("text-[10px] font-bold px-3 py-1 rounded-full shadow-lg", isExceeded ? "bg-red-500/20 text-red-500" : "bg-emerald-500/20 text-emerald-500")}>
                              {isExceeded ? 'VIOLATION' : 'COMPLIANT'}
                            </span>
                          </td>
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        );
      case 'alerts':
        return (
          <div className="space-y-6">
            <section className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" /> Compliance Violation Feed
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Real-time monitoring of environmental thresholds</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all">
                    <Filter className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                  { label: 'Total Alerts', value: alerts.length, color: 'text-white' },
                  { label: 'Critical', value: alerts.filter(a => a.severity === 'CRITICAL').length, color: 'text-red-500' },
                  { label: 'High Risk', value: alerts.filter(a => a.severity === 'HIGH').length, color: 'text-orange-500' },
                  { label: 'Resolved', value: '124', color: 'text-emerald-500' },
                ].map((stat, i) => (
                  <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/5">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{stat.label}</h4>
                    <div className={cn("text-3xl font-bold", stat.color)}>{stat.value}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-4">
                    <Shield className="w-16 h-16 opacity-10" />
                    <p className="text-sm font-medium">No active violations detected</p>
                  </div>
                ) : (
                  alerts.map((alert, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col md:flex-row gap-6 items-start md:items-center group hover:bg-white/10 transition-all"
                    >
                      <div className={cn("p-3 rounded-xl shadow-lg", alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? "bg-red-500" : "bg-yellow-500")}>
                        <AlertTriangle className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-white">Threshold Violation</h4>
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? "bg-red-500/20 text-red-500" : "bg-yellow-500/20 text-yellow-500")}>{alert.severity}</span>
                        </div>
                        <p className="text-xs text-slate-400">Sensor <span className="text-slate-200 font-medium">{alert.sensorId}</span> recorded a value of <span className="text-red-400 font-bold">{alert.value?.toFixed(1)}</span>, exceeding the safety threshold.</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-xs font-bold text-white">{alert.timestamp ? format(new Date(alert.timestamp), 'MMM dd, HH:mm a') : '--:--'}</div>
                        <button className="text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:underline">Acknowledge</button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </section>
          </div>
        );
      case 'simulator':
        return (
          <div className="space-y-6">
            <section className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <Zap className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="font-bold text-lg text-white">Environmental Simulator</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                  <h4 className="text-sm font-bold text-white mb-4">Simulation Controls</h4>
                  <p className="text-xs text-slate-500 mb-6">Adjust parameters to simulate environmental impact scenarios.</p>
                  <div className="space-y-6">
                    {[
                      { key: 'industrialGrowth', label: 'Industrial Growth' },
                      { key: 'trafficDensity', label: 'Traffic Density' },
                      { key: 'wasteManagement', label: 'Waste Management' },
                      { key: 'greenCover', label: 'Green Cover' },
                    ].map((param) => (
                      <div key={param.key}>
                        <div className="flex justify-between mb-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{param.label}</label>
                          <span className="text-[10px] font-bold text-emerald-500">
                            {simulationBandLabel(simulatorControls[param.key as keyof typeof simulatorControls])}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={simulatorControls[param.key as keyof typeof simulatorControls]}
                            onChange={(e) => {
                              const next = Number(e.target.value);
                              setSimulatorControls((prev) => ({
                                ...prev,
                                [param.key]: next,
                              }));
                            }}
                            className="w-full accent-emerald-500 cursor-pointer"
                          />
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${simulatorControls[param.key as keyof typeof simulatorControls]}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={runEnvironmentalSimulation}
                    disabled={simulationLoading}
                    className="w-full mt-8 py-4 rounded-xl bg-emerald-500 text-slate-900 font-bold text-sm hover:bg-emerald-400 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {simulationLoading ? 'Running Simulation...' : 'Run Simulation'}
                  </button>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center gap-4">
                  {!simulationResult ? (
                    <>
                      <div className="w-20 h-20 rounded-full bg-emerald-500/5 flex items-center justify-center">
                        <Activity className="w-10 h-10 text-emerald-500 opacity-20" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Simulation Results</h4>
                      <p className="text-xs text-slate-500 px-8">Run a simulation to see predicted environmental outcomes and risk assessments.</p>
                      {simulationError && <p className="text-xs text-red-400">{simulationError}</p>}
                    </>
                  ) : (
                    <>
                      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                        <div className="rounded-xl bg-black/20 border border-white/5 p-3">
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">AQI</p>
                          <p className="text-xl font-black text-orange-400 mt-1">{simulationResult.aqi}</p>
                        </div>
                        <div className="rounded-xl bg-black/20 border border-white/5 p-3">
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Noise</p>
                          <p className="text-xl font-black text-purple-400 mt-1">{simulationResult.noise} dB</p>
                        </div>
                        <div className="rounded-xl bg-black/20 border border-white/5 p-3">
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Water pH</p>
                          <p className="text-xl font-black text-cyan-400 mt-1">{simulationResult.ph}</p>
                        </div>
                      </div>
                      <div className="w-full rounded-xl bg-black/20 border border-white/5 p-4 text-left">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <h4 className="text-sm font-bold text-white">Simulation Results</h4>
                          <span className={cn(
                            'text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full',
                            simulationResult.risk === 'Critical' ? 'bg-red-500/20 text-red-400' :
                            simulationResult.risk === 'High' ? 'bg-orange-500/20 text-orange-400' :
                            simulationResult.risk === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-emerald-500/20 text-emerald-400'
                          )}>
                            {simulationResult.risk} Risk
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{simulationResult.summary}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>

            <D3SimulationForecast
              controls={simulatorControls}
              simulationResult={simulationResult}
            />
          </div>
        );
      case 'waterquality':
        return (
          <div className="space-y-6">
            <section className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-cyan-500" /> Water Quality Monitoring
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Real-time analysis of water bodies and monitoring stations</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={fetchWaterQuality} className="px-4 py-2 rounded-xl bg-cyan-500/10 text-cyan-500 text-xs font-bold border border-cyan-500/20 hover:bg-cyan-500/20 transition-all flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Refresh Data
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 h-[600px]">
                  <RealMap 
                    sensors={sensors} 
                    readings={readings} 
                    pinnedLocation={pinnedLocation}
                    onMapClick={handleMapClick}
                    mapCenter={mapCenter}
                    mapZoom={mapZoom}
                    waterStations={waterStations}
                    showWaterQuality={true}
                    locationInfo={locationInfo}
                    onDownloadIndustries={handleDownloadIndustriesData}
                  />
                </div>
                
                <div className="lg:col-span-4 space-y-6 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Monitoring Stations</h4>
                  {loadingWaterQuality ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-4 bg-white/5 rounded-2xl border border-white/5">
                      <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                      <p className="text-xs font-medium">Fetching station data...</p>
                    </div>
                  ) : waterStations.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-4 bg-white/5 rounded-2xl border border-white/5">
                      <Droplets className="w-8 h-8 text-slate-600" />
                      <p className="text-xs font-medium">No monitoring stations found in this area.</p>
                      <button 
                        onClick={fetchWaterQuality}
                        className="text-[10px] text-cyan-500 hover:underline"
                      >
                        Try again
                      </button>
                    </div>
                  ) : (
                    waterStations.map((station, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: 20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                        onClick={() => {
                          setMapCenter([station.lat, station.lng]);
                          setMapZoom(14);
                        }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">{station.name}</h5>
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 uppercase tracking-tighter">Active</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-black/20 p-2 rounded-xl">
                            <p className="text-[8px] text-slate-500 uppercase font-bold mb-1">pH Level</p>
                            <p className="text-sm font-bold text-cyan-400">{station.ph}</p>
                          </div>
                          <div className="bg-black/20 p-2 rounded-xl">
                            <p className="text-[8px] text-slate-500 uppercase font-bold mb-1">Turbidity</p>
                            <p className="text-sm font-bold text-blue-400">{station.turbidity} <span className="text-[8px] font-normal">NTU</span></p>
                          </div>
                          {station.dissolved_oxygen && (
                            <div className="bg-black/20 p-2 rounded-xl">
                              <p className="text-[8px] text-slate-500 uppercase font-bold mb-1">Dissolved O2</p>
                              <p className="text-sm font-bold text-emerald-400">{station.dissolved_oxygen} <span className="text-[8px] font-normal">mg/L</span></p>
                            </div>
                          )}
                          {station.bod && (
                            <div className="bg-black/20 p-2 rounded-xl">
                              <p className="text-[8px] text-slate-500 uppercase font-bold mb-1">BOD</p>
                              <p className="text-sm font-bold text-orange-400">{station.bod} <span className="text-[8px] font-normal">mg/L</span></p>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <p className="text-[9px] text-slate-400 flex items-center gap-1">
                            <Shield className="w-3 h-3 text-emerald-500" /> {station.contaminants}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Average pH', value: (waterStations.reduce((acc, s) => acc + parseFloat(s.ph), 0) / (waterStations.length || 1)).toFixed(1), icon: Droplets, color: 'text-cyan-400' },
                { label: 'Safe Stations', value: waterStations.filter(s => {
                  const ph = parseFloat(s.ph);
                  return ph >= 6.5 && ph <= 8.5;
                }).length, icon: CheckCircle2, color: 'text-emerald-400' },
                { label: 'Alerts', value: '0', icon: AlertTriangle, color: 'text-slate-500' },
              ].map((stat, i) => (
                <div key={i} className="p-6 bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] shadow-xl flex items-center gap-4">
                  <div className={cn("p-3 rounded-2xl bg-white/5", stat.color.replace('text', 'bg').replace('400', '500/10'))}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleLogin = async () => {
    setLoginError(null);
    setLoginLoading(true);

    try {
      if (userRole === 'Citizen') {
        setAuthToken('');
        window.localStorage.removeItem(AUTH_SESSION_KEY);
        setCurrentUser({
          email: 'citizen@public.portal',
          role: 'Citizen',
        });
        setIsLoggedIn(true);
        setLoginEmail('');
        setLoginPassword('');
        return;
      }

      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: userRole.replace(/ /g, "_").toUpperCase(),
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload?.detail || 'Login failed');
      }

      const payload = await response.json();
      const accessToken = String(payload?.access_token || '').trim();

      if (!accessToken) {
        throw new Error('Login succeeded but no access token was returned.');
      }

      const normalizedEmail = String(payload?.email || loginEmail).trim().toLowerCase();

      setAuthToken(accessToken);
      window.localStorage.setItem(
        AUTH_SESSION_KEY,
        JSON.stringify({
          email: normalizedEmail,
          role: userRole,
          token: accessToken,
        }),
      );

      setCurrentUser({
        email: normalizedEmail,
        role: userRole
      });
      setIsLoggedIn(true);
      setLoginEmail('');
      setLoginPassword('');
    } catch (err) {
      const fallbackMessage = 'Invalid credentials for the selected role.';
      const message = err instanceof Error ? err.message : fallbackMessage;
      const isNetworkError = /failed to fetch|networkerror|load failed/i.test(message);

      setLoginError(
        isNetworkError
          ? 'Unable to connect to backend. Start backend server on port 8000 and try again.'
          : message
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const scrollToLandingSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  if (!isLoggedIn) {
    return (
      <div className={cn(
        "min-h-screen font-sans relative overflow-x-hidden transition-colors duration-300",
        isLandingDark ? "bg-[#07111a] text-slate-100" : "bg-[#eef3ef] text-slate-800"
      )}>
        <div className={cn(
          "absolute inset-0 pointer-events-none",
          isLandingDark
            ? "bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.18),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(30,64,175,0.20),transparent_35%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.12),transparent_45%)]"
            : "bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.18),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(30,64,175,0.14),transparent_35%),radial-gradient(circle_at_50%_90%,rgba(15,118,110,0.16),transparent_45%)]"
        )} />

        <div className={cn(
          "relative z-10 border-b backdrop-blur-lg transition-colors duration-300",
          isLandingDark ? "border-emerald-200/10 bg-[#0d1a24]/95" : "border-slate-200 bg-white/95"
        )}>
          <header className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className={cn(
                "w-14 h-14 rounded-full border overflow-hidden flex items-center justify-center shadow-lg shrink-0",
                isLandingDark ? "bg-amber-50 border-amber-300/60" : "bg-white border-amber-200"
              )}>
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                  alt="Government of India emblem"
                  className={cn(
                    "w-10 h-10 object-contain",
                    isLandingDark ? "brightness-50 contrast-125" : "brightness-90"
                  )}
                />
              </div>
              <div className="min-w-0">
                <h1 className={cn("text-xl sm:text-2xl font-black tracking-tight truncate", isLandingDark ? "text-emerald-100" : "text-slate-800")}>State Environment Conservation Board</h1>
                <p className={cn("text-xs sm:text-sm font-semibold truncate", isLandingDark ? "text-emerald-300/80" : "text-slate-600")}>PrithviNet - State Environmental Intelligence Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsLandingDark(prev => !prev)}
                aria-label="Toggle theme"
                className={cn(
                  "w-14 h-8 rounded-full border relative transition-colors",
                  isLandingDark ? "border-emerald-300/30 bg-emerald-800/70" : "border-slate-300 bg-slate-100"
                )}
              >
                <span className={cn(
                  "absolute top-1 w-6 h-6 rounded-full transition-all duration-300",
                  isLandingDark ? "left-7 bg-emerald-200" : "left-1 bg-white"
                )} />
              </button>
              <button className={cn(
                "px-3 py-2 rounded-xl border text-xs font-bold transition-colors",
                isLandingDark ? "border-emerald-200/20 bg-[#12212d] text-emerald-100" : "border-slate-300 bg-white text-slate-700"
              )}>EN</button>
            </div>
          </header>

          <nav className={cn(
            "sticky top-0 z-40 border-t",
            isLandingDark ? "bg-[#0d1a24]/98 border-emerald-200/10" : "bg-white/98 border-slate-200"
          )}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-1 sm:gap-2">
              {[
                { label: 'Home', id: 'home' },
                { label: 'About SECB', id: 'about' },
                { label: 'Environmental Data', id: 'environmental-data' },
                { label: 'Monitoring Stations', id: 'monitoring-stations' },
                { label: 'Reports', id: 'reports' },
                { label: 'Citizen Services', id: 'citizen-services' },
                { label: 'Contact', id: 'contact' },
              ].map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => scrollToLandingSection(item.id)}
                  className={cn(
                    "px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition-colors",
                    index === 0
                      ? (isLandingDark ? "text-emerald-100 bg-emerald-800/40" : "text-slate-900 bg-amber-50")
                      : (isLandingDark ? "text-emerald-100/80 hover:text-emerald-50 hover:bg-emerald-300/10" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100")
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        </div>

        <main className={cn(
          "relative z-10 pb-12 sm:pb-16",
          isLandingDark
            ? "bg-[linear-gradient(180deg,rgba(3,14,25,0.85),rgba(6,22,34,0.95))]"
            : "bg-transparent"
        )}>
          {!isLandingDark && (
            <div
              className="absolute inset-x-0 top-0 h-[620px] pointer-events-none opacity-80"
              style={{
                backgroundImage: "linear-gradient(90deg, rgba(220,245,235,0.94) 0%, rgba(220,245,235,0.35) 14%, rgba(220,245,235,0.00) 28%, rgba(220,245,235,0.00) 72%, rgba(220,245,235,0.35) 86%, rgba(220,245,235,0.94) 100%), linear-gradient(180deg, rgba(220,245,235,0.65) 0%, rgba(220,245,235,0.00) 35%, rgba(220,245,235,0.72) 100%), url('https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2200&q=80')",
                backgroundPosition: 'center',
                backgroundSize: 'cover'
              }}
            />
          )}

          <section id="home" className="scroll-mt-28 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
            <div className={cn(
              "rounded-none sm:rounded-3xl border overflow-hidden shadow-2xl",
              isLandingDark
                ? "border-emerald-300/20 shadow-black/40"
                : "border-slate-200/70 shadow-slate-900/10"
            )}>
              <div
                className="relative px-6 sm:px-10 py-14 sm:py-16 lg:py-20"
                style={{
                  backgroundImage: isLandingDark
                    ? "linear-gradient(95deg, rgba(2,10,18,0.92) 0%, rgba(2,10,18,0.82) 46%, rgba(6,78,59,0.30) 100%), url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1800&q=80')"
                    : "linear-gradient(95deg, rgba(239,246,255,0.92) 0%, rgba(239,246,255,0.86) 42%, rgba(19,78,74,0.18) 100%), url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1800&q=80')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className={cn(
                  "absolute inset-0 pointer-events-none",
                  isLandingDark
                    ? "bg-[radial-gradient(circle_at_75%_30%,rgba(16,185,129,0.16),transparent_42%),radial-gradient(circle_at_90%_70%,rgba(14,165,233,0.14),transparent_46%)]"
                    : "bg-[radial-gradient(circle_at_75%_30%,rgba(16,185,129,0.08),transparent_42%)]"
                )} />

                <div className="absolute right-8 top-10 hidden lg:flex flex-col gap-3 max-w-[260px] pointer-events-none">
                  <div className={cn(
                    "rounded-xl border px-4 py-3 backdrop-blur-sm",
                    isLandingDark ? "bg-emerald-900/30 border-emerald-300/20" : "bg-white/70 border-white/70"
                  )}>
                    <p className={cn("text-[11px] font-black uppercase tracking-wide", isLandingDark ? "text-emerald-200" : "text-teal-700")}>Live AQI Nodes</p>
                    <p className={cn("text-xl font-black mt-1", isLandingDark ? "text-emerald-100" : "text-slate-800")}>1,247 Active</p>
                  </div>
                  <div className={cn(
                    "rounded-xl border px-4 py-3 backdrop-blur-sm",
                    isLandingDark ? "bg-sky-900/25 border-sky-300/20" : "bg-white/70 border-white/70"
                  )}>
                    <p className={cn("text-[11px] font-black uppercase tracking-wide", isLandingDark ? "text-sky-200" : "text-sky-700")}>Compliance Pulse</p>
                    <p className={cn("text-xl font-black mt-1", isLandingDark ? "text-slate-100" : "text-slate-800")}>98% Within Limits</p>
                  </div>
                </div>

                <div className="max-w-2xl">
                  <h2 className={cn(
                    "text-4xl sm:text-5xl font-black leading-tight tracking-tight",
                    isLandingDark ? "text-emerald-100 [text-shadow:0_2px_16px_rgba(0,0,0,0.65)]" : "text-slate-800"
                  )}>
                    Safeguarding India's Environment Through Data-Driven Monitoring &amp; Governance
                  </h2>
                  <p className={cn(
                    "mt-5 text-base sm:text-xl max-w-xl leading-relaxed",
                    isLandingDark ? "text-slate-100/90 [text-shadow:0_1px_10px_rgba(0,0,0,0.55)]" : "text-slate-700"
                  )}>
                    Real-time environmental intelligence monitoring air quality, water resources, industrial emissions, and ecological health across India.
                  </p>
                  <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => setShowRoleAccess(true)}
                      className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-900/30 transition-colors flex items-center justify-center gap-2"
                    >
                      Login to Portal
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToLandingSection('environmental-data')}
                      className={cn(
                        "px-6 py-3.5 rounded-xl border font-bold transition-colors",
                        isLandingDark ? "border-emerald-200/30 bg-emerald-900/30 text-emerald-50 hover:bg-emerald-900/50" : "border-slate-300 bg-white/85 text-slate-700 hover:bg-white"
                      )}
                    >
                      View Live Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="environmental-data" className="scroll-mt-28 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-[-10px] sm:mt-[-18px]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              {[
                {
                  title: 'Air Quality Index',
                  value: 'Moderate',
                  note: 'Real-time city and regional air quality status',
                },
                {
                  title: 'Water Quality Index',
                  value: 'Good',
                  note: 'Continuous river and reservoir quality indicators',
                },
                {
                  title: 'Industrial Emissions',
                  value: 'Tracked',
                  note: 'Automated compliance and exceedance observations',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className={cn(
                    "rounded-xl border p-4",
                    isLandingDark ? "bg-[#0f1d29] border-emerald-300/15" : "bg-white border-slate-200"
                  )}
                >
                  <p className={cn("text-xs font-black uppercase tracking-wide", isLandingDark ? "text-emerald-300" : "text-slate-500")}>{item.title}</p>
                  <p className={cn("mt-2 text-2xl font-black", isLandingDark ? "text-emerald-100" : "text-slate-800")}>{item.value}</p>
                  <p className={cn("mt-1 text-sm", isLandingDark ? "text-slate-300" : "text-slate-600")}>{item.note}</p>
                </div>
              ))}
            </div>

            <div id="monitoring-stations" className={cn(
              "scroll-mt-28 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 overflow-hidden",
              isLandingDark ? "bg-[#0f1d29] border-emerald-300/15" : "bg-white border-slate-200 shadow-xl shadow-slate-900/10"
            )}>
              {[
                { label: 'Monitoring Stations', value: '1247', icon: Activity },
                { label: 'States & UTs Covered', value: '36', icon: Globe },
                { label: '24/7 Real-Time Monitoring', value: '24/7', icon: Clock },
                { label: 'Data Accuracy', value: '98%', icon: CheckCircle2 },
              ].map((stat) => (
                <div key={stat.label} className={cn(
                  "p-5 sm:p-6 border-r last:border-r-0",
                  isLandingDark ? "border-emerald-300/10" : "border-slate-200"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl border flex items-center justify-center",
                      isLandingDark ? "bg-emerald-900/40 border-emerald-300/20 text-emerald-200" : "bg-teal-50 border-teal-100 text-teal-700"
                    )}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={cn("text-4xl font-black leading-none", isLandingDark ? "text-emerald-100" : "text-teal-700")}>{stat.value}</p>
                      <p className={cn("mt-1 text-lg font-semibold", isLandingDark ? "text-slate-200" : "text-slate-700")}>{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
            <div className={cn(
              "rounded-2xl border p-5 sm:p-6",
              isLandingDark ? "bg-[#0f1d29] border-emerald-300/15" : "bg-white border-slate-200"
            )}>
              <p className={cn("text-xs font-black uppercase tracking-[0.18em]", isLandingDark ? "text-emerald-300" : "text-slate-600")}>Monitoring Stations</p>
              <p className={cn("mt-2 text-sm sm:text-base", isLandingDark ? "text-slate-300" : "text-slate-600")}>
                The State Environment Conservation Board operates a distributed monitoring network with fixed stations, mobile units, and remote sensing nodes to provide 24/7 visibility into air, water, and industrial parameters across districts.
              </p>
            </div>
          </section>

          <section id="about" className="scroll-mt-28 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-5">
                <h3 className={cn("text-4xl font-black tracking-tight", isLandingDark ? "text-emerald-100" : "text-slate-800")}>About SECB &amp; PrithviNet</h3>
                <p className={cn("mt-4 text-2xl leading-relaxed", isLandingDark ? "text-slate-300" : "text-slate-700")}>
                  The State Environment Conservation Board operates the PrithviNet platform to monitor pollution levels, industrial emissions, water resources, and ecological health in real-time, ensuring evidence-based policy and regulatory compliance across India.
                </p>
              </div>

              <div className="xl:col-span-4">
                <div className={cn(
                  "rounded-2xl overflow-hidden border h-full min-h-[260px] p-4",
                  isLandingDark ? "border-emerald-300/15 bg-[#0f1d29]" : "border-slate-200 bg-[#f8fbfd]"
                )}>
                  <div className={cn(
                    "w-full h-full rounded-xl border p-4 flex flex-col gap-4",
                    isLandingDark ? "border-emerald-300/15 bg-[#12212d]" : "border-slate-200 bg-white"
                  )}>
                    <div className="flex items-center justify-between">
                      <p className={cn("text-sm font-black", isLandingDark ? "text-emerald-100" : "text-slate-800")}>Environmental Monitoring Dashboard</p>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className={cn("text-[10px] font-bold uppercase", isLandingDark ? "text-emerald-200" : "text-emerald-700")}>Live</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'AQI', value: '82' },
                        { label: 'WQI', value: '91' },
                        { label: 'Noise', value: '64' },
                      ].map((metric) => (
                        <div key={metric.label} className={cn(
                          "rounded-lg border px-2 py-2",
                          isLandingDark ? "border-emerald-300/15 bg-emerald-900/20" : "border-slate-200 bg-slate-50"
                        )}>
                          <p className={cn("text-[10px] font-bold", isLandingDark ? "text-emerald-200/80" : "text-slate-500")}>{metric.label}</p>
                          <p className={cn("text-lg font-black", isLandingDark ? "text-emerald-100" : "text-slate-800")}>{metric.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className={cn(
                      "rounded-lg border p-3 flex-1",
                      isLandingDark ? "border-emerald-300/15 bg-emerald-900/15" : "border-slate-200 bg-slate-50"
                    )}>
                      <p className={cn("text-[11px] font-bold mb-2", isLandingDark ? "text-emerald-100" : "text-slate-700")}>National Signal Overview</p>
                      <div className="flex items-end gap-1.5 h-20">
                        {[42, 55, 48, 66, 52, 61, 72, 68, 74, 63].map((height, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "flex-1 rounded-t",
                              isLandingDark ? "bg-emerald-400/50" : "bg-teal-500/55"
                            )}
                            style={{ height: `${height}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div id="citizen-services" className="scroll-mt-28 xl:col-span-3">
                <div className={cn(
                  "rounded-2xl border p-5 h-full",
                  isLandingDark ? "bg-[#0f1d29] border-emerald-300/15" : "bg-[#f8fafc] border-slate-200"
                )}>
                  <h4 className={cn("text-2xl font-black", isLandingDark ? "text-emerald-100" : "text-slate-800")}>Citizen Services</h4>
                  <div className="mt-4 grid grid-cols-1 gap-2">
                    {[
                      { title: 'Public Environmental Data', desc: 'Access open environmental indicators' },
                      { title: 'Citizen Complaints', desc: 'Register and track pollution complaints' },
                      { title: 'Pollution Alerts', desc: 'Receive area-level warning notifications' },
                    ].map((service) => (
                      <div
                        key={service.title}
                        className={cn(
                          "rounded-lg border p-3",
                          isLandingDark ? "bg-emerald-900/20 border-emerald-300/20" : "bg-white border-slate-200"
                        )}
                      >
                        <p className={cn("text-sm font-bold", isLandingDark ? "text-emerald-100" : "text-slate-700")}>{service.title}</p>
                        <p className={cn("text-xs mt-1", isLandingDark ? "text-slate-300" : "text-slate-500")}>{service.desc}</p>
                      </div>
                    ))}
                  </div>

                  <h5 className={cn("text-lg font-black mt-5", isLandingDark ? "text-emerald-100" : "text-slate-800")}>Quick Links</h5>
                  <div className="mt-4 space-y-3">
                    {[
                      {
                        title: 'Environmental Dashboard',
                        icon: LayoutDashboard,
                        href: 'https://app.cpcbccr.com/ccr/#!/caaqm-dashboard-all/caaqm-landing',
                        info: 'National real-time air quality dashboard and trends.'
                      },
                      {
                        title: 'Pollution Monitoring',
                        icon: Activity,
                        href: 'https://app.cpcbccr.com/AQI_India/',
                        info: 'Ambient air and pollution monitoring program details.'
                      },
                      {
                        title: 'Industrial Compliance',
                        icon: Factory,
                        href: 'https://cpcb.nic.in/industrial-pollution/',
                        info: 'Industrial pollution control standards and guidance.'
                      },
                      {
                        title: 'Public Data Portal',
                        icon: Database,
                        href: 'https://data.gov.in/',
                        info: 'Open government datasets for public access and analysis.'
                      },
                      {
                        title: 'Citizen Complaints',
                        icon: AlertTriangle,
                        href: 'https://pgportal.gov.in/',
                        info: 'Submit and track public grievances and complaints.'
                      },
                    ].map((item) => (
                      <a
                        key={item.title}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "w-full rounded-xl border px-3 py-3 text-left flex items-start justify-between gap-3 transition-colors",
                          isLandingDark
                            ? "bg-emerald-900/20 border-emerald-300/20 hover:bg-emerald-900/35"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        <span className="flex items-start gap-2">
                          <item.icon className={cn("w-4 h-4 mt-0.5", isLandingDark ? "text-emerald-200" : "text-teal-700")} />
                          <span>
                            <span className={cn("block text-sm font-bold", isLandingDark ? "text-emerald-100" : "text-slate-700")}>{item.title}</span>
                            <span className={cn("block mt-1 text-xs", isLandingDark ? "text-slate-300" : "text-slate-500")}>{item.info}</span>
                          </span>
                        </span>
                        <ChevronRight className={cn("w-4 h-4 mt-1 shrink-0", isLandingDark ? "text-emerald-200" : "text-slate-500")} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="reports" className="scroll-mt-28 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
            <div className={cn(
              "rounded-2xl border p-5 sm:p-6",
              isLandingDark ? "bg-[#0f1d29] border-emerald-300/15" : "bg-white border-slate-200"
            )}>
              <p className={cn("text-xs font-black uppercase tracking-[0.18em]", isLandingDark ? "text-emerald-300" : "text-slate-600")}>Reports</p>
              <h4 className={cn("mt-2 text-2xl font-black", isLandingDark ? "text-emerald-100" : "text-slate-800")}>Compliance and Monitoring Reports</h4>
              <p className={cn("mt-2 text-sm", isLandingDark ? "text-slate-300" : "text-slate-600")}>Access verified reports generated from environmental stations and compliance submissions.</p>
            </div>
          </section>

          <section id="contact" className="scroll-mt-28 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
            <div className={cn(
              "rounded-2xl border p-5 sm:p-6",
              isLandingDark ? "bg-[#0f1d29] border-emerald-300/15" : "bg-white border-slate-200"
            )}>
              <p className={cn("text-xs font-black uppercase tracking-[0.18em]", isLandingDark ? "text-emerald-300" : "text-slate-600")}>Contact</p>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className={cn("font-bold", isLandingDark ? "text-emerald-100" : "text-slate-800")}>Address</p>
                  <p className={cn(isLandingDark ? "text-slate-300" : "text-slate-600")}>CGO Complex, New Delhi, India</p>
                </div>
                <div>
                  <p className={cn("font-bold", isLandingDark ? "text-emerald-100" : "text-slate-800")}>Helpline</p>
                  <p className={cn(isLandingDark ? "text-slate-300" : "text-slate-600")}>1800-11-CECB</p>
                </div>
                <div>
                  <p className={cn("font-bold", isLandingDark ? "text-emerald-100" : "text-slate-800")}>Email</p>
                  <p className={cn(isLandingDark ? "text-slate-300" : "text-slate-600")}>support@prithvinet.gov.in</p>
                </div>
              </div>
            </div>
          </section>

          <AnimatePresence>
            {showRoleAccess && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-emerald-950/70 backdrop-blur-sm"
                  onClick={() => setShowRoleAccess(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.96 }}
                  className="relative w-full max-w-md bg-[#1a1f2e]/90 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl"
                >
                  <button
                    onClick={() => setShowRoleAccess(false)}
                    className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex flex-col items-center mb-10">
                    <div className="bg-emerald-500 p-4 rounded-2xl shadow-xl shadow-emerald-500/20 mb-6">
                      <Shield className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">PrithviNet</h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">Environmental Intelligence</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-1">Select Access Role</label>
                      <div className="grid grid-cols-1 gap-3">
                        {(['Super Admin', 'Regional Officer', 'Monitoring Team', 'Industry User', 'Citizen'] as UserRole[]).map((role) => (
                          <button
                            key={role}
                            onClick={() => setUserRole(role)}
                            className={cn(
                              "flex items-center justify-between px-5 py-4 rounded-2xl border transition-all duration-300 group",
                              userRole === role
                                ? "bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20"
                                : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "p-2 rounded-lg transition-colors",
                                userRole === role ? "bg-white/20" : "bg-white/5 group-hover:bg-white/10"
                              )}>
                                {role === 'Super Admin' && <Zap className="w-4 h-4" />}
                                {role === 'Regional Officer' && <Users className="w-4 h-4" />}
                                {role === 'Monitoring Team' && <Activity className="w-4 h-4" />}
                                {role === 'Industry User' && <Building2 className="w-4 h-4" />}
                                {role === 'Citizen' && <Globe className="w-4 h-4" />}
                              </div>
                              <span className="text-sm font-bold">{role}</span>
                            </div>
                            {userRole === role && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {userRole !== 'Citizen' && (
                      <div className="space-y-4 pt-2">
                        {(() => {
                          const selected = demoCredentials.find((entry) => entry.role === userRole);
                          if (!selected) return null;
                          return (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Demo Credentials</p>
                              <p className="text-xs text-slate-300 mt-1">Email: {selected.email}</p>
                              <p className="text-xs text-slate-300">Password: {selected.password}</p>
                            </div>
                          );
                        })()}

                        {loginError && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-3"
                          >
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{loginError}</span>
                          </motion.div>
                        )}
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                            <User className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            placeholder="Email Address"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                        </div>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                            <Clock className="w-4 h-4" />
                          </div>
                          <input
                            type="password"
                            placeholder="Password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleLogin}
                      disabled={loginLoading}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
                    >
                      {loginLoading ? 'Signing In...' : userRole === 'Citizen' ? 'Enter Public Portal' : 'Secure Login'}
                      {!loginLoading && <ChevronRight className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/5 text-center">
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      Authorized access only. All activities are monitored and logged for compliance verification.
                    </p>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    );
  }

  return (
    <div className={cn(
      "dashboard-shell min-h-screen bg-[#0b0e14] font-sans text-slate-300 flex flex-col",
      dashboardTheme === 'light' ? 'light-theme' : 'dark-theme'
    )}>
      {/* Top Navigation */}
      <header className="border-b border-white/5 bg-[#0b0e14]/80 backdrop-blur-xl sticky top-0 z-[4000]">
        <div className="px-4 md:px-8 py-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 items-center gap-4">
            <div className="flex items-center gap-3 justify-start">
              <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">PrithviNet</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Environmental Intelligence Platform</p>
              </div>
            </div>

            <div className="state-board-pill flex items-center justify-center gap-3 px-3 py-2 rounded-2xl border border-emerald-400/15 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.12)]">
              <div className="w-10 h-10 rounded-full bg-white/90 border border-emerald-300/30 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={dashboardStateLogo}
                  alt={`${dashboardStateName} logo`}
                  className="w-7 h-7 object-contain"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg';
                  }}
                />
              </div>
              <p className="state-board-title text-sm md:text-base font-semibold text-emerald-100 tracking-wide text-center">
                {dashboardStateName} Environment Conservation Board
              </p>
            </div>

            <div className="flex items-center justify-end gap-4">
              <button
                onClick={() => setDashboardTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                className="theme-toggle-btn flex items-center gap-2 px-4 py-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-xs font-bold"
                title="Toggle theme"
              >
                {dashboardTheme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                {dashboardTheme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>

              <div className="relative">
                <button
                  ref={profileMenuTriggerRef}
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
                >
                  <User className="w-4 h-4 text-blue-400" />
                  <div className="text-xs font-bold text-white">{userRole}</div>
                </button>

                {showProfileMenu && typeof document !== 'undefined' && createPortal(
                  <>
                    <div
                      className="fixed inset-0 z-[4900]"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="fixed w-56 bg-[#1a1f2e] border border-white/10 rounded-[1.5rem] shadow-2xl z-[5000] overflow-hidden p-2"
                      style={{ top: profileMenuPosition.top, right: profileMenuPosition.right }}
                    >
                        <div className="px-4 py-3 border-b border-white/5 mb-2">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Session</p>
                          <p className="text-xs font-bold text-white mt-1">{userRole}</p>
                        </div>

                        {userRole === 'Super Admin' && (
                          <button
                            onClick={() => {
                              window.open('/super-admin-debug', '_blank', 'noopener,noreferrer');
                              setShowProfileMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10 rounded-xl transition-all"
                          >
                            <Database className="w-4 h-4 text-emerald-400" />
                            Open API Debug Log
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setAuthToken('');
                            setCurrentUser(null);
                            window.localStorage.removeItem(AUTH_SESSION_KEY);
                            setIsLoggedIn(false);
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        >
                          <Users className="w-4 h-4 text-blue-400" />
                          Change User Role
                        </button>

                        <button
                          onClick={() => {
                            setAuthToken('');
                            setCurrentUser(null);
                            window.localStorage.removeItem(AUTH_SESSION_KEY);
                            setIsLoggedIn(false);
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                          <Settings className="w-4 h-4" />
                          Logout
                        </button>
                    </motion.div>
                  </>,
                  document.body,
                )}
              </div>

              <div className="flex flex-col items-end">
                <div className="text-sm font-bold text-white">{format(new Date(), 'EEEE, HH:mm a')}</div>
                <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> System Active
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-8 pb-3">
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => {
                setCurrentView('dashboard');
                setShowMapsMenu(false);
              }}
              className={cn(
                "text-sm font-bold transition-all relative py-2",
                currentView === 'dashboard' ? "text-white" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Dashboard
              {currentView === 'dashboard' && (
                <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full" />
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMapsMenu(prev => !prev)}
                className={cn(
                  "text-sm font-bold transition-all relative py-2 flex items-center gap-2",
                  ['pollutionmap', 'industries', 'waterquality', 'globalmap', 'map'].includes(currentView) ? "text-white" : "text-slate-500 hover:text-slate-300"
                )}
              >
                Maps
                <span className={cn("text-[10px] transition-transform", showMapsMenu ? "rotate-180" : "")}>▼</span>
                {['pollutionmap', 'industries', 'waterquality', 'globalmap', 'map'].includes(currentView) && (
                  <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full" />
                )}
              </button>

              <AnimatePresence>
                {showMapsMenu && (
                  <>
                    <div className="fixed inset-0 z-[4850]" onClick={() => setShowMapsMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      className="absolute left-0 mt-3 w-52 bg-[#1a1f2e] border border-white/10 rounded-2xl shadow-2xl z-[4950] p-2"
                    >
                      <button
                        onClick={() => {
                          setCurrentView('pollutionmap');
                          setShowMapsMenu(false);
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                      >
                        Pollution Map
                      </button>
                      <button
                        onClick={() => {
                          setCurrentView('industries');
                          setShowMapsMenu(false);
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                      >
                        Industries Map
                      </button>
                      <button
                        onClick={() => {
                          setCurrentView('waterquality');
                          setShowMapsMenu(false);
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                      >
                        Water Quality Map
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => {
                setCurrentView('alerts');
                setShowMapsMenu(false);
              }}
              className={cn(
                "text-sm font-bold transition-all relative py-2",
                currentView === 'alerts' ? "text-white" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Alerts
              {currentView === 'alerts' && (
                <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full" />
              )}
            </button>
          </nav>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-24 border-r border-white/5 flex flex-col items-center py-8 gap-8 sticky top-28 h-[calc(100vh-7rem)]">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-white/5 shadow-xl mb-4 hover:bg-slate-700 transition-all"
          >
            <User className="w-6 h-6 text-slate-400" />
          </button>
          
          <div className="flex flex-col gap-6">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['Super Admin', 'Regional Officer', 'Monitoring Team', 'Industry User', 'Citizen'] },
              { id: 'system-mgmt', icon: Settings, label: 'System Management', roles: ['Super Admin'] },
              { id: 'master-data', icon: Database, label: 'Master Data', roles: ['Super Admin'] },
              { id: 'region-mgmt', icon: Users, label: 'Region Management', roles: ['Regional Officer'] },
              { id: 'data-collection', icon: Activity, label: 'Data Collection', roles: ['Monitoring Team'] },
              { id: 'compliance-reporting', icon: Factory, label: 'Compliance Reporting', roles: ['Industry User'] },
              { id: 'iot-monitoring', icon: Activity, label: 'IoT Monitoring', roles: ['Super Admin', 'Regional Officer', 'Monitoring Team', 'Industry User', 'Citizen'] },
              { id: 'industries', icon: Building2, label: 'Industries', roles: ['Super Admin', 'Regional Officer', 'Industry User'] },
              { id: 'complaints', icon: Bell, label: 'Complaints', roles: ['Citizen'] },
              { id: 'alerts', icon: Bell, label: 'Alerts', roles: ['Super Admin', 'Regional Officer', 'Monitoring Team', 'Industry User'] },
              { id: 'simulator', icon: Zap, label: 'Simulator', roles: ['Super Admin'] },
            ].filter(item => item.roles.includes(userRole)).map((item) => (
              <button 
                key={item.id}
                onClick={() => setCurrentView(item.id as View)}
                className={cn(
                  "p-3 rounded-2xl transition-all group relative",
                  currentView === item.id ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                )}
              >
                <item.icon className="w-6 h-6" />
                <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-auto mb-4 flex flex-col gap-4">
            {['Super Admin', 'Regional Officer', 'Monitoring Team', 'Industry User'].includes(userRole) && (
              <button 
                onClick={() => setShowCopilot(!showCopilot)}
                className={cn(
                  "p-3 rounded-2xl transition-all group relative",
                  showCopilot ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                )}
              >
                <BrainCircuit className="w-6 h-6" />
                <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
                  Compliance Copilot
                </span>
              </button>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <ComplianceCopilot 
        isOpen={showCopilot}
        onClose={() => setShowCopilot(false)}
        industrialAreas={industrialAreas}
        pollutionAreas={pollutionAreas}
        weatherData={forecast}
      />

      <AnimatePresence>
        {editingLimit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingLimit(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#1a1f2e] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Edit Pollution Limit</h3>
                  <p className="text-xs text-slate-500 mt-1">{editingLimit.param}</p>
                </div>
                <button 
                  onClick={() => setEditingLimit(null)}
                  className="p-2 rounded-xl bg-white/5 text-slate-500 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Prescribed Limit ({editingLimit.unit})</label>
                  <input 
                    type="text" 
                    defaultValue={editingLimit.limit}
                    id="edit-limit-input"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setEditingLimit(null)}
                    className="flex-1 px-6 py-4 rounded-2xl border border-white/10 text-sm font-bold text-slate-400 hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      const newValue = (document.getElementById('edit-limit-input') as HTMLInputElement).value;
                      setPollutionLimits(prev => prev.map(l => l.id === editingLimit.id ? { ...l, limit: newValue } : l));
                      setEditingLimit(null);
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showCreateOfficeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateOfficeModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#1a1f2e] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Create Regional Office</h3>
                  <p className="text-xs text-slate-500 mt-1">Add a new monitoring region</p>
                </div>
                <button 
                  onClick={() => setShowCreateOfficeModal(false)}
                  className="p-2 rounded-xl bg-white/5 text-slate-500 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Region Name</label>
                  <input 
                    type="text"
                    value={newOffice.name}
                    onChange={(e) => setNewOffice({...newOffice, name: e.target.value})}
                    placeholder="e.g. Central Region (Bhopal)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Officer In-Charge</label>
                  <input 
                    type="text"
                    value={newOffice.officer}
                    onChange={(e) => setNewOffice({...newOffice, officer: e.target.value})}
                    placeholder="e.g. Dr. S.K. Sharma"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Industries</label>
                    <input 
                      type="number"
                      value={newOffice.industries}
                      onChange={(e) => setNewOffice({...newOffice, industries: parseInt(e.target.value) || 0})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Compliance %</label>
                    <input 
                      type="text"
                      value={newOffice.compliance}
                      onChange={(e) => setNewOffice({...newOffice, compliance: e.target.value})}
                      placeholder="e.g. 85%"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    if (!newOffice.name || !newOffice.officer) {
                      alert('Please fill in all required fields');
                      return;
                    }
                    const officeToAdd = {
                      ...newOffice,
                      id: Date.now(),
                    };
                    setRegionalOffices([...regionalOffices, officeToAdd]);
                    setShowCreateOfficeModal(false);
                    setNewOffice({ name: '', officer: '', industries: 0, compliance: '100%', status: 'Active' });
                  }}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all mt-4"
                >
                  Create Office
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
