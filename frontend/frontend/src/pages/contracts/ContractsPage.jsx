import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import ContractDetailModal from './ContractDetailModal'
import ContractFormModal from './ContractFormModal'
import { getContracts, submitContract, approveContract, rejectContract } from '../../api/contracts'
import { fmtMoney, fmtDateTime } from '../../utils/format'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

const APPROVAL = {
  draft:      { label: 'Nháp',        color: 'gray' },
  pending_kt: { label: 'Chờ KT duyệt',color: 'yellow' },
  approved:   { label: 'Đã duyệt',    color: 'green' },
  rejected:   { label: 'Từ chối',     color: 'red' },
}
const PAYMENT = {
  pending:  { label: 'Chưa thanh toán', color: 'yellow' },
  received: { label: 'Đã nhận',         color: 'green' },
  partial:  { label: 'Một phần',        color: 'orange' },
}

export default function ContractsPage() {
  const { user } = useAuthStore()
  const [contracts, setContracts] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page }
      if (statusFilter) params.approval_status = statusFilter
      const { data } = await getContracts(params)
      setContracts(data.results ?? data)
      setCount(data.count ?? data.length)
    } finally { setLoading(false) }
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  const canCreate = ['SALE','CSKH','LEAD_SALE','LEAD_CSKH','QUAN_LY','CHU_DN'].includes(user?.role)
  const isKT = ['KE_TOAN','QUAN_LY','CHU_DN'].includes(user?.role)

  const handleSubmit = async (id, e) => {
    e.stopPropagation()
    try {
      await submitContract(id)
      toast.success('Đã gửi lên KT duyệt')
      load()
    } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi') }
  }

  const handleApprove = async (id, e) => {
    e.stopPropagation()
    try {
      await approveContract(id)
      toast.success('Đã duyệt hợp đồng')
      load()
    } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi') }
  }

  const handleReject = async (id, e) => {
    e.stopPropagation()
    const reason = window.prompt('Lý do từ chối:')
    if (!reason) return
    try {
      await rejectContract(id, { reason })
      toast.success('Đã từ chối hợp đồng')
      load()
    } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi') }
  }

  return (
    <DashboardLayout title="Hợp đồng">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex gap-3 items-center justify-between">
          <div className="flex gap-2">
            <select className="input w-48 text-sm" value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
              <option value="">Tất cả trạng thái</option>
              {Object.entries(APPROVAL).map(([v, d]) => (
                <option key={v} value={v}>{d.label}</option>
              ))}
            </select>
          </div>
          {canCreate && (
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Tạo HĐ</button>
          )}
        </div>

        <div className="card p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : contracts.length === 0 ? (
            <EmptyState icon="📋" title="Chưa có hợp đồng" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-th">Số HĐ</th>
                    <th className="table-th">Khách hàng</th>
                    <th className="table-th">Dịch vụ</th>
                    <th className="table-th">Giá trị</th>
                    <th className="table-th">Thanh toán</th>
                    <th className="table-th">Duyệt</th>
                    <th className="table-th">Người tạo</th>
                    <th className="table-th">Ngày tạo</th>
                    <th className="table-th">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c) => {
                    const ap = APPROVAL[c.approval_status] ?? { label: c.approval_status, color: 'gray' }
                    const pm = PAYMENT[c.payment_status] ?? { label: c.payment_status, color: 'gray' }
                    return (
                      <tr key={c.id}
                        className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelected(c)}>
                        <td className="table-td font-mono text-primary-700 font-medium">{c.contract_no}</td>
                        <td className="table-td font-medium">{c.customer_name}</td>
                        <td className="table-td text-gray-500 max-w-xs truncate">
                          {c.items?.map(i => i.service_name ?? i.name).join(', ') ?? '—'}
                        </td>
                        <td className="table-td font-semibold">{fmtMoney(c.final_amount)}</td>
                        <td className="table-td"><Badge variant={pm.color}>{pm.label}</Badge></td>
                        <td className="table-td"><Badge variant={ap.color}>{ap.label}</Badge></td>
                        <td className="table-td text-gray-500">{c.created_by_name}</td>
                        <td className="table-td text-gray-400">{fmtDateTime(c.created_at)}</td>
                        <td className="table-td" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1">
                            {c.approval_status === 'draft' && (
                              <button onClick={(e) => handleSubmit(c.id, e)}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">
                                Gửi KT
                              </button>
                            )}
                            {isKT && c.approval_status === 'pending_kt' && (
                              <>
                                <button onClick={(e) => handleApprove(c.id, e)}
                                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">
                                  Duyệt
                                </button>
                                <button onClick={(e) => handleReject(c.id, e)}
                                  className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">
                                  Từ chối
                                </button>
                              </>
                            )}
                          </div>
                        </td>
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

      {selected && (
        <ContractDetailModal contract={selected} onClose={() => { setSelected(null); load() }} />
      )}
      {showForm && (
        <ContractFormModal onClose={() => { setShowForm(false); load() }} />
      )}
    </DashboardLayout>
  )
}
