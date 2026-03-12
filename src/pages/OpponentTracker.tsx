import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import {
    Search,
    MapPin,
    Calendar,
    User,
    X,
    Maximize2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Activity
} from 'lucide-react';
import { Pagination } from '../components/Pagination';

interface OpponentTracker {
    id: string;
    user_id: string;
    village_name: string;
    booth_number: string;
    constituency: string;
    latitude: number;
    longitude: number;
    opponent_name: string;
    opponent_party: string;
    opponent_age: number;
    is_local_candidate: boolean;
    opponent_strength: string;
    our_support_est: string;
    opponent_support_est: string;
    top_issues: string[];
    development_seen: string;
    public_mood_govt: string;
    demand_for_change: string;
    key_influencers: any;
    rally_people_count: number;
    crowd_reaction: string;
    opponent_supporters_seen: boolean;
    youth_support: string;
    women_support: string;
    notes: string;
    images: string[];
    tracked_at: string;
    created_at: string;
    worker_name: string;
    worker_phone: string;
}

interface GalleryState {
    images: string[];
    index: number;
}

export const OpponentTrackerPage = () => {
    const [trackers, setTrackers] = useState<OpponentTracker[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeGallery, setActiveGallery] = useState<GalleryState | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(24);

    const fetchTrackers = async () => {
        try {
            const response = await api.get('/admin/opponent-trackers');
            setTrackers(response.data);
        } catch (error) {
            console.error('Failed to fetch opponent trackers', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTrackers(); }, []);

    const filteredTrackers = trackers.filter(t => {
        const matchesSearch = t.worker_name?.toLowerCase().includes(search.toLowerCase()) ||
            (t.opponent_name && t.opponent_name.toLowerCase().includes(search.toLowerCase())) ||
            (t.constituency && t.constituency.toLowerCase().includes(search.toLowerCase())) ||
            (t.village_name && t.village_name.toLowerCase().includes(search.toLowerCase()));
        return matchesSearch;
    });

    const totalItems = filteredTrackers.length;
    const paginatedTrackers = filteredTrackers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const handlePrevious = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!activeGallery) return;
        setActiveGallery(prev => ({
            ...prev!,
            index: (prev!.index - 1 + prev!.images.length) % prev!.images.length
        }));
    }, [activeGallery]);

    const handleNext = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!activeGallery) return;
        setActiveGallery(prev => ({
            ...prev!,
            index: (prev!.index + 1) % prev!.images.length
        }));
    }, [activeGallery]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!activeGallery) return;
            if (e.key === 'ArrowLeft') handlePrevious();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'Escape') setActiveGallery(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeGallery, handlePrevious, handleNext]);

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Opponent Intelligence</h1>
                        <p className="text-slate-500 text-sm">Review ground reality and opponent tracking reports</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mt-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by worker, opponent, constituency or village..."
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-shrink overflow-y-auto">

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Loader2 className="w-10 h-10 animate-spin mb-4" />
                        <p>Fetching intelligence reports...</p>
                    </div>
                ) : paginatedTrackers.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl text-slate-400 shadow-sm">
                        No reports match your filters.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedTrackers.map((tracker) => (
                            <div key={tracker.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all group flex flex-col">
                                {tracker.images && tracker.images.length > 0 ? (
                                    <div className="relative h-48 bg-slate-100 overflow-hidden cursor-pointer shrink-0" onClick={() => setActiveGallery({ images: tracker.images, index: 0 })}>
                                        <img
                                            src={tracker.images[0]}
                                            alt={tracker.opponent_name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Maximize2 className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md shadow flex items-center gap-1.5">
                                            <Activity className="w-3 h-3" />
                                            {tracker.opponent_party || 'Unknown Party'}
                                        </div>
                                        {tracker.images.length > 1 && (
                                            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                                                +{tracker.images.length - 1} more
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="relative h-16 bg-gradient-to-r from-red-50 to-orange-50 overflow-hidden shrink-0 flex items-center px-4">
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-red-500" />
                                            <span className="font-bold text-red-700">{tracker.opponent_party || 'Unknown Party'}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="p-5 flex-1 flex flex-col space-y-4">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold text-slate-900 flex justify-between items-start">
                                            <span>{tracker.opponent_name || 'Unnamed Opponent'}</span>
                                            {tracker.opponent_strength && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border top-0.5 relative whitespace-nowrap ${tracker.opponent_strength === 'Very Strong' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    tracker.opponent_strength === 'Strong' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                        tracker.opponent_strength === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                            'bg-green-50 text-green-700 border-green-200'
                                                    }`}>
                                                    {tracker.opponent_strength}
                                                </span>
                                            )}
                                        </h3>
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <div className="flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5" />
                                                <span>Report by <span className="font-semibold text-slate-700">{tracker.worker_name}</span></span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 text-sm text-slate-700 flex-1">
                                        {tracker.constituency && (
                                            <div className="flex items-start gap-2">
                                                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                                <span>{tracker.village_name ? `${tracker.village_name}, ` : ''}{tracker.constituency}</span>
                                            </div>
                                        )}

                                        {tracker.top_issues && tracker.top_issues.length > 0 && (
                                            <div className="mt-2">
                                                <span className="text-xs font-semibold text-slate-500 block mb-1">Top Issues</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {tracker.top_issues.map((issue, idx) => (
                                                        <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded-md">
                                                            {issue}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {tracker.public_mood_govt && (
                                            <div className="mt-2 text-xs flex justify-between bg-slate-50 p-2 rounded-md border border-slate-100">
                                                <span className="text-slate-500">Public Mood:</span>
                                                <span className={`font-semibold ${tracker.public_mood_govt === 'Happy' ? 'text-green-600' :
                                                    tracker.public_mood_govt === 'Angry' ? 'text-red-600' : 'text-yellow-600'
                                                    }`}>{tracker.public_mood_govt}</span>
                                            </div>
                                        )}

                                        {tracker.notes && (
                                            <div className="mt-2 text-xs text-slate-600 italic line-clamp-2 border-l-2 border-slate-200 pl-2">
                                                "{tracker.notes}"
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-3 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 mt-auto">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(tracker.tracked_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
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

                {/* Image Preview Modal / Gallery */}
                {activeGallery && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setActiveGallery(null)}>
                        {/* Close button */}
                        <button
                            className="absolute top-6 right-6 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
                            onClick={() => setActiveGallery(null)}
                        >
                            <X className="w-8 h-8" />
                        </button>

                        {/* Navigation Buttons */}
                        {activeGallery.images.length > 1 && (
                            <>
                                <button
                                    className="absolute left-6 p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
                                    onClick={handlePrevious}
                                >
                                    <ChevronLeft className="w-10 h-10" />
                                </button>
                                <button
                                    className="absolute right-6 p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
                                    onClick={handleNext}
                                >
                                    <ChevronRight className="w-10 h-10" />
                                </button>

                                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
                                    {activeGallery.images.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1.5 rounded-full transition-all ${idx === activeGallery.index ? 'w-8 bg-indigo-500' : 'w-2 bg-white/20'}`}
                                        />
                                    ))}
                                </div>
                                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-white/60 font-medium bg-black/40 px-3 py-1 rounded-full text-xs">
                                    {activeGallery.index + 1} / {activeGallery.images.length}
                                </div>
                            </>
                        )}

                        <div className="relative max-w-5xl w-full h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                            <img
                                key={activeGallery.images[activeGallery.index]}
                                src={activeGallery.images[activeGallery.index]}
                                alt={`Preview ${activeGallery.index + 1}`}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
