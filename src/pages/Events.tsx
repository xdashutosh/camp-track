import { useState, useEffect } from 'react';
import api from '../lib/api';
import {
    Search,
    Filter,
    MapPin,
    Calendar,
    User,
    X,
    Maximize2,
    Loader2
} from 'lucide-react';
import { Pagination } from '../components/Pagination';

interface Event {
    id: string;
    user_id: string;
    type: string;
    latitude: number;
    longitude: number;
    image_url: string;
    description?: string;
    created_at: string;
    worker_name: string;
    worker_phone: string;
}

export const EventsPage = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(24); // Multiple of 3 for grid
    const [typeFilter, setTypeFilter] = useState('all');

    const fetchEvents = async () => {
        try {
            const response = await api.get('/admin/events');
            setEvents(response.data);
        } catch (error) {
            console.error('Failed to fetch events', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEvents(); }, []);

    const filteredEvents = events.filter(e => {
        const matchesSearch = e.worker_name.toLowerCase().includes(search.toLowerCase()) ||
            (e.description && e.description.toLowerCase().includes(search.toLowerCase())) ||
            e.type.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === 'all' || e.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const totalItems = filteredEvents.length;
    const paginatedEvents = filteredEvents.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, typeFilter]);

    const uniqueTypes = Array.from(new Set(events.map(e => e.type))).sort();

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Event Monitoring</h1>
                        <p className="text-slate-500 text-sm">Review field activities and uploaded photos</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mt-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by worker, description or type..."
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-slate-400" />
                        <select
                            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="all">All Event Types</option>
                            {uniqueTypes.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-shrink overflow-y-auto">

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Loader2 className="w-10 h-10 animate-spin mb-4" />
                        <p>Fetching events...</p>
                    </div>
                ) : paginatedEvents.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl text-slate-400 shadow-sm">
                        No events match your filters.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedEvents.map((event) => (
                            <div key={event.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all group">
                                <div className="relative h-48 bg-slate-100 overflow-hidden cursor-pointer" onClick={() => setSelectedImage(event.image_url)}>
                                    <img
                                        src={event.image_url}
                                        alt={event.type}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Maximize2 className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md shadow">
                                        {event.type}
                                    </div>
                                </div>

                                <div className="p-5 space-y-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                                <User className="w-4 h-4 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{event.worker_name}</p>
                                                <p className="text-[10px] text-slate-400">{event.worker_phone}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {event.description && (
                                        <p className="text-sm text-slate-500 line-clamp-2 italic">
                                            "{event.description}"
                                        </p>
                                    )}

                                    <div className="pt-2 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-slate-400 border-t border-slate-100">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(event.created_at).toLocaleString()}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-8">
                    <Pagination
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                    />
                </div>

                {/* Image Preview Modal */}
                {selectedImage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
                        <button className="absolute top-6 right-6 text-white/60 hover:text-white">
                            <X className="w-8 h-8" />
                        </button>
                        <img
                            src={selectedImage}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
