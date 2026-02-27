/**
 * MapPreview.jsx — Leaflet + OpenStreetMap map preview.
 *
 * Shows numbered pins for each stop and a polyline connecting them.
 * Includes the Vite + Leaflet icon bug fix from CLAUDE.md.
 */
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Vite + Leaflet icon bug fix (CLAUDE.md) ──
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * Create a numbered marker icon.
 */
function createNumberedIcon(number) {
    return L.divIcon({
        html: `<div style="
      background: #2563EB;
      color: white;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    ">${number}</div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });
}

/**
 * Auto-fit map bounds to show all stops.
 */
function FitBounds({ stops }) {
    const map = useMap();

    useEffect(() => {
        if (stops.length === 0) return;
        const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng]));
        map.fitBounds(bounds, { padding: [40, 40] });
    }, [stops, map]);

    return null;
}

export default function MapPreview({ stops = [] }) {
    if (!stops || stops.length === 0) {
        return (
            <div className="w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center text-secondary">
                No stops to display on map
            </div>
        );
    }

    const center = [stops[0].lat, stops[0].lng];
    const polylinePositions = stops.map((s) => [s.lat, s.lng]);

    return (
        <div className="w-full h-64 rounded-xl overflow-hidden border border-gray-200">
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Numbered stop markers */}
                {stops.map((stop, i) => (
                    <Marker key={i} position={[stop.lat, stop.lng]} icon={createNumberedIcon(i + 1)}>
                        <Popup>
                            <strong>{i + 1}. {stop.label || 'Stop'}</strong>
                            {stop.resolved && <br />}
                            {stop.resolved && <span className="text-sm">{stop.resolved}</span>}
                        </Popup>
                    </Marker>
                ))}

                {/* Connecting polyline */}
                {stops.length > 1 && (
                    <Polyline positions={polylinePositions} color="#2563EB" weight={3} opacity={0.7} />
                )}

                <FitBounds stops={stops} />
            </MapContainer>
        </div>
    );
}
