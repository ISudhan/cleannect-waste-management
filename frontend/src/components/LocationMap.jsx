/**
 * LocationMap — Read-only OpenStreetMap tile map using react-leaflet.
 * Geocodes city/state via Nominatim if no lat/lng provided.
 *
 * Props:
 *   location: { city?, state?, country?, lat?, lng? }
 *   height: CSS height string (default '280px')
 *   zoom: number (default 13)
 *   showPopup: bool (default true)
 */
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icon for Vite (no webpack file-loader)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

async function geocode({ city, state, country }) {
  const q = [city, state, country || 'India'].filter(Boolean).join(', ');
  if (!q.trim()) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

// Inner component: re-centers map when coords change
function MapController({ coords, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView([coords.lat, coords.lng], zoom);
      // Force tile re-render after any container resize
      setTimeout(() => map.invalidateSize(), 100);
    }
  }, [coords, zoom, map]);
  return null;
}

function LocationMap({ location, height = '280px', zoom = 13, showPopup = true }) {
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!location) { setLoading(false); return; }

    // Prefer explicit lat/lng; fall back to geocoding
    if (location.lat && location.lng) {
      setCoords({ lat: location.lat, lng: location.lng });
      setLoading(false);
    } else {
      setLoading(true);
      geocode(location)
        .then((c) => setCoords(c))
        .finally(() => setLoading(false));
    }
  }, [location?.city, location?.state, location?.lat, location?.lng]);

  const hasLocation = location?.city || location?.state || (location?.lat && location?.lng);

  if (!hasLocation) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 text-sm border border-slate-200"
        style={{ height }}
      >
        📍 Location not available
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-slate-100 border border-slate-200"
        style={{ height }}
      >
        <div className="spinner" />
      </div>
    );
  }

  if (!coords) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 text-sm border border-slate-200"
        style={{ height }}
      >
        📍 Could not locate: {[location.city, location.state].filter(Boolean).join(', ')}
      </div>
    );
  }

  const label = [location.city, location.state, location.country].filter(Boolean).join(', ');

  return (
    <MapContainer
      center={[coords.lat, coords.lng]}
      zoom={zoom}
      style={{ height, width: '100%' }}
      className="rounded-xl overflow-hidden border border-slate-200 z-0"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <MapController coords={coords} zoom={zoom} />
      <Marker position={[coords.lat, coords.lng]}>
        {showPopup && <Popup><strong>📍 {label || 'Pickup location'}</strong></Popup>}
      </Marker>
    </MapContainer>
  );
}

export default LocationMap;
