import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import CustomerTable from '../../components/customers/CustomerTable'
import StatCard from '../tele/components/StatCard'
import { getCustomersStats } from '../../api/customers'

const ACCENT = '#6d28d9'

function fmtMoney(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('vi') + ' ₫'
}

export default function CustomersPage() {
  const [count, setCount] = useState(0)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getCustomersStats()
      setStats(data)
    } catch {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <AppLayout
      title="Khách hàng"
      meta={`${count} khách`}
      bare
    >
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '24px 20px 0' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))',
          gap: 12, marginBottom: 16, flexShrink: 0,
        }}>
          <StatCard label="Tổng khách"       value={loading ? '…' : (stats?.total ?? 0)}         accent={ACCENT} />
          <StatCard label="Khách mới tháng"  value={loading ? '…' : (stats?.new_month ?? 0)}     accent="#0369a1" />
          <StatCard label="Đang chăm sóc"    value={loading ? '…' : (stats?.cham_soc ?? 0)}      accent="#d97706" />
          <StatCard label="Tổng doanh thu"   value={loading ? '…' : fmtMoney(stats?.revenue)}    accent="#15803d" />
          <StatCard label="Đã thu"           value={loading ? '…' : fmtMoney(stats?.paid)}       accent="#0f766e" />
          <StatCard label="Còn nợ"           value={loading ? '…' : fmtMoney(stats?.debt)}       accent="#dc2626" />
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <CustomerTable baseParams={{ is_customer: true }} onCountChange={setCount} />
        </div>
      </div>
    </AppLayout>
  )
}