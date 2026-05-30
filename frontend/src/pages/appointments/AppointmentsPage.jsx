import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import { getAppointments, checkinAppointment } from '../../api/appointments'
import { fmtDateTime, fmtPhone } from '../../utils/format'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'

const STATUS = {
  pending:     { label: 'Chờ xác nhận', color: 'yellow' },
  confirmed:   { label: 'Đã xác nhận',  color: 'blue' },
  in_progress: { label: 'Đang khám',    color: 'purple' },
  done:        { label: 'Hoàn thành',   color: 'green' },
  cancelled:   { label: 'Đã huỷ',      color: 'red' },
}

export default function AppointmentsPage() {
  const { user } = useAuthStore()
  const [appts, setAppts] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [dateFilter, setDateFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page }
      if (dateFilter) params.date = dateFilter
      const { data } = await getAppointments(params)
      setAppts(data.results ?? data)
      setCount(data.count ?? data.length)
    } finally { setLoading(false) }
  }, [page, dateFilter])

  useEffect(() => { load() }, [load])

  const handleCheckin = async (id) => {
    try {
      await checkinAppointment(id)
      toast.success('Đã check-in thành công')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi check-in')
    }
  }

  const isLeTan = ['LE_TAN', 'QUAN_LY', 'CHU_DN'].includes(user?.role)

  return (
    <DashboardLayout title="Lịch hẹn">
      <div className="space-y-4">
        <div className="flex gap-3 items-center">
          <input type="date" className="input w-44" value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1) }} />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="btn-secondary text-sm px-3 py-2">✕ Xoá lọc</button>
          )}
        </div>

        <div className="card p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : appts.length === 0 ? (
            <EmptyState icon="📅" title="Chưa có lịch hẹn" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-th">Thời gian</th>
                    <th className="table-th">Khách hàng</th>
                    <th className="table-th">SĐT</th>
                    <th className="table-th">Dịch vụ</th>
                    <th className="table-th">Phòng</th>
                    <th className="table-th">Trạng thái</th>
                    {isLeTan && <th className="table-th">Thao tác</th>}
                  </tr>
                </thead>
                <tbody>
                  {appts.map((a) => {
                    const st = STATUS[a.status] ?? { label: a.status, color: 'gray' }
                    return (
                      <tr key={a.id} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="table-td font-mono">{fmtDateTime(a.scheduled_at)}</td>
                        <td className="table-td font-medium">{a.customer_name}</td>
                        <td className="table-td font-mono text-gray-500">{fmtPhone(a.customer_phone)}</td>
                        <td className="table-td text-gray-500 max-w-xs truncate">{a.services?.join(', ') ?? '—'}</td>
                        <td className="table-td text-gray-500">{a.room_name ?? '—'}</td>
                        <td className="table-td">
                          <Badge variant={st.color}>{st.label}</Badge>
                          {a.tua_confirmed && <Badge variant="green" className="ml-1">✓ Tua</Badge>}
                        </td>
                        {isLeTan && (
                          <td className="table-td">
                            {a.status === 'pending' && (
                              <button onClick={() => handleCheckin(a.id)}
                                className="text-xs btn-primary px-2 py-1">Check-in</button>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <Pagination page={page} count={count} onChange={setPage} />
      </div>
    </DashboardLayout>
  )
}
