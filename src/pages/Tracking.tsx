import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../lib/api';
import { Users, Loader2, Map as MapIcon, RotateCcw, Clock, MapPin, Navigation, Calendar, Filter, ChevronDown, ChevronUp, X } from 'lucide-react';

// Fix Leaflet marker icons
import iconImg from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: iconImg,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Worker {
    id: string;
    name: string;
    phone: string;
    last_lat?: number;
    last_lng?: number;
    last_seen?: string;
}

interface TrailPoint {
    latitude: number;
    longitude: number;
    recorded_at: string;
}

interface Stop {
    id: string;
    latitude: number;
    longitude: number;
    start_at: string;
    end_at: string;
    duration_minutes: number;
}

const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) map.setView([lat, lng], 15);
    }, [lat, lng, map]);
    return null;
};

const formatDuration = (mins: number) => {
    if (mins < 60) return `${Math.round(mins)} min`;
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// ---- Reverse Geocode with Nominatim (free, no API key) ----
const geocodeCache = new Map<string, string>();

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    if (geocodeCache.has(key)) return geocodeCache.get(key)!;

    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        console.log('🗺️ Nominatim response:', data);
        console.log('📍 Address object:', data.address);
        const addr = data.address;
        // Build a detailed, human-readable name with village/town/district/state
        const parts: string[] = [];
        if (addr.amenity || addr.building || addr.shop || addr.office) {
            parts.push(addr.amenity || addr.building || addr.shop || addr.office);
        }
        if (addr.road) parts.push(addr.road);
        if (addr.neighbourhood) parts.push(addr.neighbourhood);
        if (addr.suburb) parts.push(addr.suburb);
        if (addr.village) parts.push(addr.village);
        if (addr.town) parts.push(addr.town);
        if (addr.city) parts.push(addr.city);
        if (addr.county || addr.state_district) parts.push(addr.county || addr.state_district);
        if (addr.state) parts.push(addr.state);

        // Deduplicate in case village == town or city == county
        const unique = [...new Set(parts)];
        const name = unique.length > 0 ? unique.join(', ') : (data.display_name?.split(',').slice(0, 4).join(',') || 'Unknown');
        geocodeCache.set(key, name);
        return name;
    } catch {
        return 'Location unavailable';
    }
};

// ---- StopPopup: lazily geocodes when the popup opens ----
const StopPopupContent = ({ stop }: { stop: Stop }) => {
    const [placeName, setPlaceName] = useState<string>('Loading location...');

    useEffect(() => {
        reverseGeocode(stop.latitude, stop.longitude).then(setPlaceName);
    }, [stop.latitude, stop.longitude]);

    return (
        <div className="p-1.5 text-xs min-w-[180px]">
            <p className="font-bold text-slate-900 text-sm mb-1">🛑 Stop: {formatDuration(stop.duration_minutes)}</p>
            <p className="text-slate-700 font-medium">{placeName}</p>
            <p className="text-slate-400 mt-1">{formatTime(stop.start_at)} — {formatTime(stop.end_at)}</p>
            <p className="text-slate-400 mt-0.5">{stop.latitude.toFixed(5)}, {stop.longitude.toFixed(5)}</p>
        </div>
    );
};

// ---- StopTimelineItem: geocodes and shows place name in sidebar ----
const StopTimelineItem = ({ stop, onLocate }: { stop: Stop; onLocate: (lat: number, lng: number) => void }) => {
    const [placeName, setPlaceName] = useState<string | null>(null);
    const [loadingName, setLoadingName] = useState(false);
    const hasLoaded = useRef(false);

    useEffect(() => {
        // Auto-load the first few, then lazy-load on scroll/visibility
        if (!hasLoaded.current) {
            hasLoaded.current = true;
            setLoadingName(true);
            reverseGeocode(stop.latitude, stop.longitude)
                .then(setPlaceName)
                .finally(() => setLoadingName(false));
        }
    }, [stop.latitude, stop.longitude]);

    return (
        <div
            className="pb-4 flex-1 min-w-0 cursor-pointer hover:bg-slate-50 rounded-lg p-2 -m-1 transition-colors"
            onClick={() => onLocate(stop.latitude, stop.longitude)}
        >
            <div className="flex items-center justify-between">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${stop.duration_minutes >= 30 ? 'bg-red-50 text-red-600'
                    : stop.duration_minutes >= 10 ? 'bg-amber-50 text-amber-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}>
                    {formatDuration(stop.duration_minutes)}
                </span>
                <button
                    className="text-slate-300 hover:text-indigo-500 transition-colors"
                    title="Go to location on map"
                    onClick={(e) => { e.stopPropagation(); onLocate(stop.latitude, stop.longitude); }}
                >
                    <Navigation className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Place name */}
            <div className="mt-1.5">
                {loadingName ? (
                    <p className="text-[11px] text-slate-300 italic">Resolving location...</p>
                ) : placeName ? (
                    <p className="text-[11px] text-slate-700 font-medium leading-tight">📍 {placeName}</p>
                ) : null}
            </div>

            <p className="text-[11px] text-slate-500 mt-1">
                {formatTime(stop.start_at)} — {formatTime(stop.end_at)}
            </p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {stop.latitude.toFixed(5)}, {stop.longitude.toFixed(5)}
            </p>
        </div>
    );
};

// ---- FlyTo: component that flies the map to a given point ----
const FlyTo = ({ lat, lng }: { lat: number; lng: number }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) map.flyTo([lat, lng], 17, { duration: 1 });
    }, [lat, lng, map]);
    return null;
};

export const TrackingPage = () => {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
    const [trail, setTrail] = useState<[number, number][]>([]);
    const [stops, setStops] = useState<Stop[]>([]);
    const [loading, setLoading] = useState(true);
    const [trailLoading, setTrailLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'workers' | 'stops'>('workers');
    const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);

    const [selectedRange, setSelectedRange] = useState<string>('24h');
    const [customFrom, setCustomFrom] = useState<string>('');
    const [customTo, setCustomTo] = useState<string>('');
    const [isCustom, setIsCustom] = useState(false);

    const fetchWorkers = async () => {
        try {
            const response = await api.get('/admin/workers');
            setWorkers(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrailAndStops = async (workerId: string) => {
        setTrailLoading(true);
        try {
            let trailUrl = `/admin/trails/${workerId}/preset?range=${selectedRange}&simplify=true`;
            let stopsUrl = `/admin/stops/${workerId}/preset?range=${selectedRange}`;

            if (isCustom && customFrom && customTo) {
                const fromIso = new Date(customFrom).toISOString();
                const toIso = new Date(customTo).toISOString();
                trailUrl = `/admin/trails/${workerId}?from=${fromIso}&to=${toIso}&simplify=true`;
                stopsUrl = `/admin/stops/${workerId}?from=${fromIso}&to=${toIso}`;
            }

            const [trailRes, stopsRes] = await Promise.all([
                api.get(trailUrl),
                api.get(stopsUrl)
            ]);

            const points = trailRes.data.trail.map((p: TrailPoint) => [p.latitude, p.longitude] as [number, number]);
            setTrail(points);
            setStops(stopsRes.data.stops || []);
        } catch (error) {
            console.error(error);
        } finally {
            setTrailLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkers();
        const interval = setInterval(fetchWorkers, 30000);
        return () => clearInterval(interval);
    }, []);

    const selectedWorker = workers.find(w => w.id === selectedWorkerId);

    const selectWorker = (id: string) => {
        setSelectedWorkerId(id);
        setFlyTarget(null);
        fetchTrailAndStops(id);
        setActiveTab('stops');
    };

    useEffect(() => {
        if (selectedWorkerId) {
            fetchTrailAndStops(selectedWorkerId);
        }
    }, [selectedRange, isCustom, customFrom, customTo, selectedWorkerId]);

    const handleLocateStop = (lat: number, lng: number) => {
        setFlyTarget({ lat, lng });
    };

    const presets = ['1h', '3h', '6h', '12h', '24h', '1d', '2d', '3d', '7d', '14d', '30d'];

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
            {/* Filters Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm mr-2">
                    <Filter className="w-4 h-4" />
                    Tracking Filters
                </div>

                <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
                    {presets.slice(0, 5).map(p => (
                        <button
                            key={p}
                            onClick={() => { setIsCustom(false); setSelectedRange(p); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!isCustom && selectedRange === p
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                    <div className="w-px h-4 bg-slate-300 mx-1" />
                    {['1d', '3d', '7d', '30d'].map(p => (
                        <button
                            key={p}
                            onClick={() => { setIsCustom(false); setSelectedRange(p); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!isCustom && selectedRange === p
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                    <button
                        onClick={() => setIsCustom(!isCustom)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${isCustom
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        <Calendar className="w-3.5 h-3.5" />
                        Custom Range
                        {isCustom ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isCustom && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">From</span>
                                <input
                                    type="datetime-local"
                                    value={customFrom}
                                    onChange={(e) => setCustomFrom(e.target.value)}
                                    className="bg-transparent border-none text-xs font-medium focus:ring-0 text-slate-700 outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">To</span>
                                <input
                                    type="datetime-local"
                                    value={customTo}
                                    onChange={(e) => setCustomTo(e.target.value)}
                                    className="bg-transparent border-none text-xs font-medium focus:ring-0 text-slate-700 outline-none"
                                />
                            </div>
                            {(customFrom || customTo) && (
                                <button
                                    onClick={() => { setCustomFrom(''); setCustomTo(''); setIsCustom(false); setSelectedRange('24h'); }}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                    title="Reset filters"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {selectedWorkerId && (
                    <div className="ml-auto flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-medium text-indigo-700">
                            Tracking: <span className="font-bold">{selectedWorker?.name}</span>
                        </span>
                    </div>
                )}
            </div>

            <div className="flex-1 flex gap-6 min-h-0">
                {/* Left Panel */}
                <div className="w-80 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200">
                        <button
                            onClick={() => setActiveTab('workers')}
                            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'workers'
                                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-1.5">
                                <Users className="w-4 h-4" />
                                Workers
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('stops')}
                            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'stops'
                                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                Stops ({stops.length})
                            </div>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {/* Workers Tab */}
                        {activeTab === 'workers' && (
                            <div className="p-2 space-y-1">
                                <div className="flex items-center justify-between px-2 py-2">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Worker</span>
                                    <button onClick={fetchWorkers} className="text-slate-400 hover:text-indigo-600 transition-colors">
                                        <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                {loading ? (
                                    <div className="p-4 text-center text-slate-400">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                    </div>
                                ) : workers.map(w => (
                                    <button
                                        key={w.id}
                                        onClick={() => selectWorker(w.id)}
                                        className={`w-full text-left p-3 rounded-xl transition-all ${selectedWorkerId === w.id
                                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                                            }`}
                                    >
                                        <p className="font-semibold text-sm">{w.name}</p>
                                        <p className={`text-[10px] ${selectedWorkerId === w.id ? 'text-indigo-400' : 'text-slate-400'}`}>
                                            {w.last_seen ? `Seen: ${new Date(w.last_seen).toLocaleTimeString()}` : 'Never seen'}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Stops Timeline Tab */}
                        {activeTab === 'stops' && (
                            <div className="p-3">
                                {!selectedWorkerId ? (
                                    <div className="text-center py-10 text-slate-400 text-sm">
                                        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                        Select a worker first
                                    </div>
                                ) : trailLoading ? (
                                    <div className="text-center py-10 text-slate-400">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        <p className="text-xs">Loading stops...</p>
                                    </div>
                                ) : stops.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400 text-sm">
                                        No stops in the selected range
                                    </div>
                                ) : (
                                    <div className="space-y-0">
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
                                            {isCustom ? 'Custom Range' : `Last ${selectedRange}`} · {stops.length} stop{stops.length > 1 ? 's' : ''}
                                        </p>
                                        {stops.map((stop, i) => (
                                            <div key={stop.id} className="relative flex gap-3">
                                                {/* Timeline dot & line */}
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-3 h-3 rounded-full border-2 ${stop.duration_minutes >= 30
                                                        ? 'bg-red-700 border-red-400'
                                                        : stop.duration_minutes >= 10
                                                            ? 'bg-amber-500 border-amber-300'
                                                            : 'bg-emerald-500 border-emerald-300'
                                                        }`} />
                                                    {i < stops.length - 1 && (
                                                        <div className="w-0.5 flex-1 bg-slate-200 my-1" />
                                                    )}
                                                </div>
                                                {/* Stop Details with place name */}
                                                <StopTimelineItem stop={stop} onLocate={handleLocateStop} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Map Area */}
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden relative shadow-sm">
                    <MapContainer
                        center={[20.5937, 78.9629]}
                        zoom={5}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <LayersControl position="topright">
                            <LayersControl.BaseLayer checked name="Street View">
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                />
                            </LayersControl.BaseLayer>
                            <LayersControl.BaseLayer name="Satellite">
                                <TileLayer
                                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                    attribution='&copy; Esri, Maxar, Earthstar'
                                />
                            </LayersControl.BaseLayer>
                            <LayersControl.BaseLayer name="Terrain">
                                <TileLayer
                                    url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
                                />
                            </LayersControl.BaseLayer>
                        </LayersControl>

                        {/* Only show the selected worker's marker */}
                        {selectedWorker?.last_lat && selectedWorker?.last_lng && (
                            <Marker position={[selectedWorker.last_lat, selectedWorker.last_lng]}>
                                <Popup>
                                    <div className="p-1">
                                        <p className="font-bold text-slate-900">{selectedWorker.name}</p>
                                        <p className="text-xs text-slate-600">{selectedWorker.phone}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            Last seen: {selectedWorker.last_seen ? new Date(selectedWorker.last_seen).toLocaleString() : 'N/A'}
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        )}

                        {/* Trail polyline */}
                        {trail.length > 0 && (
                            <Polyline positions={trail} color="#4f46e5" weight={3} opacity={0.7} />
                        )}

                        {/* Stop markers on map with reverse-geocoded popups */}
                        {stops.map((stop) => (
                            <CircleMarker
                                key={stop.id}
                                center={[stop.latitude, stop.longitude]}
                                radius={stop.duration_minutes >= 30 ? 10 : stop.duration_minutes >= 10 ? 7 : 5}
                                fillColor={
                                    stop.duration_minutes >= 30 ? '#991b1b'
                                        : stop.duration_minutes >= 10 ? '#b91c1c'
                                            : '#dc2626'
                                }
                                fillOpacity={0.9}
                                color="#7f1d1d"
                                weight={2}
                            >
                                <Popup>
                                    <StopPopupContent stop={stop} />
                                </Popup>
                            </CircleMarker>
                        ))}

                        {/* Recenter to selected worker */}
                        {selectedWorker?.last_lat && selectedWorker?.last_lng && !flyTarget && (
                            <RecenterMap lat={selectedWorker.last_lat} lng={selectedWorker.last_lng} />
                        )}

                        {/* Fly to a specific stop when clicked in sidebar */}
                        {flyTarget && (
                            <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} />
                        )}
                    </MapContainer>

                    {!selectedWorkerId && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-[1000] flex flex-col items-center justify-center text-slate-600 p-6 text-center">
                            <MapIcon className="w-12 h-12 mb-4 text-slate-300" />
                            <h3 className="text-xl font-bold text-slate-700">Select a worker to track</h3>
                            <p className="text-slate-400 text-sm mt-2">Pick someone from the list to see their live location, trail, and stops.</p>
                        </div>
                    )}

                    {trailLoading && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full z-[1000] flex items-center gap-2 text-xs text-indigo-600 border border-indigo-100 shadow-sm">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Loading trail & stops...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
