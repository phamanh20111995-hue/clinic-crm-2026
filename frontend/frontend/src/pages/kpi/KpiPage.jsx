import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Spinner from '../../components/ui/Spinner'
import useAuthStore from '../../store/authStore'
import { getKpiDashboard, getKpiTele, getKpiSale, getKpiTrucPage } from '../../api/kpi'
import { fmtMoney } from '../../utils/format'

function PctBar({ value, max = 100, color = 'blue' }) {
  const pct = Math.min(value ?? 0, 150)
  const colors = { blue: 'bg-blue-500', green: 'bg-green-500', yellow: 'bg-yellow-500', red: 'bg-red-500' }
  const c = value >= 100 ? 'green' : value >= 70 ? 'blue' : value >= 40 ? 'yellow' : 'red'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full transition-all ${colors[c]}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-bold w-10 text-right ${value >= 100 ? 'text-green-700' : 'text-gray-600'}`}>
        {value ?? '—'}%
      </span>
    </div>
  )
}

function FunnelCard({ data }) {
  if (!data) return null
  const steps = [
    { label: 'Lead mới',       value: data.new_leads ?? data.new_customers, icon: '👥' },
    { label: 'Đã gọi điện',   value: data.leads_called, icon: '📞' },
    { label: 'Đặt lịch',       value: data.appointments_created, icon: '📅' },
    { label: 'Đã khám',        value: data.appointments_done, icon: '🏥' },
    { label: 'Ký HĐ',          value: data.contracts_approved, icon: '📋' },
  ]
  const max = steps[0]?.value || 1
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-800 mb-4">Phễu chuyển đổi</h3>
      <div className="space-y-3">
        {steps.map((s, i) => s.value != null && (
          <div key={i} className="flex items-center gap-3">
            <span className="text-base w-6 text-center">{s.icon}</span>
            <span className="text-sm text-gray-600 w-28">{s.label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
              <div
                className="h-5 rounded-full bg-gradient-to-r from-primary-500 to-primary-400 flex items-center justify-end pr-2 transition-all"
                style={{ width: `${Math.max((s.value / max) * 100, 4)}%` }}>
                <span className="text-white text-xs font-bold">{s.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {data.total_revenue != null && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
          <span className="text-gray-500">Tổng doanh thu</span>
          <span className="font-bold text-primary-700">{fmtMoney(data.total_revenue)}</span>
        </div>
      )}
    </div>
  )
}

export default function KpiPage() {
  const { user } = useAuthStore()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('dashboard')

  const canSeeTrucPage = ['QUAN_LY','CHU_DN','KE_TOAN','LEAD_SALE'].includes(user?.role)
  const canSeeTele = ['QUAN_LY','CHU_DN','KE_TOAN','LEAD_TELE','TELE'].includes(user?.role)
  const canSeeSale = ['QUAN_LY','CHU_DN','KE_TOAN','LEAD_SALE','SALE'].includes(user?.role)

  useEffect(() => {
    const params = { year, month }
    setLoading(true)
    const fetchers = {
      dashboard: getKpiDashboard,
      tele:      getKpiTele,
      sale:      getKpiSale,
      truc_page: getKpiTrucPage,
    }
    ;(fetchers[tab] ?? getKpiDashboard)(params)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [year, month, tab])

  const tabs = [
    { id: 'dashboard', label: '📊 Tổng hợp' },
    ...(canSeeTele    ? [{ id: 'tele',      label: '📞 Tele' }] : []),
    ...(canSeeSale    ? [{ id: 'sale',      label: '💼 Sale' }] : []),
    ...(canSeeTrucPage? [{ id: 'truc_page', label: '🔍 Trực page' }] : []),
  ]

  return (
    <DashboardLayout title="KPI Dashboard">
      <div className="space-y-4">
        {/* Period picker */}
        <div className="flex items-center gap-3">
          <select className="input w-24 text-sm" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i+1} value={i+1}>Tháng {i+1}</option>
            ))}
          </select>
          <select className="input w-24 text-sm" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="text-sm text-gray-500">Tháng {month}/{year}</span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>{t.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : !data ? (
          <div className="card text-center py-12 text-gray-400">Không có dữ liệu</div>
        ) : (
          <div className="space-y-4">
            {/* Dashboard: funnel + staff table */}
            {tab === 'dashboard' && (
              <>
                {data.funnel && <FunnelCard data={data.funnel} />}
                {data.staff?.length > 0 && (
                  <div className="card p-0">
                    <div className="px-5 py-3 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-800">KPI Nhân viên</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="table-th">Nhân viên</th>
                            <th className="table-th">Vai trò</th>
                            <th className="table-th">Gọi điện</th>
                            <th className="table-th">Lịch hẹn</th>
                            <th className="table-th">HĐ</th>
                            <th className="table-th">Doanh thu</th>
                            <th className="table-th">% KPI</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.staff.map(s => (
                            <tr key={s.id} className="border-t border-gray-50">
                              <td className="table-td font-medium">{s.user_name}</td>
                              <td className="table-td text-gray-500 text-xs">{s.user_role}</td>
                              <td className="table-td">{s.calls_actual}/{s.calls_target || '—'}</td>
                              <td className="table-td">{s.appointments_actual}/{s.appointments_target || '—'}</td>
                              <td className="table-td">{s.contracts_actual}/{s.contracts_target || '—'}</td>
                              <td className="table-td">{fmtMoney(s.revenue_actual)}</td>
                              <td className="table-td w-32"><PctBar value={s.achievement_rate} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Tele */}
            {tab === 'tele' && data.tele?.length > 0 && (
              <div className="card p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="table-th">Tele</th>
                        <th className="table-th">Tổng cuộc gọi</th>
                        <th className="table-th">KH tiếp cận</th>
                        <th className="table-th">Lịch hẹn đặt</th>
                        <th className="table-th">Tỷ lệ chuyển đổi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.tele.map(t => (
                        <tr key={t.user_id} className="border-t border-gray-50">
                          <td className="table-td font-medium">{t.user_name}</td>
                          <td className="table-td">{t.total_calls}</td>
                          <td className="table-td">{t.unique_customers_called}</td>
                          <td className="table-td">{t.appointments_booked}</td>
                          <td className="table-td">
                            <PctBar value={t.conversion_rate} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sale */}
            {tab === 'sale' && data.sale?.length > 0 && (
              <div className="card p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="table-th">Sale</th>
                        <th className="table-th">KH assign</th>
                        <th className="table-th">HĐ duyệt</th>
                        <th className="table-th">Doanh thu</th>
                        <th className="table-th">Pipeline</th>
                        <th className="table-th">Close rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sale.map(s => (
                        <tr key={s.user_id} className="border-t border-gray-50">
                          <td className="table-td font-medium">{s.user_name}</td>
                          <td className="table-td">{s.customers_assigned}</td>
                          <td className="table-td">{s.contracts_approved}</td>
                          <td className="table-td font-medium">{fmtMoney(s.revenue)}</td>
                          <td className="table-td text-yellow-600">{s.pipeline} HĐ đang chờ</td>
                          <td className="table-td w-32"><PctBar value={s.close_rate} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Trực page */}
            {tab === 'truc_page' && data.funnel && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FunnelCard data={data.funnel} />
                {data.conversion && (
                  <div className="card">
                    <h3 className="font-semibold text-gray-800 mb-4">Tỷ lệ chuyển đổi</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Lead → Gọi điện',     value: data.conversion.lead_to_call },
                        { label: 'Gọi → Đặt lịch',      value: data.conversion.call_to_appointment },
                        { label: 'Đặt → Đã khám',       value: data.conversion.appointment_to_done },
                        { label: 'Khám → Ký HĐ',        value: data.conversion.done_to_contract },
                        { label: 'Tổng (Lead → HĐ)',    value: data.conversion.overall },
                      ].map((r, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">{r.label}</span>
                          </div>
                          <PctBar value={r.value} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {data.sources?.length > 0 && (
                  <div className="card lg:col-span-2">
                    <h3 className="font-semibold text-gray-800 mb-3">Nguồn khách hàng</h3>
                    <div className="flex flex-wrap gap-3">
                      {data.sources.map((s, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg px-4 py-3 text-center min-w-[100px]">
                          <p className="text-2xl font-bold text-primary-700">{s.count}</p>
                          <p className="text-xs text-gray-500 mt-1">{s.source}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
