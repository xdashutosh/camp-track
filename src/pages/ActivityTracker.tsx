import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle, InfoWindow } from '@react-google-maps/api';
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
    User,
    Flag,
    Upload,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Navigation,
    Activity,
    Layers
} from 'lucide-react';
import { Pagination } from '../components/Pagination';

const GOOGLE_MAPS_API_KEY = "AIzaSyCSFX5Min2gS2bbqQjSeGWFqE97btxKERg";
const LIBRARIES: ("places")[] = ["places"];

interface ActivityTracker {
    id: string;
    user_id: string;
    leader_name: string;
    party_name: string;
    type: 'opponent' | 'our';
    address: string | null;
    latitude: number;
    longitude: number;
    images: string[];
    people_count: number;
    activity_date: string | null;
    worker_name: string;
    worker_phone: string;
    created_at: string;
}

interface GalleryState {
    images: string[];
    index: number;
}

export const ActivityTrackerPage = () => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES,
    });

    const [activities, setActivities] = useState<ActivityTracker[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeGallery, setActiveGallery] = useState<GalleryState | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [fullScreenActivity, setFullScreenActivity] = useState<ActivityTracker | null>(null);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [hoveredActivity, setHoveredActivity] = useState<ActivityTracker | null>(null);
    const [heatmapInitialCenter, setHeatmapInitialCenter] = useState<{lat: number, lng: number} | null>(null);

    // Filters state
    const [filterType, setFilterType] = useState<string>('all');
    const [filterParty, setFilterParty] = useState<string>('all');

    useEffect(() => { setCurrentPage(1); }, [search, filterType, filterParty]);

    useEffect(() => {
        if (showHeatmap && !heatmapInitialCenter && activities.length > 0) {
            setHeatmapInitialCenter({ lat: activities[0].latitude, lng: activities[0].longitude });
        } else if (!showHeatmap) {
            setHeatmapInitialCenter(null);
        }
    }, [showHeatmap, activities, heatmapInitialCenter]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);

    // Form state
    const [leaderName, setLeaderName] = useState('');
    const [partyName, setPartyName] = useState('');
    const [type, setType] = useState<'opponent' | 'our'>('opponent');
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [address, setAddress] = useState('');
    const [peopleCount, setPeopleCount] = useState<string>('');
    const [activityDate, setActivityDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [latInput, setLatInput] = useState('');
    const [lngInput, setLngInput] = useState('');

    // Google Maps refs
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchActivities = async () => {
        try {
            const response = await api.get('/admin/activity-trackers');
            setActivities(response.data);
        } catch (error) {
            console.error('Failed to fetch activity trackers', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchActivities(); }, []);


    // ── Reverse geocode on map click or marker drag ──
    const reverseGeocode = (latitude: number, longitude: number) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                setAddress(results[0].formatted_address);
            } else {
                setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            }
        });
    };

    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const newLat = e.latLng.lat();
        const newLng = e.latLng.lng();
        setLat(newLat);
        setLng(newLng);
        setLatInput(newLat.toString());
        setLngInput(newLng.toString());
        reverseGeocode(newLat, newLng);
    };

    const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const newLat = e.latLng.lat();
        const newLng = e.latLng.lng();
        setLat(newLat);
        setLng(newLng);
        setLatInput(newLat.toString());
        setLngInput(newLng.toString());
        reverseGeocode(newLat, newLng);
    };

    const onCoordinateChange = (newLatStr: string, newLngStr: string) => {
        setLatInput(newLatStr);
        setLngInput(newLngStr);
        
        const nLat = parseFloat(newLatStr);
        const nLng = parseFloat(newLngStr);
        
        if (!isNaN(nLat) && !isNaN(nLng) && nLat >= -90 && nLat <= 90 && nLng >= -180 && nLng <= 180) {
            setLat(nLat);
            setLng(nLng);
            reverseGeocode(nLat, nLng);
            if (map) {
                map.panTo({ lat: nLat, lng: nLng });
                map.setZoom(16);
            }
        }
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

    // ── Submit activity ──
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!leaderName || !partyName || !lat || !lng) {
            alert('Please fill in all required fields and select a location on the map.');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/admin/activity-trackers', {
                leader_name: leaderName,
                party_name: partyName,
                type,
                images,
                latitude: lat,
                longitude: lng,
                address: address || null,
                people_count: parseInt(peopleCount) || 0,
                activity_date: activityDate || null,
            });
            setIsModalOpen(false);
            resetForm();
            fetchActivities();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to create activity tracker');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this activity record?')) return;
        try {
            await api.delete(`/admin/activity-trackers/${id}`);
            fetchActivities();
        } catch {
            alert('Failed to delete activity tracker');
        }
    };

    const resetForm = () => {
        setType('opponent');
        setLeaderName('Pramod Boro');
        setPartyName('UPPL');
        setImages([]);
        setLat(null);
        setLng(null);
        setLatInput('');
        setLngInput('');
        setAddress('');
        setPeopleCount('');
        setActivityDate(new Date().toISOString().split('T')[0]);
        setMap(null);
    };

    const panToActivity = (activity: ActivityTracker) => {
        setSelectedId(activity.id);
        setFullScreenActivity(activity); // Open full screen map
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
    const parties = Array.from(new Set(activities.map(a => a.party_name))).sort();

    const filteredActivities = activities.filter(act => {
        const q = search.toLowerCase();
        const matchesSearch = act.leader_name.toLowerCase().includes(q) ||
            act.party_name.toLowerCase().includes(q) ||
            (act.address && act.address.toLowerCase().includes(q)) ||
            act.worker_name.toLowerCase().includes(q);
        
        const matchesType = filterType === 'all' || act.type === filterType;
        const matchesParty = filterParty === 'all' || act.party_name === filterParty;
        
        return matchesSearch && matchesType && matchesParty;
    });

    const totalItems = filteredActivities.length;
    const paginatedActivities = filteredActivities.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );


    return (
        <div className="h-full flex flex-col space-y-6">
            {/* Header */}
            <div className="flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Activity Tracker</h1>
                        <p className="text-slate-500 text-sm">Track leader activities and ground presence</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowHeatmap(true)}
                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 border border-indigo-100"
                        >
                            <Layers className="w-5 h-5" />
                            Heatmap View
                        </button>
                        <button
                            onClick={() => { resetForm(); setIsModalOpen(true); }}
                            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
                        >
                            <Plus className="w-5 h-5" />
                            Add Activity
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mt-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by leader, party, worker or location..."
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-4">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-sm min-w-[140px]"
                        >
                            <option value="all">All Types</option>
                            <option value="opponent">Opponent</option>
                            <option value="our">Our Activity</option>
                        </select>

                        <select
                            value={filterParty}
                            onChange={(e) => setFilterParty(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-sm min-w-[140px]"
                        >
                            <option value="all">All Parties</option>
                            {parties.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>

                        {(search || filterType !== 'all' || filterParty !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setFilterType('all');
                                    setFilterParty('all');
                                }}
                                className="px-4 py-3 text-slate-500 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>


            {/* Activity Cards */}
            <div className="min-h-0 flex-shrink overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Loader2 className="w-10 h-10 animate-spin mb-4" />
                        <p>Fetching activities...</p>
                    </div>
                ) : paginatedActivities.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl text-slate-400 shadow-sm">
                        <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-lg font-semibold">No activities found</p>
                        <p className="text-sm">Click "Add Activity" to record ground movement</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedActivities.map((activity) => (
                            <div 
                                key={activity.id} 
                                onClick={() => panToActivity(activity)}
                                className={`bg-white border cursor-pointer rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group flex flex-col ${selectedId === activity.id ? 'ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50/10' : 'border-slate-200'}`}
                            >
                                {/* Image section */}
                                {activity.images && activity.images.length > 0 ? (
                                    <div
                                        className="relative h-44 bg-slate-100 overflow-hidden cursor-pointer"
                                        onClick={() => setActiveGallery({ images: activity.images, index: 0 })}
                                    >
                                        <img
                                            src={activity.images[0]}
                                            alt="Activity"
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Maximize2 className="w-8 h-8 text-white" />
                                        </div>
                                        <div className={`absolute top-3 left-3 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md shadow flex items-center gap-1.5 ${activity.type === 'opponent' ? 'bg-red-600' : 'bg-emerald-600'}`}>
                                            <Activity className="w-3 h-3" />
                                            {activity.type === 'opponent' ? 'Opponent' : 'Our Activity'}
                                        </div>
                                        {activity.images.length > 1 && (
                                            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                                                +{activity.images.length - 1} more
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className={`h-16 flex items-center px-5 shrink-0 ${activity.type === 'opponent' ? 'bg-gradient-to-r from-red-50 to-orange-50' : 'bg-gradient-to-r from-emerald-50 to-teal-50'}`}>
                                        <div className={`flex items-center gap-2 font-bold ${activity.type === 'opponent' ? 'text-red-700' : 'text-emerald-700'}`}>
                                            <Activity className="w-5 h-5" />
                                            <span>{activity.type === 'opponent' ? 'Opponent' : 'Our Activity'}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="p-5 flex-1 flex flex-col space-y-4">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{activity.leader_name}</h3>
                                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                            <Flag className="w-4 h-4 text-slate-400" />
                                            <span className="font-medium">{activity.party_name}</span>
                                        </div>
                                    </div>

                                         <div className="flex flex-col gap-2 text-sm text-slate-700 flex-1">
                                            {activity.address && (
                                                <div className="flex items-start gap-2">
                                                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                                    <span className="line-clamp-2">{activity.address}</span>
                                                </div>
                                            )}
                                            
                                            <div className="grid grid-cols-2 gap-2 mt-1">
                                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Coordinates</p>
                                                    <p className="text-[10px] font-mono text-slate-600">{activity.latitude.toFixed(4)}, {activity.longitude.toFixed(4)}</p>
                                                </div>
                                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Crowd Size</p>
                                                    <p className="text-xs font-bold text-slate-700">{activity.people_count || 0}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 mt-auto">
                                                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-600 border border-indigo-200">
                                                    {activity.worker_name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Reported By</span>
                                                    <span className="text-xs font-semibold text-slate-700">{activity.worker_name}</span>
                                                </div>
                                            </div>
                                        </div>

                                    <div className="pt-3 flex items-center justify-between border-t border-slate-100 mt-auto">
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                            <Calendar className="w-3 h-3" />
                                            ACTIVITY: {activity.activity_date ? new Date(activity.activity_date).toLocaleDateString([], { dateStyle: 'medium' }) : 'N/A'}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(activity.id)}
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

            {/* ═══════════════ Add Activity Modal ═══════════════ */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl relative shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">New Activity Record</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Capture ground intelligence and leader movements</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                            <div className="p-6 space-y-6">
                                {/* Type Selection - Moved to Top */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-teal-600" />
                                        Activity Type *
                                    </label>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setType('opponent');
                                                setLeaderName('Pramod Boro');
                                                setPartyName('UPPL');
                                            }}
                                            className={`flex-1 py-3 px-4 rounded-xl border font-bold transition-all flex items-center justify-center gap-2 ${type === 'opponent' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${type === 'opponent' ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
                                            Opponent
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setType('our');
                                                setLeaderName('Biswajit Daimary');
                                                setPartyName('BJP');
                                            }}
                                            className={`flex-1 py-3 px-4 rounded-xl border font-bold transition-all flex items-center justify-center gap-2 ${type === 'our' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${type === 'our' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                            Our Activity
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Leader Name */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <User className="w-4 h-4 text-indigo-600" />
                                            Leader Name *
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                                            value={leaderName}
                                            onChange={e => setLeaderName(e.target.value)}
                                            placeholder="Enter leader name"
                                            required
                                        />
                                    </div>

                                    {/* Party Name */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <Flag className="w-4 h-4 text-red-600" />
                                            Party Name *
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all"
                                            value={partyName}
                                            onChange={e => setPartyName(e.target.value)}
                                            placeholder="Enter party name"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Activity Date */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-indigo-600" />
                                            Date of Activity *
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                                            value={activityDate}
                                            onChange={e => setActivityDate(e.target.value)}
                                            required
                                        />
                                    </div>

                                    {/* People Count */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <User className="w-4 h-4 text-rose-600" />
                                            People Gathered
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition-all"
                                            value={peopleCount}
                                            onChange={e => setPeopleCount(e.target.value)}
                                            placeholder="Estimated number of people"
                                        />
                                    </div>
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
                                                <p className="text-sm text-slate-500 font-medium">Click to upload photos</p>
                                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Multiple images supported</p>
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
                                <div className="space-y-4">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-rose-600" />
                                        Location *
                                        <span className="text-xs text-slate-400 font-normal">(Input coordinates or drag marker)</span>
                                    </label>

                                    {/* Manual Coordinates Input */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Latitude</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                                                placeholder="e.g. 26.1158"
                                                value={latInput}
                                                onChange={(e) => onCoordinateChange(e.target.value, lngInput)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Longitude</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                                                placeholder="e.g. 91.7086"
                                                value={lngInput}
                                                onChange={(e) => onCoordinateChange(latInput, e.target.value)}
                                            />
                                        </div>
                                    </div>


                                    {/* Map Container */}
                                    <div className="rounded-2xl overflow-hidden border border-slate-200 h-[300px] relative shadow-inner">
                                        {isLoaded ? (
                                            <GoogleMap
                                                mapContainerStyle={{ height: '300px', width: '100%' }}
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
                                                    <Marker
                                                        position={{ lat, lng }}
                                                        draggable={true}
                                                        onDragEnd={handleMarkerDragEnd}
                                                    />
                                                )}
                                            </GoogleMap>
                                        ) : (
                                            <div className="flex flex-center justify-center h-full text-slate-400">
                                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                                Initializing Map...
                                            </div>
                                        )}
                                    </div>

                                    {address && (
                                        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/50">
                                            <MapPin className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-slate-700 font-bold">{address}</p>
                                                {lat && lng && (
                                                    <p className="text-[10px] text-slate-400 font-mono mt-1">{lat.toFixed(6)}, {lng.toFixed(6)}</p>
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
                                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Activity className="w-5 h-5" />
                                            Save Activity Report
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Gallery View */}
            {activeGallery && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md" onClick={() => setActiveGallery(null)}>
                    <button className="absolute top-6 right-6 p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all z-50" onClick={() => setActiveGallery(null)}>
                        <X className="w-8 h-8" />
                    </button>

                    {activeGallery.images.length > 1 && (
                        <>
                            <button className="absolute left-6 p-3 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all z-50" onClick={handlePrevious}>
                                <ChevronLeft className="w-10 h-10" />
                            </button>
                            <button className="absolute right-6 p-3 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all z-50" onClick={handleNext}>
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

            {/* Full Screen Map View */}
            {fullScreenActivity && (
                <div className="fixed inset-0 z-[150] bg-white flex flex-col">
                    <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setFullScreenActivity(null)}
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors flex items-center gap-2"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                <span className="font-bold text-sm">Back to List</span>
                            </button>
                            <div className="w-px h-6 bg-slate-200" />
                            <div>
                                <h2 className="text-base font-bold text-slate-900 leading-tight">{fullScreenActivity.leader_name}</h2>
                                <p className="text-xs text-slate-500">{fullScreenActivity.address || 'Location View'}</p>
                            </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${fullScreenActivity.type === 'opponent' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            <Activity className="w-3.5 h-3.5" />
                            {fullScreenActivity.type === 'opponent' ? 'Opponent' : 'Our Activity'}
                        </div>
                    </div>
                    
                    <div className="flex-1 relative">
                        {isLoaded ? (
                            <GoogleMap
                                mapContainerStyle={{ height: '100%', width: '100%' }}
                                center={{ lat: fullScreenActivity.latitude, lng: fullScreenActivity.longitude }}
                                zoom={17}
                                options={{
                                    mapTypeControl: true,
                                    streetViewControl: true,
                                    fullscreenControl: true,
                                }}
                            >
                                <Marker
                                    position={{ lat: fullScreenActivity.latitude, lng: fullScreenActivity.longitude }}
                                    icon={{
                                        url: fullScreenActivity.type === 'opponent' 
                                            ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' 
                                            : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                                    }}
                                />
                            </GoogleMap>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">
                                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                                Loading Full Map...
                            </div>
                        )}

                        {/* Floating Info Card */}
                        <div className="absolute bottom-10 left-10 max-w-sm w-full bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">
                                    {fullScreenActivity.leader_name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900">{fullScreenActivity.leader_name}</h3>
                                    <p className="text-xs text-slate-500 font-medium">{fullScreenActivity.party_name}</p>
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                                    <span className="text-slate-500">Crowd Size</span>
                                    <span className="font-bold text-slate-900">{fullScreenActivity.people_count || 0}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                                    <span className="text-slate-500">Activity Date</span>
                                    <span className="font-bold text-slate-900">
                                        {fullScreenActivity.activity_date ? new Date(fullScreenActivity.activity_date).toLocaleDateString([], { dateStyle: 'long' }) : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs py-2">
                                    <span className="text-slate-500">Reported By</span>
                                    <span className="font-bold text-slate-900">{fullScreenActivity.worker_name}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Heatmap View Overlay */}
            {showHeatmap && (
                <div className="fixed inset-0 z-[160] bg-white flex flex-col">
                    <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setShowHeatmap(false)}
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors flex items-center gap-2"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                <span className="font-bold text-sm">Close Heatmap</span>
                            </button>
                            <div className="w-px h-6 bg-slate-200" />
                            <div className="flex items-center gap-2">
                                <Layers className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-base font-bold text-slate-900">Activity Heatmap</h2>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-900 border border-red-900" />
                                    <span className="text-slate-600">Opponent</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-green-900 border border-green-900" />
                                    <span className="text-slate-600">Our Activity</span>
                                </div>
                            </div>
                            <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500">
                                BUBBLE SIZE = CROWD SIZE
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        {isLoaded ? (
                            <GoogleMap
                                mapContainerStyle={{ height: '100%', width: '100%' }}
                                center={heatmapInitialCenter || { lat: 26.1158, lng: 91.7086 }}
                                zoom={12}
                                options={{
                                    mapTypeControl: true,
                                    streetViewControl: true,
                                    fullscreenControl: true,
                                    styles: [
                                        {
                                            featureType: 'all',
                                            elementType: 'labels.text.fill',
                                            stylers: [{ color: '#747474' }]
                                        }
                                    ]
                                }}
                            >
                                {filteredActivities.map(activity => {
                                    // Calculate radius based on people count (increased ratio for better visibility)
                                    // Both activity types now use the same ratio as requested
                                    const radius = 400 + (activity.people_count || 0) * 15;
                                    
                                    const color = activity.type === 'opponent' ? 'red' : 'green';
                                    
                                    return (
                                        <Circle
                                            key={activity.id}
                                            center={{ lat: activity.latitude, lng: activity.longitude }}
                                            radius={radius}
                                            onMouseOver={() => setHoveredActivity(activity)}
                                            onMouseOut={() => setHoveredActivity(null)}
                                            onClick={() => setFullScreenActivity(activity)}
                                            options={{
                                                fillColor: color,
                                                fillOpacity: 1,
                                                strokeColor: color,
                                                strokeOpacity: 0.8,
                                                strokeWeight: 2,
                                                zIndex: activity.people_count || 0
                                            }}
                                        />
                                    );
                                })}

                                {hoveredActivity && (
                                    <InfoWindow
                                        position={{ lat: hoveredActivity.latitude, lng: hoveredActivity.longitude }}
                                        options={{ 
                                            pixelOffset: new google.maps.Size(0, -10),
                                            disableAutoPan: true
                                        }}
                                    >
                                        <div className="p-2 min-w-[150px]">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{hoveredActivity.type}</p>
                                            <h4 className="font-bold text-slate-900 text-sm mb-0.5">{hoveredActivity.leader_name}</h4>
                                            <p className="text-xs text-slate-600 mb-2">{hoveredActivity.party_name}</p>
                                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                                <User className="w-3 h-3 text-indigo-500" />
                                                <span className="text-xs font-bold text-slate-700">{hoveredActivity.people_count || 0} People</span>
                                            </div>
                                        </div>
                                    </InfoWindow>
                                )}
                            </GoogleMap>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
