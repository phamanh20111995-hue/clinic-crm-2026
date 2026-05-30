import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import CustomerDetailModal from './CustomerDetailModal'
import CustomerFormModal from './CustomerFormModal'
import { getCustomers } from '../../api/customers'
import { fmtPhone, fmtDate } from '../../utils/format'

const STATUS_COLORS = {
  moi: 'blue', dang_tu_van: 'yellow', da_tu_van: 'yellow',
  dat_lich: 'green', da_den: 'green', dang_dieu_tri: 'purple',
  hoan_thanh: 'green', hoan_so: 'orange', sai_so: 'red',
  khong_lien_lac: 'gray', tu_choi: 'red',
}
const STATUS_LABELS = {
  moi: 'Mới', dang_tu_van: 'Đang tư vấn', da_tu_van: 'Đã tư vấn',
  dat_lich: 'Đặt lịch', da_den: 'Đã đến', dang_dieu_tri: 'Điều trị',
  hoan_thanh: 'Hoàn thành', hoan_so: 'Hoàn số', sai_so: 'Sai số',
  khong_lien_lac: 'Không liên lạc', tu_choi: 'Từ chối',
}
const DATA_TYPE_COLORS = { nong: 'red', am: 'yellow', thuong: 'gray' }
const DATA_TYPE_LABELS = { nong: '🔥 Nóng', am: '🌤 Âm', thuong: '❄ Thường' }

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: 20 }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const { data } = await getCustomers(params)
      setCustomers(data.results ?? data)
      setCount(data.count ?? data.length)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => { load() }, [load])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    load()
  }

  return (
    <DashboardLayout title="Khách hàng">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              className="input w-64"
              placeholder="Tìm tên, SĐT, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="input w-40"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <button type="submit" className="btn-primary px-4 py-2 text-sm">🔍 Tìm</button>
          </form>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Thêm KH</button>
        </div>

        {/* Table */}
        <div className="card p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-th">Tên</th>
                    <th className="table-th">SĐT</th>
                    <th className="table-th">Nguồn</th>
                    <th className="table-th">Loại data</th>
                    <th className="table-th">Trạng thái</th>
                    <th className="table-th">Sale</th>
                    <th className="table-th">Tele</th>
                    <th className="table-th">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-400">Không có dữ liệu</td></tr>
                  ) : customers.map((c) => (
                    <tr
                      key={c.id}
                      className="border-t border-gray-50 hover:bg-blue-50/50 cursor-pointer transition-colors"
                      onClick={() => setSelected(c)}
                    >
                      <td className="table-td font-medium text-primary-700 hover:underline">
                        {c.full_name}
                      </td>
                      <td className="table-td font-mono">{fmtPhone(c.phone)}</td>
                      <td className="table-td text-gray-500">{c.source}</td>
                      <td className="table-td">
                        <Badge variant={DATA_TYPE_COLORS[c.data_type] ?? 'gray'}>
                          {DATA_TYPE_LABELS[c.data_type] ?? c.data_type}
                        </Badge>
                      </td>
                      <td className="table-td">
                        <Badge variant={STATUS_COLORS[c.status] ?? 'gray'}>
                          {STATUS_LABELS[c.status] ?? c.status}
                        </Badge>
                      </td>
                      <td className="table-td text-gray-500">{c.sale_name ?? '—'}</td>
                      <td className="table-td text-gray-500">{c.tele_name ?? '—'}</td>
                      <td className="table-td text-gray-400">{fmtDate(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Pagination page={page} count={count} onChange={setPage} />
      </div>

      {selected && (
        <CustomerDetailModal
          customer={selected}
          onClose={() => { setSelected(null); load() }}
        />
      )}
      {showForm && (
        <CustomerFormModal
          onClose={() => { setShowForm(false); load() }}
        />
      )}
    </DashboardLayout>
  )
}
