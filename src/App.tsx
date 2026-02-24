import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/Login';
import { WorkersPage } from './pages/Workers';
import { EventsPage } from './pages/Events';
import { TrackingPage } from './pages/Tracking';
import { ProfilePage } from './pages/Profile';
import { ZonesPage } from './pages/Zones';
import { ZoneMandalsPage } from './pages/ZoneMandals';
import { BoothsPage } from './pages/Booths';
import { OrgChartPage } from './pages/OrgChart';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';

const Dashboard = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="text-slate-500 text-sm">Overview of your campaign activity</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { label: 'Active Workers', value: '12', trend: '+2', color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Events Today', value: '156', trend: '+14', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Active Trails', value: '8', trend: 'Steady', color: 'bg-amber-50 text-amber-600' },
      ].map((stat, i) => (
        <div key={i} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.color}`}>{stat.trend}</span>
          </div>
        </div>
      ))}
    </div>

    <div className="bg-white border border-slate-200 rounded-2xl p-6 h-[400px] flex items-center justify-center shadow-sm">
      <p className="text-slate-400 font-medium">Activity Analytics Chart Coming Soon...</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workers" element={<WorkersPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="/zones" element={<ZonesPage />} />
            <Route path="/zone-mandals" element={<ZoneMandalsPage />} />
            <Route path="/booths" element={<BoothsPage />} />
            <Route path="/org-chart" element={<OrgChartPage />} />
            <Route path="/logs" element={<div className="text-slate-900">System Logs</div>} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
