import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/Login';
import { WorkersPage } from './pages/Workers';
import { EventsPage } from './pages/Events';
import { OpponentTrackerPage } from './pages/OpponentTracker';
import { TrackingPage } from './pages/Tracking';
import { ProfilePage } from './pages/Profile';
import { ZonesPage } from './pages/Zones';
import { ZoneMandalsPage } from './pages/ZoneMandals';
import { BoothsPage } from './pages/Booths';
import { OrgChartPage } from './pages/OrgChart';
import { HeatMapPage } from './pages/HeatMap';
import { DashboardPage } from './pages/Dashboard';
import { MembersPage } from './pages/Members';
import { SurveysPage } from './pages/Surveys';
import { AddSurveyPage } from './pages/AddSurvey';
import { ViewSurveyPage } from './pages/ViewSurvey';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/workers" element={<WorkersPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/opponent-tracker" element={<OpponentTrackerPage />} />
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="/zones" element={<ZonesPage />} />
            <Route path="/zone-mandals" element={<ZoneMandalsPage />} />
            <Route path="/booths" element={<BoothsPage />} />
            <Route path="/org-chart" element={<OrgChartPage />} />
            <Route path="/heat-map" element={<HeatMapPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/surveys" element={<SurveysPage />} />
            <Route path="/surveys/add" element={<AddSurveyPage />} />
            <Route path="/surveys/:id" element={<ViewSurveyPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
