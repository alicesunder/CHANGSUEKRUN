import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RouteId, Landmark } from '../types';
import { routesData, eventInfo, parkingZones } from '../data/eventData';
import { hotelsData } from '../data/hotelsData';
import {
  Layers,
  Locate,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Info,
  MapPin,
  Sparkles,
  Image as ImageIcon,
  Droplets,
  HeartPulse,
  Camera,
  ExternalLink,
  X,
  Globe,
  Play,
  Flag,
  Car,
  Building2,
  Check,
  ChevronDown,
  Navigation,
  Compass,
  Mountain,
  ShieldCheck,
  Calendar,
  Clock,
} from 'lucide-react';
import { getGoogleMapsUrl } from '../utils/geo';
import { useRouteSimulation } from '../hooks/useRouteSimulation';
import { StartSimulationControls } from './StartSimulationControls';

interface InteractiveRouteMapProps {
  selectedRoute: RouteId;
  onSelectRoute: (id: RouteId) => void;
  onOpenArtworkModal: () => void;
  onOpenRunnerCenter?: () => void;
  initialSimulationActive?: boolean;
}

interface MapLayersState {
  route: boolean;
  startFinish: boolean;
  water: boolean;
  medical: boolean;
  parking: boolean;
  landmark: boolean;
  hotel: boolean;
}

export const InteractiveRouteMap: React.FC<InteractiveRouteMapProps> = ({
  selectedRoute,
  onSelectRoute,
  onOpenArtworkModal,
  onOpenRunnerCenter,
  initialSimulationActive = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer groups
  const routePolylineLayerRef = useRef<L.LayerGroup | null>(null);
  const startFinishLayerRef = useRef<L.LayerGroup | null>(null);
  const waterLayerRef = useRef<L.LayerGroup | null>(null);
  const medicalLayerRef = useRef<L.LayerGroup | null>(null);
  const parkingLayerRef = useRef<L.LayerGroup | null>(null);
  const landmarkLayerRef = useRef<L.LayerGroup | null>(null);
  const hotelLayerRef = useRef<L.LayerGroup | null>(null);
  const runnerMarkerLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapMode, setMapMode] = useState<'streets' | 'satellite'>('streets');
  const [activeLandmark, setActiveLandmark] = useState<Landmark | null>(null);
  const [selectedEntityInfo, setSelectedEntityInfo] = useState<{
    type: 'landmark' | 'parking' | 'hotel';
    title: string;
    subtitle: string;
    description: string;
    tag?: string;
    tagColor?: string;
    distance?: string;
    googleMapsUrl: string;
    features?: string[];
  } | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [simulationActive, setSimulationActive] = useState(initialSimulationActive);
  const [layerDropdownOpen, setLayerDropdownOpen] = useState(false);
  const [showElevationInfo, setShowElevationInfo] = useState(false);

  // Layer controls state
  const [layers, setLayers] = useState<MapLayersState>({
    route: true,
    startFinish: true,
    water: true,
    medical: true,
    parking: true,
    landmark: true,
    hotel: true,
  });

  // Sync simulationActive when initialSimulationActive changes
  useEffect(() => {
    if (initialSimulationActive) {
      setSimulationActive(true);
      simulation.start();
    }
  }, [initialSimulationActive]);

  const currentRoute = routesData[selectedRoute] || routesData['3km'];

  // Initialize Route Simulation hook
  const simulation = useRouteSimulation(selectedRoute);

  // Top featured hotels near venue for map layer
  const featuredHotels = useMemo(() => {
    return hotelsData.slice(0, 6);
  }, []);

  // Toggle single layer
  const toggleLayer = (layerKey: keyof MapLayersState) => {
    setLayers((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey],
    }));
  };

  // Helper for custom SVG marker HTML
  const createDivIcon = (iconHtml: string, bg: string, borderColor = '#FFFFFF', size = 34) => {
    return L.divIcon({
      className: 'custom-leaflet-pin',
      html: `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${size}px;
          height: ${size}px;
          background-color: ${bg};
          border: 2.5px solid ${borderColor};
          border-radius: 50%;
          box-shadow: 0 4px 14px rgba(0,0,0,0.32);
          font-size: ${size > 36 ? '18px' : '15px'};
          cursor: pointer;
          transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
        ">
          ${iconHtml}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2 - 2],
    });
  };

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [12.6948, 99.9642],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      const tileLayer = L.tileLayer(
        mapMode === 'satellite'
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution:
            mapMode === 'satellite'
              ? 'Esri Satellite'
              : '&copy; OpenStreetMap contributors',
          maxZoom: 18,
        }
      ).addTo(map);

      tileLayerRef.current = tileLayer;

      // Layer groups
      routePolylineLayerRef.current = L.layerGroup().addTo(map);
      startFinishLayerRef.current = L.layerGroup().addTo(map);
      waterLayerRef.current = L.layerGroup().addTo(map);
      medicalLayerRef.current = L.layerGroup().addTo(map);
      parkingLayerRef.current = L.layerGroup().addTo(map);
      landmarkLayerRef.current = L.layerGroup().addTo(map);
      hotelLayerRef.current = L.layerGroup().addTo(map);
      runnerMarkerLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch Tile Layer when mapMode changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTile = L.tileLayer(
      mapMode === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          mapMode === 'satellite'
            ? 'Esri Satellite'
            : '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }
    ).addTo(map);

    tileLayerRef.current = newTile;
  }, [mapMode]);

  // Sync Layer visibility with map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const syncGroup = (groupRef: React.RefObject<L.LayerGroup | null>, isVisible: boolean) => {
      if (!groupRef.current) return;
      if (isVisible) {
        if (!map.hasLayer(groupRef.current)) {
          map.addLayer(groupRef.current);
        }
      } else {
        if (map.hasLayer(groupRef.current)) {
          map.removeLayer(groupRef.current);
        }
      }
    };

    syncGroup(routePolylineLayerRef, layers.route);
    syncGroup(startFinishLayerRef, layers.startFinish);
    syncGroup(waterLayerRef, layers.water);
    syncGroup(medicalLayerRef, layers.medical);
    syncGroup(parkingLayerRef, layers.parking);
    syncGroup(landmarkLayerRef, layers.landmark);
    syncGroup(hotelLayerRef, layers.hotel);
  }, [layers]);

  // Re-populate all markers and route polyline when selectedRoute or currentRoute changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (
      !map ||
      !routePolylineLayerRef.current ||
      !startFinishLayerRef.current ||
      !waterLayerRef.current ||
      !medicalLayerRef.current ||
      !parkingLayerRef.current ||
      !landmarkLayerRef.current ||
      !hotelLayerRef.current
    )
      return;

    // Clear previous contents
    routePolylineLayerRef.current.clearLayers();
    startFinishLayerRef.current.clearLayers();
    waterLayerRef.current.clearLayers();
    medicalLayerRef.current.clearLayers();
    parkingLayerRef.current.clearLayers();
    landmarkLayerRef.current.clearLayers();
    hotelLayerRef.current.clearLayers();

    const coords = currentRoute.coordinates;

    // 1. ROUTE POLYLINE (Casing + Core color)
    if (coords.length > 0) {
      const casing = L.polyline(coords, {
        color: '#FFFFFF',
        weight: 9,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      });
      const core = L.polyline(coords, {
        color: currentRoute.color,
        weight: 5.5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      });
      routePolylineLayerRef.current.addLayer(casing);
      routePolylineLayerRef.current.addLayer(core);
    }

    // 2. START / FINISH MARKER
    const startPoint = coords[0] || [12.6966, 99.9638];
    const startFinishMarker = L.marker(startPoint, {
      icon: createDivIcon('🏁', '#3D106B', '#FFC928', 42),
      zIndexOffset: 1000,
    });
    startFinishMarker.bindPopup(`
      <div style="font-family: 'Prompt', sans-serif; padding: 10px; min-width: 220px;">
        <div style="font-size: 10px; font-weight: 800; color: #5B20A8; text-transform: uppercase;">START & FINISH</div>
        <div style="font-size: 14px; font-weight: 800; color: #18151D; margin: 3px 0;">จุดปล่อยตัวและเส้นชัยริมหาด</div>
        <div style="font-size: 11px; color: #666; margin-bottom: 8px;">หาดหน้าโรงแรม Sea Sand Sun • ค่ายนเรศวร</div>
        <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px;">
          <span style="background: #FAF5FF; color: #5B20A8; border: 1px solid #E9D5FF; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">จุดลงทะเบียน</span>
          <span style="background: #FAF5FF; color: #5B20A8; border: 1px solid #E9D5FF; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">ซุ้มอาหาร</span>
          <span style="background: #FAF5FF; color: #5B20A8; border: 1px solid #E9D5FF; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">รับฝากของ</span>
        </div>
        <a href="${getGoogleMapsUrl('Sea Sand Sun Hua Hin Resort', 12.6966, 99.9638)}" target="_blank" style="color: #5B20A8; font-weight: 700; font-size: 11px; text-decoration: none;">
          เปิดนำทางใน Google Maps &rarr;
        </a>
      </div>
    `);
    startFinishMarker.on('click', () => {
      setSelectedEntityInfo({
        type: 'landmark',
        title: 'START / FINISH จุดปล่อยตัวและเส้นชัย',
        subtitle: 'ชายหาดหน้าโรงแรม Sea Sand Sun • ค่ายนเรศวร',
        description: 'จุดรวมพลหลักของนักวิ่งทุกระยะ บริการจุดรับฝากของ ซุ้มอาหารเติมพลัง หน่วยแพทย์หลัก และเวทีมอบรางวัล',
        tag: 'START & FINISH',
        tagColor: '#3D106B',
        distance: 'กม. 0 / เส้นชัย',
        googleMapsUrl: getGoogleMapsUrl('Sea Sand Sun Hua Hin Resort', 12.6966, 99.9638),
        features: ['จุดลงทะเบียน', 'ซุ้มอาหาร', 'จุดรับฝากของ', 'หน่วยแพทย์ใหญ่'],
      });
    });
    startFinishLayerRef.current.addLayer(startFinishMarker);

    // 3. ROUTE LANDMARKS & SERVICE STATIONS
    currentRoute.landmarks.forEach((landmark) => {
      if (landmark.type === 'start_finish') return; // already added

      let icon = '📍';
      let bg = '#5B20A8';
      let targetLayer = landmarkLayerRef.current;

      if (landmark.type === 'water') {
        icon = '💧';
        bg = '#0284C7';
        targetLayer = waterLayerRef.current;
      } else if (landmark.type === 'medical') {
        icon = '🏥';
        bg = '#DC2626';
        targetLayer = medicalLayerRef.current;
      } else if (landmark.type === 'photo') {
        icon = '📷';
        bg = '#8B5CF6';
        targetLayer = landmarkLayerRef.current;
      } else if (landmark.type === 'checkpoint') {
        icon = '⏱️';
        bg = '#F59E0B';
        targetLayer = landmarkLayerRef.current;
      } else if (landmark.type === 'landmark') {
        icon = '🏛️';
        bg = '#10B981';
        targetLayer = landmarkLayerRef.current;
      }

      const m = L.marker([landmark.latitude, landmark.longitude], {
        icon: createDivIcon(icon, bg),
      });

      m.bindPopup(`
        <div style="font-family: 'Prompt', sans-serif; padding: 10px; min-width: 220px;">
          <div style="font-size: 10px; font-weight: 700; color: ${currentRoute.color}; text-transform: uppercase;">
            ${currentRoute.name} • กม. ${landmark.distanceFromStartKm}
          </div>
          <div style="font-size: 13px; font-weight: 800; color: #18151D; margin: 3px 0;">
            ${landmark.name}
          </div>
          <div style="font-size: 11px; color: #555; line-height: 1.4; margin-bottom: 6px;">
            ${landmark.description}
          </div>
          ${
            landmark.services && landmark.services.length > 0
              ? `<div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px;">
                  ${landmark.services.map((s) => `<span style="background: #F3F4F6; color: #374151; font-size: 9px; font-weight: 600; padding: 2px 5px; border-radius: 4px;">${s}</span>`).join('')}
                </div>`
              : ''
          }
          <a href="${getGoogleMapsUrl(landmark.name, landmark.latitude, landmark.longitude)}" target="_blank" style="color: #5B20A8; font-weight: 700; font-size: 11px; text-decoration: none;">
            เปิดนำทางใน Google Maps &rarr;
          </a>
        </div>
      `);

      m.on('click', () => {
        setActiveLandmark(landmark);
        setSelectedEntityInfo({
          type: 'landmark',
          title: landmark.name,
          subtitle: landmark.nameEn || `กม. ${landmark.distanceFromStartKm} ของเส้นทาง`,
          description: landmark.description,
          tag: landmark.type.toUpperCase(),
          tagColor: bg,
          distance: `กม. ${landmark.distanceFromStartKm}`,
          googleMapsUrl: getGoogleMapsUrl(landmark.name, landmark.latitude, landmark.longitude),
          features: landmark.services,
        });
      });

      targetLayer?.addLayer(m);
    });

    // 4. PARKING ZONES (Official parking around venue)
    const parkingCoords: Record<string, [number, number]> = {
      'zone-a': [12.6938, 99.9610],
      'zone-b': [12.6975, 99.9618],
      'zone-c': [12.6958, 99.9625],
      'zone-staff': [12.6962, 99.9634],
    };

    parkingZones.forEach((pz) => {
      const pCoord = parkingCoords[pz.id] || [12.6938, 99.9610];
      const pMarker = L.marker(pCoord, {
        icon: createDivIcon('🅿️', '#4F46E5', '#FFFFFF', 32),
      });

      pMarker.bindPopup(`
        <div style="font-family: 'Prompt', sans-serif; padding: 10px; min-width: 210px;">
          <div style="font-size: 10px; font-weight: 800; color: #4F46E5; text-transform: uppercase;">PARKING ZONE</div>
          <div style="font-size: 13px; font-weight: 800; color: #18151D; margin: 2px 0;">${pz.name}</div>
          <div style="font-size: 11px; color: #555; margin-bottom: 6px;">ความจุ: ${pz.capacity} • ${pz.distanceToStart}</div>
          <div style="font-size: 10px; color: #6B7280; margin-bottom: 6px;">${pz.description}</div>
          <a href="${getGoogleMapsUrl(pz.name, pCoord[0], pCoord[1])}" target="_blank" style="color: #4F46E5; font-weight: 700; font-size: 11px; text-decoration: none;">
            นำทางไปจุดจอดรถ &rarr;
          </a>
        </div>
      `);

      pMarker.on('click', () => {
        setSelectedEntityInfo({
          type: 'parking',
          title: pz.name,
          subtitle: `ความจุ ${pz.capacity} • เปิด ${pz.openingTime}`,
          description: pz.description || 'พื้นที่จอดรถอย่างเป็นทางการสำหรับผู้เข้าร่วมกิจกรรม',
          tag: 'PARKING',
          tagColor: '#4F46E5',
          distance: pz.distanceToStart,
          googleMapsUrl: getGoogleMapsUrl(pz.name, pCoord[0], pCoord[1]),
          features: [pz.suitableFor || 'รถยนต์ทั่วไป', pz.shuttleService ? 'มีรถกอล์ฟรับส่ง' : 'เดินถึงสนามแข่ง'],
        });
      });

      parkingLayerRef.current?.addLayer(pMarker);
    });

    // 5. FEATURED HOTELS (Nearby accommodations)
    featuredHotels.forEach((h) => {
      const hMarker = L.marker([h.latitude, h.longitude], {
        icon: createDivIcon('🏨', '#9333EA', '#FFFFFF', 32),
      });

      hMarker.bindPopup(`
        <div style="font-family: 'Prompt', sans-serif; padding: 10px; min-width: 220px;">
          <div style="font-size: 10px; font-weight: 800; color: #9333EA; text-transform: uppercase;">PET FRIENDLY HOTEL</div>
          <div style="font-size: 13px; font-weight: 800; color: #18151D; margin: 2px 0;">${h.name}</div>
          <div style="font-size: 11px; color: #555; margin-bottom: 6px;">ห่างค่าย ${h.distanceKm} กม. • ${h.availableRooms || 'ห้องว่าง'}</div>
          <div style="font-size: 10px; color: #059669; font-weight: 700; margin-bottom: 6px;">ราคาเริ่มต้น ${h.priceStart}</div>
          <a href="${h.googleMaps || getGoogleMapsUrl(h.name, h.latitude, h.longitude)}" target="_blank" style="color: #9333EA; font-weight: 700; font-size: 11px; text-decoration: none;">
            ดูแผนที่โรงแรม &rarr;
          </a>
        </div>
      `);

      hMarker.on('click', () => {
        setSelectedEntityInfo({
          type: 'hotel',
          title: h.name,
          subtitle: h.addressSnippet || `ห่างสนามแข่ง ${h.distanceKm} กม.`,
          description: h.description,
          tag: 'HOTEL',
          tagColor: '#9333EA',
          distance: `${h.distanceKm} กม. จากค่าย`,
          googleMapsUrl: h.googleMaps || getGoogleMapsUrl(h.name, h.latitude, h.longitude),
          features: [
            h.petFriendly ? '🐶 สัตว์เลี้ยงเข้าพักได้' : 'ห้องพักมาตรฐาน',
            `ราคา ${h.priceStart}`,
            h.availableRooms ? `ว่าง ${h.availableRooms}` : 'สอบถามห้องว่าง',
          ],
        });
      });

      hotelLayerRef.current?.addLayer(hMarker);
    });

    // 6. FIT BOUNDS TO ROUTE
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [selectedRoute, currentRoute, featuredHotels]);

  // Update Runner Marker during Simulation
  useEffect(() => {
    const map = mapInstanceRef.current;
    const runnerLayer = runnerMarkerLayerRef.current;
    if (!map || !runnerLayer) return;

    runnerLayer.clearLayers();

    if (!simulationActive) return;

    const [lat, lng] = simulation.currentCoord;

    const runnerIcon = L.divIcon({
      className: 'custom-simulation-runner',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background-color: ${currentRoute.color};
            opacity: 0.3;
            animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            background-color: #FFC928;
            border: 3px solid #1F1035;
            border-radius: 50%;
            box-shadow: 0 4px 14px rgba(0,0,0,0.4);
            font-size: 18px;
            z-index: 10;
          ">
            🏃
          </div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

    const marker = L.marker([lat, lng], { icon: runnerIcon });
    runnerLayer.addLayer(marker);

    if (simulation.isRunning) {
      map.panTo([lat, lng], { animate: true, duration: 0.25 });
    }
  }, [simulationActive, simulation.currentCoord, simulation.isRunning, currentRoute.color]);

  // Controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleReset = () => {
    const coords = currentRoute.coordinates;
    if (coords.length > 0) {
      mapInstanceRef.current?.fitBounds(L.latLngBounds(coords), { padding: [50, 50] });
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setLocating(false);

        const map = mapInstanceRef.current;
        if (map) {
          map.setView(coords, 15);
          L.circleMarker(coords, {
            radius: 9,
            fillColor: '#25A5F5',
            color: '#FFFFFF',
            weight: 3,
            fillOpacity: 0.9,
          })
            .addTo(map)
            .bindPopup('📍 ตำแหน่งปัจจุบันของคุณ')
            .openPopup();
        }
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleMapMode = () => {
    setMapMode((prev) => (prev === 'streets' ? 'satellite' : 'streets'));
  };

  // Active layers counter
  const activeLayersCount = Object.values(layers).filter(Boolean).length;

  return (
    <section
      id="routes"
      className="py-12 sm:py-16 bg-gradient-to-b from-white via-[#FAF7FD] to-[#F5EFFC] border-b border-purple-100 relative overflow-hidden"
    >
      {/* Anchor targets for both hash links */}
      <div id="interactive-map" className="absolute -top-16" />
      <div id="gps-survey" className="absolute -top-16" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ============================================================ */}
        {/* SECTION HEADER: PRIMARY UNIFIED MAP                           */}
        {/* ============================================================ */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#5B20A8] text-xs font-bold uppercase tracking-wider mb-2.5 shadow-xs">
              <Compass className="w-3.5 h-3.5 text-[#5B20A8]" />
              <span className="font-extrabold">GPS SURVEY • CHANGSUEK RUN ROUTE MAP</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFC928]" />
              <span className="text-[11px] font-semibold text-purple-600">ONE UNIFIED MAP</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#261042] tracking-tight">
              เส้นทางวิ่งสำรวจ <span className="text-[#5B20A8]">(GPS Survey)</span>
            </h2>

            <p className="text-xs sm:text-sm text-gray-600 mt-1.5 max-w-2xl font-medium leading-relaxed">
              แผนที่เส้นทางแข่งขันอย่างเป็นทางการ รวมข้อมูลพิกัด GPS จุดปล่อยตัว จุดบริการน้ำดื่ม
              หน่วยปฐมพยาบาล ลานจอดรถ และที่พักริมหาดชะอำ-หัวหิน ครบจบในแผนที่เดียว
            </p>
          </div>

          {/* Quick Actions on Header */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {!simulationActive ? (
              <button
                onClick={() => {
                  setSimulationActive(true);
                  simulation.start();
                }}
                className="bg-gradient-to-r from-[#FFC928] to-[#FFB703] hover:from-[#FFD54F] hover:to-[#FFA000] text-[#17151C] font-black text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer border border-amber-300"
              >
                <Play className="w-4 h-4 fill-[#17151C]" />
                <span>เริ่มจำลองวิ่ง (Simulation)</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  simulation.exit();
                  setSimulationActive(false);
                }}
                className="bg-purple-100 hover:bg-purple-200 text-[#5B20A8] font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full transition-all flex items-center gap-2 cursor-pointer border border-purple-200"
              >
                <RotateCcw className="w-4 h-4" />
                <span>กลับสู่โหมดสำรวจอิสระ</span>
              </button>
            )}

            <button
              onClick={toggleMapMode}
              className={`font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-full border transition-all flex items-center gap-2 cursor-pointer ${
                mapMode === 'satellite'
                  ? 'bg-[#18151D] text-white border-[#18151D] shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-purple-50 border-gray-200 shadow-xs'
              }`}
              title="สลับโหมดแผนที่ภาพถ่ายดาวเทียม"
            >
              <Layers className="w-4 h-4 text-[#FFC928]" />
              <span className="hidden sm:inline">
                {mapMode === 'satellite' ? 'ภาพถ่ายดาวเทียม' : 'แผนที่ถนน'}
              </span>
              <span className="sm:hidden">{mapMode === 'satellite' ? 'ดาวเทียม' : 'ถนน'}</span>
            </button>

            <button
              onClick={onOpenArtworkModal}
              className="bg-[#5B20A8] hover:bg-[#471587] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-[#FFC928]" />
              <span className="hidden sm:inline">แผนผังต้นฉบับ</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* ROUTE SELECTOR TABS: [ 1 KM ] [ 3 KM ] [ 5 KM ] [ 10 KM ]    */}
        {/* ============================================================ */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-2 sm:p-2.5 border border-purple-100 shadow-xs mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* 4 Distance Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(['1km', '3km', '5km', '10km'] as RouteId[]).map((rId) => {
                const r = routesData[rId];
                const isSelected = selectedRoute === rId;

                return (
                  <button
                    key={rId}
                    onClick={() => onSelectRoute(rId)}
                    className={`px-4 sm:px-5 py-2 rounded-full font-black text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[#5B20A8] text-white shadow-sm shadow-purple-500/25 scale-[1.02]'
                        : 'bg-white text-gray-700 hover:bg-purple-50 border border-gray-200'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: isSelected ? '#FFC928' : r?.color || '#5B20A8' }}
                    />
                    <span>{rId.toUpperCase()}{rId === '1km' || rId === '3km' ? ' 🐾' : ''}</span>
                    <span className="text-[10px] opacity-80 hidden sm:inline">
                      ({r?.distanceKm || 0} KM)
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick stats for current active route */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-600 font-bold overflow-x-auto">
              <span className="text-[#5B20A8] bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200/60 whitespace-nowrap">
                {currentRoute.name}
              </span>
              <span className="hidden lg:inline">•</span>
              <span className="whitespace-nowrap text-gray-500 hidden lg:inline">
                จุดน้ำ {currentRoute.waterStationCount} จุด
              </span>
              <span className="hidden lg:inline">•</span>
              <span className="whitespace-nowrap text-gray-500 hidden lg:inline">
                ปล่อยตัว {currentRoute.startTime}
              </span>
              <button
                onClick={() => setShowElevationInfo(!showElevationInfo)}
                className="text-[#5B20A8] hover:text-[#3D106B] underline font-bold cursor-pointer whitespace-nowrap ml-auto"
              >
                {showElevationInfo ? 'ซ่อนกราฟความสูง' : 'ดูกราฟความสูง & รายละเอียด'}
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MAP LAYERS FILTER BAR (QUICK TOGGLES)                         */}
        {/* ============================================================ */}
        <div className="flex items-center justify-between gap-2 mb-3 px-1 overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-gray-500 mr-1 text-[11px] hidden sm:inline">
              ชั้นข้อมูล:
            </span>

            {/* 1. Running Route */}
            <button
              onClick={() => toggleLayer('route')}
              className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                layers.route
                  ? 'bg-purple-100 text-[#5B20A8] border border-purple-300 shadow-2xs'
                  : 'bg-white text-gray-400 border border-gray-200 opacity-60'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: currentRoute.color }}
              />
              <span>เส้นทางวิ่ง</span>
              {layers.route && <Check className="w-3 h-3 text-[#5B20A8]" />}
            </button>

            {/* 2. Start / Finish */}
            <button
              onClick={() => toggleLayer('startFinish')}
              className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                layers.startFinish
                  ? 'bg-purple-100 text-[#5B20A8] border border-purple-300 shadow-2xs'
                  : 'bg-white text-gray-400 border border-gray-200 opacity-60'
              }`}
            >
              <span>🏁</span>
              <span>Start / Finish</span>
              {layers.startFinish && <Check className="w-3 h-3 text-[#5B20A8]" />}
            </button>

            {/* 3. Water Station */}
            <button
              onClick={() => toggleLayer('water')}
              className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                layers.water
                  ? 'bg-sky-100 text-sky-800 border border-sky-300 shadow-2xs'
                  : 'bg-white text-gray-400 border border-gray-200 opacity-60'
              }`}
            >
              <span>💧</span>
              <span>จุดบริการน้ำ</span>
              {layers.water && <Check className="w-3 h-3 text-sky-700" />}
            </button>

            {/* 4. Medical */}
            <button
              onClick={() => toggleLayer('medical')}
              className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                layers.medical
                  ? 'bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs'
                  : 'bg-white text-gray-400 border border-gray-200 opacity-60'
              }`}
            >
              <span>🏥</span>
              <span>หน่วยแพทย์</span>
              {layers.medical && <Check className="w-3 h-3 text-rose-700" />}
            </button>

            {/* 5. Parking */}
            <button
              onClick={() => toggleLayer('parking')}
              className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                layers.parking
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 shadow-2xs'
                  : 'bg-white text-gray-400 border border-gray-200 opacity-60'
              }`}
            >
              <span>🅿️</span>
              <span>ลานจอดรถ</span>
              {layers.parking && <Check className="w-3 h-3 text-indigo-700" />}
            </button>

            {/* 6. Landmark */}
            <button
              onClick={() => toggleLayer('landmark')}
              className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                layers.landmark
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs'
                  : 'bg-white text-gray-400 border border-gray-200 opacity-60'
              }`}
            >
              <span>🏛️</span>
              <span>จุดสำคัญ</span>
              {layers.landmark && <Check className="w-3 h-3 text-emerald-700" />}
            </button>

            {/* 7. Hotel */}
            <button
              onClick={() => toggleLayer('hotel')}
              className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                layers.hotel
                  ? 'bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs'
                  : 'bg-white text-gray-400 border border-gray-200 opacity-60'
              }`}
            >
              <span>🏨</span>
              <span>ที่พักใกล้เคียง</span>
              {layers.hotel && <Check className="w-3 h-3 text-purple-800" />}
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MAP CONTAINER (HEIGHT: Desktop ~580px, Mobile ~440px)          */}
        {/* ============================================================ */}
        <div
          className={`relative rounded-3xl overflow-hidden border border-purple-200/80 shadow-md bg-[#17151C] transition-all duration-300 ${
            isFullscreen
              ? 'fixed inset-0 z-50 rounded-none h-screen w-screen'
              : 'h-[440px] sm:h-[520px] lg:h-[580px]'
          }`}
        >
          {/* Leaflet DOM Anchor */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Top-Left: Live GPS Track Info Badge */}
          <div className="absolute top-4 left-4 z-20 hidden sm:flex items-center gap-2 bg-black/75 backdrop-blur-md text-white text-xs font-bold px-3.5 py-2 rounded-full border border-white/10 shadow-md pointer-events-none">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ค่ายนเรศวร • หาด Sea Sand Sun ชะอำ-หัวหิน (GPS Track)</span>
          </div>

          {/* Top-Right: Map Control Buttons */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            {/* Satellite switch */}
            <button
              onClick={toggleMapMode}
              className={`w-10 h-10 rounded-xl shadow-md border flex items-center justify-center transition-all hover:scale-105 cursor-pointer ${
                mapMode === 'satellite'
                  ? 'bg-[#18151D] text-[#FFC928] border-[#18151D]'
                  : 'bg-white/95 hover:bg-white text-[#18151D] border-gray-200'
              }`}
              title="สลับโหมดภาพถ่ายดาวเทียม"
            >
              <Layers className="w-5 h-5" />
            </button>

            {/* Zoom In */}
            <button
              onClick={handleZoomIn}
              className="w-10 h-10 bg-white/95 hover:bg-white text-[#18151D] rounded-xl shadow-md border border-gray-200 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
              title="ซูมเข้า"
            >
              <ZoomIn className="w-5 h-5" />
            </button>

            {/* Zoom Out */}
            <button
              onClick={handleZoomOut}
              className="w-10 h-10 bg-white/95 hover:bg-white text-[#18151D] rounded-xl shadow-md border border-gray-200 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
              title="ซูมออก"
            >
              <ZoomOut className="w-5 h-5" />
            </button>

            {/* Center / Reset View */}
            <button
              onClick={handleReset}
              className="w-10 h-10 bg-white/95 hover:bg-white text-[#18151D] rounded-xl shadow-md border border-gray-200 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
              title="รีเซ็ตมุมมองจัดกึ่งกลางเส้นทาง"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Locate Me */}
            <button
              onClick={handleLocateMe}
              className={`w-10 h-10 rounded-xl shadow-md border flex items-center justify-center transition-all hover:scale-105 cursor-pointer ${
                locating
                  ? 'bg-[#FFC928] text-[#18151D] animate-spin border-[#FFC928]'
                  : 'bg-white/95 hover:bg-white text-[#18151D] border-gray-200'
              }`}
              title="พิกัด GPS ตำแหน่งของคุณ"
            >
              <Locate className="w-5 h-5" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="w-10 h-10 bg-white/95 hover:bg-white text-[#18151D] rounded-xl shadow-md border border-gray-200 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
              title={isFullscreen ? 'ย่อหน้าจอ' : 'ขยายเต็มหน้าจอ'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Bottom-Left: Map Legend Pill (Desktop) */}
          <div className="absolute bottom-4 left-4 z-20 hidden md:flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2 border border-purple-100 shadow-md text-xs">
            <div className="flex items-center gap-1.5 font-extrabold text-[#18151D] mr-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentRoute.color }} />
              <span>{currentRoute.name}</span>
            </div>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600">🏁 Start / Finish</span>
            <span className="text-gray-600">💧 จุดน้ำ</span>
            <span className="text-gray-600">🏥 หน่วยแพทย์</span>
            <span className="text-gray-600">🅿️ ที่จอดรถ</span>
            <span className="text-gray-600">🏨 โรงแรม</span>
          </div>

          {/* Interactive Selected Entity Card / Drawer */}
          {selectedEntityInfo && (
            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-purple-100 animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span
                    className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: `${selectedEntityInfo.tagColor || '#5B20A8'}15`,
                      color: selectedEntityInfo.tagColor || '#5B20A8',
                    }}
                  >
                    {selectedEntityInfo.tag}
                  </span>
                  <h4 className="text-base font-extrabold text-[#18151D] mt-1">
                    {selectedEntityInfo.title}
                  </h4>
                  <p className="text-xs text-[#6F35B5] font-semibold">
                    {selectedEntityInfo.subtitle}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEntityInfo(null)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
                  aria-label="ปิด"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed mb-3">
                {selectedEntityInfo.description}
              </p>

              {selectedEntityInfo.features && selectedEntityInfo.features.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedEntityInfo.features.map((feat, i) => (
                    <span
                      key={i}
                      className="bg-purple-50 text-[#5B20A8] border border-purple-100 text-[10px] font-bold px-2 py-0.5 rounded-md"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                {selectedEntityInfo.distance && (
                  <span className="text-gray-500 font-semibold">
                    📍 {selectedEntityInfo.distance}
                  </span>
                )}
                <a
                  href={selectedEntityInfo.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5B20A8] hover:text-[#3D106B] font-bold inline-flex items-center gap-1 ml-auto"
                >
                  <span>นำทางใน Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Simulation Floating Controls Bar */}
          {simulationActive && (
            <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:w-[460px] z-30 pointer-events-auto">
              <StartSimulationControls
                isRunning={simulation.isRunning}
                isPaused={simulation.isPaused}
                isComplete={simulation.isComplete}
                progress={simulation.progress}
                currentKm={simulation.currentKm}
                totalKm={simulation.totalKm}
                speedMultiplier={simulation.speedMultiplier}
                onSpeedChange={simulation.setSpeedMultiplier}
                currentLandmark={simulation.currentLandmark}
                onStart={simulation.start}
                onPause={simulation.pause}
                onResume={simulation.resume}
                onRestart={simulation.restart}
                onExit={() => {
                  simulation.exit();
                  setSimulationActive(false);
                }}
                onOpenRunnerCenter={onOpenRunnerCenter}
              />
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* ROUTE INFORMATION PANEL (BELOW PRIMARY MAP)                   */}
        {/* ============================================================ */}
        <div className="mt-6 bg-white rounded-3xl p-5 sm:p-7 border border-purple-100 shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {/* 1. Distance */}
            <div className="bg-[#FAF8FD] p-3 rounded-2xl border border-purple-100/80">
              <div className="text-[11px] text-gray-500 font-bold uppercase">ระยะทางจริง</div>
              <div className="text-lg font-black text-[#261042] mt-0.5">
                {currentRoute.distanceKm} KM
              </div>
              <div className="text-[10px] text-[#5B20A8] font-semibold">
                สำรวจ: {currentRoute.measuredPerimeterKm || currentRoute.distanceKm} KM
              </div>
            </div>

            {/* 2. Start Time */}
            <div className="bg-[#FAF8FD] p-3 rounded-2xl border border-purple-100/80">
              <div className="text-[11px] text-gray-500 font-bold uppercase">เวลาปล่อยตัว</div>
              <div className="text-lg font-black text-[#261042] mt-0.5">
                {currentRoute.startTime}
              </div>
              <div className="text-[10px] text-gray-500">ยามรุ่งอรุณริมหาด</div>
            </div>

            {/* 3. Cut-off */}
            <div className="bg-[#FAF8FD] p-3 rounded-2xl border border-purple-100/80">
              <div className="text-[11px] text-gray-500 font-bold uppercase">เวลา Cut-Off</div>
              <div className="text-lg font-black text-[#261042] mt-0.5">
                {currentRoute.cutoffTime}
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold">
                {currentRoute.durationEstimate}
              </div>
            </div>

            {/* 4. Water Stations */}
            <div className="bg-[#FAF8FD] p-3 rounded-2xl border border-purple-100/80">
              <div className="text-[11px] text-gray-500 font-bold uppercase">จุดบริการน้ำ</div>
              <div className="text-lg font-black text-[#0369A1] mt-0.5">
                {currentRoute.waterStationCount} จุด
              </div>
              <div className="text-[10px] text-gray-500">พร้อมเกลือแร่ & ผ้าเย็น</div>
            </div>

            {/* 5. Medical Stations */}
            <div className="bg-[#FAF8FD] p-3 rounded-2xl border border-purple-100/80">
              <div className="text-[11px] text-gray-500 font-bold uppercase">หน่วยพยาบาล</div>
              <div className="text-lg font-black text-rose-600 mt-0.5">
                {currentRoute.medicalStationCount} จุด
              </div>
              <div className="text-[10px] text-gray-500">พร้อมเครื่อง AED & กู้ชีพ</div>
            </div>

            {/* 6. Terrain */}
            <div className="bg-[#FAF8FD] p-3 rounded-2xl border border-purple-100/80">
              <div className="text-[11px] text-gray-500 font-bold uppercase">ระดับความยาก</div>
              <div className="text-lg font-black text-[#5B20A8] mt-0.5">
                {currentRoute.difficulty.split(' ')[0]}
              </div>
              <div className="text-[10px] text-gray-500">ทางเรียบวิวทะเล</div>
            </div>
          </div>

          {/* Description and Key Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-base font-extrabold text-[#261042] flex items-center gap-2">
                <span>รายละเอียดเส้นทางวิ่ง</span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-black text-white"
                  style={{ backgroundColor: currentRoute.color }}
                >
                  {currentRoute.name}
                </span>
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {currentRoute.description}
              </p>
              <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-3 text-xs text-gray-700 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#5B20A8] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#5B20A8]">มาตรฐานความปลอดภัย: </span>
                  <span>{currentRoute.safetyNotes}</span>
                </div>
              </div>
            </div>

            {/* Key landmarks list along this route */}
            <div className="bg-[#FAF8FD] rounded-2xl p-4 border border-purple-100/80 space-y-2.5">
              <h5 className="text-xs font-black text-[#261042] uppercase tracking-wider">
                จุดแลนด์มาร์กสำคัญบนเส้นทาง
              </h5>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {currentRoute.landmarks.map((lm, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      mapInstanceRef.current?.setView([lm.latitude, lm.longitude], 16);
                      setActiveLandmark(lm);
                      setSelectedEntityInfo({
                        type: 'landmark',
                        title: lm.name,
                        subtitle: lm.nameEn || `กม. ${lm.distanceFromStartKm}`,
                        description: lm.description,
                        tag: lm.type.toUpperCase(),
                        tagColor: currentRoute.color,
                        distance: `กม. ${lm.distanceFromStartKm}`,
                        googleMapsUrl: getGoogleMapsUrl(lm.name, lm.latitude, lm.longitude),
                        features: lm.services,
                      });
                    }}
                    className="p-2 bg-white rounded-xl border border-gray-100 hover:border-purple-200 transition-all cursor-pointer flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5B20A8] shrink-0" />
                      <span className="font-bold text-gray-800 truncate">{lm.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-purple-700 shrink-0">
                      กม. {lm.distanceFromStartKm}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Elevation Profile Section if toggled */}
          {showElevationInfo && currentRoute.elevation && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Mountain className="w-4 h-4 text-[#5B20A8]" />
                <h5 className="text-sm font-black text-[#261042]">
                  ระดับความสูงของเส้นทาง (Elevation Profile)
                </h5>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {currentRoute.elevation.map((el, i) => (
                  <div
                    key={i}
                    className="bg-[#FAF8FD] p-2.5 rounded-xl border border-purple-100 text-center"
                  >
                    <div className="text-[10px] text-gray-500 font-bold">กม. {el.distanceKm}</div>
                    <div className="text-sm font-black text-[#5B20A8] my-0.5">
                      {el.elevationMeters || el.elevationM || 4} ม.
                    </div>
                    <div className="text-[9px] text-gray-600 truncate">{el.surface || 'ทางเรียบ'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
