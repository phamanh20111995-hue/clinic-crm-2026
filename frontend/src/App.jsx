import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'
import { getUserRole, getHomeRoute } from './utils/rolesV2'

import LoginPage        from './pages/auth/LoginPage'
import LayoutDemoPage   from './pages/demo/LayoutDemoPage'
import TelePage         from './pages/tele/TelePage'
import DashboardPage    from './pages/DashboardPage'
import CustomersPage    from './pages/customers/CustomersPage'
import TeleQueuePage    from './pages/tele/TeleQueuePage'
import AppointmentsPage from './pages/appointments/AppointmentsPage'
import RoomsPage        from './pages/rooms/RoomsPage'
import ContractsPage    from './pages/contracts/ContractsPage'
import AttendancePage   from './pages/attendance/AttendancePage'
import SalaryPage       from './pages/salary/SalaryPage'
import LetanPage        from './pages/letan/LetanPage'
import KpiPage          from './pages/kpi/KpiPage'
import ChatPage         from './pages/chat/ChatPage'
import CustomerDetailPage from './pages/customer-detail/CustomerDetailPage'
import SalePage          from './pages/sale/SalePage'
import KetoanPage        from './pages/ketoan/KetoanPage'
import MarketingPage     from './pages/marketing/MarketingPage'
import CskhPage          from './pages/cskh/CskhPage'

function PrivateRoute({ children }) {
  const user = useAuthStore(s => s.user)
  return user ? children : <Navigate to="/login" replace />
}

// Redirect `/` to each role's home screen instead of the old v1 Dashboard
function HomeRedirect() {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  const home = getHomeRoute(getUserRole(user))
  return <Navigate to={home} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontSize: '14px', maxWidth: '380px' },
          success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Root → role-based redirect */}
        <Route path="/" element={<HomeRedirect />} />

        {/* ── v2 screens ── */}
        <Route path="/tele"         element={<PrivateRoute><TelePage /></PrivateRoute>} />
        <Route path="/letan"        element={<PrivateRoute><LetanPage /></PrivateRoute>} />
        <Route path="/sale"         element={<PrivateRoute><SalePage /></PrivateRoute>} />
        <Route path="/ketoan"       element={<PrivateRoute><KetoanPage /></PrivateRoute>} />
        <Route path="/marketing"    element={<PrivateRoute><MarketingPage /></PrivateRoute>} />
        <Route path="/cskh"         element={<PrivateRoute><CskhPage /></PrivateRoute>} />
        <Route path="/kpi"          element={<PrivateRoute><KpiPage /></PrivateRoute>} />
        <Route path="/customers"    element={<PrivateRoute><CustomersPage /></PrivateRoute>} />
        <Route path="/customers/:id"element={<PrivateRoute><CustomerDetailPage /></PrivateRoute>} />
        <Route path="/chat"         element={<PrivateRoute><ChatPage /></PrivateRoute>} />

        {/* ── v1 screens kept alive (not linked from sidebar) ── */}
        <Route path="/tele-queue"   element={<PrivateRoute><TeleQueuePage /></PrivateRoute>} />
        <Route path="/appointments" element={<PrivateRoute><AppointmentsPage /></PrivateRoute>} />
        <Route path="/rooms"        element={<PrivateRoute><RoomsPage /></PrivateRoute>} />
        <Route path="/contracts"    element={<PrivateRoute><ContractsPage /></PrivateRoute>} />
        <Route path="/attendance"   element={<PrivateRoute><AttendancePage /></PrivateRoute>} />
        <Route path="/salary"       element={<PrivateRoute><SalaryPage /></PrivateRoute>} />
        <Route path="/dashboard"    element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/layout-demo"  element={<PrivateRoute><LayoutDemoPage /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
