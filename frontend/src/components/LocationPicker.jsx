/**
 * LocationPicker — Interactive OpenStreetMap picker using react-leaflet.
 * Search bar uses Nominatim geocoder. Click or drag marker to pick location.
 *
 * Props:
 *   value: { lat, lng, city?, state?, country?, display? }
 *   onChange: (info) => void
 *   height: CSS height string (default '320px')
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const a = data.address || {};
    return {
      lat, lng,
      city: a.city || a.town || a.village || a.county || '',
      state: a.state || '',
      country: a.country || 'India',
      display: data.display_name || '',
    };
  } catch {
    return { lat, lng, city: '', state: '', country: 'India', display: '' };
  }
}

async function searchGeocode(query) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      { headers: { 'Accept-Language': 'en' } }
    );
    return res.json();
  } catch { return []; }
}

// Listens to map clicks and calls onPick
function ClickHandler({ onPick }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      const info = await reverseGeocode(lat, lng);
      onPick(info);
    },
  });
  return null;
}

// Draggable marker — calls onDrag when dropped
function DraggableMarker({ position, onDrag }) {
  const markerRef = useRef(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const { lat, lng } = marker.getLatLng();
        reverseGeocode(lat, lng).then(onDrag);
      }
    },
  };

  return (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    >
      <Popup>📍 Drag to adjust</Popup>
    </Marker>
  );
}

function LocationPicker({ value, onChange, height = '320px' }) {
  const [markerPos, setMarkerPos] = useState(
    value?.lat && value?.lng ? [value.lat, value.lng] : null
  );
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const mapRef = useRef(null);

  const handlePick = useCallback((info) => {
    setMarkerPos([info.lat, info.lng]);
    onChange?.(info);
  }, [onChange]);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    setResults([]);
    const data = await searchGeocode(search);
    setResults(data);
    setSearching(false);
  };

  const selectResult = async (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const a = item.address || {};
    const info = {
      lat, lng,
      city: a.city || a.town || a.village || item.display_name.split(',')[0] || '',
      state: a.state || '',
      country: a.country || 'India',
      display: item.display_name,
    };
    setMarkerPos([lat, lng]);
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 14);
      setTimeout(() => mapRef.current?.invalidateSize(), 100);
    }
    onChange?.(info);
    setResults([]);
    setSearch(item.display_name);
  };

  // Keep map centered when marker moves
  useEffect(() => {
    if (markerPos && mapRef.current) {
      mapRef.current.setView(markerPos, mapRef.current.getZoom());
      setTimeout(() => mapRef.current?.invalidateSize(), 100);
    }
  }, [markerPos]);

  const center = markerPos || [20.5937, 78.9629]; // India center default
  const zoom = markerPos ? 14 : 5;

  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search address, city, or area…"
          className="input-field flex-1 text-sm"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="btn-secondary px-4 flex-shrink-0 text-sm"
        >
          {searching ? '…' : '🔍 Search'}
        </button>
      </div>

      {/* Autocomplete results */}
      {results.length > 0 && (
        <ul className="z-50 rounded-xl border border-slate-200 bg-white shadow-xl max-h-52 overflow-y-auto text-sm divide-y divide-slate-50">
          {results.map((r) => (
            <li key={r.place_id}>
              <button
                type="button"
                onClick={() => selectResult(r)}
                className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition"
              >
                📍 {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Map */}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height, width: '100%' }}
        className="rounded-xl overflow-hidden border border-slate-200 z-0"
        ref={mapRef}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <ClickHandler onPick={handlePick} />
        {markerPos && (
          <DraggableMarker position={markerPos} onDrag={handlePick} />
        )}
      </MapContainer>

      <p className="text-xs text-slate-400">
        💡 Click on the map or drag the marker to set the exact pickup point.
      </p>

      {/* Selected address display */}
      {value?.display && (
        <div className="flex items-start gap-2 text-sm text-slate-600 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
          <span className="text-emerald-500 mt-0.5">📍</span>
          <span>{value.display}</span>
        </div>
      )}
    </div>
  );
}

export default LocationPicker;
