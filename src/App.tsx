import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useAuthListener } from '@/hooks/useAuth'
import { useSitePageView } from '@/hooks/useSitePageView'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { AdminProtectedRoute } from '@/routes/AdminProtectedRoute'
import { MarketingLayout } from '@/components/layout/MarketingLayout'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'

import Landing from '@/pages/Landing'
import QuickQR from '@/pages/QuickQR'
import Features from '@/pages/Features'
import Templates from '@/pages/Templates'
import Pricing from '@/pages/Pricing'
import About from '@/pages/About'
import Contact from '@/pages/Contact'
import Terms from '@/pages/Terms'
import Privacy from '@/pages/Privacy'
import Cookies from '@/pages/Cookies'

import Login from '@/pages/Login'
import SignUp from '@/pages/SignUp'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'

import Overview from '@/pages/dashboard/Overview'
import ProfileEditor from '@/pages/dashboard/ProfileEditor'
import Businesses from '@/pages/dashboard/Businesses'
import BusinessNew from '@/pages/dashboard/BusinessNew'
import Portfolio from '@/pages/dashboard/Portfolio'
import ExperiencePage from '@/pages/dashboard/Experience'
import Social from '@/pages/dashboard/Social'
import Cards from '@/pages/dashboard/Cards'
import CardNew from '@/pages/dashboard/CardNew'
import QrCodePage from '@/pages/dashboard/QrCode'
import Analytics from '@/pages/dashboard/Analytics'
import Settings from '@/pages/dashboard/Settings'

import PublicProfile from '@/pages/PublicProfile'
import ProfileOrShortLink from '@/pages/ProfileOrShortLink'
import NotFound from '@/pages/NotFound'

import AdminLogin from '@/pages/admin/AdminLogin'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminProfiles from '@/pages/admin/AdminProfiles'
import AdminBusinesses from '@/pages/admin/AdminBusinesses'
import AdminAnalytics from '@/pages/admin/AdminAnalytics'
import AdminQr from '@/pages/admin/AdminQr'
import AdminCards from '@/pages/admin/AdminCards'
import AdminSettings from '@/pages/admin/AdminSettings'

function RouteTracker() {
  useSitePageView()
  return null
}

export default function App() {
  useAuthListener()

  return (
    <BrowserRouter>
      <RouteTracker />
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/quick-qr" element={<QuickQR />} />
          <Route path="/features" element={<Features />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="profile" element={<ProfileEditor />} />
            <Route path="businesses" element={<Businesses />} />
            <Route path="businesses/new" element={<BusinessNew />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="experience" element={<ExperiencePage />} />
            <Route path="social" element={<Social />} />
            <Route path="cards" element={<Cards />} />
            <Route path="cards/new" element={<CardNew />} />
            <Route path="qr" element={<QrCodePage />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<AdminProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="profiles" element={<AdminProfiles />} />
            <Route path="businesses" element={<AdminBusinesses />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="qr" element={<AdminQr />} />
            <Route path="cards" element={<AdminCards />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>

        <Route path="/u/:username" element={<PublicProfile />} />
        <Route path="/:slug" element={<ProfileOrShortLink />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
