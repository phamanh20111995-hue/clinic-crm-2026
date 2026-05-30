import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'

import LoginPage        from './pages/auth/LoginPage'
import DashboardPage    from './pages/DashboardPage'
import CustomersPage    from './pages/customers/CustomersPage'
import TeleQueuePage    from './pages/tele/TeleQueuePage'
import AppointmentsPage from './pages/appointments/AppointmentsPage'
import RoomsPage        from './pages/rooms/RoomsPage'
import ContractsPage    from './pages/contracts/ContractsPage'
import AttendancePage   from './pages/attendance/AttendancePage'
import SalaryPage       from './pages/salary/SalaryPage'
import KpiPage          from './pages/kpi/KpiPage'
import ChatPage         from './pages/chat/ChatPage'

function PrivateRoute({ children }) {
  const user = useAuthStore(s => s.user)
  return user ? children : <Navigate to="/login" replace />
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
        <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/customers"    element={<PrivateRoute><CustomersPage /></PrivateRoute>} />
        <Route path="/tele-queue"   element={<PrivateRoute><TeleQueuePage /></PrivateRoute>} />
        <Route path="/appointments" element={<PrivateRoute><AppointmentsPage /></PrivateRoute>} />
        <Route path="/rooms"        element={<PrivateRoute><RoomsPage /></PrivateRoute>} />
        <Route path="/contracts"    element={<PrivateRoute><ContractsPage /></PrivateRoute>} />
        <Route path="/attendance"   element={<PrivateRoute><AttendancePage /></PrivateRoute>} />
        <Route path="/salary"       element={<PrivateRoute><SalaryPage /></PrivateRoute>} />
        <Route path="/kpi"          element={<PrivateRoute><KpiPage /></PrivateRoute>} />
        <Route path="/chat"         element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="*"             element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
