import { useState, useEffect } from 'react';
import api from '../lib/api';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Loader2,
    MapPinned,
    Palette
} from 'lucide-react';
import { ASSAM_CONSTITUENCIES } from '../lib/constants';
import { Pagination } from '../components/Pagination';

interface Worker {
    id: string;
    name: string;
    phone: string;
    is_assigned?: boolean;
}

interface Zone {
    id: string;
    constituency_name: string;
    zone_name: string;
    zone_color: string;
    president_id?: string;
    president_name?: string;
    president_phone?: string;
    created_at: string;
}

export const ZonesPage = () => {
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingZone, setEditingZone] = useState<Zone | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const [selectedConstituency, setSelectedConstituency] = useState('');
    const [zoneName, setZoneName] = useState('');
    const [selectedColor, setSelectedColor] = useState('#6366f1'); // Default indigo
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [selectedPresidentId, setSelectedPresidentId] = useState('');
    const [presidentSearch, setPresidentSearch] = useState('');
    const [showPresidentDropdown, setShowPresidentDropdown] = useState(false);

    const fetchData = async () => {
        try {
            const [zonesRes, workersRes] = await Promise.all([
                api.get('/admin/zones'),
                api.get('/admin/workers')
            ]);
            setZones(zonesRes.data);
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

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = () => setShowDropdown(false);
        if (showDropdown) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => window.removeEventListener('click', handleClickOutside);
    }, [showDropdown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                constituency_name: selectedConstituency,
                zone_name: zoneName,
                zone_color: selectedColor,
                president_id: selectedPresidentId || null
            };

            if (editingZone) {
                await api.put(`/admin/zones/${editingZone.id}`, payload);
            } else {
                await api.post('/admin/zones', payload);
            }
            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to save zone');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this zone?')) return;
        try {
            await api.delete(`/admin/zones/${id}`);
            fetchData();
        } catch {
            alert('Failed to delete zone');
        }
    };

    const openModal = (zone?: Zone) => {
        if (zone) {
            setEditingZone(zone);
            setSelectedConstituency(zone.constituency_name);
            setZoneName(zone.zone_name);
            setSelectedColor(zone.zone_color);
            setSelectedPresidentId(zone.president_id || '');
            setPresidentSearch(zone.president_name || '');
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingZone(null);
        setSelectedConstituency('');
        setZoneName('');
        setSelectedColor('#6366f1');
        setSelectedPresidentId('');
        setPresidentSearch('');
        setShowDropdown(false);
        setShowPresidentDropdown(false);
    };

    const filteredZones = zones.filter(z =>
        z.constituency_name.toLowerCase().includes(search.toLowerCase()) ||
        z.zone_name.toLowerCase().includes(search.toLowerCase())
    );

    const totalItems = filteredZones.length;
    const paginatedZones = filteredZones.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    // Constituencies can now have multiple zones
    const availableConstituencies = ASSAM_CONSTITUENCIES;

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Zones Management</h1>
                        <p className="text-slate-500 text-sm">Assign colors to constituencies for visualization</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
                    >
                        <Plus className="w-5 h-5" />
                        Add Zone
                    </button>
                </div>

                <div className="flex gap-4 mt-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search constituencies or zones..."
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-shrink bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <div className="overflow-x-auto overflow-y-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Constituency & Zone</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">President</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Zone Color</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right bg-slate-50">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                        Loading...
                                    </td>
                                </tr>
                            ) : paginatedZones.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                                        No zones found matching your search.
                                    </td>
                                </tr>
                            ) : paginatedZones.map((zone) => (
                                <tr key={zone.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                                <MapPinned className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{zone.constituency_name}</p>
                                                <p className="text-xs text-slate-500 font-medium">Zone: {zone.zone_name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {zone.president_name ? (
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{zone.president_name}</p>
                                                <p className="text-xs text-slate-500 italic">{zone.president_phone}</p>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">Not Assigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-6 h-6 rounded-full border border-slate-200"
                                                style={{ backgroundColor: zone.zone_color }}
                                            />
                                            <span className="text-sm text-slate-600 font-mono uppercase">{zone.zone_color}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openModal(zone)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(zone.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
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

            {/* Add/Edit Zone Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]">
                        <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><X /></button>
                        <h2 className="text-xl font-bold text-slate-900 mb-6">{editingZone ? 'Edit Zone' : 'Add Zone'}</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2 relative">
                                <label className="text-sm font-medium text-slate-700">Constituency</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Search constituency..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                        value={selectedConstituency}
                                        onChange={(e) => {
                                            setSelectedConstituency(e.target.value);
                                            setShowDropdown(true);
                                        }}
                                        onFocus={() => setShowDropdown(true)}
                                    />
                                    {selectedConstituency && (
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedConstituency(''); setShowDropdown(true); }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {showDropdown && (
                                    <div
                                        className="absolute z-[60] left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl divide-y divide-slate-50"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {availableConstituencies
                                            .filter(c => c.toLowerCase().includes(selectedConstituency.toLowerCase()))
                                            .length === 0 ? (
                                            <div className="px-4 py-3 text-sm text-slate-400 italic">No results found</div>
                                        ) : (
                                            availableConstituencies
                                                .filter(c => c.toLowerCase().includes(selectedConstituency.toLowerCase()))
                                                .map(c => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedConstituency(c);
                                                            if (!zoneName) setZoneName(`${c} Zone 1`);
                                                            setShowDropdown(false);
                                                        }}
                                                        className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                                                    >
                                                        {c}
                                                    </button>
                                                ))
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Zone Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                    value={zoneName}
                                    onChange={e => setZoneName(e.target.value)}
                                    placeholder="e.g. Guwahati East Zone 1"
                                    required
                                />
                            </div>

                            <div className="space-y-2 relative">
                                <label className="text-sm font-medium text-slate-700">Zone President</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Search worker..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                        value={presidentSearch}
                                        onChange={(e) => {
                                            setPresidentSearch(e.target.value);
                                            setShowPresidentDropdown(true);
                                            if (!e.target.value) setSelectedPresidentId('');
                                        }}
                                        onFocus={() => setShowPresidentDropdown(true)}
                                    />
                                    {presidentSearch && (
                                        <button
                                            type="button"
                                            onClick={() => { setPresidentSearch(''); setSelectedPresidentId(''); setShowPresidentDropdown(true); }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {showPresidentDropdown && (
                                    <div
                                        className="absolute z-[60] left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl divide-y divide-slate-50"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {workers
                                            .filter(w => {
                                                const matchesSearch = w.name.toLowerCase().includes(presidentSearch.toLowerCase()) || w.phone.includes(presidentSearch);
                                                const isUnassigned = !w.is_assigned;
                                                const isCurrentPresident = editingZone && w.id === editingZone.president_id;
                                                return matchesSearch && (isUnassigned || isCurrentPresident);
                                            })
                                            .length === 0 ? (
                                            <div className="px-4 py-3 text-sm text-slate-400 italic">No workers found</div>
                                        ) : (
                                            workers
                                                .filter(w => {
                                                    const matchesSearch = w.name.toLowerCase().includes(presidentSearch.toLowerCase()) || w.phone.includes(presidentSearch);
                                                    const isUnassigned = !w.is_assigned;
                                                    const isCurrentPresident = editingZone && w.id === editingZone.president_id;
                                                    return matchesSearch && (isUnassigned || isCurrentPresident);
                                                })
                                                .map(w => (
                                                    <button
                                                        key={w.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedPresidentId(w.id);
                                                            setPresidentSearch(w.name);
                                                            setShowPresidentDropdown(false);
                                                        }}
                                                        className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors"
                                                    >
                                                        <div className="font-bold text-slate-900">{w.name}</div>
                                                        <div className="text-xs text-slate-500">{w.phone}</div>
                                                    </button>
                                                ))
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <Palette className="w-4 h-4" /> Zone Color
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        type="color"
                                        className="h-12 w-20 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                                        value={selectedColor}
                                        onChange={e => setSelectedColor(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                        value={selectedColor}
                                        onChange={e => setSelectedColor(e.target.value)}
                                        placeholder="#000000"
                                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25">
                                {editingZone ? 'Update Zone' : 'Create Zone'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
