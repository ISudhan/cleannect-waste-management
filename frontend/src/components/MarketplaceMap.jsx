/**
 * MarketplaceMap — shows all listings as clickable map pins.
 * Each pin pops up the listing title, price, and a "View" link.
 *
 * Props:
 *   listings: array of listing objects with location.city/state/lat/lng
 */
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom green marker for available listings
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const amberIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Geocode city+state using Nominatim
const geocodeCache = new Map();
async function geocodeLocation(city, state, country = 'India') {
  const key = [city, state, country].filter(Boolean).join(',');
  if (geocodeCache.has(key)) return geocodeCache.get(key);
  try {
    const q = [city, state, country].filter(Boolean).join(', ');
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (!data.length) return null;
    const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    geocodeCache.set(key, coords);
    return coords;
  } catch { return null; }
}

function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 200);
  }, [map]);
  return null;
}

function MarketplaceMap({ listings, height = '480px' }) {
  const [plotted, setPlotted] = useState([]); // { listing, lat, lng }

  useEffect(() => {
    if (!listings?.length) return;

    (async () => {
      const results = [];
      for (const listing of listings) {
        let lat = listing.location?.lat;
        let lng = listing.location?.lng;

        if (!lat || !lng) {
          if (listing.location?.city || listing.location?.state) {
            const coords = await geocodeLocation(
              listing.location.city,
              listing.location.state,
              listing.location.country
            );
            if (coords) { lat = coords.lat; lng = coords.lng; }
          }
        }

        if (lat && lng) results.push({ listing, lat, lng });
      }
      setPlotted(results);
    })();
  }, [listings]);

  if (!plotted.length) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 text-sm gap-2"
        style={{ height }}
      >
        <div className="spinner" />
        <span>Locating listings on map…</span>
      </div>
    );
  }

  // Center on mean of all coords
  const centerLat = plotted.reduce((s, p) => s + p.lat, 0) / plotted.length;
  const centerLng = plotted.reduce((s, p) => s + p.lng, 0) / plotted.length;

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={6}
      style={{ height, width: '100%' }}
      className="rounded-2xl overflow-hidden border border-slate-200 z-0"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <InvalidateSizeOnMount />
      {plotted.map(({ listing, lat, lng }) => {
        const isAvailable = listing.status === 'available' && listing.quantity > 0;
        return (
          <Marker
            key={listing._id}
            position={[lat, lng]}
            icon={isAvailable ? greenIcon : amberIcon}
          >
            <Popup>
              <div className="text-sm min-w-[160px]">
                <p className="font-bold text-slate-900 mb-1 line-clamp-2">{listing.title}</p>
                <p className="text-emerald-600 font-semibold text-base">₹{listing.price}/{listing.unit}</p>
                {listing.location?.city && (
                  <p className="text-slate-400 text-xs mt-0.5">📍 {listing.location.city}{listing.location.state ? `, ${listing.location.state}` : ''}</p>
                )}
                <Link
                  to={`/listing/${listing._id}`}
                  className="mt-2 inline-block rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                >
                  View Listing →
                </Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

export default MarketplaceMap;
