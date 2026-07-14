'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom premium markers (black with white border)
const blackCircleIcon = L.divIcon({
  html: `<div style="background-color: #111; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const blackSquareIcon = L.divIcon({
  html: `<div style="background-color: #111; width: 14px; height: 14px; border-radius: 2px; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const LOCATIONS: Record<string, [number, number]> = {
  "Paris centre": [48.8566, 2.3522],
  "CDG T1/T2/T3": [49.0097, 2.5479],
  "CDG T2G": [49.0097, 2.5479],
  "CDG": [49.0097, 2.5479],
  "Orly": [48.7262, 2.3652],
  "Beauvais": [49.4553, 2.1128],
  "Gare du Nord": [48.8809, 2.3553],
  "Gare de Lyon": [48.8443, 2.3744],
  "Gare Montparnasse": [48.8412, 2.3204],
  "Gare Saint-Lazare": [48.8763, 2.3253],
  "Versailles": [48.8048, 2.1203],
  "Disneyland Paris": [48.8722, 2.7758],
  "Le Havre": [49.4944, 0.1079],
  "Reims": [49.2583, 4.0317],
};

interface BookingMapProps {
  routeStr: string;
  /** Pickup coordinates (e.g. from geolocation) — map updates as soon as this is set */
  originCoords?: [number, number] | null;
  /** Drop-off coordinates — route is drawn when both ends exist */
  destinationCoords?: [number, number] | null;
}

function MapViewSync({ bounds, singleCenter }: { bounds: L.LatLngBounds | null; singleCenter: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (singleCenter) {
      map.setView(singleCenter, 14, { animate: true, duration: 0.35 });
      return;
    }
    if (bounds) {
      map.flyToBounds(bounds, { padding: [50, 50], duration: 0.55, maxZoom: 14 });
    }
  }, [bounds, map, singleCenter?.[0], singleCenter?.[1]]);
  return null;
}

export default function BookingMap({ routeStr, originCoords, destinationCoords }: BookingMapProps) {
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
  const [points, setPoints] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [singleCenter, setSingleCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    async function fetchRoute() {
      let p1: [number, number] | undefined;
      let p2: [number, number] | undefined;

      if (originCoords && destinationCoords) {
        p1 = originCoords;
        p2 = destinationCoords;
      } else if (originCoords) {
        setSingleCenter(originCoords);
        setPoints([originCoords]);
        setRouteCoordinates([]);
        setRouteInfo(null);
        const b = L.latLngBounds([originCoords, originCoords]);
        setBounds(b.pad(0.06));
        return;
      } else if (destinationCoords) {
        setSingleCenter(destinationCoords);
        setPoints([destinationCoords]);
        setRouteCoordinates([]);
        setRouteInfo(null);
        const b = L.latLngBounds([destinationCoords, destinationCoords]);
        setBounds(b.pad(0.06));
        return;
      } else {
        setSingleCenter(null);
      }

      if (routeStr && routeStr !== 'Custom Route') {
        const parts = routeStr.split(' → ');
        if (parts.length === 2) {
          p1 = LOCATIONS[parts[0]];
          p2 = LOCATIONS[parts[1]];
        }
      }

      if (!p1 || !p2) {
        const center: [number, number] = [48.8566, 2.3522];
        setSingleCenter(null);
        setPoints([center]);
        setRouteCoordinates([]);
        setRouteInfo(null);
        const b = L.latLngBounds([center, center]);
        setBounds(b.pad(0.5));
        return;
      }

      setSingleCenter(null);
      setPoints([p1, p2]);
      setBounds(L.latLngBounds([p1, p2]).pad(0.12));
      // OSRM expects lon,lat
      const url = `https://router.project-osrm.org/route/v1/driving/${p1[1]},${p1[0]};${p2[1]},${p2[0]}?overview=full&geometries=geojson`;
      
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const geojsonCoords = data.routes[0].geometry.coordinates;
          // geojson is [lon, lat], leaflet needs [lat, lon]
          const leafletCoords: [number, number][] = geojsonCoords.map((c: [number, number]) => [c[1], c[0]]);
          setRouteCoordinates(leafletCoords);
          setRouteInfo({
            distance: data.routes[0].distance,
            duration: data.routes[0].duration
          });
          
          const b = L.latLngBounds(leafletCoords);
          setBounds(b);
        } else {
          setRouteCoordinates([p1, p2]);
          setRouteInfo(null);
          setBounds(L.latLngBounds([p1, p2]));
        }
      } catch (e) {
        console.error("Failed to fetch route", e);
        setRouteCoordinates([p1, p2]);
        setRouteInfo(null);
        setBounds(L.latLngBounds([p1, p2]));
      }
    }

    fetchRoute();
  }, [
    routeStr,
    originCoords?.[0],
    originCoords?.[1],
    destinationCoords?.[0],
    destinationCoords?.[1],
  ]);

  return (
    <div className="w-full h-full relative">
      <MapContainer 
        center={[48.8566, 2.3522]} 
        zoom={12} 
        style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
        zoomControl={false}
        attributionControl={false}
      >
        {/* Premium Voyager Theme TileLayer (Google Maps muted style) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {points.map((p, i) => (
          <Marker
            key={`${p[0].toFixed(5)}-${p[1].toFixed(5)}-${i}`}
            position={p}
            icon={i === 0 ? blackCircleIcon : blackSquareIcon}
          />
        ))}

        {routeCoordinates.length > 0 && (
          <Polyline 
            positions={routeCoordinates} 
            color="#111111" // Black color
            weight={5}
            opacity={0.9}
          />
        )}

        <MapViewSync bounds={bounds} singleCenter={singleCenter} />
      </MapContainer>

      {/* Soft gradient to blend with the dark left panel */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(90deg, rgba(17,17,17,0.8) 0%, rgba(17,17,17,0) 40%)',
        zIndex: 10
      }}></div>

      {/* Route Info Badge */}
      {routeInfo && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[2000] flex gap-4">
          <div 
            className="bg-[#111111]/95 backdrop-blur-xl border border-white/10 rounded-none px-8 shadow-2xl flex items-center justify-center gap-8"
            style={{ 
              animation: 'slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
              boxShadow: '0 10px 20px -5px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
              minWidth: '260px',
              height: '54px'
            }}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <span className="text-[7px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold opacity-90 leading-none">Distance</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-white text-lg font-light tracking-tight leading-none">{(routeInfo.distance / 1000).toFixed(1)}</span>
                <span className="text-neutral-400 text-[10px] uppercase font-bold tracking-widest leading-none">km</span>
              </div>
            </div>
            
            <div className="w-[1px] h-4 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
            
            <div className="flex flex-col items-center justify-center h-full">
              <span className="text-[7px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold opacity-90 leading-none">Durée approx.</span>
              <div className="flex items-baseline gap-1 mt-1">
                {Math.round(routeInfo.duration / 60) >= 60 ? (
                  <>
                    <span className="text-white text-lg font-light tracking-tight leading-none">{Math.floor(Math.round(routeInfo.duration / 60) / 60)}</span>
                    <span className="text-neutral-400 text-[10px] uppercase font-bold tracking-widest mr-1 leading-none">h</span>
                    {Math.round(routeInfo.duration / 60) % 60 > 0 && (
                      <>
                        <span className="text-white text-lg font-light tracking-tight leading-none">{Math.round(routeInfo.duration / 60) % 60}</span>
                        <span className="text-neutral-400 text-[10px] uppercase font-bold tracking-widest leading-none">min</span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-white text-lg font-light tracking-tight leading-none">{Math.round(routeInfo.duration / 60)}</span>
                    <span className="text-neutral-400 text-[10px] uppercase font-bold tracking-widest leading-none">min</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
