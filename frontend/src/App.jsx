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
import SchedulePage      from './pages/schedule/SchedulePage'
import HcnsPage          from './pages/hcns/HcnsPage'
import PlaceholderPage   from './components/common/PlaceholderPage'

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

// Shortcut: shell page bọc PrivateRoute
const Shell = (title, subtitle, icon) => (
  <PrivateRoute><PlaceholderPage title={title} subtitle={subtitle} icon={icon} /></PrivateRoute>
)

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
        <Route path="/lich-lam-viec" element={<PrivateRoute><SchedulePage /></PrivateRoute>} />

        {/* ── HCNS workspace (mới) ── */}
        <Route path="/hcns"         element={<PrivateRoute><HcnsPage /></PrivateRoute>} />

        {/* ── Module shell mới (Phase A — chưa nối backend) ── */}
        <Route path="/data"        element={Shell('Data', 'Quản lý data thô theo nguồn — tách từ Tele (cùng nguồn dữ liệu, khác view).', '🔀')} />
        <Route path="/bac-si-ktv"  element={Shell('Bác sĩ / KTV', 'Workspace chuyên môn Bác sĩ & KTV.', '🩺')} />
        <Route path="/quan-ly"     element={Shell('Quản lý', 'Khu điều hành của Quản lý cơ sở.', '🛡️')} />
        <Route path="/live-chat"   element={Shell('Live Chat', 'Chat với khách từ Facebook, Zalo, Website... (khác Chat nội bộ).', '💬')} />
        <Route path="/rio-rewards" element={Shell('RIO Rewards', 'Loyalty khách hàng: tích điểm, ví điểm, hạng, đổi quà, voucher, referral.', '🎁')} />
        <Route path="/rnd"         element={Shell('R&D', 'Nghiên cứu & phát triển dịch vụ/phác đồ: đề tài, SOP, pilot, safety.', '🧪')} />
        <Route path="/ai-hub"      element={Shell('AI Hub', 'Trung tâm công cụ AI dùng chung toàn CRM.', '🤖')} />
        <Route path="/bao-cao"     element={Shell('Báo cáo & Phân tích', 'Tổng hợp dữ liệu quan trọng từ nhiều bộ phận cho quản lý.', '📊')} />
        <Route path="/ket-noi"     element={Shell('Kết nối kênh', 'Kết nối Facebook, Zalo, Website, payment gateway...', '🔌')} />
        <Route path="/du-lieu"     element={Shell('Dữ liệu & Danh mục', 'Quản lý danh mục dùng chung: nguồn, tỉnh/thành, nhóm KH, dịch vụ...', '🗂️')} />
        <Route path="/cai-dat"     element={Shell('Cài đặt hệ thống', 'Cấu hình chung của CRM.', '⚙️')} />

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
