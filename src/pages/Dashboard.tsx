import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import tamulpurGeoJsonUrl from '../assets/export.geojson';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartTooltip,
    Legend
} from 'recharts';
import {
    Users,
    MapPin,
    Calendar,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    LayoutDashboard,
    ArrowUpRight,
    Map
} from 'lucide-react';
import api from '../lib/api';
import { Loader2 } from 'lucide-react';

const COLORS = ['#6366f1', '#e2e8f0']; // indigo-500, slate-200
const BAR_COLORS = ['#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3'];

const FitBounds = ({ geoJsonData }: { geoJsonData: any }) => {
    const map = useMap();
    useEffect(() => {
        if (geoJsonData) {
            const geoJsonLayer = L.geoJSON(geoJsonData);
            const bounds = geoJsonLayer.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [30, 30] });
            }
        }
    }, [geoJsonData, map]);
    return null;
};

const ConstituencyMapInner = ({ geoJsonData }: { geoJsonData: any }) => {
    const geoJsonStyle = {
        color: '#4f46e5',
        weight: 3,
        opacity: 0.8,
        fillColor: '#6366f1',
        fillOpacity: 0.15,
        dashArray: ''
    };

    const onEachFeature = (feature: any, layer: any) => {
        if (feature.properties && feature.properties.name) {
            layer.bindPopup(
                `<div style="padding:4px 8px;">
                    <h4 style="margin:0;font-weight:700;font-size:14px;color:#1e293b;">${feature.properties.name}</h4>
                    <p style="margin:4px 0 0;font-size:11px;color:#64748b;">Administrative Boundary</p>
                </div>`
            );
        }
    };

    return (
        <MapContainer
            center={[26.65, 91.65]}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <GeoJSON
                data={geoJsonData}
                style={geoJsonStyle}
                onEachFeature={onEachFeature}
            />
            <FitBounds geoJsonData={geoJsonData} />
        </MapContainer>
    );
};

const ConstituencyMap = () => {
    const [geoData, setGeoData] = useState<any>(null);
    const [mapLoading, setMapLoading] = useState(true);

    useEffect(() => {
        fetch(tamulpurGeoJsonUrl)
            .then(res => res.json())
            .then(data => {
                setGeoData(data);
                setMapLoading(false);
            })
            .catch(err => {
                console.error('Failed to load GeoJSON:', err);
                setMapLoading(false);
            });
    }, []);

    if (mapLoading || !geoData) {
        return (
            <div className="h-full flex items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return <ConstituencyMapInner geoJsonData={geoData} />;
};

interface DashboardStats {
    counts: {
        total_zones: string;
        total_mandals: string;
        total_booths: string;
        total_workers: string;
        total_events: string;
    };
    coverage: Array<{ status: string; count: string }>;
    workerStats: Array<{ name: string; event_count: string }>;
    recentEvents: Array<{
        id: string;
        event_name: string;
        people_count: number;
        address: string;
        created_at: string;
        thumbnail: string;
        worker_name: string;
    }>;
}

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 ${color}`}>
            <Icon className="w-full h-full" />
        </div>
        <div className="flex items-center justify-between mb-4">
            <div className={`p-2.5 rounded-xl ${color} bg-opacity-10 transition-colors`}>
                <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
            </div>
            {trend && (
                <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    {trend}
                </div>
            )}
        </div>
        <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        </div>
    </div>
);


export const DashboardPage = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/admin/dashboard-stats');
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading || !stats) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-600" />
                <p className="font-medium">Loading campaign metrics...</p>
            </div>
        );
    }

    const coverageData = stats.coverage.map(c => ({
        name: c.status,
        value: parseInt(c.count)
    }));

    const workerChartData = stats.workerStats.map(w => ({
        name: w.name,
        events: parseInt(w.event_count)
    }));

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900">Campaign Overview</h1>
                <p className="text-slate-500 mt-1">Real-time statistics across all management modules</p>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard
                    title="Total Zones"
                    value={stats.counts.total_zones}
                    icon={Map}
                    color="bg-blue-600"
                />
                <StatCard
                    title="Mandals"
                    value={stats.counts.total_mandals}
                    icon={LayoutDashboard}
                    color="bg-purple-600"
                />
                <StatCard
                    title="Total Booths"
                    value={stats.counts.total_booths}
                    icon={MapPin}
                    color="bg-indigo-600"
                />
                <StatCard
                    title="Active Workers"
                    value={stats.counts.total_workers}
                    icon={Users}
                    color="bg-emerald-600"
                />
                <StatCard
                    title="Total Events"
                    value={stats.counts.total_events}
                    icon={Calendar}
                    color="bg-orange-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Booth Coverage Chart */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Booth Coverage</h3>
                            <p className="text-sm text-slate-500">Assignment status of booth presidents</p>
                        </div>
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        </div>
                    </div>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={coverageData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {coverageData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartTooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-6 flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-semibold text-slate-600">Action Required</span>
                        </div>
                        <span className="text-xs font-bold text-amber-600 underline cursor-pointer">View unassigned booths</span>
                    </div>
                </div>

                {/* Worker Activity Bar Chart */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Top Workers Activity</h3>
                            <p className="text-sm text-slate-500">Event contribution by field workers</p>
                        </div>
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={workerChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                />
                                <RechartTooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar
                                    dataKey="events"
                                    fill="#6366f1"
                                    radius={[6, 6, 0, 0]}
                                    barSize={32}
                                >
                                    {workerChartData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Constituency Map */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Constituency Map</h3>
                        <p className="text-sm text-slate-500">Tamulpur constituency boundary</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Map className="w-5 h-5 text-blue-600" />
                    </div>
                </div>
                <div className="h-[450px] relative">
                    <ConstituencyMap />
                </div>
            </div>

            {/* Recent Activity List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Recent Field Activities</h3>
                        <p className="text-sm text-slate-500">Live feed from campaign workers</p>
                    </div>
                    <button className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                        View all <ArrowUpRight className="w-4 h-4" />
                    </button>
                </div>
                <div className="divide-y divide-slate-50">
                    {stats.recentEvents.map((event) => (
                        <div key={event.id} className="p-6 hover:bg-slate-50/50 transition-colors group flex items-start gap-5">
                            <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 shadow-inner">
                                {event.thumbnail ? (
                                    <img src={event.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-bold text-slate-900 truncate pr-4">{event.event_name}</h4>
                                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap bg-white px-2 py-1 rounded-lg border border-slate-100">
                                        {new Date(event.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-4 h-4 bg-indigo-50 rounded-full flex items-center justify-center">
                                            <Users className="w-2.5 h-2.5 text-indigo-600" />
                                        </div>
                                        <span className="font-medium text-slate-700">{event.worker_name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="truncate max-w-[300px]">{event.address}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 rounded text-emerald-600 font-bold text-[10px]">
                                        {event.people_count} People
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
