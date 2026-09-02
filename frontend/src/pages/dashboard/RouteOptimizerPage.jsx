import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
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

function MapBoundsUpdater({ points, liveCoords }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    try {
      const allPts = liveCoords ? [...points, liveCoords] : points;
      const bounds = L.latLngBounds(allPts.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } catch (e) {
      // ignore
    }
  }, [points, map]);
  return null;
}

export default function RouteOptimizerPage() {
  const { user, token } = useAuth();

  // Depot / Driver starting point
  const [depot, setDepot] = useState({
    name: 'Collection Vehicle Depot / Hub',
    lat: 12.9716,
    lng: 77.5946,
    address: 'Bengaluru City Center',
  });
  const [gettingLocation, setGettingLocation] = useState(false);

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
  const [currentDestinationName, setCurrentDestinationName] = useState('');
  const simIntervalRef = useRef(null);

  // New Stop Input Form
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

  // Fetch real marketplace listings from MongoDB on mount
  useEffect(() => {
    async function fetchRealMarketData() {
      setLoading(true);
      try {
        const res = await apiClient.get('/route-optimizer/marketplace-stops');
        const realListings = res.data?.data || [];
        if (realListings.length > 0) {
          setAvailableMarketStops(realListings);
          setStops(realListings.slice(0, 3));
        }
      } catch (err) {
        console.warn('Failed to load marketplace stops:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRealMarketData();
  }, []);

  // Fetch user active orders if logged in
  useEffect(() => {
    if (!user) return;
    async function fetchMyOrders() {
      try {
        const res = await apiClient.get('/route-optimizer/my-orders-stops');
        setMyOrdersStops(res.data?.data || []);
      } catch (err) {
        // ignore
      }
    }
    fetchMyOrders();
  }, [user]);

  // Real-time Socket.io listener
  useEffect(() => {
    const socket = getSocket(token);
    if (!socket) return;

    const handleStopLive = (data) => {
      setCollectedStops((prev) => new Set([...prev, data.stopId]));
      setLiveNotification(`✅ Real-Time Update: "${data.stopName || 'Stop'}" has been collected!`);
      setTimeout(() => setLiveNotification(null), 5000);
    };

    socket.on('stopCollectedLive', handleStopLive);
    return () => {
      socket.off('stopCollectedLive', handleStopLive);
    };
  }, [token]);

  // Run Optimization when stops or depot changes
  const runOptimization = async (currentDepot = depot, currentStops = stops) => {
    if (!currentStops || currentStops.length === 0) {
      setOptimizedData(null);
      setRoadPolyline([]);
      return;
    }

    setOptimizing(true);
    setError('');
    try {
      const res = await apiClient.post('/route-optimizer/optimize', {
        startLocation: currentDepot,
        stops: currentStops,
      });

      const optResult = res.data?.data;
      setOptimizedData(optResult);

      // Fetch Real OSRM Road Geometry for realistic street paths
      await fetchRealRoadGeometry(currentDepot, optResult.optimizedStops);
    } catch (err) {
      console.error('Optimization error:', err);
      setError(err.response?.data?.message || 'Failed to optimize route');
    } finally {
      setOptimizing(false);
    }
  };

  // Fetch real road turn-by-turn geometry from OSRM
  const fetchRealRoadGeometry = async (start, orderedStops) => {
    if (!orderedStops || orderedStops.length === 0) return;
    try {
      const coords = [
        `${start.lng},${start.lat}`,
        ...orderedStops.map((s) => `${s.lng},${s.lat}`),
      ].join(';');

      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
      const response = await fetch(osrmUrl);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates) {
        const polylineCoords = data.routes[0].geometry.coordinates.map(([lng, lat]) => ({
          lat,
          lng,
        }));
        setRoadPolyline(polylineCoords);
      } else {
        // Fallback straight lines
        setRoadPolyline([start, ...orderedStops]);
      }
    } catch (e) {
      setRoadPolyline([start, ...orderedStops]);
    }
  };

  // Trigger optimization whenever stops or depot updates
  useEffect(() => {
    if (stops.length > 0) {
      runOptimization(depot, stops);
    }
  }, [stops, depot]);

  // Get User's Live Real GPS Location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const liveDepot = {
          name: 'My Live GPS Driver Location',
          lat: latitude,
          lng: longitude,
          address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)} (Live GPS)`,
        };
        setDepot(liveDepot);
        setGettingLocation(false);
        runOptimization(liveDepot, stops);
      },
      (err) => {
        setGettingLocation(false);
        alert('Could not access live GPS coordinates: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Toggle Stop Collection
  const toggleStopCollected = (stopId, stopName) => {
    const socket = getSocket(token);
    const nextSet = new Set(collectedStops);
    const isNowCollected = !nextSet.has(stopId);

    if (isNowCollected) {
      nextSet.add(stopId);
      if (socket) {
        socket.emit('stopCollectedBroadcast', { stopId, stopName, time: new Date().toISOString() });
      }
    } else {
      nextSet.delete(stopId);
    }
    setCollectedStops(nextSet);
  };

  // Live GPS Simulation Engine
  const startSimulation = () => {
    if (!roadPolyline || roadPolyline.length < 2) return;
    setIsSimulating(true);
    setSimIndex(0);
    setLiveDriverPos(roadPolyline[0]);
    setCurrentDestinationName(optimizedData?.optimizedStops[0]?.name || 'Stop 1');
  };

  const pauseSimulation = () => {
    setIsSimulating(false);
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    setSimIndex(0);
    setLiveDriverPos(null);
    setCurrentDestinationName('');
  };

  useEffect(() => {
    if (!isSimulating || roadPolyline.length === 0) return;

    const intervalMs = Math.max(80, Math.round(300 / simSpeed));
    simIntervalRef.current = setInterval(() => {
      setSimIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= roadPolyline.length) {
          clearInterval(simIntervalRef.current);
          setIsSimulating(false);
          // Mark all as collected
          if (optimizedData?.optimizedStops) {
            const allIds = new Set(optimizedData.optimizedStops.map((s) => s.id));
            setCollectedStops(allIds);
          }
          return roadPolyline.length - 1;
        }

        const currentCoord = roadPolyline[nextIndex];
        setLiveDriverPos(currentCoord);

        // Check proximity to stops and mark collected automatically
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

  // Remove Stop
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
            Sequence 3+ pickup locations to minimize total kilometers traveled, cut fuel expenses, and navigate turn-by-turn with live GPS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setDepot({
                name: 'CleanNect Hub (Indiranagar)',
                lat: 12.9784,
                lng: 77.6408,
                address: 'Indiranagar, Bengaluru',
              });
              setStops(defaultBengaluruStops);
            }}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-2 text-xs border border-emerald-200 transition active:scale-95"
          >
            <span>⚡ 3-Member Bengaluru</span>
          </button>

          <button
            onClick={() => {
              const mumbaiDepot = {
                name: 'CleanNect Hub (Bandra West)',
                lat: 19.0596,
                lng: 72.8295,
                address: 'Linking Road, Bandra West, Mumbai',
              };
              const mumbaiStops = [
                {
                  id: 'mb1',
                  name: 'Member 1 — Sunita Patel',
                  phone: '+91 98200 44556',
                  address: '14th Road, Khar West, Mumbai',
                  lat: 19.0700,
                  lng: 72.8350,
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
                  lat: 19.0830,
                  lng: 72.8390,
                  wasteType: 'Brass & Aluminum Scrap',
                  quantity: 25,
                  unit: 'kg',
                  price: 4500,
                },
                {
                  id: 'mb3',
                  name: 'Member 3 — Neha Kapoor',
                  phone: '+91 98211 66778',
                  address: 'Juhu Tara Road, Mumbai',
                  lat: 19.1020,
                  lng: 72.8260,
                  wasteType: 'Industrial LDPE Film Rolls',
                  quantity: 95,
                  unit: 'kg',
                  price: 1900,
                },
              ];
              setDepot(mumbaiDepot);
              setStops(mumbaiStops);
            }}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold px-3 py-2 text-xs border border-teal-200 transition active:scale-95"
          >
            <span>⚡ 3-Member Mumbai</span>
          </button>

          <button
            onClick={handleGetCurrentLocation}
            disabled={gettingLocation}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 text-xs transition active:scale-95 disabled:opacity-50"
          >
            <span>{gettingLocation ? '🛰️ Locating...' : '📍 Use Live GPS'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 text-xs transition shadow-sm active:scale-95"
          >
            <span>+ Add Stop</span>
          </button>
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
                      <div className="text-[11px] text-slate-500">Seller: {oStop.name} • {oStop.quantity} {oStop.unit}</div>
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
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">CO₂ Cut</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-black text-teal-600">
                {optimizedData.summary.co2SavedKg}
              </span>
              <span className="text-xs font-bold text-slate-500">kg CO₂e</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-400">Direct emission offset</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Route Time</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-black text-slate-900">
                {optimizedData.summary.totalEstimatedTimeMinutes}
              </span>
              <span className="text-xs font-bold text-slate-500">Mins</span>
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
                {liveDriverPos ? `Vehicle at: ${liveDriverPos.lat.toFixed(4)}, ${liveDriverPos.lng.toFixed(4)}` : 'Ready to start live driving playback'}
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
                <span>🗺️ Open in Google Maps</span>
              </a>
            )}
          </div>
        </div>

        {/* Compact Map Canvas */}
        <div className="h-[280px] md:h-[320px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
          <MapContainer
            center={[depot.lat, depot.lng]}
            zoom={12}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapBoundsUpdater points={[depot, ...stops]} liveCoords={liveDriverPos} />

            {/* Depot Pin */}
            <Marker position={[depot.lat, depot.lng]} icon={depotIcon}>
              <Popup>
                <div className="text-xs p-1 font-sans">
                  <strong>🏢 Start Depot / Hub</strong>
                  <p>{depot.name}</p>
                  <p className="text-slate-500">{depot.address}</p>
                </div>
              </Popup>
            </Marker>

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
                      <div className="pt-2">
                        <button
                          onClick={() => toggleStopCollected(stop.id, stop.name)}
                          className={`w-full py-1 px-2 rounded font-bold text-[11px] text-white ${
                            isCollected ? 'bg-slate-600' : 'bg-emerald-600'
                          }`}
                        >
                          {isCollected ? '✓ Completed' : 'Mark as Collected'}
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
        </div>
      </div>

      {/* ── Sequence Stop-by-Stop Itinerary ── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center justify-between">
          <span>📋 Turn-by-Turn Collection Itinerary ({stops.length} Stops)</span>
          <span className="text-xs text-slate-400 font-medium">Sorted by Nearest-Neighbor Shortest Path</span>
        </h2>

        {stops.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No stops selected. Add active listings from the marketplace above or use "+ Add Custom Stop".
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
                      onClick={() => toggleStopCollected(stop.id, stop.name)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
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
              <h3 className="font-bold text-slate-900 text-base">Add Real Pickup Location</h3>
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
