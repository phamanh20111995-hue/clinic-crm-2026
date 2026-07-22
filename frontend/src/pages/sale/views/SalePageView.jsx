import { useState, useEffect, useCallback } from 'react'
import { getSaleStats } from '../../../api/sale'
import StatCard from '../../tele/components/StatCard'
import CustomerTable from '../../../components/customers/CustomerTable'

const ACCENT = '#15803d'

function fmtMoney(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('vi') + ' ₫'
}

export default function SalePageView({ reloadKey }) {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getSaleStats()
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
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))',
        gap: 12, marginBottom: 16, flexShrink: 0,
      }}>
        <StatCard label="Khách của tôi"    value={loading ? '…' : (stats?.total ?? 0)}               accent={ACCENT} />
        <StatCard label="Chốt hôm nay"     value={loading ? '…' : (stats?.chot_today ?? 0)}          accent="#15803d" />
        <StatCard label="HĐ chờ duyệt"     value={loading ? '…' : (stats?.hd_pending ?? 0)}          accent="#0369a1" />
        <StatCard label="Doanh thu tháng"  value={loading ? '…' : fmtMoney(stats?.revenue_month)}    accent="#6d28d9" />
        <StatCard label="Đã thu"           value={loading ? '…' : fmtMoney(stats?.paid)}             accent="#0f766e" />
        <StatCard label="Công nợ"          value={loading ? '…' : fmtMoney(stats?.debt)}             accent="#d97706" />
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <CustomerTable baseParams={{ is_customer: true }} reloadKey={reloadKey} fromContext="sale" />
      </div>
    </div>
  )
}
