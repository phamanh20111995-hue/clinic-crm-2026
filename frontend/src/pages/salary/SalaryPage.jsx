import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import api from '../../api/client'
import { fmtMoney, fmtDateTime } from '../../utils/format'
import useAuthStore from '../../store/authStore'
import { getUserRole } from '../../utils/rolesV2'
import toast from 'react-hot-toast'

const ST_COLOR = { draft: 'gray', approved: 'green', paid: 'blue' }
const ST_LABEL = { draft: 'Nháp', approved: 'Đã duyệt', paid: 'Đã thanh toán' }

export default function SalaryPage() {
  const { user } = useAuthStore()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [calcLoading, setCalcLoading] = useState(false)

  const isHR = ['KE_TOAN','QUAN_LY','CHU_DN'].includes(getUserRole(user))

  const load = () => {
    setLoading(true)
    api.get('/api/salary/monthly/', { params: { year, month } })
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [year, month])

  const handleCalculate = async () => {
    setCalcLoading(true)
    try {
      const { data: res } = await api.post('/api/salary/calculate/', { month, year, overwrite: false })
      toast.success(`Đã tính lương: ${res.calculated} nhân viên`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi tính lương')
    } finally { setCalcLoading(false) }
  }

  const handleApprove = async (id, action) => {
    try {
      await api.post(`/api/salary/${id}/approve/`, { action })
      toast.success(action === 'approve' ? 'Đã duyệt lương' : 'Đã đánh dấu thanh toán')
      load()
    } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi') }
  }

  return (
    <DashboardLayout title="Bảng lương">
      <div className="space-y-4">
        {/* Period + actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <select className="input w-24 text-sm" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i+1} value={i+1}>Tháng {i+1}</option>
            ))}
          </select>
          <select className="input w-24 text-sm" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {isHR && (
            <button onClick={handleCalculate} disabled={calcLoading} className="btn-primary text-sm">
              {calcLoading ? '⏳ Đang tính...' : '⚙️ Tính lương tự động'}
            </button>
          )}
        </div>

        {/* Summary */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="card text-center py-3">
              <p className="text-2xl font-bold">{data.total_staff}</p>
              <p className="text-xs text-gray-500 mt-1">Nhân viên</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-lg font-bold text-primary-700">{fmtMoney(data.total_payout)}</p>
              <p className="text-xs text-gray-500 mt-1">Tổng chi lương</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-2xl font-bold text-green-700">{data.approved}</p>
              <p className="text-xs text-gray-500 mt-1">Đã duyệt</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-2xl font-bold text-blue-700">{data.paid}</p>
              <p className="text-xs text-gray-500 mt-1">Đã thanh toán</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : data?.records?.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            Chưa có bảng lương. {isHR && 'Nhấn "Tính lương tự động" để tạo.'}
          </div>
        ) : (
          <div className="card p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-th">Nhân viên</th>
                    <th className="table-th">Vai trò</th>
                    <th className="table-th">Lương CB</th>
                    <th className="table-th">Hoa hồng</th>
                    <th className="table-th">Tua</th>
                    <th className="table-th">Khấu trừ</th>
                    <th className="table-th font-bold">Thực lĩnh</th>
                    <th className="table-th">Trạng thái</th>
                    {isHR && <th className="table-th">Thao tác</th>}
                  </tr>
                </thead>
                <tbody>
                  {(data?.records ?? []).map(s => (
                    <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="table-td font-medium">{s.user_name}</td>
                      <td className="table-td text-gray-500 text-xs">{s.user_role}</td>
                      <td className="table-td">{fmtMoney(s.base)}</td>
                      <td className="table-td text-green-700">{fmtMoney(s.commission)}</td>
                      <td className="table-td text-green-700">{fmtMoney(s.tua_income)}</td>
                      <td className="table-td text-red-600">-{fmtMoney(s.deductions)}</td>
                      <td className="table-td font-bold text-primary-700">{fmtMoney(s.total)}</td>
                      <td className="table-td">
                        <Badge variant={ST_COLOR[s.status] ?? 'gray'}>{ST_LABEL[s.status] ?? s.status}</Badge>
                      </td>
                      {isHR && (
                        <td className="table-td">
                          <div className="flex gap-1">
                            {s.status === 'draft' && (
                              <button onClick={() => handleApprove(s.id, 'approve')}
                                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">
                                Duyệt
                              </button>
                            )}
                            {s.status === 'approved' && (
                              <button onClick={() => handleApprove(s.id, 'pay')}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">
                                Đã TT
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
