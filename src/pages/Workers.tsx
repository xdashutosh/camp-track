import { useState, useEffect } from 'react';
import api from '../lib/api';
import {
    UserPlus,
    Search,
    Key,
    Trash2,
    X,
    Loader2,
    Filter,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { Pagination } from '../components/Pagination';

interface Worker {
    id: string;
    name: string;
    phone: string;
    image_url?: string;
    last_lat?: number;
    last_lng?: number;
    last_seen?: string;
    is_assigned?: boolean;
}

export const WorkersPage = () => {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [updatePassword, setUpdatePassword] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [statusFilter, setStatusFilter] = useState('all'); // all, assigned, unassigned

    const fetchWorkers = async () => {
        try {
            const response = await api.get('/admin/workers');
            setWorkers(response.data);
        } catch (error) {
            console.error('Failed to fetch workers', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchWorkers(); }, []);

    const handleAddWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/workers', { name: newName, phone: newPhone, password: newPassword });
            setIsAddModalOpen(false);
            fetchWorkers();
            setNewName(''); setNewPhone(''); setNewPassword('');
        } catch { alert('Failed to add worker'); }
    };

    const handleDeleteWorker = async (id: string) => {
        if (!confirm('Are you sure you want to delete this worker?')) return;
        try { await api.delete(`/admin/workers/${id}`); fetchWorkers(); } catch { alert('Failed to delete worker'); }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedWorker) return;
        try {
            await api.put(`/admin/workers/${selectedWorker.id}/password`, { password: updatePassword });
            setIsPasswordModalOpen(false); setUpdatePassword('');
            alert('Password updated successfully');
        } catch { alert('Failed to update password'); }
    };

    const filteredWorkers = workers.filter(w => {
        const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase()) || w.phone.includes(search);
        const matchesStatus = statusFilter === 'all' ? true : (statusFilter === 'assigned' ? w.is_assigned : !w.is_assigned);
        return matchesSearch && matchesStatus;
    });

    const totalItems = filteredWorkers.length;
    const paginatedWorkers = filteredWorkers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter]);

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Workers Management</h1>
                        <p className="text-slate-500 text-sm">Manage field staff and their accounts</p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
                    >
                        <UserPlus className="w-5 h-5" />
                        Add Worker
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-slate-400 ml-2" />
                        <select
                            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Workers</option>
                            <option value="assigned">Assigned</option>
                            <option value="unassigned">Unassigned</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-shrink bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <div className="overflow-x-auto overflow-y-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Worker</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Phone</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Last Seen</th>
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
                            ) : paginatedWorkers.map((worker) => (
                                <tr key={worker.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600">
                                                {worker.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{worker.name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{worker.phone}</td>
                                    <td className="px-6 py-4">
                                        {worker.is_assigned ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold uppercase">
                                                <CheckCircle2 className="w-3 h-3" /> Assigned
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 text-slate-400 rounded-md text-[10px] font-bold uppercase">
                                                <XCircle className="w-3 h-3" /> Unassigned
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        {worker.last_seen ? new Date(worker.last_seen).toLocaleString() : 'Never'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => { setSelectedWorker(worker); setIsPasswordModalOpen(true); }}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                <Key className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteWorker(worker.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && paginatedWorkers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                        No workers match your filters.
                                    </td>
                                </tr>
                            )}
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

            {/* Add Worker Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 relative shadow-2xl">
                        <button onClick={() => setIsAddModalOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><X /></button>
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Add Worker</h2>
                        <form onSubmit={handleAddWorker} className="space-y-4">
                            <input type="text" placeholder="Name" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" value={newName} onChange={e => setNewName(e.target.value)} required />
                            <input type="text" placeholder="Phone (10 digits)" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" value={newPhone} onChange={e => setNewPhone(e.target.value)} required pattern="\d{10}" />
                            <input type="password" placeholder="Password" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25">Create Account</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Password Update Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 relative shadow-2xl">
                        <button onClick={() => setIsPasswordModalOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><X /></button>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Update Password</h2>
                        <p className="text-sm text-slate-500 mb-6">For {selectedWorker?.name}</p>
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <input type="password" placeholder="New Password" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" value={updatePassword} onChange={e => setUpdatePassword(e.target.value)} required minLength={6} />
                            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25">Update</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
