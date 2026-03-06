import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, Circle, InfoWindow } from '@react-google-maps/api';
import api from '../lib/api';
import { Users, Loader2, Map as MapIcon, RotateCcw, Clock, MapPin, Navigation, Calendar, Filter, ChevronDown, ChevronUp, X } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = "AIzaSyCSFX5Min2gS2bbqQjSeGWFqE97btxKERg";

const containerStyle = {
    width: '100%',
    height: '100%'
};

const defaultCenter = {
    lat: 20.5937,
    lng: 78.9629
};

const getCarSvg = (rotation: number) => {
    const svg = `
<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <g transform="rotate(${rotation} 40 40)">
        {/* Shadow */}
        <rect x="22" y="11" width="36" height="58" rx="4" fill="gray" fill-opacity="0.2" />
        
        {/* Main Body - Scorpio is boxy */}
        <rect x="24" y="10" width="32" height="60" rx="3" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5"/>
        
        {/* Bonnet/Hood Lines */}
        <path d="M28 25 L52 25" fill="none" stroke="#cbd5e1" stroke-width="1" />
        <path d="M30 15 L50 15" fill="none" stroke="#cbd5e1" stroke-width="0.5" />
        
        {/* Windshield (Black/Dark Slate for contrast) */}
        <path d="M27 28 L53 28 L50 42 L30 42 Z" fill="#1e293b" fill-opacity="0.9" />
        
        {/* Roof Rails (Typical of Scorpio) */}
        <rect x="23" y="30" width="2" height="30" rx="1" fill="#475569" />
        <rect x="55" y="30" width="2" height="30" rx="1" fill="#475569" />
        
        {/* Rear Window */}
        <path d="M28 58 L52 58 L51 66 L29 66 Z" fill="#1e293b" fill-opacity="0.9" />
        
        {/* Front Headlights (Bright Yellow) */}
        <rect x="25" y="10" width="8" height="3" rx="1" fill="#fef08a" />
        <rect x="47" y="10" width="8" height="3" rx="1" fill="#fef08a" />
        
        {/* Tail lights (Bright Red) */}
        <rect x="25" y="68" width="8" height="2" rx="0.5" fill="#ef4444" />
        <rect x="47" y="68" width="8" height="2" rx="0.5" fill="#ef4444" />
        
        {/* Footsteps/Side cladding details */}
        <rect x="23" y="35" width="1" height="20" fill="#cbd5e1" />
        <rect x="56" y="35" width="1" height="20" fill="#cbd5e1" />
    </g>
</svg>`;
    return `data:image/svg+xml;base64,${window.btoa(svg)}`;
};

const getBearing = (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
    const startLat = (start.lat * Math.PI) / 180;
    const startLng = (start.lng * Math.PI) / 180;
    const endLat = (end.lat * Math.PI) / 180;
    const endLng = (end.lng * Math.PI) / 180;

    const y = Math.sin(endLng - startLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) -
        Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
};

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

// No longer need RecenterMap as a component, we'll use map.panTo

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

// ---- StopPopup: geocodes when the popup opens ----
const StopPopupContent = ({ stop }: { stop: Stop }) => {
    const [placeName, setPlaceName] = useState<string>('Loading location...');

    useEffect(() => {
        reverseGeocode(stop.latitude, stop.longitude).then(setPlaceName);
    }, [stop.latitude, stop.longitude]);

    return (
        <div className="p-1 text-xs">
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
    const [loadingName, setLoadingName] = useState(true);
    const hasLoaded = useRef(false);

    useEffect(() => {
        // Auto-load the first few, then lazy-load on scroll/visibility
        if (!hasLoaded.current) {
            hasLoaded.current = true;
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
// No longer need FlyTo as a component

export const TrackingPage = () => {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
    const [trail, setTrail] = useState<{ lat: number, lng: number }[]>([]);
    const [stops, setStops] = useState<Stop[]>([]);
    const [loading, setLoading] = useState(true);
    const [trailLoading, setTrailLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'workers' | 'stops'>('workers');
    const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY
    });

    const [selectedRange, setSelectedRange] = useState<string>('24h');
    const [customFrom, setCustomFrom] = useState<string>('');
    const [customTo, setCustomTo] = useState<string>('');
    const [isCustom, setIsCustom] = useState(false);

    const carIconUrl = useMemo(() => {
        if (trail.length < 2) return getCarSvg(0);
        const secondLast = trail[trail.length - 2];
        const last = trail[trail.length - 1];
        const rotation = getBearing(secondLast, last);
        return getCarSvg(rotation);
    }, [trail]);

    const fetchWorkers = useCallback(async () => {
        try {
            const response = await api.get('/admin/workers');
            setWorkers(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTrailAndStops = useCallback(async (workerId: string) => {
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

            const points = trailRes.data.trail.map((p: TrailPoint) => ({ lat: p.latitude, lng: p.longitude }));
            setTrail(points);
            setStops(stopsRes.data.stops || []);
        } catch (error) {
            console.error(error);
        } finally {
            setTrailLoading(false);
        }
    }, [selectedRange, isCustom, customFrom, customTo]);

    useEffect(() => {
        fetchWorkers();
        const interval = setInterval(fetchWorkers, 30000);
        return () => clearInterval(interval);
    }, [fetchWorkers]);

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
    }, [selectedRange, isCustom, customFrom, customTo, selectedWorkerId, fetchTrailAndStops]);

    const handleLocateStop = (lat: number, lng: number) => {
        setFlyTarget({ lat, lng });
        if (map) {
            map.panTo({ lat, lng });
            map.setZoom(17);
        }
    };

    const onLoad = (map: google.maps.Map) => {
        setMap(map);
    };

    const onUnmount = () => {
        setMap(null);
    };

    useEffect(() => {
        if (selectedWorker?.last_lat && selectedWorker?.last_lng && map && !flyTarget) {
            map.panTo({ lat: selectedWorker.last_lat, lng: selectedWorker.last_lng });
            map.setZoom(15);
        }
    }, [selectedWorker, map, flyTarget]);

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
                    {isLoaded ? (
                        <GoogleMap
                            mapContainerStyle={containerStyle}
                            center={defaultCenter}
                            zoom={5}
                            onLoad={onLoad}
                            onUnmount={onUnmount}
                            options={{
                                mapTypeControl: true,
                                streetViewControl: true,
                                fullscreenControl: true,
                            }}
                        >
                            {/* Only show the selected worker's marker */}
                            {selectedWorker?.last_lat && selectedWorker?.last_lng && (
                                <Marker
                                    position={{ lat: selectedWorker.last_lat, lng: selectedWorker.last_lng }}
                                    title={selectedWorker.name}
                                    icon={{
                                        url: carIconUrl,
                                        anchor: isLoaded ? new google.maps.Point(40, 40) : undefined,
                                    }}
                                />
                            )}

                            {/* Trail polyline */}
                            {trail.length > 0 && (
                                <Polyline
                                    path={trail}
                                    options={{
                                        strokeColor: "#4f46e5",
                                        strokeOpacity: 0.7,
                                        strokeWeight: 4,
                                    }}
                                />
                            )}

                            {/* Stop markers on map */}
                            {stops.map((stop) => (
                                <Circle
                                    key={stop.id}
                                    center={{ lat: stop.latitude, lng: stop.longitude }}
                                    radius={stop.duration_minutes >= 30 ? 60 : stop.duration_minutes >= 10 ? 40 : 25}
                                    onClick={() => setSelectedStop(stop)}
                                    options={{
                                        fillColor: stop.duration_minutes >= 30 ? '#991b1b' : stop.duration_minutes >= 10 ? '#b91c1c' : '#dc2626',
                                        fillOpacity: 0.9,
                                        strokeColor: "#7f1d1d",
                                        strokeWeight: 2,
                                    }}
                                />
                            ))}

                            {selectedStop && (
                                <InfoWindow
                                    position={{ lat: selectedStop.latitude, lng: selectedStop.longitude }}
                                    onCloseClick={() => setSelectedStop(null)}
                                >
                                    <StopPopupContent stop={selectedStop} />
                                </InfoWindow>
                            )}
                        </GoogleMap>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin mr-2" />
                            Loading Map...
                        </div>
                    )}

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
