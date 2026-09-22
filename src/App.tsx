import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useAuthListener } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { MarketingLayout } from '@/components/layout/MarketingLayout'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

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

export default function App() {
  useAuthListener()

  return (
    <BrowserRouter>
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

        <Route path="/u/:username" element={<PublicProfile />} />
        <Route path="/:slug" element={<ProfileOrShortLink />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
