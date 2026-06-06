import { useState, useEffect, useCallback } from 'react'
import { IconPlus, IconRefresh } from '@tabler/icons-react'
import { getCustomers } from '../../../api/tele'
import StatCard from '../components/StatCard'
import DataRow from '../components/DataRow'
import FilterBar from '../components/FilterBar'
import NewDataModal from '../modals/NewDataModal'

const ACCENT = '#6d28d9'

export default function TrucPageView() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [filters, setFilters]     = useState({})
  const [showNew, setShowNew]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getCustomers({
        ...filters,
        page_size: 50,
      })
      setCustomers(data?.results ?? data ?? [])
    } catch {
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { load() }, [load])

  // Stats
  const today = new Date().toDateString()
  const todayData = customers.filter(c => new Date(c.created_at).toDateString() === today)
  const withPhone = customers.filter(c => c.phone)
  const hot = customers.filter(c => c.data_type === 'nong')
  const noPhone = customers.filter(c => !c.phone || c.phone === '')

  // Groups
  const withoutPhone = customers.filter(c => !c.tele)
  const withPhoneReady = customers.filter(c => c.tele)

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
        <StatCard label="Data nhập hôm nay" value={todayData.length} accent={ACCENT} />
        <StatCard label="Đã có SĐT" value={withPhone.length} accent={ACCENT} />
        <StatCard label="Chưa giao Tele" value={withoutPhone.length} accent="#d97706" />
        <StatCard label="Data nóng" value={hot.length} accent="#dc2626" />
      </div>

      {/* Filter + actions */}
      <div style={{
        background: '#fff', borderRadius: 10, border: '1px solid #dde3ef',
        padding: '12px 16px', marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <FilterBar
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters({})}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={load}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 12, cursor: 'pointer' }}>
              <IconRefresh size={14} stroke={2} />
              Tải lại
            </button>
            <button onClick={() => setShowNew(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <IconPlus size={14} stroke={2.5} />
              Nhập data mới
            </button>
          </div>
        </div>
      </div>

      {/* Data list */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Đang tải...</div>
        ) : customers.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
            <p>Chưa có data. Nhấn "Nhập data mới" để bắt đầu.</p>
          </div>
        ) : (
          <>
            {/* Nhóm chưa giao Tele */}
            {withoutPhone.length > 0 && (
              <div>
                <div style={{ padding: '8px 16px', background: '#fef9c3', borderBottom: '1px solid #fef08a' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    📌 Chưa giao Tele ({withoutPhone.length})
                  </span>
                </div>
                {withoutPhone.map(c => (
                  <DataRow key={c.id} customer={c} accent={ACCENT} />
                ))}
              </div>
            )}

            {/* Nhóm đã giao Tele */}
            {withPhoneReady.length > 0 && (
              <div>
                <div style={{ padding: '8px 16px', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ✅ Đã giao Tele ({withPhoneReady.length})
                  </span>
                </div>
                {withPhoneReady.map(c => (
                  <DataRow key={c.id} customer={c} accent={ACCENT} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showNew && (
        <NewDataModal onClose={() => setShowNew(false)} onDone={load} />
      )}
    </div>
  )
}
