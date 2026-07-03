import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet';
import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import './LiveMap.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Small red dot icon for secondary points of interest (e.g. nearby stations),
// visually distinct from the default blue pin used for the user's own position.
const poiIcon = L.divIcon({
  className: 'live-map__poi-icon',
  html: '<span></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
    requestAnimationFrame(() => map.invalidateSize());
  }, [lat, lng, map]);
  return null;
}

function FitToMarkers({ lat, lng, markers }) {
  const map = useMap();
  useEffect(() => {
    if (!markers?.length) return;
    const bounds = L.latLngBounds([[lat, lng], ...markers.map((m) => [m.lat, m.lng])]);
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 });
    requestAnimationFrame(() => map.invalidateSize());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, markers, map]);
  return null;
}

function ResizeFix() {
  const map = useMap();
  useEffect(() => {
    const invalidate = () => map.invalidateSize();
    const t = setTimeout(invalidate, 0);
    requestAnimationFrame(invalidate);
    window.addEventListener('resize', invalidate);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', invalidate);
    };
  }, [map]);
  return null;
}

export default function LiveMap({ lat, lng, label, live, pulse = false, height = 220, zoom = 15, markers = [] }) {
  const safeLat = Number.isFinite(lat) ? lat : 28.6139;
  const safeLng = Number.isFinite(lng) ? lng : 77.2090;
  const hasMarkers = markers.length > 0;
  const key = useMemo(() => `${safeLat.toFixed(3)},${safeLng.toFixed(3)}`, [safeLat, safeLng]);

  return (
    <div className="live-map" style={{ height }}>
      <MapContainer
        center={[safeLat, safeLng]}
        zoom={zoom}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={true}
        className="live-map__container"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <Marker position={[safeLat, safeLng]}>
          <Popup>{live ? 'You are here (live)' : label}</Popup>
        </Marker>
        {pulse && (
          <Circle
            center={[safeLat, safeLng]}
            radius={live ? 60 : 120}
            pathOptions={{ color: pulse ? '#ff3b5c' : '#00e0b8', fillOpacity: 0.12, weight: 1.5 }}
          />
        )}
        {markers.map((m) => (
          <Marker key={m.key ?? m.label} position={[m.lat, m.lng]} icon={poiIcon}>
            <Popup>{m.label}</Popup>
          </Marker>
        ))}
        {hasMarkers ? (
          <FitToMarkers key={key} lat={safeLat} lng={safeLng} markers={markers} />
        ) : (
          <Recenter lat={safeLat} lng={safeLng} />
        )}
        <ResizeFix />
      </MapContainer>
      <div className="live-map__badge">{live ? 'Live GPS' : 'Demo location'} · {label}</div>
    </div>
  );
}
