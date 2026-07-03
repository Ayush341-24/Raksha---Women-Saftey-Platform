import { Building2, Navigation, Phone, LocateFixed, MapPinned } from 'lucide-react';
import { useApp } from '../context/AppContext';
import LiveMap from '../components/LiveMap';
import './PoliceStations.css';

// Demo dataset with real-world coordinates — in production this list would come from
// a Places API queried live against the user's coordinates instead of being static.
const STATIONS = [
  { name: 'Connaught Place Police Station', lat: 28.6315, lng: 77.2167, phone: '+91 11 2334 1234' },
  { name: 'Parliament Street Police Station', lat: 28.6229, lng: 77.2100, phone: '+91 11 2336 5678' },
  { name: 'Mandir Marg Police Station', lat: 28.6249, lng: 77.2003, phone: '+91 11 2336 9012' },
  { name: "Women's Help Desk — North District", lat: 28.7041, lng: 77.1025, phone: '1091' },
];

// Haversine distance in km between two lat/lng points.
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function PoliceStations() {
  const { location, geoStatus, requestLiveLocation } = useApp();
  const mapsQuery = encodeURIComponent(
    'police station near ' + (location.live ? `${location.lat},${location.lng}` : location.label)
  );

  // Once we have the user's real coordinates, rank the demo stations by actual distance
  // from them rather than showing the fixed Delhi-based figures.
  const stationsWithDistance = STATIONS.map((s) => ({
    ...s,
    km: location.live ? distanceKm(location.lat, location.lng, s.lat, s.lng) : null,
  }));
  if (location.live) stationsWithDistance.sort((a, b) => a.km - b.km);

  // If the live location is nowhere near this demo dataset (>40km), the list below stops
  // being meaningful — the honest move is to point the user at the real map search instead
  // of showing misleading nearby-sounding entries for a city they aren't in.
  const nearestKm = location.live ? stationsWithDistance[0].km : null;
  const demoDataOutOfRange = location.live && nearestKm > 40;

  return (
    <section className="ps">
      <div className="container">
        <div className="ps__head">
          <span className="how__eyebrow">Nearby help</span>
          <h1>Police stations & help desks near you</h1>
          <p>
            Based on {location.live ? 'your live location' : location.label}. Distances are
            approximate.
          </p>
        </div>

        <div className="ps__actions">
          <button className="btn btn--ghost ps__locate-btn" onClick={requestLiveLocation}>
            <LocateFixed size={16} />
            {geoStatus === 'live'
              ? 'Refresh my live location'
              : geoStatus === 'locating'
              ? 'Locating…'
              : geoStatus === 'denied' || geoStatus === 'unsupported'
              ? 'Location unavailable — retry'
              : 'Use my real location'}
          </button>

          <a
            className="btn btn--primary ps__maps-link"
            href={`https://www.google.com/maps/search/${mapsQuery}`}
            target="_blank"
            rel="noreferrer"
          >
            <Navigation size={16} /> Open full map search
          </a>
        </div>

        {location.live && (
          <p className="ps__live-note">
            <MapPinned size={13} />
            Showing distances from your live position
            {location.accuracy ? ` (±${Math.round(location.accuracy)}m accuracy)` : ''}. Map
            search opens results centered on your exact coordinates.
          </p>
        )}

        <div className="ps__map">
          <LiveMap
            lat={location.lat}
            lng={location.lng}
            label={location.live ? 'Your live position' : location.label}
            live={location.live}
            pulse={location.live}
            height={280}
            markers={
              demoDataOutOfRange
                ? []
                : stationsWithDistance.map((s) => ({ key: s.name, lat: s.lat, lng: s.lng, label: s.name }))
            }
          />
        </div>

        {demoDataOutOfRange ? (
          <div className="ps__out-of-range">
            <p>
              The stations listed below are demo entries near New Delhi, and your live location
              is about {Math.round(nearestKm)} km from there — too far for these numbers to mean
              anything. Use <strong>Open full map search</strong> above for real stations near
              you.
            </p>
          </div>
        ) : (
          <ul className="ps__list">
            {stationsWithDistance.map((s) => (
              <li key={s.name} className="ps__item">
                <div className="ps__icon">
                  <Building2 size={20} />
                </div>
                <div className="ps__meta">
                  <strong>{s.name}</strong>
                  <span>{s.km !== null ? `${s.km.toFixed(1)} km away` : 'Demo distance — enable live location for accuracy'}</span>
                </div>
                <a className="ps__call" href={`tel:${s.phone}`}>
                  <Phone size={14} /> Call
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="ps__helplines">
          <h3>National helplines</h3>
          <div className="ps__helpline-grid">
            <a href="tel:112" className="ps__helpline"><strong>112</strong><span>All-India emergency</span></a>
            <a href="tel:1091" className="ps__helpline"><strong>1091</strong><span>Women's helpline</span></a>
            <a href="tel:181" className="ps__helpline"><strong>181</strong><span>Women in distress</span></a>
            <a href="tel:1098" className="ps__helpline"><strong>1098</strong><span>Child helpline</span></a>
          </div>
        </div>
      </div>
    </section>
  );
}
