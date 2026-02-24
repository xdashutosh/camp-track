import { NavLink } from 'react-router-dom';
import {
    History,
    GitGraph,
    ScrollText,
    Camera,
    LayoutDashboard,
    Map as MapIcon,
    MapPin,
    Layers,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: MapIcon, label: 'Zones', path: '/zones' },
    { icon: Layers, label: 'Zone Mandals', path: '/zone-mandals' },
    { icon: MapPin, label: 'Booths Management', path: '/booths' },
    { icon: GitGraph, label: 'Organization Chart', path: '/org-chart' },
    { icon: ScrollText, label: 'System Logs', path: '/logs' },
    { icon: Camera, label: 'Events', path: '/events' },
    { icon: MapIcon, label: 'Live Tracking', path: '/tracking' },
    { icon: History, label: 'Logs', path: '/logs' },
];

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
    return (
        <aside className={cn(
            'bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 transition-all duration-300 relative',
            collapsed ? 'w-[72px]' : 'w-64'
        )}>
            {/* Toggle button on the border edge */}
            <button
                onClick={onToggle}
                className="absolute -right-3 top-[26px] z-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 shadow-sm transition-colors"
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>

            {/* Logo */}
            <div className={cn('p-4 flex items-center h-16 border-b border-slate-200', collapsed ? 'justify-center' : 'px-6 gap-3')}>
                <img src="/app_icon.png" alt="Campaign Tracker" className="w-10 h-10 rounded-xl flex-shrink-0" />
                {!collapsed && (
                    <span className="text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap">Campaign</span>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2 py-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                            cn(
                                'flex items-center gap-3 rounded-xl transition-all duration-200 group',
                                collapsed ? 'justify-center px-0 py-3' : 'px-4 py-3',
                                isActive
                                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            )
                        }
                    >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};
