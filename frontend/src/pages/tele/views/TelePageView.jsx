import { useState, useEffect, useCallback } from 'react'
import { getPageStats } from '../../../api/tele'
import StatCard from '../components/StatCard'
import CustomerTable from '../../../components/customers/CustomerTable'

const ACCENT = '#0369a1'

function fmtMoney(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('vi') + ' ₫'
}

export default function TelePageView({ onNewData, reloadKey }) {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getPageStats()
      setStats(data)
    } catch {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '24px 20px 0' }}>
      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))',
        gap: 12, marginBottom: 16, flexShrink: 0,
      }}>
        <StatCard label="Tổng data"             value={loading ? '…' : (stats?.total ?? 0)}        accent={ACCENT} />
        <StatCard label="Đặt lịch"              value={loading ? '…' : (stats?.dat_lich ?? 0)}     accent="#15803d" />
        <StatCard label="Data nóng hôm nay"     value={loading ? '…' : (stats?.nong_today ?? 0)}   accent="#dc2626" />
        <StatCard label="Giá trị HĐ vòng 1"    value={loading ? '…' : fmtMoney(stats?.round1_value)}  accent="#6d28d9" />
        <StatCard label="Đã thu"                value={loading ? '…' : fmtMoney(stats?.round1_paid)}   accent="#0f766e" />
        <StatCard label="Còn nợ"                value={loading ? '…' : fmtMoney(stats?.round1_debt)}   accent="#d97706" />
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <CustomerTable baseParams={{}} reloadKey={reloadKey} fromContext="tele" />
      </div>
    </div>
  )
}
