import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../lib/api';
import { Loader2, MapPin, Users, Globe, Info } from 'lucide-react';

// Fix Leaflet marker icons
import iconImg from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: iconImg,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface BoothMapData {
    id: string;
    booth_name: string;
    latitude: number;
    longitude: number;
    mandal_name: string;
    zone_name: string;
    constituency_name: string;
    president_name: string | null;
    all_workers: string[];
}

const RecenterMap = ({ points }: { points: BoothMapData[] }) => {
    const map = useMap();
    useEffect(() => {
        if (points.length > 0) {
            const bounds = L.latLngBounds(points.map(p => [p.latitude, p.longitude]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [points, map]);
    return null;
};

export const HeatMapPage = () => {
    const [booths, setBooths] = useState<BoothMapData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBooths = async () => {
            try {
                const response = await api.get('/admin/booths-map');
                setBooths(response.data);
            } catch (error) {
                console.error('Failed to fetch booths map:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBooths();
    }, []);

    return (
        <div className="h-full flex flex-col space-y-2">
            <div className="flex-shrink-0">
                <p className="text-slate-500 text-sm">Geographical distribution of all campaign booths</p>
            </div>

            <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden relative shadow-sm">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 z-[1001] bg-white/80 backdrop-blur-sm">
                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-600" />
                        <p className="font-medium">Loading map data...</p>
                    </div>
                ) : (
                    <MapContainer
                        center={[26.1158, 91.7086]} // Guwahati center as fallback
                        zoom={12}
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
                        </LayersControl>

                        {booths.map((booth) => (
                            <Marker key={booth.id} position={[booth.latitude, booth.longitude]}>
                                <Popup maxWidth={300}>
                                    <div className="p-1 space-y-3">
                                        <div className="border-b border-slate-100 pb-2">
                                            <h3 className="font-bold text-slate-900 text-base">{booth.booth_name}</h3>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <MapPin className="w-3 h-3 text-indigo-500" />
                                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight">Booth Details</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Hierarchy</p>
                                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium">{booth.constituency_name}</span>
                                                    <span className="text-slate-300">›</span>
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium">{booth.zone_name}</span>
                                                    <span className="text-slate-300">›</span>
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium">{booth.mandal_name}</span>
                                                </div>
                                            </div>

                                            {booth.president_name && (
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">President</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                                                            {booth.president_name[0]}
                                                        </div>
                                                        <span className="text-sm font-semibold text-slate-700">{booth.president_name}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {booth.all_workers && booth.all_workers.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Associated Workers</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {booth.all_workers.map((worker, i) => (
                                                            <span key={i} className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-medium">
                                                                {worker}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                                            <span>{booth.latitude.toFixed(5)}, {booth.longitude.toFixed(5)}</span>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        <RecenterMap points={booths} />
                    </MapContainer>
                )}

                {/* Floating Info */}
                <div className="absolute bottom-6 right-6 z-[1000] bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                        <Globe className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-900">{booths.length} Booths Tracked</p>
                        <p className="text-[10px] text-slate-500 font-medium tracking-wide">Across all constituencies</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
