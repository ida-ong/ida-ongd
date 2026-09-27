import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import SiteLayout from './layouts/SiteLayout'
import About from './pages/About'
import Activities from './pages/Activities'
import AdminDashboard from './pages/AdminDashboard'
import AdminEligible from './pages/AdminEligible'
import AdminMembers from './pages/AdminMembers'
import AdminMissions from './pages/AdminMissions'
import AdminReportDetail from './pages/AdminReportDetail'
import AdminReports from './pages/AdminReports'
import Contact from './pages/Contact'
import Dashboard from './pages/Dashboard'
import Donations from './pages/Donations'
import ForgotPassword from './pages/ForgotPassword'
import FounderAdministrators from './pages/FounderAdministrators'
import FounderDashboard from './pages/FounderDashboard'
import Home from './pages/Home'
import LeaderDashboard from './pages/LeaderDashboard'
import LeaderActivities from './pages/LeaderActivities'
import LeaderMissionDetail from './pages/LeaderMissionDetail'
import LeaderMissions from './pages/LeaderMissions'
import LeaderReportNew from './pages/LeaderReportNew'
import LeaderReports from './pages/LeaderReports'
import Login from './pages/Login'
import News from './pages/News'
import Network from './pages/Network'
import Register from './pages/Register'
import Referral from './pages/Referral'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<Home />} />
            <Route path="/a-propos" element={<About />} />
            <Route path="/actions" element={<Activities />} />
            <Route path="/actualites" element={<News />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/dons" element={<Donations />} />
            <Route path="/inscription" element={<Register />} />
            <Route path="/connexion" element={<Login />} />
            <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
            <Route path="/rejoindre/:affiliateCode" element={<Referral />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/reseau" element={<ProtectedRoute><Network /></ProtectedRoute>} />
            <Route path="/leader" element={<ProtectedRoute roles={['leader']}><LeaderDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute roles={['admin', 'founder']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/membres" element={<ProtectedRoute roles={['admin', 'founder']}><AdminMembers /></ProtectedRoute>} />
            <Route path="/admin/eligibles" element={<ProtectedRoute roles={['admin', 'founder']}><AdminEligible /></ProtectedRoute>} />
            <Route path="/admin/missions" element={<ProtectedRoute roles={['admin', 'founder']}><AdminMissions /></ProtectedRoute>} />
            <Route path="/admin/rapports" element={<ProtectedRoute roles={['admin', 'founder']}><AdminReports /></ProtectedRoute>} />
            <Route path="/admin/rapports/:id" element={<ProtectedRoute roles={['admin', 'founder']}><AdminReportDetail /></ProtectedRoute>} />
            <Route path="/founder" element={<ProtectedRoute roles={['founder']}><FounderDashboard /></ProtectedRoute>} />
            <Route path="/founder/administrateurs" element={<ProtectedRoute roles={['founder']}><FounderAdministrators /></ProtectedRoute>} />
            <Route path="/leader/missions" element={<ProtectedRoute roles={['leader']}><LeaderMissions /></ProtectedRoute>} />
            <Route path="/leader/missions/:id" element={<ProtectedRoute roles={['leader']}><LeaderMissionDetail /></ProtectedRoute>} />
            <Route path="/leader/activites" element={<ProtectedRoute roles={['leader']}><LeaderActivities /></ProtectedRoute>} />
            <Route path="/leader/rapports" element={<ProtectedRoute roles={['leader']}><LeaderReports /></ProtectedRoute>} />
            <Route path="/leader/rapports/nouveau" element={<ProtectedRoute roles={['leader']}><LeaderReportNew /></ProtectedRoute>} />
            <Route path="/leader/rapports/:id/modifier" element={<ProtectedRoute roles={['leader']}><LeaderReportEdit /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App