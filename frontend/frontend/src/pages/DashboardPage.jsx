import { useEffect, useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import Spinner from '../components/ui/Spinner'
import useAuthStore from '../store/authStore'
import { getKpiDashboard } from '../api/kpi'
import { getTodayAppointments } from '../api/appointments'
import { fmtMoney, fmtTime } from '../utils/format'

function StatCard({ label, value, sub, color = 'blue', icon }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-700',
    green:  'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    purple: 'bg-purple-50 text-purple-700',
  }
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const APPT_STATUS = {
  pending:     { label: 'Chờ',      color: 'bg-yellow-100 text-yellow-800' },
  confirmed:   { label: 'Đã đến',   color: 'bg-green-100 text-green-800' },
  in_progress: { label: 'Đang khám',color: 'bg-blue-100 text-blue-800' },
  done:        { label: 'Xong',     color: 'bg-gray-100 text-gray-700' },
  cancelled:   { label: 'Huỷ',      color: 'bg-red-100 text-red-800' },
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [kpi, setKpi] = useState(null)
  const [appts, setAppts] = useState([])
  const [loading, setLoading] = useState(true)

  const now = new Date()

  useEffect(() => {
    const load = async () => {
      try {
        const [kpiRes, apptRes] = await Promise.all([
          getKpiDashboard({ year: now.getFullYear(), month: now.getMonth() + 1 }).catch(() => null),
          getTodayAppointments().catch(() => ({ data: [] })),
        ])
        setKpi(kpiRes?.data ?? null)
        setAppts(Array.isArray(apptRes.data) ? apptRes.data : apptRes.data?.results ?? [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <DashboardLayout title="Dashboard">
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-6">
          {/* Greeting */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Chào, {user?.display_name ?? user?.email} 👋
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* KPI Stats */}
          {kpi?.funnel && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon="👥" label="KH mới tháng này" value={kpi.funnel.new_customers} color="blue" />
              <StatCard icon="📅" label="Lịch hẹn đã khám" value={kpi.funnel.appointments_done} color="green" />
              <StatCard icon="📋" label="HĐ đã duyệt" value={kpi.funnel.contracts_approved} color="purple" />
              <StatCard icon="💰" label="Doanh thu tháng" value={fmtMoney(kpi.funnel.total_revenue)} color="yellow"
                sub={`Tỷ lệ chốt: ${kpi.funnel.conversion_rate}%`} />
            </div>
          )}

          {/* Today appointments */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Lịch hẹn hôm nay</h3>
              <span className="text-sm text-gray-500">{appts.length} lịch</span>
            </div>
            {appts.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">Không có lịch hẹn hôm nay</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="table-th">Giờ</th>
                      <th className="table-th">Khách hàng</th>
                      <th className="table-th">Dịch vụ</th>
                      <th className="table-th">Phòng</th>
                      <th className="table-th">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appts.map((a) => {
                      const st = APPT_STATUS[a.status] ?? { label: a.status, color: 'bg-gray-100 text-gray-700' }
                      return (
                        <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="table-td font-mono font-medium">{fmtTime(a.scheduled_at)}</td>
                          <td className="table-td font-medium">{a.customer_name}</td>
                          <td className="table-td text-gray-500">{a.services?.join(', ') ?? '—'}</td>
                          <td className="table-td text-gray-500">{a.room_name ?? '—'}</td>
                          <td className="table-td">
                            <span className={`badge ${st.color}`}>{st.label}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
