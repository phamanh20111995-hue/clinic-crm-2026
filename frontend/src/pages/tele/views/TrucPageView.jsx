import { useState, useEffect, useCallback } from 'react'
import { IconRefresh, IconPlus } from '@tabler/icons-react'
import { getCustomers } from '../../../api/tele'
import StatCard from '../components/StatCard'
import DataRow from '../components/DataRow'
import FilterBar from '../components/FilterBar'
import NewDataModal from '../modals/NewDataModal'
import AssignModal from '../modals/AssignModal'

const ACCENT = '#6d28d9'

export default function TrucPageView({ onNewData, hideNewBtn = false }) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [filters, setFilters]     = useState({})
  const [showNew, setShowNew]     = useState(false)
  const [assignTarget, setAssignTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getCustomers({ ...filters, page_size: 100 })
      setCustomers(data?.results ?? data ?? [])
    } catch {
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { load() }, [load])

  // --- Stats ---
  const todayStr = new Date().toDateString()
  const todayData   = customers.filter(c => new Date(c.created_at).toDateString() === todayStr)
  const withPhone   = customers.filter(c => c.phone && c.phone.trim() !== '')
  // "Đang chờ ảnh" = có SĐT nhưng chưa giao Tele (vẫn ở bước xin ảnh tình trạng)
  const waitingImg  = customers.filter(c => c.phone && !c.tele)
  const hotToday    = customers.filter(c =>
    c.data_type === 'nong' && new Date(c.created_at).toDateString() === todayStr
  )

  // --- Groups ---
  // Group 1: chưa có SĐT (theo dõi Pancake)
  const noPhone     = customers.filter(c => !c.phone || c.phone.trim() === '')
  // Group 2: đã có SĐT
  const hasPhone    = customers.filter(c => c.phone && c.phone.trim() !== '')

  const handleNewData = () => {
    if (onNewData) onNewData()
    else setShowNew(true)
  }

  return (
    <div>
      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))',
        gap: 12, marginBottom: 16,
      }}>
        <StatCard label="Data nhập hôm nay" value={todayData.length} accent={ACCENT} />
        <StatCard label="Đã lấy SĐT"         value={withPhone.length} accent="#15803d" />
        <StatCard label="Đang chờ ảnh"        value={waitingImg.length} accent="#d97706"
          sub="Có SĐT, chưa giao Tele" />
        <StatCard label="Data nóng hôm nay"   value={hotToday.length} accent="#dc2626" />
      </div>

      {/* Filter bar */}
      <div style={{
        background: '#fff', borderRadius: 10, border: '1px solid #dde3ef',
        padding: '10px 16px', marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <FilterBar filters={filters} onChange={setFilters} onClear={() => setFilters({})} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={load}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 12, cursor: 'pointer' }}>
              <IconRefresh size={14} stroke={2} />
              Tải lại
            </button>
            {/* Only show here if not controlled by topbar */}
            {!hideNewBtn && (
              <button onClick={handleNewData}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                <IconPlus size={14} stroke={2.5} />
                Nhập data mới
              </button>
            )}
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
            <p style={{ marginBottom: 12 }}>Chưa có data.</p>
            <button onClick={handleNewData}
              style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              + Nhập data mới
            </button>
          </div>
        ) : (
          <>
            {/* Nhóm 1: theo dõi Pancake — chưa có SĐT */}
            {noPhone.length > 0 && (
              <section>
                <div style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(90deg, #fef3c7, #fffbeb)',
                  borderBottom: '1px solid #fde68a',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    👀 Theo dõi trên Pancake — chưa có SĐT ({noPhone.length})
                  </span>
                  <span style={{ fontSize: 11, color: '#b45309' }}>Đang xin ảnh tình trạng hoặc chờ SĐT</span>
                </div>
                {noPhone.map(c => (
                  <DataRow
                    key={c.id}
                    customer={c}
                    accent={ACCENT}
                    showAssign={() => setAssignTarget([c])}
                  />
                ))}
              </section>
            )}

            {/* Nhóm 2: đã có SĐT */}
            {hasPhone.length > 0 && (
              <section>
                <div style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(90deg, #d1fae5, #f0fdf4)',
                  borderBottom: '1px solid #a7f3d0',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ✅ Đã có SĐT ({hasPhone.length})
                  </span>
                  <button
                    onClick={() => setAssignTarget(hasPhone.filter(c => !c.tele))}
                    style={{ fontSize: 11, color: ACCENT, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Giao Tele hàng loạt →
                  </button>
                </div>
                {hasPhone.map(c => (
                  <DataRow
                    key={c.id}
                    customer={c}
                    accent={ACCENT}
                    showAssign={() => setAssignTarget([c])}
                  />
                ))}
              </section>
            )}
          </>
        )}
      </div>

      {showNew && (
        <NewDataModal onClose={() => setShowNew(false)} onDone={load} />
      )}

      {assignTarget && (
        <AssignModal
          customers={assignTarget}
          onClose={() => setAssignTarget(null)}
          onDone={load}
        />
      )}
    </div>
  )
}
