import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import LoginPage from '@/pages/LoginPage'
import SignInPage from '@/pages/SignInPage'
import SignUpPage from '@/pages/SignUpPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import DashboardPage from '@/pages/DashboardPage'
import DirectoryPage from '@/pages/DirectoryPage'
import VotingPage from '@/pages/VotingPage'
import NewsPage from '@/pages/NewsPage'
import DocumentsPage from '@/pages/DocumentsPage'
import AdminPage from '@/pages/AdminPage'
import MessagesPage from '@/pages/MessagesPage'
import NeighbourSupportPage from '@/pages/NeighbourSupportPage'
import GatePage from '@/pages/GatePage'
import PassSharePage from '@/pages/PassSharePage'
import ProposalsPage from '@/pages/ProposalsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/signin"          element={<SignInPage />} />
      <Route path="/signup"          element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />

      {/* All app routes require authentication */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/directory" element={<DirectoryPage />} />
        <Route path="/voting" element={<VotingPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/neighbours-support" element={<NeighbourSupportPage />} />
        <Route path="/gate" element={<GatePage />} />
        <Route path="/proposals" element={<ProposalsPage />} />
      </Route>

      {/* Public — no auth required (visitors open this link) */}
      <Route path="/pass" element={<PassSharePage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
