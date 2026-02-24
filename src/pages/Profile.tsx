import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Camera, Loader2, Save, User, Phone, Shield, CheckCircle } from 'lucide-react';

interface ProfileData {
    id: string;
    name: string;
    phone: string;
    role: string;
    imageUrl?: string;
}

export const ProfilePage = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [name, setName] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/profile');
            setProfile(res.data);
            setName(res.data.name || '');
            setImageUrl(res.data.imageUrl || '');
        } catch (err) {
            console.error('Failed to fetch profile', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProfile(); }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.post('/api/v1/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const uploadedUrl = res.data.data.data.fileUrl;
            setImageUrl(uploadedUrl);

            // Auto-save the image
            await api.put('/auth/profile', { imageUrl: uploadedUrl });
            setProfile(prev => prev ? { ...prev, imageUrl: uploadedUrl } : prev);

            // Update localStorage too
            const saved = localStorage.getItem('admin_user');
            if (saved) {
                const userData = JSON.parse(saved);
                userData.imageUrl = uploadedUrl;
                localStorage.setItem('admin_user', JSON.stringify(userData));
            }

            setSuccess('Profile photo updated!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Upload failed', err);
            setError('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const res = await api.put('/auth/profile', { name });
            setProfile(res.data.user);

            // Update localStorage
            const saved = localStorage.getItem('admin_user');
            if (saved) {
                const userData = JSON.parse(saved);
                userData.name = name;
                localStorage.setItem('admin_user', JSON.stringify(userData));
            }

            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Save failed', err);
            setError('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const initials = name
        ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'AD';

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
                <p className="text-slate-500 text-sm">Manage your account details and profile photo</p>
            </div>

            {/* Profile Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Banner */}
                <div className="h-32 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 relative" />

                {/* Avatar */}
                <div className="px-8 -mt-16 relative z-10">
                    <div className="relative inline-block">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt="Profile"
                                className="w-28 h-28 rounded-2xl border-4 border-white shadow-lg object-cover bg-slate-100"
                            />
                        ) : (
                            <div className="w-28 h-28 rounded-2xl border-4 border-white shadow-lg bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                                {initials}
                            </div>
                        )}

                        {/* Upload overlay */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="absolute bottom-1 right-1 w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors shadow-sm"
                        >
                            {uploading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Camera className="w-4 h-4" />
                            )}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                    </div>
                </div>

                {/* Form */}
                <div className="p-8 pt-6 space-y-6">
                    {/* Success / Error messages */}
                    {success && (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm p-3 rounded-xl">
                            <CheckCircle className="w-4 h-4" />
                            {success}
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                            placeholder="Your name"
                        />
                    </div>

                    {/* Phone (read-only) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400" />
                            Phone Number
                        </label>
                        <input
                            type="text"
                            value={profile?.phone || user?.phone || ''}
                            readOnly
                            className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 text-slate-500 cursor-not-allowed"
                        />
                        <p className="text-[11px] text-slate-400">Phone number cannot be changed</p>
                    </div>

                    {/* Role (read-only) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-slate-400" />
                            Role
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                {profile?.role || 'admin'}
                            </span>
                        </div>
                    </div>

                    {/* Save button */}
                    <div className="pt-2">
                        <button
                            onClick={handleSave}
                            disabled={saving || name === profile?.name}
                            className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
