import { useState, useEffect } from 'react';
import api from '../lib/api';
import {
    Search,
    Loader2,
    Filter,
    Plus,
    Pencil,
    Trash2,
    X,
} from 'lucide-react';
import { Pagination } from '../components/Pagination';

interface Member {
    id: string;
    type: 'senior_member' | 'general_member';
    name: string;
    mobile_number: string;
    created_at: string;
    worker_name?: string;
    worker_phone?: string;
}

export const MembersPage = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [type, setType] = useState<'senior_member' | 'general_member'>('senior_member');
    const [submitting, setSubmitting] = useState(false);

    const fetchMembers = async () => {
        try {
            const response = await api.get('/admin/members');
            setMembers(response.data);
        } catch (error) {
            console.error('Failed to fetch members', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMembers(); }, []);

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/admin/members', { name, mobileNumber, type });
            setIsAddModalOpen(false);
            resetForm();
            fetchMembers();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to add member');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember) return;
        setSubmitting(true);
        try {
            await api.put(`/admin/members/${selectedMember.id}`, { name, mobileNumber, type });
            setIsEditModalOpen(false);
            resetForm();
            fetchMembers();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to update member');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteMember = async (id: string) => {
        if (!confirm('Are you sure you want to delete this member?')) return;
        try {
            await api.delete(`/admin/members/${id}`);
            fetchMembers();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to delete member');
        }
    };

    const openEditModal = (member: Member) => {
        setSelectedMember(member);
        setName(member.name);
        setMobileNumber(member.mobile_number);
        setType(member.type);
        setIsEditModalOpen(true);
    };

    const resetForm = () => {
        setName('');
        setMobileNumber('');
        setType('senior_member');
        setSelectedMember(null);
    };

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || 
                             m.mobile_number.includes(search) ||
                             (m.worker_name?.toLowerCase().includes(search.toLowerCase()) ?? false);
        const matchesType = typeFilter === 'all' ? true : m.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const totalItems = filteredMembers.length;
    const paginatedMembers = filteredMembers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search, typeFilter]);

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Members Management</h1>
                        <p className="text-slate-500 text-sm">View and manage Senior and General members registered by workers or admins</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
                    >
                        <Plus className="w-5 h-5" />
                        Add Member
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, phone or worker..."
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-slate-400 ml-2" />
                        <select
                            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            <option value="senior_member">Senior Member</option>
                            <option value="general_member">General Member</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-shrink bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <div className="overflow-x-auto overflow-y-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Member</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Mobile</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Type</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Registered By</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Date Added</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right bg-slate-50">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                        Loading...
                                    </td>
                                </tr>
                            ) : paginatedMembers.map((member) => (
                                <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 ${member.type === 'senior_member' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'} rounded-full flex items-center justify-center font-bold`}>
                                                {member.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{member.mobile_number}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            member.type === 'senior_member' 
                                            ? 'bg-indigo-100 text-indigo-800' 
                                            : 'bg-emerald-100 text-emerald-800'
                                        }`}>
                                            {member.type === 'senior_member' ? 'Senior Member' : 'General Member'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            <p className="font-medium text-slate-900">{member.worker_name ?? 'Admin'}</p>
                                            <p className="text-slate-500 text-xs">{member.worker_phone ?? '-'}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        {new Date(member.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(member)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteMember(member.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && paginatedMembers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                        No members found.
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

            {/* Add/Edit Modal */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 relative shadow-2xl">
                        <button 
                            onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); resetForm(); }} 
                            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
                        >
                            <X />
                        </button>
                        <h2 className="text-xl font-bold text-slate-900 mb-6">{isAddModalOpen ? 'Add Member' : 'Edit Member'}</h2>
                        <form onSubmit={isAddModalOpen ? handleAddMember : handleEditMember} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                <input 
                                    type="text" 
                                    placeholder="Name" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" 
                                    value={name} 
                                    onChange={e => setName(e.target.value)} 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number (10 digits)</label>
                                <input 
                                    type="text" 
                                    placeholder="Mobile Number" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" 
                                    value={mobileNumber} 
                                    onChange={e => setMobileNumber(e.target.value)} 
                                    required 
                                    pattern="\d{10}" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                    value={type}
                                    onChange={(e) => setType(e.target.value as any)}
                                >
                                    <option value="senior_member">Senior Member</option>
                                    <option value="general_member">General Member</option>
                                </select>
                            </div>
                            <button 
                                type="submit" 
                                disabled={submitting}
                                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                            >
                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isAddModalOpen ? 'Create Member' : 'Update Member'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
