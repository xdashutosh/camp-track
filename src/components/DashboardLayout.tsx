import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../hooks/useAuth';
import { User, LogOut, Settings } from 'lucide-react';

export const DashboardLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const initials = user?.name
        ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : 'AD';

    return (
        <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden">
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 border-b border-slate-200 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <h2 className="text-lg font-semibold text-slate-800">Admin Control Panel</h2>

                    {/* User Profile Avatar & Dropdown */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="flex items-center gap-3 hover:bg-slate-50 rounded-xl px-3 py-2 transition-colors"
                        >
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.name || 'Admin'}</p>
                                <p className="text-[10px] text-slate-400">Administrator</p>
                            </div>
                            {user?.imageUrl ? (
                                <img src={user.imageUrl} alt="Profile" className="w-9 h-9 rounded-full object-cover shadow-md shadow-indigo-500/20" />
                            ) : (
                                <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
                                    {initials}
                                </div>
                            )}
                        </button>

                        {/* Dropdown Menu */}
                        {menuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 overflow-hidden z-50 animate-fade-in">
                                {/* User info header */}
                                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                                    <p className="text-sm font-semibold text-slate-800">{user?.name || 'Admin'}</p>
                                    <p className="text-xs text-slate-400">{user?.phone || ''}</p>
                                </div>

                                <div className="py-1">
                                    <button
                                        onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                                    >
                                        <User className="w-4 h-4" />
                                        Profile
                                    </button>
                                    <button
                                        onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Settings
                                    </button>
                                </div>

                                <div className="border-t border-slate-100 py-1">
                                    <button
                                        onClick={() => { setMenuOpen(false); logout(); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-8 animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
