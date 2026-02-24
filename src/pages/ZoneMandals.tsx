import { useState, useEffect } from 'react';
import api from '../lib/api';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Loader2,
    Layers,
    User,
    Filter
} from 'lucide-react';
import { Pagination } from '../components/Pagination';

interface Zone {
    id: string;
    constituency_name: string;
    zone_name: string;
}

interface Worker {
    id: string;
    name: string;
    is_assigned: boolean;
}

interface ZoneMandal {
    id: string;
    zone_id: string;
    mandal_name: string;
    president_id: string | null;
    zone_name: string;
    constituency_name: string;
    president_name: string | null;
    president_phone: string | null;
    created_at: string;
}

export const ZoneMandalsPage = () => {
    const [mandals, setMandals] = useState<ZoneMandal[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMandal, setEditingMandal] = useState<ZoneMandal | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [constituencyFilter, setConstituencyFilter] = useState('all');
    const [zoneFilter, setZoneFilter] = useState('all');

    const [selectedZone, setSelectedZone] = useState('');
    const [zoneSearch, setZoneSearch] = useState('');
    const [showZoneDropdown, setShowZoneDropdown] = useState(false);
    const [mandalName, setMandalName] = useState('');
    const [selectedPresident, setSelectedPresident] = useState('');

    const fetchData = async () => {
        try {
            const [mandalsRes, zonesRes, workersRes] = await Promise.all([
                api.get('/admin/zone-mandals'),
                api.get('/admin/zones'),
                api.get('/admin/workers')
            ]);
            setMandals(mandalsRes.data);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedZone) {
            alert('Please select a zone');
            return;
        }
        try {
            const payload = {
                zone_id: selectedZone,
                mandal_name: mandalName,
                president_id: selectedPresident || null
            };

            if (editingMandal) {
                await api.put(`/admin/zone-mandals/${editingMandal.id}`, payload);
            } else {
                await api.post('/admin/zone-mandals', payload);
            }

            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to save zone mandal');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this zone mandal?')) return;
        try {
            await api.delete(`/admin/zone-mandals/${id}`);
            fetchData();
        } catch {
            alert('Failed to delete zone mandal');
        }
    };

    const openModal = (mandal?: ZoneMandal) => {
        if (mandal) {
            setEditingMandal(mandal);
            setSelectedZone(mandal.zone_id);
            setZoneSearch(`${mandal.constituency_name} - ${mandal.zone_name}`);
            setMandalName(mandal.mandal_name);
            setSelectedPresident(mandal.president_id || '');
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingMandal(null);
        setSelectedZone('');
        setZoneSearch('');
        setShowZoneDropdown(false);
        setMandalName('');
        setSelectedPresident('');
    };

    const filteredMandals = mandals.filter(m => {
        const matchesSearch = m.mandal_name.toLowerCase().includes(search.toLowerCase()) ||
            m.zone_name.toLowerCase().includes(search.toLowerCase()) ||
            m.constituency_name.toLowerCase().includes(search.toLowerCase());
        const matchesConstituency = constituencyFilter === 'all' || m.constituency_name === constituencyFilter;
        const matchesZone = zoneFilter === 'all' || m.zone_name === zoneFilter;
        return matchesSearch && matchesConstituency && matchesZone;
    });

    const totalItems = filteredMandals.length;
    const paginatedMandals = filteredMandals.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, constituencyFilter, zoneFilter]);

    const uniqueConstituencies = Array.from(new Set(mandals.map(m => m.constituency_name))).sort();
    const uniqueZones = Array.from(new Set(mandals
        .filter(m => constituencyFilter === 'all' || m.constituency_name === constituencyFilter)
        .map(m => m.zone_name))).sort();

    const filteredZonesDropdown = zones.filter(z =>
        z.constituency_name.toLowerCase().includes(zoneSearch.toLowerCase()) ||
        z.zone_name.toLowerCase().includes(zoneSearch.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Zone Mandals</h1>
                        <p className="text-slate-500 text-sm">Manage mandals and their presidents under each zone</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
                    >
                        <Plus className="w-5 h-5" />
                        Add Mandal
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 mt-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search mandals, zones or constituencies..."
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-slate-400" />
                            <select
                                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                value={constituencyFilter}
                                onChange={(e) => {
                                    setConstituencyFilter(e.target.value);
                                    setZoneFilter('all');
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
                                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-w-[150px]"
                                value={zoneFilter}
                                onChange={(e) => setZoneFilter(e.target.value)}
                            >
                                <option value="all">All Zones</option>
                                {uniqueZones.map(z => (
                                    <option key={z} value={z}>{z}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-shrink bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <div className="overflow-x-auto overflow-y-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Mandal Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Zone</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Constituency</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">President</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right bg-slate-50">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                        Loading...
                                    </td>
                                </tr>
                            ) : paginatedMandals.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                        No zone mandals found matching your filters.
                                    </td>
                                </tr>
                            ) : paginatedMandals.map((mandal) => (
                                <tr key={mandal.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                                <Layers className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-semibold text-slate-900">{mandal.mandal_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-slate-700">{mandal.zone_name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-semibold text-[10px] uppercase">{mandal.constituency_name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {mandal.president_name ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{mandal.president_name}</p>
                                                    <p className="text-xs text-slate-400">{mandal.president_phone}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-400 italic">Not Assigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openModal(mandal)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(mandal.id)}
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

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]">
                        <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><X /></button>
                        <h2 className="text-xl font-bold text-slate-900 mb-6">{editingMandal ? 'Edit Mandal' : 'Add Mandal'}</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2 relative">
                                <label className="text-sm font-medium text-slate-700">Select Zone</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                        placeholder="Search zone or constituency..."
                                        value={zoneSearch}
                                        onChange={(e) => {
                                            setZoneSearch(e.target.value);
                                            setShowZoneDropdown(true);
                                            if (!e.target.value) setSelectedZone('');
                                        }}
                                        onFocus={() => setShowZoneDropdown(true)}
                                    />
                                    {showZoneDropdown && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                            {filteredZonesDropdown.length === 0 ? (
                                                <div className="p-3 text-sm text-slate-400 italic">No zones found</div>
                                            ) : (
                                                filteredZonesDropdown.map(z => (
                                                    <button
                                                        key={z.id}
                                                        type="button"
                                                        className="w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-0"
                                                        onClick={() => {
                                                            setSelectedZone(z.id);
                                                            setZoneSearch(`${z.constituency_name} - ${z.zone_name}`);
                                                            setShowZoneDropdown(false);
                                                        }}
                                                    >
                                                        <p className="font-semibold text-slate-900">{z.constituency_name}</p>
                                                        <p className="text-xs text-slate-500">{z.zone_name}</p>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Mandal Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                    value={mandalName}
                                    onChange={e => setMandalName(e.target.value)}
                                    placeholder="Enter mandal name"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Zone Mandal President</label>
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
                                {editingMandal ? 'Update Mandal' : 'Create Mandal'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
