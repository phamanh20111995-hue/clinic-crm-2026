import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import api from '../../api/client'
import { fmtDate } from '../../utils/format'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

const STATUS_COLOR = {
  on_time: 'green', late: 'yellow', early: 'orange', absent: 'red', leave: 'blue',
}
const STATUS_LABEL = {
  on_time: 'Đúng giờ', late: 'Đi muộn', early: 'Về sớm', absent: 'Vắng', leave: 'Nghỉ phép',
}

export default function AttendancePage() {
  const { user } = useAuthStore()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('monthly')
  const [leaves, setLeaves] = useState([])
  const [leaveForm, setLeaveForm] = useState({ start_date: '', end_date: '', leave_type: 'annual', reason: '' })
  const [leaveLoading, setLeaveLoading] = useState(false)

  const isHR = ['KE_TOAN','QUAN_LY','CHU_DN'].includes(user?.role)

  const loadMonthly = () => {
    setLoading(true)
    api.get('/api/attendance/monthly/', { params: { year, month } })
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }

  const loadLeaves = () => {
    api.get('/api/attendance/leaves/')
      .then(r => setLeaves(r.data?.results ?? r.data ?? []))
      .catch(() => {})
  }

  useEffect(() => { if (tab === 'monthly') loadMonthly() }, [year, month, tab])
  useEffect(() => { if (tab === 'leaves') loadLeaves() }, [tab])

  const handleLeaveSubmit = async (e) => {
    e.preventDefault()
    setLeaveLoading(true)
    try {
      await api.post('/api/attendance/leaves/', leaveForm)
      toast.success('Đã gửi đơn nghỉ phép')
      setLeaveForm({ start_date: '', end_date: '', leave_type: 'annual', reason: '' })
      loadLeaves()
    } catch (err) {
      toast.error(Object.values(err.response?.data ?? {}).flat().join(' ') || 'Lỗi')
    } finally { setLeaveLoading(false) }
  }

  const handleApproveLeave = async (id, action) => {
    const reason = action === 'reject' ? window.prompt('Lý do từ chối:') : undefined
    if (action === 'reject' && !reason) return
    try {
      await api.post(`/api/attendance/leaves/${id}/approve/`, { action, reason })
      toast.success(action === 'approve' ? 'Đã duyệt' : 'Đã từ chối')
      loadLeaves()
    } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi') }
  }

  return (
    <DashboardLayout title="Chấm công">
      <div className="space-y-4">
        <div className="flex border-b border-gray-200 gap-1">
          {[
            { id: 'monthly', label: '📅 Tháng này' },
            { id: 'leaves',  label: '🏖 Nghỉ phép' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>{t.label}</button>
          ))}
        </div>

        {tab === 'monthly' && (
          <>
            <div className="flex items-center gap-3">
              <select className="input w-24 text-sm" value={month} onChange={e => setMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i+1} value={i+1}>T{i+1}</option>
                ))}
              </select>
              <select className="input w-24 text-sm" value={year} onChange={e => setYear(Number(e.target.value))}>
                {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <button onClick={loadMonthly} className="btn-secondary text-sm px-3 py-2">🔄 Làm mới</button>
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : data && (
              <>
                {/* Summary */}
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { label: 'Đúng giờ', value: data.on_time,  color: 'green' },
                    { label: 'Đi muộn', value: data.late,    color: 'yellow' },
                    { label: 'Về sớm',  value: data.early,   color: 'orange' },
                    { label: 'Vắng mặt', value: data.absent,  color: 'red' },
                    { label: 'Nghỉ phép', value: data.leave,   color: 'blue' },
                  ].map(s => (
                    <div key={s.label} className="card text-center py-3">
                      <p className="text-xl font-bold text-gray-900">{s.value}</p>
                      <Badge variant={s.color} className="mt-1">{s.label}</Badge>
                    </div>
                  ))}
                </div>

                {/* Records table */}
                <div className="card p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="table-th">Ngày</th>
                          {isHR && <th className="table-th">Nhân viên</th>}
                          <th className="table-th">Vào</th>
                          <th className="table-th">Ra</th>
                          <th className="table-th">Trạng thái</th>
                          <th className="table-th">Muộn (phút)</th>
                          <th className="table-th">Nguồn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data.records ?? []).map(r => (
                          <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50">
                            <td className="table-td font-mono">{fmtDate(r.date)}</td>
                            {isHR && <td className="table-td">{r.user_name}</td>}
                            <td className="table-td font-mono">{r.check_in ?? '—'}</td>
                            <td className="table-td font-mono">{r.check_out ?? '—'}</td>
                            <td className="table-td">
                              <Badge variant={STATUS_COLOR[r.status] ?? 'gray'}>
                                {STATUS_LABEL[r.status] ?? r.status}
                              </Badge>
                            </td>
                            <td className="table-td text-center">{r.late_minutes || '—'}</td>
                            <td className="table-td text-gray-400 text-xs">{r.source_display}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {tab === 'leaves' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Form đăng ký */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Đăng ký nghỉ phép</h3>
              <form onSubmit={handleLeaveSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày *</label>
                  <input type="date" required className="input" value={leaveForm.start_date}
                    onChange={e => setLeaveForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày *</label>
                  <input type="date" required className="input" value={leaveForm.end_date}
                    onChange={e => setLeaveForm(f => ({ ...f, end_date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại phép</label>
                  <select className="input" value={leaveForm.leave_type}
                    onChange={e => setLeaveForm(f => ({ ...f, leave_type: e.target.value }))}>
                    <option value="annual">Phép năm</option>
                    <option value="sick">Phép bệnh</option>
                    <option value="unpaid">Không lương</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lý do *</label>
                  <textarea required className="input resize-none" rows={2} value={leaveForm.reason}
                    onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))} />
                </div>
                <button type="submit" disabled={leaveLoading} className="btn-primary w-full text-sm">
                  {leaveLoading ? 'Đang gửi...' : '📤 Gửi đơn'}
                </button>
              </form>
            </div>

            {/* Danh sách đơn */}
            <div className="lg:col-span-2 space-y-3">
              {leaves.length === 0 ? (
                <div className="card text-center py-10 text-gray-400">Chưa có đơn nghỉ phép</div>
              ) : leaves.map(l => (
                <div key={l.id} className="card">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{l.user_name}</p>
                      <p className="text-sm text-gray-500">{fmtDate(l.start_date)} — {fmtDate(l.end_date)}</p>
                      <p className="text-sm text-gray-600 mt-1">{l.reason}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={l.status === 'approved' ? 'green' : l.status === 'rejected' ? 'red' : 'yellow'}>
                        {l.status === 'approved' ? 'Đã duyệt' : l.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                      </Badge>
                      {isHR && l.status === 'pending' && (
                        <div className="flex gap-1">
                          <button onClick={() => handleApproveLeave(l.id, 'approve')}
                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">
                            Duyệt
                          </button>
                          <button onClick={() => handleApproveLeave(l.id, 'reject')}
                            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">
                            Từ chối
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
