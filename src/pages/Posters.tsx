import { useState, useEffect } from 'react';
import api from '../lib/api';
import {
    Search,
    Loader2,
    Trash2,
    MapPin,
    Calendar,
    User,
    ExternalLink,
    Image as ImageIcon,
    X,
    Maximize2,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { Pagination } from '../components/Pagination';

interface Poster {
    id: string;
    latitude: number;
    longitude: number;
    address: string;
    images: string[];
    worker_name: string;
    worker_phone: string;
    created_at: string;
}

interface GalleryState {
    images: string[];
    index: number;
}

export const PostersPage = () => {
    const [posters, setPosters] = useState<Poster[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeGallery, setActiveGallery] = useState<GalleryState | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const fetchPosters = async () => {
        try {
            const response = await api.get('/admin/posters');
            setPosters(response.data);
        } catch (error) {
            console.error('Failed to fetch posters', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPosters(); }, []);

    const handleDeletePoster = async (id: string) => {
        if (!confirm('Are you sure you want to delete this poster record?')) return;
        try {
            await api.delete(`/admin/posters/${id}`);
            fetchPosters();
        } catch (error) {
            alert('Failed to delete poster record');
        }
    };

    const filteredPosters = posters.filter(p => 
        p.address?.toLowerCase().includes(search.toLowerCase()) || 
        p.worker_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.worker_phone?.includes(search)
    );

    const totalItems = filteredPosters.length;
    const paginatedPosters = filteredPosters.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePrevious = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!activeGallery) return;
        setActiveGallery(prev => ({
            ...prev!,
            index: (prev!.index - 1 + prev!.images.length) % prev!.images.length
        }));
    };

    const handleNext = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!activeGallery) return;
        setActiveGallery(prev => ({
            ...prev!,
            index: (prev!.index + 1) % prev!.images.length
        }));
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (activeGallery) {
                if (e.key === 'ArrowLeft') handlePrevious();
                if (e.key === 'ArrowRight') handleNext();
                if (e.key === 'Escape') setActiveGallery(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeGallery]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Poster Tracker</h1>
                        <p className="text-slate-500 text-sm">Visual Monitoring of Campaign Posters</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by worker, phone or address..."
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
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Images</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Location & Address</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Submitted By</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Time</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right bg-slate-50">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                        Loading posters...
                                    </td>
                                </tr>
                            ) : paginatedPosters.map((poster) => (
                                <tr key={poster.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {poster.images.map((img, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className="relative h-12 w-12 rounded-lg border-2 border-white bg-slate-100 overflow-hidden cursor-pointer hover:scale-110 transition-transform hover:z-10 group/img"
                                                    onClick={() => setActiveGallery({ images: poster.images, index: idx })}
                                                >
                                                    <img
                                                        src={img}
                                                        alt="Poster"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Maximize2 className="w-3 h-3 text-white" />
                                                    </div>
                                                </div>
                                            ))}
                                            {poster.images.length === 0 && (
                                                <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center">
                                                    <ImageIcon className="w-5 h-5 text-slate-400" />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-semibold text-slate-900 line-clamp-1">{poster.address || 'Unknown Address'}</p>
                                            <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                                                <MapPin className="w-3 h-3" />
                                                <span>{poster.latitude.toFixed(6)}, {poster.longitude.toFixed(6)}</span>
                                                <a 
                                                    href={`https://www.google.com/maps/search/?api=1&query=${poster.latitude},${poster.longitude}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="ml-1 text-indigo-600 hover:text-indigo-800"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-slate-400" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{poster.worker_name}</p>
                                                <p className="text-xs text-slate-500">{poster.worker_phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            {new Date(poster.created_at).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDeletePoster(poster.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Entry"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && paginatedPosters.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                        No poster tracking data found.
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
    );
};
