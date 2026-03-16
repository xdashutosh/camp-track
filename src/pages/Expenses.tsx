import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import api from '../lib/api';
import {
    Search,
    Plus,
    Trash2,
    X,
    Loader2,
    MapPin,
    Calendar,
    Image as ImageIcon,
    IndianRupee,
    FileText,
    Upload,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Navigation
} from 'lucide-react';
import { Pagination } from '../components/Pagination';

const GOOGLE_MAPS_API_KEY = "AIzaSyCSFX5Min2gS2bbqQjSeGWFqE97btxKERg";
const LIBRARIES: ("places")[] = ["places"];

interface Expense {
    id: string;
    user_id: string;
    amount: string;
    reason: string;
    images: string[];
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    created_by_name: string;
    created_at: string;
}

interface GalleryState {
    images: string[];
    index: number;
}

export const ExpensesPage = () => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES,
    });

    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeGallery, setActiveGallery] = useState<GalleryState | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);

    // Form state
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [address, setAddress] = useState('');

    // Google Maps refs
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const autocompleteInputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchExpenses = async () => {
        try {
            const response = await api.get('/admin/expenses');
            setExpenses(response.data);
        } catch (error) {
            console.error('Failed to fetch expenses', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchExpenses(); }, []);

    // ── Initialize Places Autocomplete when modal opens ──
    useEffect(() => {
        if (!isLoaded || !isModalOpen || !autocompleteInputRef.current) return;

        // Small delay so DOM is ready
        const timer = setTimeout(() => {
            if (!autocompleteInputRef.current) return;

            const autocomplete = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
                componentRestrictions: { country: 'in' },
                fields: ['formatted_address', 'geometry', 'name'],
            });

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (place.geometry?.location) {
                    const newLat = place.geometry.location.lat();
                    const newLng = place.geometry.location.lng();
                    setLat(newLat);
                    setLng(newLng);
                    setAddress(place.formatted_address || place.name || '');
                    if (map) {
                        map.panTo({ lat: newLat, lng: newLng });
                        map.setZoom(16);
                    }
                }
            });

            autocompleteRef.current = autocomplete;
        }, 300);

        return () => clearTimeout(timer);
    }, [isLoaded, isModalOpen, map]);

    // ── Reverse geocode on map click ──
    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const newLat = e.latLng.lat();
        const newLng = e.latLng.lng();
        setLat(newLat);
        setLng(newLng);

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                setAddress(results[0].formatted_address);
                if (autocompleteInputRef.current) {
                    autocompleteInputRef.current.value = results[0].formatted_address;
                }
            } else {
                setAddress(`${newLat.toFixed(6)}, ${newLng.toFixed(6)}`);
            }
        });
    };

    // ── Photo upload ──
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        const newImages: string[] = [];

        for (const file of Array.from(files)) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                const res = await api.post('/api/v1/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                newImages.push(res.data.data.data.fileUrl);
            } catch (err) {
                console.error('Upload failed for', file.name, err);
            }
        }

        setImages(prev => [...prev, ...newImages]);
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    // ── Submit expense ──
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !reason) return;

        setSubmitting(true);
        try {
            await api.post('/admin/expenses', {
                amount: parseFloat(amount),
                reason,
                images,
                latitude: lat,
                longitude: lng,
                address: address || null,
            });
            setIsModalOpen(false);
            resetForm();
            fetchExpenses();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to create expense');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        try {
            await api.delete(`/admin/expenses/${id}`);
            fetchExpenses();
        } catch {
            alert('Failed to delete expense');
        }
    };

    const resetForm = () => {
        setAmount('');
        setReason('');
        setImages([]);
        setLat(null);
        setLng(null);
        setAddress('');
        setMap(null);
        if (autocompleteInputRef.current) autocompleteInputRef.current.value = '';
    };

    // ── Gallery nav ──
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

    // ── Filtering & Pagination ──
    const filteredExpenses = expenses.filter(exp => {
        const q = search.toLowerCase();
        return exp.reason.toLowerCase().includes(q) ||
            exp.created_by_name.toLowerCase().includes(q) ||
            (exp.address && exp.address.toLowerCase().includes(q)) ||
            exp.amount.toString().includes(q);
    });

    const totalItems = filteredExpenses.length;
    const paginatedExpenses = filteredExpenses.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => { setCurrentPage(1); }, [search]);

    const totalAmount = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    return (
        <div className="h-full flex flex-col space-y-6">
            {/* Header */}
            <div className="flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Expense Tracker</h1>
                        <p className="text-slate-500 text-sm">Track and manage campaign expenses</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
                    >
                        <Plus className="w-5 h-5" />
                        Add Expense
                    </button>
                </div>

                {/* Stats Bar */}
                <div className="flex flex-wrap gap-4 mt-6">
                    <div className="flex-1 min-w-[180px] bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
                        <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Total Expenses</p>
                        <p className="text-3xl font-bold mt-1">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        <p className="text-emerald-200 text-xs mt-1">{filteredExpenses.length} entries</p>
                    </div>
                    <div className="flex-1 min-w-[180px] bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-500/20">
                        <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider">This Month</p>
                        <p className="text-3xl font-bold mt-1">₹{expenses
                            .filter(e => new Date(e.created_at).getMonth() === new Date().getMonth() && new Date(e.created_at).getFullYear() === new Date().getFullYear())
                            .reduce((sum, e) => sum + parseFloat(e.amount), 0)
                            .toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        <p className="text-indigo-200 text-xs mt-1">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>

                {/* Search */}
                <div className="flex flex-col md:flex-row gap-4 mt-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by reason, person or location..."
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Expense Cards */}
            <div className="min-h-0 flex-shrink overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Loader2 className="w-10 h-10 animate-spin mb-4" />
                        <p>Fetching expenses...</p>
                    </div>
                ) : paginatedExpenses.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl text-slate-400 shadow-sm">
                        <IndianRupee className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-lg font-semibold">No expenses found</p>
                        <p className="text-sm">Click "Add Expense" to record your first expense</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedExpenses.map((expense) => (
                            <div key={expense.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all group">
                                {/* Image section */}
                                {expense.images && expense.images.length > 0 ? (
                                    <div
                                        className="relative h-44 bg-slate-100 overflow-hidden cursor-pointer"
                                        onClick={() => setActiveGallery({ images: expense.images, index: 0 })}
                                    >
                                        <img
                                            src={expense.images[0]}
                                            alt="Expense"
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Maximize2 className="w-8 h-8 text-white" />
                                        </div>
                                        {expense.images.length > 1 && (
                                            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                                                +{expense.images.length - 1} more
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow flex items-center gap-1">
                                            <IndianRupee className="w-3.5 h-3.5" />
                                            {parseFloat(expense.amount).toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-20 bg-gradient-to-r from-emerald-50 to-indigo-50 flex items-center px-5">
                                        <div className="bg-emerald-600 text-white text-lg font-bold px-4 py-2 rounded-xl shadow flex items-center gap-1.5">
                                            <IndianRupee className="w-5 h-5" />
                                            {parseFloat(expense.amount).toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                )}

                                <div className="p-5 space-y-3">
                                    <div className="flex items-start gap-2">
                                        <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-slate-800 font-medium line-clamp-3">{expense.reason}</p>
                                    </div>

                                    {expense.address && (
                                        <div className="flex items-start gap-2 text-xs text-slate-500">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                            <span className="line-clamp-2">{expense.address}</span>
                                        </div>
                                    )}

                                    <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(expense.created_at).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(expense.id)}
                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
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
            </div>

            {/* ═══════════════ Add Expense Modal ═══════════════ */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                    <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl relative shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">New Expense</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Record a new campaign expense</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                            <div className="p-6 space-y-6">
                                {/* Amount */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <IndianRupee className="w-4 h-4 text-emerald-600" />
                                        Amount *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-emerald-600">₹</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-lg font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Reason */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-indigo-600" />
                                        Reason *
                                    </label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none"
                                        rows={3}
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        placeholder="Describe the expense reason..."
                                        required
                                    />
                                </div>

                                {/* Photos */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4 text-violet-600" />
                                        Photos
                                        <span className="text-xs text-slate-400 font-normal">(optional)</span>
                                    </label>

                                    {images.length > 0 && (
                                        <div className="flex flex-wrap gap-3 mb-3">
                                            {images.map((url, idx) => (
                                                <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200">
                                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(idx)}
                                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                    >
                                                        <X className="w-5 h-5 text-white" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div
                                        className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {uploading ? (
                                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                <p className="text-sm text-slate-500">Click to upload photos</p>
                                                <p className="text-[10px] text-slate-400 mt-1">JPG, PNG, WebP up to 10MB</p>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handlePhotoUpload}
                                    />
                                </div>

                                {/* Location */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-rose-600" />
                                        Location
                                        <span className="text-xs text-slate-400 font-normal">(search or click on map)</span>
                                    </label>

                                    {/* Google Places Autocomplete Search */}
                                    <div className="relative">
                                        <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            ref={autocompleteInputRef}
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                                            placeholder="Search for a place..."
                                        />
                                    </div>

                                    {/* Google Map */}
                                    <div className="rounded-xl overflow-hidden border border-slate-200 h-[280px] relative">
                                        {isLoaded ? (
                                            <GoogleMap
                                                mapContainerStyle={{ height: '280px', width: '100%' }}
                                                center={lat && lng ? { lat, lng } : { lat: 26.1158, lng: 91.7086 }}
                                                zoom={lat && lng ? 16 : 12}
                                                onClick={handleMapClick}
                                                onLoad={(mapInstance) => setMap(mapInstance)}
                                                options={{
                                                    mapTypeControl: false,
                                                    streetViewControl: false,
                                                    fullscreenControl: false,
                                                }}
                                            >
                                                {lat && lng && (
                                                    <Marker position={{ lat, lng }} />
                                                )}
                                            </GoogleMap>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-slate-400">
                                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                                Loading Map...
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected address */}
                                    {address && (
                                        <div className="flex items-start gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                            <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs text-emerald-800 font-medium line-clamp-2">{address}</p>
                                                {lat && lng && (
                                                    <p className="text-[10px] text-emerald-600 font-mono mt-1">{lat.toFixed(6)}, {lng.toFixed(6)}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                                <button
                                    type="submit"
                                    disabled={submitting || uploading}
                                    className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Plus className="w-5 h-5" />
                                            Add Expense
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══════════════ Image Gallery ═══════════════ */}
            {activeGallery && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setActiveGallery(null)}>
                    <button className="absolute top-6 right-6 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all z-50" onClick={() => setActiveGallery(null)}>
                        <X className="w-8 h-8" />
                    </button>

                    {activeGallery.images.length > 1 && (
                        <>
                            <button className="absolute left-6 p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all z-50" onClick={handlePrevious}>
                                <ChevronLeft className="w-10 h-10" />
                            </button>
                            <button className="absolute right-6 p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all z-50" onClick={handleNext}>
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
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
