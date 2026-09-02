import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import apiClient from '../../lib/apiClient';
import { getSocket } from '../../lib/socket';
import { useAuth } from '../../auth/AuthContext';

// Fix standard leaflet icon urls
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom styled markers
const createNumberedIcon = (number, color = '#10B981', isNext = false) => {
  return L.divIcon({
    className: 'custom-route-marker',
    html: `
      <div style="
        background-color: ${color};
        color: white;
        width: ${isNext ? '38px' : '32px'};
        height: ${isNext ? '38px' : '32px'};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: ${isNext ? '14px' : '13px'};
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        border: 2.5px solid white;
        animation: ${isNext ? 'pulse 1.5s infinite' : 'none'};
      ">
        ${number}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

const depotIcon = L.divIcon({
  className: 'depot-marker',
  html: `
    <div style="
      background-color: #0F172A;
      color: #34D399;
      width: 38px;
      height: 38px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.35);
      border: 2.5px solid white;
    ">
      🏢
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -20],
});

const searchPinIcon = L.divIcon({
  className: 'search-pin-marker',
  html: `
    <div style="
      background: linear-gradient(135deg, #EF4444, #B91C1C);
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 20px rgba(220,38,38,0.55);
      border: 3px solid white;
      animation: bounce 1.2s infinite alternate;
    ">
      <span style="transform: rotate(45deg); font-size: 18px; font-weight: 900;">📍</span>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const vehicleIcon = L.divIcon({
  className: 'vehicle-marker',
  html: `
    <div style="
      background: linear-gradient(135deg, #10B981, #059669);
      color: white;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.35), 0 6px 16px rgba(0,0,0,0.4);
      border: 2.5px solid white;
      transition: all 0.3s ease;
    ">
      🚐
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22],
});

// Map Controller for smooth flyTo animation when user searches a place
function MapFlyToController({ targetLocation }) {
  const map = useMap();
  useEffect(() => {
    if (targetLocation && targetLocation.lat && targetLocation.lng) {
      map.flyTo([targetLocation.lat, targetLocation.lng], 15, {
        duration: 1.2,
      });
    }
  }, [targetLocation, map]);
  return null;
}

// Map Click Listener to let users click anywhere to pin a location
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

function MapBoundsUpdater({ points, liveCoords, targetLocation }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    if (targetLocation) return; // Prioritize manual search navigation
    try {
      const allPts = liveCoords ? [...points, liveCoords] : points;
      const bounds = L.latLngBounds(allPts.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } catch (e) {
      // ignore
    }
  }, [points, liveCoords, targetLocation, map]);
  return null;
}

export default function RouteOptimizerPage() {
  const { user, token } = useAuth();

  // Depot / Driver starting point
  const [depot, setDepot] = useState({
    name: 'CleanNect Central Depot',
    lat: 12.9716,
    lng: 77.5946,
    address: 'Bengaluru City Center, Karnataka',
  });

  const defaultBengaluruStops = [
    {
      id: 'member-1-koramangala',
      name: 'Member 1 — Rajesh Kumar',
      phone: '+91 98450 11223',
      address: '4th Block, Koramangala, Bengaluru',
      lat: 12.9352,
      lng: 77.6245,
      wasteType: 'PET Plastic Bottles & HDPE Scrap',
      quantity: 45,
      unit: 'kg',
      price: 900,
    },
    {
      id: 'member-2-hsr',
      name: 'Member 2 — Priya Sundaram',
      phone: '+91 99001 22334',
      address: 'Sector 2, HSR Layout, Bengaluru',
      lat: 12.9116,
      lng: 77.6476,
      wasteType: 'Copper Wires & E-Waste Scrap',
      quantity: 28,
      unit: 'kg',
      price: 3400,
    },
    {
      id: 'member-3-domlur',
      name: 'Member 3 — Amit Sharma',
      phone: '+91 97312 33445',
      address: 'Domlur 2nd Stage, Bengaluru',
      lat: 12.9609,
      lng: 77.6387,
      wasteType: 'Cardboard Cartons & Paper Bundles',
      quantity: 80,
      unit: 'kg',
      price: 1200,
    },
  ];

  // Stops and optimization results
  const [stops, setStops] = useState(defaultBengaluruStops);
  const [availableMarketStops, setAvailableMarketStops] = useState(defaultBengaluruStops);
  const [myOrdersStops, setMyOrdersStops] = useState([]);
  const [optimizedData, setOptimizedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState('');
  const [collectedStops, setCollectedStops] = useState(new Set());

  // Real OSRM Road Geometry Points
  const [roadPolyline, setRoadPolyline] = useState([]);

  // Live GPS Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simIndex, setSimIndex] = useState(0);
  const [simSpeed, setSimSpeed] = useState(2); // 1x, 2x, 5x
  const [liveDriverPos, setLiveDriverPos] = useState(null);
  const simIntervalRef = useRef(null);

  // New Stop Input Form Modal
  const [newStopForm, setNewStopForm] = useState({
    name: '',
    phone: '',
    address: '',
    lat: '',
    lng: '',
    wasteType: 'PET Plastic Scrap',
    quantity: '25',
    unit: 'kg',
  });
  const [showAddModal, setShowAddModal] = useState(false);

  // Real-time live collection banner
  const [liveNotification, setLiveNotification] = useState(null);

  // ── Place Search & Geocoding State ──
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchedPlace, setSearchedPlace] = useState(null);
  const [flyToTarget, setFlyToTarget] = useState(null);
  const [searchWasteType, setSearchWasteType] = useState('PET Plastic Scrap');
  const [searchQuantity, setSearchQuantity] = useState('25');

  // Fetch real marketplace listings from MongoDB on mount
  useEffect(() => {
    async function fetchRealMarketData() {
      setLoading(true);
      try {
        const res = await apiClient.get('/route-optimizer/marketplace-stops');
        if (res.data?.success && res.data?.data?.stops?.length > 0) {
          setAvailableMarketStops(res.data.data.stops);
          // Set active stops to real MongoDB listings
          setStops(res.data.data.stops);
          if (res.data.data.stops[0]?.lat && res.data.data.stops[0]?.lng) {
            setDepot({
              name: 'Regional CleanNect Waste Depot',
              lat: res.data.data.stops[0].lat + 0.015,
              lng: res.data.data.stops[0].lng - 0.015,
              address: `${res.data.data.stops[0].address || 'Regional Collection Center'}`,
            });
          }
        }
      } catch (err) {
        console.warn('Could not load MongoDB marketplace stops, using default stops:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRealMarketData();
  }, []);

  // Fetch user orders stops
  useEffect(() => {
    async function fetchUserOrders() {
      if (!token) return;
      try {
        const res = await apiClient.get('/route-optimizer/my-orders-stops');
        if (res.data?.success && res.data?.data?.stops?.length > 0) {
          setMyOrdersStops(res.data.data.stops);
        }
      } catch (err) {
        // user might not have placed orders yet
      }
    }
    fetchUserOrders();
  }, [token]);

  // Socket.IO real-time event listeners
  useEffect(() => {
    const socket = getSocket(token);
    if (!socket) return;

    socket.on('stopCollectedLive', (data) => {
      setCollectedStops((prev) => new Set([...prev, data.stopId]));
      setLiveNotification(`✅ Real-Time Update: "${data.stopName || 'Stop'}" marked collected!`);
      setTimeout(() => setLiveNotification(null), 5000);
    });

    socket.on('driverMoved', (data) => {
      if (data.coords) {
        setLiveDriverPos(data.coords);
      }
    });

    return () => {
      socket.off('stopCollectedLive');
      socket.off('driverMoved');
    };
  }, [token]);

  // ── Place Search Handler (OpenStreetMap Nominatim) ──
  const handleSearchPlaces = async (customQuery = null) => {
    const query = (customQuery !== null ? customQuery : searchQuery).trim();
    if (!query) return;

    setIsSearchingLocation(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=6&addressdetails=1`
      );
      const data = await res.json();
      setSearchResults(data || []);

      if (data && data.length > 0) {
        // Auto-locate top result on map
        selectLocationResult(data[0]);
      } else {
        setLiveNotification(`⚠️ No location matches found for "${query}"`);
        setTimeout(() => setLiveNotification(null), 4000);
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setLiveNotification('⚠️ Failed to search place. Please try again.');
      setTimeout(() => setLiveNotification(null), 4000);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const selectLocationResult = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    if (isNaN(lat) || isNaN(lng)) return;

    const shortName = item.name || item.display_name.split(',')[0] || 'Selected Location';
    const placeObj = {
      name: shortName,
      address: item.display_name,
      lat,
      lng,
    };

    setSearchedPlace(placeObj);
    setFlyToTarget({ lat, lng, ts: Date.now() });
    setSearchResults([]);
    setLiveNotification(`📍 Located on map: ${shortName}`);
    setTimeout(() => setLiveNotification(null), 4000);
  };

  // Click on map to place pin
  const handleMapClick = async (latlng) => {
    const lat = latlng.lat;
    const lng = latlng.lng;
    const defaultName = `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

    setSearchedPlace({
      name: defaultName,
      address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      lat,
      lng,
    });
    setFlyToTarget({ lat, lng, ts: Date.now() });

    // Reverse geocode to get human address
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      if (data?.display_name) {
        setSearchedPlace({
          name: data.name || data.display_name.split(',')[0] || defaultName,
          address: data.display_name,
          lat,
          lng,
        });
      }
    } catch (e) {
      // ignore
    }
  };

  // Use Current GPS Device Location
  const handleUseCurrentGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLiveNotification('📡 Acquiring current GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const placeObj = {
          name: 'My Current GPS Location',
          address: `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          lat,
          lng,
        };
        setSearchedPlace(placeObj);
        setFlyToTarget({ lat, lng, ts: Date.now() });
        setLiveNotification(`📍 GPS Location Acquired (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        setTimeout(() => setLiveNotification(null), 4000);
      },
      (err) => {
        alert('Could not acquire GPS position: ' + err.message);
        setLiveNotification(null);
      }
    );
  };

  // Set Searched Place as Depot
  const handleSetSearchedAsDepot = () => {
    if (!searchedPlace) return;
    setDepot({
      name: searchedPlace.name,
      address: searchedPlace.address,
      lat: searchedPlace.lat,
      lng: searchedPlace.lng,
    });
    setLiveNotification(`🏢 Vehicle Depot moved to: ${searchedPlace.name}`);
    setSearchedPlace(null);
    setTimeout(() => setLiveNotification(null), 4000);
  };

  // Add Searched Place as Stop
  const handleAddSearchedAsStop = () => {
    if (!searchedPlace) return;
    const newStop = {
      id: `searched-${Date.now()}`,
      name: searchedPlace.name,
      phone: 'N/A',
      address: searchedPlace.address,
      lat: searchedPlace.lat,
      lng: searchedPlace.lng,
      wasteType: searchWasteType || 'PET Plastic & Scrap',
      quantity: parseFloat(searchQuantity) || 25,
      unit: 'kg',
      price: 0,
    };
    setStops([...stops, newStop]);
    setLiveNotification(`➕ Added collection stop: ${searchedPlace.name}`);
    setSearchedPlace(null);
    setTimeout(() => setLiveNotification(null), 4000);
  };

  // Calculate & Optimize Route
  const handleOptimizeRoute = async () => {
    if (stops.length === 0) {
      setError('Please add at least 1 stop to optimize the route.');
      return;
    }

    setOptimizing(true);
    setError('');
    try {
      const res = await apiClient.post('/route-optimizer/optimize', {
        depot,
        stops,
        vehicleCapacity: 500,
      });

      if (res.data?.success) {
        setOptimizedData(res.data.data);

        // Extract real road coordinates from legs for smooth polyline and GPS simulation
        const poly = [];
        if (res.data.data.legs) {
          res.data.data.legs.forEach((leg) => {
            if (leg.geometry && leg.geometry.coordinates) {
              leg.geometry.coordinates.forEach((coord) => {
                poly.push({ lat: coord[1], lng: coord[0] });
              });
            } else {
              poly.push({ lat: leg.from.lat, lng: leg.from.lng });
              poly.push({ lat: leg.to.lat, lng: leg.to.lng });
            }
          });
        }
        setRoadPolyline(poly);

        setLiveNotification('🎉 Route optimized with real TSP shortest-path sequencing!');
        setTimeout(() => setLiveNotification(null), 4000);
      }
    } catch (err) {
      console.error('Optimization error:', err);
      setError(err.response?.data?.message || 'Failed to optimize route. Please check coordinates.');
    } finally {
      setOptimizing(false);
    }
  };

  // Toggle stop collected
  const toggleStopCollected = (stopId, stopName) => {
    const isNowCollected = !collectedStops.has(stopId);
    setCollectedStops((prev) => {
      const next = new Set(prev);
      if (next.has(stopId)) next.delete(stopId);
      else next.add(stopId);
      return next;
    });

    const socket = getSocket(token);
    if (socket) {
      socket.emit('stopCollectedBroadcast', {
        stopId,
        stopName,
        isCollected: isNowCollected,
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Live GPS Simulation
  const startSimulation = () => {
    if (roadPolyline.length === 0) {
      alert('Please click "Run TSP Optimization" first to generate the road itinerary.');
      return;
    }
    setIsSimulating(true);
  };

  const pauseSimulation = () => {
    setIsSimulating(false);
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setSimIndex(0);
    setLiveDriverPos(null);
    setCollectedStops(new Set());
  };

  useEffect(() => {
    if (!isSimulating || roadPolyline.length === 0) {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      return;
    }

    const intervalMs = Math.max(50, Math.floor(400 / simSpeed));

    simIntervalRef.current = setInterval(() => {
      setSimIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex >= roadPolyline.length) {
          setIsSimulating(false);
          setLiveNotification('🏁 All collection stops completed! Vehicle returned to depot.');
          if (optimizedData?.optimizedStops) {
            const allIds = new Set(optimizedData.optimizedStops.map((s) => s.id));
            setCollectedStops(allIds);
          }
          return roadPolyline.length - 1;
        }

        const currentCoord = roadPolyline[nextIndex];
        setLiveDriverPos(currentCoord);

        // Proximity auto-collector
        if (optimizedData?.optimizedStops) {
          optimizedData.optimizedStops.forEach((stop) => {
            const dist = Math.hypot(stop.lat - currentCoord.lat, stop.lng - currentCoord.lng);
            if (dist < 0.003 && !collectedStops.has(stop.id)) {
              toggleStopCollected(stop.id, stop.name);
            }
          });
        }

        return nextIndex;
      });
    }, intervalMs);

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isSimulating, simSpeed, roadPolyline, optimizedData]);

  // Handle Add Stop Form Submit
  const handleAddStopSubmit = (e) => {
    e.preventDefault();
    const lat = parseFloat(newStopForm.lat);
    const lng = parseFloat(newStopForm.lng);

    if (isNaN(lat) || isNaN(lng)) {
      alert('Please provide valid latitude and longitude coordinates.');
      return;
    }

    const newStop = {
      id: `custom-${Date.now()}`,
      name: newStopForm.name || `Pickup Stop ${stops.length + 1}`,
      phone: newStopForm.phone || 'N/A',
      address: newStopForm.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      lat,
      lng,
      wasteType: newStopForm.wasteType,
      quantity: parseFloat(newStopForm.quantity) || 1,
      unit: newStopForm.unit || 'kg',
      price: 0,
    };

    setStops([...stops, newStop]);
    setShowAddModal(false);
    setNewStopForm({
      name: '',
      phone: '',
      address: '',
      lat: '',
      lng: '',
      wasteType: 'PET Plastic Scrap',
      quantity: '25',
      unit: 'kg',
    });
  };

  const removeStop = (id) => {
    setStops(stops.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Real-Time Toast Notification ── */}
      {liveNotification && (
        <div className="rounded-2xl bg-emerald-700 text-white p-4 shadow-xl flex items-center justify-between border border-emerald-500 animate-slide-in">
          <div className="flex items-center gap-3 text-xs md:text-sm font-bold">
            <span className="text-xl">⚡</span>
            <span>{liveNotification}</span>
          </div>
          <button
            onClick={() => setLiveNotification(null)}
            className="text-emerald-200 hover:text-white text-xs font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Header Title & Actions ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-bold text-emerald-800 mb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Real-Time Nearest Neighbor TSP Optimization</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Multi-Member Waste Collection Route Optimizer
          </h1>
          <p className="mt-1 text-xs md:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Search any city, place, or click directly on the map to locate pickup points, minimize kilometers traveled, cut emissions, and navigate turn-by-turn with live GPS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setDepot({
                name: 'CleanNect Hub (Indiranagar)',
                lat: 12.9784,
                lng: 77.6408,
                address: 'Indiranagar, Bengaluru, Karnataka',
              });
              setStops(defaultBengaluruStops);
              setFlyToTarget({ lat: 12.9784, lng: 77.6408, ts: Date.now() });
            }}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-2 text-xs border border-emerald-200 transition active:scale-95"
          >
            <span>⚡ Bengaluru Demo</span>
          </button>

          <button
            onClick={() => {
              const mumbaiDepot = {
                name: 'CleanNect Hub (Bandra West)',
                lat: 19.0596,
                lng: 72.8295,
                address: 'Linking Road, Bandra West, Mumbai, Maharashtra',
              };
              const mumbaiStops = [
                {
                  id: 'mb1',
                  name: 'Member 1 — Sunita Patel',
                  phone: '+91 98200 44556',
                  address: '14th Road, Khar West, Mumbai',
                  lat: 19.07,
                  lng: 72.835,
                  wasteType: 'Clear Glass Bottles & Cullet',
                  quantity: 60,
                  unit: 'kg',
                  price: 750,
                },
                {
                  id: 'mb2',
                  name: 'Member 2 — Vikram Desai',
                  phone: '+91 98190 55667',
                  address: 'Station Road, Santacruz West, Mumbai',
                  lat: 19.083,
                  lng: 72.839,
                  wasteType: 'Brass & Aluminum Scrap',
                  quantity: 25,
                  unit: 'kg',
                  price: 3800,
                },
              ];
              setDepot(mumbaiDepot);
              setStops(mumbaiStops);
              setFlyToTarget({ lat: 19.0596, lng: 72.8295, ts: Date.now() });
            }}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold px-3 py-2 text-xs border border-teal-200 transition active:scale-95"
          >
            <span>⚡ Mumbai Demo</span>
          </button>

          <button
            onClick={handleOptimizeRoute}
            disabled={optimizing || stops.length === 0}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-2.5 text-xs transition shadow-lg hover:shadow-emerald-600/25 active:scale-95 disabled:opacity-50"
          >
            {optimizing ? 'Calculating TSP Route...' : '🚀 Run TSP Optimization'}
          </button>
        </div>
      </div>

      {/* ── 🔍 LIVE PLACE SEARCH & MAP LOCATOR BAR ── */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="text-base">📍</span>
              <span>Interactive Map Search & Place Locator</span>
            </h2>
            <p className="text-xs text-slate-500">
              Type any address, city, area, or landmark to fly directly to it and set it as a Depot or Collection Stop:
            </p>
          </div>

          <button
            onClick={handleUseCurrentGPSLocation}
            className="inline-flex items-center gap-1.5 self-start md:self-auto rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-bold px-3 py-2 text-xs border border-slate-200 transition"
          >
            <span>📡 Use My Current GPS Location</span>
          </button>
        </div>

        {/* Search Input with Autocomplete Form */}
        <div className="relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchPlaces();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search place, city, landmark or area (e.g. Indiranagar Bengaluru, Bandra Mumbai, Connaught Place Delhi)..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-3 text-xs md:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none transition shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSearchingLocation || !searchQuery.trim()}
              className="flex-shrink-0 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-3 text-xs md:text-sm transition shadow disabled:opacity-40"
            >
              {isSearchingLocation ? 'Locating...' : 'Locate on Map'}
            </button>
          </form>

          {/* Autocomplete Suggestions Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {searchResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => selectLocationResult(item)}
                  className="p-3.5 hover:bg-emerald-50/70 cursor-pointer transition flex items-start gap-3 text-left"
                >
                  <span className="text-emerald-600 font-bold mt-0.5">📍</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {item.name || item.display_name.split(',')[0]}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{item.display_name}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full flex-shrink-0">
                    Fly To
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Panel for Searched Pin */}
        {searchedPlace && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-scale-up">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg flex-shrink-0 shadow">
                📍
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-full">
                  Place Located on Map
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm mt-1">{searchedPlace.name}</h3>
                <p className="text-xs text-slate-600 line-clamp-1">{searchedPlace.address}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  GPS: {searchedPlace.lat.toFixed(5)}, {searchedPlace.lng.toFixed(5)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
              <button
                onClick={handleSetSearchedAsDepot}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow"
              >
                🏢 Set as Vehicle Depot
              </button>

              <button
                onClick={handleAddSearchedAsStop}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow"
              >
                ➕ Add as Pickup Stop
              </button>

              <button
                onClick={() => setSearchedPlace(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 transition text-xs font-bold"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Key Optimization Metrics ── */}
      {optimizedData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Distance Saved</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-black text-emerald-600">
                {optimizedData.summary.kmSaved}
              </span>
              <span className="text-xs font-bold text-slate-500">KM ({optimizedData.summary.percentSaved}%)</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              Down from {optimizedData.summary.unoptimizedDistanceKm} km → {optimizedData.summary.optimizedDistanceKm} km
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fuel Saved</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-black text-slate-900">
                {optimizedData.summary.fuelSavedLiters}
              </span>
              <span className="text-xs font-bold text-slate-500">Liters</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-400">≈ ₹{optimizedData.summary.costSavedInr} diesel saved</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Carbon Offset</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-black text-teal-600">
                {optimizedData.summary.co2SavedKg}
              </span>
              <span className="text-xs font-bold text-slate-500">KG CO₂</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-400">GHG emissions prevented</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Est. Travel Time</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-black text-slate-900">
                {optimizedData.summary.totalEstimatedTimeMinutes}
              </span>
              <span className="text-xs font-bold text-slate-500">Minutes</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              {stops.length} stops ({collectedStops.size}/{stops.length} completed)
            </p>
          </div>
        </div>
      )}

      {/* ── Interactive Leaflet Map & Live GPS Simulation Controls ── */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        {/* Simulation Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 text-white p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚐</span>
            <div>
              <div className="text-xs font-bold text-slate-200">
                {isSimulating ? '🔴 Live GPS Driving Simulation Active' : 'Real-Time GPS Simulation Control'}
              </div>
              <div className="text-[11px] text-slate-400">
                {liveDriverPos
                  ? `Vehicle at: ${liveDriverPos.lat.toFixed(4)}, ${liveDriverPos.lng.toFixed(4)}`
                  : 'Click "Start Live GPS Simulation" to see driver moving along route'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed Multipliers */}
            <div className="flex items-center bg-slate-800 rounded-xl p-0.5 text-xs">
              {[1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setSimSpeed(speed)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    simSpeed === speed ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {!isSimulating ? (
              <button
                onClick={startSimulation}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow active:scale-95"
              >
                ▶ Start Live GPS Simulation
              </button>
            ) : (
              <button
                onClick={pauseSimulation}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow active:scale-95"
              >
                ⏸ Pause
              </button>
            )}

            <button
              onClick={resetSimulation}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
            >
              Reset
            </button>

            {optimizedData?.navigationUrl && (
              <a
                href={optimizedData.navigationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow flex items-center gap-1.5"
              >
                <span>🗺️ Google Maps</span>
              </a>
            )}
          </div>
        </div>

        {/* Map Canvas with Click-to-Pin and Fly-to */}
        <div className="h-[380px] md:h-[450px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative">
          <MapContainer
            center={[depot.lat, depot.lng]}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapFlyToController targetLocation={flyToTarget} />
            <MapClickHandler onMapClick={handleMapClick} />
            <MapBoundsUpdater
              points={[depot, ...stops]}
              liveCoords={liveDriverPos}
              targetLocation={flyToTarget}
            />

            {/* Depot Pin */}
            <Marker position={[depot.lat, depot.lng]} icon={depotIcon}>
              <Popup>
                <div className="text-xs p-1 font-sans">
                  <strong>🏢 Start Depot / Hub</strong>
                  <p className="font-bold text-slate-900">{depot.name}</p>
                  <p className="text-slate-500">{depot.address}</p>
                </div>
              </Popup>
            </Marker>

            {/* Searched / Clicked Location Pin */}
            {searchedPlace && (
              <Marker position={[searchedPlace.lat, searchedPlace.lng]} icon={searchPinIcon}>
                <Popup>
                  <div className="text-xs p-1 font-sans space-y-2">
                    <strong className="text-rose-600">📍 Searched Place</strong>
                    <p className="font-bold text-slate-900">{searchedPlace.name}</p>
                    <p className="text-slate-500">{searchedPlace.address}</p>
                    <div className="flex gap-1 pt-1">
                      <button
                        onClick={handleSetSearchedAsDepot}
                        className="flex-1 py-1 px-2 rounded bg-slate-900 text-white text-[10px] font-bold"
                      >
                        Set as Depot
                      </button>
                      <button
                        onClick={handleAddSearchedAsStop}
                        className="flex-1 py-1 px-2 rounded bg-emerald-600 text-white text-[10px] font-bold"
                      >
                        Add as Stop
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Numbered Pickup Stops */}
            {(optimizedData?.optimizedStops || stops).map((stop, idx) => {
              const isCollected = collectedStops.has(stop.id);
              const isNext = !isCollected && idx === 0;
              const color = isCollected ? '#64748B' : isNext ? '#F59E0B' : '#10B981';

              return (
                <Marker
                  key={stop.id}
                  position={[stop.lat, stop.lng]}
                  icon={createNumberedIcon(idx + 1, color, isNext)}
                >
                  <Popup>
                    <div className="text-xs p-1 font-sans space-y-1">
                      <div className="font-extrabold text-slate-900">
                        Stop #{idx + 1}: {stop.name}
                      </div>
                      <p className="text-slate-600">📦 {stop.wasteType}</p>
                      <p className="text-slate-600">
                        ⚖️ {stop.quantity} {stop.unit}
                      </p>
                      <p className="text-slate-500">📍 {stop.address}</p>
                      <div className="pt-2 flex gap-1">
                        <button
                          onClick={() => toggleStopCollected(stop.id, stop.name)}
                          className={`flex-1 py-1 px-2 rounded font-bold text-[11px] text-white ${
                            isCollected ? 'bg-slate-600' : 'bg-emerald-600'
                          }`}
                        >
                          {isCollected ? '✓ Completed' : 'Mark as Collected'}
                        </button>
                        <button
                          onClick={() => removeStop(stop.id)}
                          className="py-1 px-2 rounded bg-rose-50 text-rose-600 font-bold text-[11px]"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Real Road Polyline Route */}
            {roadPolyline.length > 1 && (
              <Polyline
                positions={roadPolyline.map((p) => [p.lat, p.lng])}
                color="#10B981"
                weight={5}
                opacity={0.85}
              />
            )}

            {/* Live Moving Vehicle Marker */}
            {liveDriverPos && (
              <Marker position={[liveDriverPos.lat, liveDriverPos.lng]} icon={vehicleIcon}>
                <Popup>
                  <div className="text-xs font-sans font-bold">
                    🚐 Live Collection Vehicle
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          <div className="absolute top-3 right-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-600 shadow">
            💡 Tip: Click anywhere on map to drop a pin
          </div>
        </div>
      </div>

      {/* ── Real Data Source Pickers ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Marketplace Active Listings Selector */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>🛒 Real Marketplace Lots ({availableMarketStops.length})</span>
            </h2>
            <span className="text-[11px] text-slate-400">Direct from MongoDB</span>
          </div>
          <p className="text-xs text-slate-500">
            Click any active marketplace listing below to add it directly to your collection route:
          </p>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 no-scrollbar">
            {availableMarketStops.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">No active marketplace listings found.</div>
            ) : (
              availableMarketStops.map((mStop) => {
                const isSelected = stops.some((s) => s.id === mStop.id || s.listingId === mStop.id);
                return (
                  <div
                    key={mStop.id}
                    onClick={() => {
                      if (isSelected) {
                        removeStop(mStop.id);
                      } else {
                        setStops([...stops, mStop]);
                        setFlyToTarget({ lat: mStop.lat, lng: mStop.lng, ts: Date.now() });
                      }
                    }}
                    className={`cursor-pointer p-3 rounded-2xl border text-xs transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-slate-900">{mStop.wasteType}</div>
                      <div className="text-[11px] text-slate-500">
                        📍 {mStop.address} • {mStop.quantity} {mStop.unit}
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-600">
                      {isSelected ? '✓ Added' : '+ Add'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Real User Orders Selector */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>📦 Your Active Orders ({myOrdersStops.length})</span>
            </h2>
            <span className="text-[11px] text-slate-400">Your purchases</span>
          </div>
          <p className="text-xs text-slate-500">
            1-click load stops for orders you have placed on the CleanNect exchange:
          </p>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 no-scrollbar">
            {myOrdersStops.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                {user ? 'No active orders awaiting pickup.' : 'Sign in to automatically sync your placed orders.'}
              </div>
            ) : (
              myOrdersStops.map((oStop) => {
                const isSelected = stops.some((s) => s.id === oStop.id);
                return (
                  <div
                    key={oStop.id}
                    onClick={() => {
                      if (isSelected) {
                        removeStop(oStop.id);
                      } else {
                        setStops([...stops, oStop]);
                        setFlyToTarget({ lat: oStop.lat, lng: oStop.lng, ts: Date.now() });
                      }
                    }}
                    className={`cursor-pointer p-3 rounded-2xl border text-xs transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-slate-900">{oStop.wasteType}</div>
                      <div className="text-[11px] text-slate-500">
                        Seller: {oStop.name} • {oStop.quantity} {oStop.unit}
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-600">
                      {isSelected ? '✓ Added' : '+ Add'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Sequence Stop-by-Stop Itinerary ── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>📋 Collection Route Itinerary ({stops.length} Stops)</span>
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 text-xs transition shadow"
          >
            + Add Custom Coordinates
          </button>
        </div>

        {stops.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No stops selected. Search places above or add active marketplace listings.
          </div>
        ) : (
          <div className="space-y-3">
            {(optimizedData?.optimizedStops || stops).map((stop, idx) => {
              const isCollected = collectedStops.has(stop.id);
              const leg = optimizedData?.legs?.[idx];

              return (
                <div
                  key={stop.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isCollected
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200 hover:border-emerald-400 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-white font-black text-xs ${
                        isCollected ? 'bg-slate-400' : 'bg-emerald-600'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{stop.name}</h3>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {stop.wasteType}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          {stop.quantity} {stop.unit}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        📍 {stop.address} {stop.phone !== 'N/A' && `• 📞 ${stop.phone}`}
                      </p>
                      {leg && (
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400 font-semibold">
                          <span>🚗 Leg: {leg.distanceKm} km (~{leg.driveTimeMinutes} mins)</span>
                          <span>•</span>
                          <span>Cumulative: {leg.cumulativeDistanceKm} km</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      onClick={() => setFlyToTarget({ lat: stop.lat, lng: stop.lng, ts: Date.now() })}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                    >
                      📍 Focus
                    </button>

                    <button
                      onClick={() => toggleStopCollected(stop.id, stop.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        isCollected
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                      }`}
                    >
                      {isCollected ? '✓ Collected' : 'Mark Collected'}
                    </button>

                    <button
                      onClick={() => removeStop(stop.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition text-xs"
                      title="Remove Stop"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add Stop Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add Custom Coordinates Stop</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStopSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Member / Seller Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newStopForm.name}
                  onChange={(e) => setNewStopForm({ ...newStopForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    placeholder="12.9352"
                    value={newStopForm.lat}
                    onChange={(e) => setNewStopForm({ ...newStopForm, lat: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    placeholder="77.6245"
                    value={newStopForm.lng}
                    onChange={(e) => setNewStopForm({ ...newStopForm, lng: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pickup Address</label>
                <input
                  type="text"
                  placeholder="e.g. Koramangala 4th Block, Bengaluru"
                  value={newStopForm.address}
                  onChange={(e) => setNewStopForm({ ...newStopForm, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waste Type</label>
                  <input
                    type="text"
                    value={newStopForm.wasteType}
                    onChange={(e) => setNewStopForm({ ...newStopForm, wasteType: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity (kg)</label>
                  <input
                    type="number"
                    value={newStopForm.quantity}
                    onChange={(e) => setNewStopForm({ ...newStopForm, quantity: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                >
                  Add Stop to Route
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
