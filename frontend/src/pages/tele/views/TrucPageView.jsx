import { useState, useEffect, useCallback } from 'react'
import { getCustomers, getPageStats } from '../../../api/tele'
import StatCard from '../components/StatCard'
import CustomerTable from '../../../components/customers/CustomerTable'

const ACCENT = '#6d28d9'

export default function TrucPageView({ onNewData, reloadKey }) {
  const [stats, setStats]         = useState(null)
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, custRes] = await Promise.all([
        getPageStats(),
        getCustomers({ page_size: 100 }),
      ])
      setStats(statsRes.data)
      setCustomers(custRes.data?.results ?? custRes.data ?? [])
    } catch {
      setStats(null)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const todayStr  = new Date().toDateString()
  const todayData = customers.filter(c => new Date(c.created_at).toDateString() === todayStr)
  const waitingImg = customers.filter(c => c.phone && !c.tele)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '24px 20px 0' }}>
      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))',
        gap: 12, marginBottom: 16, flexShrink: 0,
      }}>
        <StatCard label="Tổng data"           value={loading ? '…' : (stats?.total ?? 0)} accent={ACCENT} />
        <StatCard label="Data nhập hôm nay"   value={loading ? '…' : todayData.length} accent="#15803d" />
        <StatCard label="Đặt lịch"            value={loading ? '…' : (stats?.dat_lich ?? 0)} accent="#0369a1" />
        <StatCard label="Đang chờ ảnh"        value={loading ? '…' : waitingImg.length} accent="#d97706"
          sub="Có SĐT, chưa giao Tele" />
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <CustomerTable baseParams={{}} reloadKey={reloadKey} hideMoneyColumns fromContext="truc" />
      </div>
    </div>
  )
}
