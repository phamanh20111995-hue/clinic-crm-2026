import { useState, useEffect, useCallback } from 'react'
import { IconRefresh } from '@tabler/icons-react'
import { getTeleQueue } from '../../../api/tele'
import useAuthStore from '../../../store/authStore'
import { getUserRole } from '../../../utils/rolesV2'
import StatCard from '../components/StatCard'
import DataRow from '../components/DataRow'
import FilterBar from '../components/FilterBar'
import LogCallModal from '../modals/LogCallModal'

const ACCENT = '#0369a1'

export default function TeleMyWork() {
  const { user } = useAuthStore()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [filters, setFilters]     = useState({})
  const [callTarget, setCallTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { ...filters }
      if (getUserRole(user) === 'TELE') params.tele_id = user.id
      const { data } = await getTeleQueue(params)
      setCustomers(data?.results ?? data ?? [])
    } catch {
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [filters, user?.id])

  useEffect(() => { load() }, [load])

  // Stats
  const done     = customers.filter(c => c.status === 'dat_lich' || c.status === 'khong_qt')
  const pending  = customers.filter(c => c.status === 'chua_goi')
  const today    = new Date().toDateString()
  const todayAppt = customers.filter(c => c.status === 'dat_lich')

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
        <StatCard label="Data được giao" value={customers.length} accent={ACCENT} />
        <StatCard label="Đã xử lý" value={done.length} accent="#15803d" />
        <StatCard label="Chưa gọi" value={pending.length} accent="#d97706" />
        <StatCard label="Đã đặt lịch" value={todayAppt.length} accent="#7c3aed" />
      </div>

      {/* Filter + reload */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', padding: '10px 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <FilterBar filters={filters} onChange={setFilters} onClear={() => setFilters({})} />
          <button onClick={load}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 12, cursor: 'pointer' }}>
            <IconRefresh size={14} stroke={2} />
            Tải lại
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Đang tải...</div>
        ) : customers.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>☎️</p>
            <p>Chưa có data được giao.</p>
          </div>
        ) : (
          customers.map(c => (
            <DataRow
              key={c.id}
              customer={c}
              accent={ACCENT}
              onCall={() => setCallTarget(c)}
              onLog={() => setCallTarget(c)}
            />
          ))
        )}
      </div>

      {callTarget && (
        <LogCallModal
          customer={callTarget}
          accent={ACCENT}
          onClose={() => setCallTarget(null)}
          onDone={load}
        />
      )}
    </div>
  )
}
