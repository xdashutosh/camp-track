import { useState, useEffect } from 'react';
import api from '../lib/api';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Loader2,
    MapPin,
    User,
    Map as MapIcon,
    Eye,
    Filter
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Pagination } from '../components/Pagination';

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

interface Mandal {
    id: string;
    mandal_name: string;
    zone_name: string;
}

interface Worker {
    id: string;
    name: string;
    is_assigned: boolean;
}

interface Booth {
    id: string;
    mandal_id: string;
    booth_name: string;
    latitude: number | null;
    longitude: number | null;
    president_id: string | null;
    mandal_name: string;
    mandal_president_name: string | null;
    zone_name: string;
    constituency_name: string;
    zone_color: string;
    zone_president_name: string | null;
    booth_president_name: string | null;
    booth_president_phone: string | null;
    created_at: string;
}

// Map Click Handler Component
const MapClickHandler = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

// Map Refresher to fix visibility in modals
const MapRefresher = () => {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 300);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
};

export const BoothsPage = () => {
    const [booths, setBooths] = useState<Booth[]>([]);
    const [mandals, setMandals] = useState<Mandal[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingBooth, setViewingBooth] = useState<Booth | null>(null);
    const [editingBooth, setEditingBooth] = useState<Booth | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [constituencyFilter, setConstituencyFilter] = useState('all');
    const [zoneFilter, setZoneFilter] = useState('all');
    const [mandalFilter, setMandalFilter] = useState('all');

    const [selectedMandal, setSelectedMandal] = useState('');
    const [boothName, setBoothName] = useState('');
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [selectedPresident, setSelectedPresident] = useState('');

    const fetchData = async () => {
        try {
            const [boothsRes, mandalsRes, workersRes] = await Promise.all([
                api.get('/admin/booths'),
                api.get('/admin/zone-mandals'),
                api.get('/admin/workers')
            ]);
            setBooths(boothsRes.data);
            setMandals(mandalsRes.data);
            setWorkers(workersRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                mandal_id: selectedMandal,
                booth_name: boothName,
                latitude: lat,
                longitude: lng,
                president_id: selectedPresident || null
            };

            if (editingBooth) {
                await api.put(`/admin/booths/${editingBooth.id}`, payload);
            } else {
                await api.post('/admin/booths', payload);
            }

            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to save booth');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this booth?')) return;
        try {
            await api.delete(`/admin/booths/${id}`);
            fetchData();
        } catch {
            alert('Failed to delete booth');
        }
    };

    const openModal = (booth?: Booth) => {
        if (booth) {
            setEditingBooth(booth);
            setSelectedMandal(booth.mandal_id);
            setBoothName(booth.booth_name);
            setLat(booth.latitude);
            setLng(booth.longitude);
            setSelectedPresident(booth.president_id || '');
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const openViewModal = (booth: Booth) => {
        setViewingBooth(booth);
        setIsViewModalOpen(true);
    };

    const resetForm = () => {
        setEditingBooth(null);
        setSelectedMandal('');
        setBoothName('');
        setLat(null);
        setLng(null);
        setSelectedPresident('');
    };

    const handleMapSelect = (newLat: number, newLng: number) => {
        setLat(newLat);
        setLng(newLng);
    };

    const filteredBooths = booths.filter(b => {
        const matchesSearch = b.booth_name.toLowerCase().includes(search.toLowerCase()) ||
            b.mandal_name.toLowerCase().includes(search.toLowerCase()) ||
            b.zone_name.toLowerCase().includes(search.toLowerCase()) ||
            b.constituency_name.toLowerCase().includes(search.toLowerCase());
        const matchesConstituency = constituencyFilter === 'all' || b.constituency_name === constituencyFilter;
        const matchesZone = zoneFilter === 'all' || b.zone_name === zoneFilter;
        const matchesMandal = mandalFilter === 'all' || b.mandal_id === mandalFilter;
        return matchesSearch && matchesConstituency && matchesZone && matchesMandal;
    });

    const totalItems = filteredBooths.length;
    const paginatedBooths = filteredBooths.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, constituencyFilter, zoneFilter, mandalFilter]);

    const uniqueConstituencies = Array.from(new Set(booths.map(b => b.constituency_name))).sort();
    const uniqueZones = Array.from(new Set(booths
        .filter(b => constituencyFilter === 'all' || b.constituency_name === constituencyFilter)
        .map(b => b.zone_name))).sort();
    const uniqueMandals = Array.from(new Set(booths
        .filter(b => (constituencyFilter === 'all' || b.constituency_name === constituencyFilter) &&
            (zoneFilter === 'all' || b.zone_name === zoneFilter))
        .map(b => ({ id: b.mandal_id, name: b.mandal_name }))))
        .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Booths Management</h1>
                        <p className="text-slate-500 text-sm">Manage booths, their coordinates and presidents</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
                    >
                        <Plus className="w-5 h-5" />
                        Add Booth
                    </button>
                </div>

                <div className="flex flex-col xl:flex-row gap-4 mt-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by booth, mandal, zone or constituency..."
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-slate-400" />
                            <select
                                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                value={constituencyFilter}
                                onChange={(e) => {
                                    setConstituencyFilter(e.target.value);
                                    setZoneFilter('all');
                                    setMandalFilter('all');
                                }}
                            >
                                <option value="all">All Constituencies</option>
                                {uniqueConstituencies.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-w-[150px]"
                                value={zoneFilter}
                                onChange={(e) => {
                                    setZoneFilter(e.target.value);
                                    setMandalFilter('all');
                                }}
                            >
                                <option value="all">All Zones</option>
                                {uniqueZones.map(z => (
                                    <option key={z} value={z}>{z}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-w-[150px]"
                                value={mandalFilter}
                                onChange={(e) => setMandalFilter(e.target.value)}
                            >
                                <option value="all">All Mandals</option>
                                {uniqueMandals.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-shrink bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <div className="overflow-x-auto overflow-y-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Booth Name</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Booth President</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Booth Coordinates</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Mandal (Zone)</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Mandal President</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Zone</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Constituency</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right bg-slate-50">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                        Loading...
                                    </td>
                                </tr>
                            ) : paginatedBooths.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                                        No booths found matching your filters.
                                    </td>
                                </tr>
                            ) : paginatedBooths.map((booth) => (
                                <tr key={booth.id} className="hover:bg-slate-50 transition-colors group text-xs">
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-indigo-700 text-sm">{booth.booth_name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 shadow-sm"><User className="w-3 h-3" /></div>
                                            <span className={booth.booth_president_name ? "font-medium" : "text-slate-300 italic"}>
                                                {booth.booth_president_name || 'Not Assigned'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {booth.latitude && booth.longitude ? (
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-slate-100 rounded-md text-slate-500"><MapPin className="w-3.5 h-3.5" /></div>
                                                <span className="font-mono text-slate-600">{booth.latitude.toFixed(5)}, {booth.longitude.toFixed(5)}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-300 italic">No Coordinates</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-slate-900">
                                        {booth.mandal_name} <span className="text-slate-400 text-[10px]">({booth.zone_name})</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><User className="w-3 h-3" /></div>
                                            <span className={booth.mandal_president_name ? "" : "text-slate-300 italic"}>
                                                {booth.mandal_president_name || 'Not Assigned'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: booth.zone_color }}></div>
                                            <span className="font-medium text-slate-700">{booth.zone_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-semibold text-[10px]">{booth.constituency_name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {booth.latitude && booth.longitude && (
                                                <button onClick={() => openViewModal(booth)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100 shadow-sm" title="View on Map"><Eye className="w-4 h-4" /></button>
                                            )}
                                            <button onClick={() => openModal(booth)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100 shadow-sm" title="Edit Booth"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(booth.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 shadow-sm" title="Delete Booth"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                />
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]">
                        <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><X /></button>
                        <h2 className="text-xl font-bold text-slate-900 mb-6">{editingBooth ? 'Edit Booth' : 'Add Booth'}</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Select Zone Mandal</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                    value={selectedMandal}
                                    onChange={e => setSelectedMandal(e.target.value)}
                                    required
                                >
                                    <option value="">Choose a mandal...</option>
                                    {mandals.map(m => (
                                        <option key={m.id} value={m.id}>{m.mandal_name} ({m.zone_name})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Booth Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                    value={boothName}
                                    onChange={e => setBoothName(e.target.value)}
                                    placeholder="Enter booth name"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Booth Coordinates</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 space-y-1">
                                        <input
                                            type="number"
                                            step="any"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                            value={lat || ''}
                                            onChange={e => setLat(parseFloat(e.target.value))}
                                            placeholder="Latitude"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <input
                                            type="number"
                                            step="any"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                            value={lng || ''}
                                            onChange={e => setLng(parseFloat(e.target.value))}
                                            placeholder="Longitude"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsMapModalOpen(true)}
                                    className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-indigo-100 bg-indigo-50 rounded-xl text-indigo-600 font-semibold text-sm hover:bg-indigo-100 transition-colors"
                                >
                                    <MapIcon className="w-4 h-4" />
                                    Choose on Map
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Booth President</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                    value={selectedPresident}
                                    onChange={e => setSelectedPresident(e.target.value)}
                                >
                                    <option value="">Assign a president (Optional)</option>
                                    {workers
                                        .filter(w => !w.is_assigned || w.id === selectedPresident)
                                        .map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))
                                    }
                                </select>
                            </div>

                            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25">
                                {editingBooth ? 'Update Booth' : 'Create Booth'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Map Picker Modal */}
            {isMapModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col h-[80vh]">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900">Choose Coordinates</h3>
                                <p className="text-xs text-slate-500">Click anywhere on the map of Assam to select booth location</p>
                            </div>
                            <button onClick={() => setIsMapModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>

                        <div className="flex-1 relative bg-slate-100 min-h-[450px]">
                            <MapContainer
                                center={[26.1158, 91.7086]}
                                zoom={12}
                                style={{ height: '450px', width: '100%' }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                <MapRefresher />
                                <MapClickHandler onLocationSelect={handleMapSelect} />
                                {(lat || 26.1158) && (lng || 91.7086) && (
                                    <Marker position={[lat || 26.1158, lng || 91.7086]} icon={DefaultIcon} />
                                )}
                            </MapContainer>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <div className="text-sm font-mono text-slate-600">
                                {lat ? `${lat.toFixed(6)}, ${lng?.toFixed(6)}` : 'Guwahati (Default): 26.1158, 91.7086'}
                            </div>
                            <button
                                onClick={() => {
                                    if (!lat) { setLat(26.1158); setLng(91.7086); }
                                    setIsMapModalOpen(false);
                                }}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                            >
                                Confirm Location
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Booth Modal */}
            {isViewModalOpen && viewingBooth && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col h-[80vh]">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900 text-indigo-700">Booth: {viewingBooth.booth_name}</h3>
                                <p className="text-xs text-slate-500">{viewingBooth.constituency_name} · {viewingBooth.zone_name} · {viewingBooth.mandal_name}</p>
                            </div>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>

                        <div className="flex-1 relative bg-slate-100 min-h-[500px]">
                            <MapContainer
                                center={[viewingBooth.latitude!, viewingBooth.longitude!]}
                                zoom={15}
                                style={{ height: '500px', width: '100%' }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                <MapRefresher />
                                <Marker position={[viewingBooth.latitude!, viewingBooth.longitude!]} icon={DefaultIcon}>
                                    <Popup>
                                        <div className="p-2 min-w-[200px]">
                                            <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: viewingBooth.zone_color }}></div>
                                                <span className="font-bold text-slate-900 text-sm">{viewingBooth.booth_name}</span>
                                            </div>
                                            <div className="space-y-2 mt-2">
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] uppercase font-bold text-slate-400">Hierarchy</p>
                                                    <p className="text-[11px] text-slate-600 font-medium">{viewingBooth.constituency_name} &gt; {viewingBooth.zone_name} &gt; {viewingBooth.mandal_name}</p>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <p className="text-[10px] uppercase font-bold text-slate-400">Presidents</p>
                                                    <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
                                                        <User className="w-3 h-3 text-slate-400" /> <span className="text-slate-400">Mand:</span> {viewingBooth.mandal_president_name || 'N/A'}
                                                    </p>
                                                    <p className="text-[11px] text-indigo-700 font-bold flex items-center gap-1.5 bg-indigo-50 p-1 rounded">
                                                        <User className="w-3 h-3 text-indigo-400" /> <span className="text-indigo-400">Booth:</span> {viewingBooth.booth_president_name || 'N/A'}
                                                    </p>
                                                </div>

                                                <p className="text-[9px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-100 italic">
                                                    {viewingBooth.latitude?.toFixed(6)}, {viewingBooth.longitude?.toFixed(6)}
                                                </p>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
