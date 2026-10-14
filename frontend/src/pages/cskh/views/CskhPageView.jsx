import { useState, useEffect, useCallback } from 'react'
import { getCskhStats } from '../../../api/cskh'
import StatCard from '../../tele/components/StatCard'
import CustomerTable from '../../../components/customers/CustomerTable'

const ACCENT = '#be185d'
const CSKH_COLUMNS = [
  'full_name', 'phone', 'source', 'customer_group', 'province', 'gender',
  'services_interest_names', 'services_bought_names',
  'care_status', 'can_lien_he', 'buoi_con_lai', 'last_treat_date', 'last_care_date',
  'appointment_date', 'appointment_time', 'next_course',
  'sale_name', 'cskh_name', 'last_bs_name', 'total_debt',
]

export default function CskhPageView({ reloadKey }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getCskhStats()
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
        <StatCard label="Tổng khách của tôi"  value={loading ? '…' : (stats?.total ?? 0)}            accent={ACCENT} />
        <StatCard label="Chăm sóc hôm nay"    value={loading ? '…' : (stats?.cham_soc_today ?? 0)}   accent="#15803d" />
        <StatCard label="Nhắc lịch hôm nay"   value={loading ? '…' : (stats?.nhac_lich_today ?? 0)}  accent="#0369a1" />
        <StatCard label="Tái khám đến hạn"    value={loading ? '…' : (stats?.tai_kham_due ?? 0)}     accent="#d97706" />
        <StatCard label="Sắp hết liệu trình" value={loading ? '…' : (stats?.sap_het_lt ?? 0)}       accent="#6d28d9" />
        <StatCard label="Chờ đánh giá"        value={loading ? '…' : (stats?.cho_danh_gia ?? 0)}    accent="#0f766e" />
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <CustomerTable baseParams={{ is_customer: true }} reloadKey={reloadKey} fromContext="cskh" columnKeys={CSKH_COLUMNS} />
      </div>
    </div>
  )
}
