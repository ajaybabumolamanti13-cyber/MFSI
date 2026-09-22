import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import ChangePassword from './pages/ChangePassword'
import Dashboard from './pages/Dashboard'
import NewInvestigation from './pages/NewInvestigation'
import Devices from './pages/Devices'
import EvidenceAcquisition from './pages/EvidenceAcquisition'
import MessagesAnalysis from './pages/MessagesAnalysis'
import CallLogAnalysis from './pages/CallLogAnalysis'
import LocationAnalysis from './pages/LocationAnalysis'
import SocialMediaAnalysis from './pages/SocialMediaAnalysis'
import AIInsights from './pages/AIInsights'
import Timeline from './pages/Timeline'
import Reports from './pages/Reports'
import ForensicTools from './pages/ForensicTools'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<ChangePassword />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/investigations/new" element={<ProtectedRoute><NewInvestigation /></ProtectedRoute>} />
      <Route path="/devices" element={<ProtectedRoute><Devices /></ProtectedRoute>} />
      <Route path="/evidence" element={<ProtectedRoute><EvidenceAcquisition /></ProtectedRoute>} />
      <Route path="/analysis/messages" element={<ProtectedRoute><MessagesAnalysis /></ProtectedRoute>} />
      <Route path="/analysis/calls" element={<ProtectedRoute><CallLogAnalysis /></ProtectedRoute>} />
      <Route path="/analysis/location" element={<ProtectedRoute><LocationAnalysis /></ProtectedRoute>} />
      <Route path="/analysis/social" element={<ProtectedRoute><SocialMediaAnalysis /></ProtectedRoute>} />
      <Route path="/ai-insights" element={<ProtectedRoute><AIInsights /></ProtectedRoute>} />
      <Route path="/timeline" element={<ProtectedRoute><Timeline /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/tools" element={<ProtectedRoute><ForensicTools /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
