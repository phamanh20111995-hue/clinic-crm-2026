import { useState, useEffect, useCallback } from 'react'
import { getCustomers } from '../../../api/tele'
import StatCard from '../components/StatCard'
import CustomerTable from '../../../components/customers/CustomerTable'

const ACCENT = '#6d28d9'

export default function TrucPageView({ onNewData, reloadKey }) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getCustomers({ page_size: 100 })
      setCustomers(data?.results ?? data ?? [])
    } catch {
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const todayStr = new Date().toDateString()
  const todayData   = customers.filter(c => new Date(c.created_at).toDateString() === todayStr)
  const withPhone   = customers.filter(c => c.phone && c.phone.trim() !== '')
  const waitingImg  = customers.filter(c => c.phone && !c.tele)
  const hotToday    = customers.filter(c =>
    c.data_type === 'nong' && new Date(c.created_at).toDateString() === todayStr
  )

  return (
    <div>
      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))',
        gap: 12, marginBottom: 16,
      }}>
        <StatCard label="Data nhập hôm nay" value={loading ? '…' : todayData.length} accent={ACCENT} />
        <StatCard label="Đã lấy SĐT"         value={loading ? '…' : withPhone.length} accent="#15803d" />
        <StatCard label="Đang chờ ảnh"        value={loading ? '…' : waitingImg.length} accent="#d97706"
          sub="Có SĐT, chưa giao Tele" />
        <StatCard label="Data nóng hôm nay"   value={loading ? '…' : hotToday.length} accent="#dc2626" />
      </div>

      <CustomerTable baseParams={{}} reloadKey={reloadKey} />
    </div>
  )
}
