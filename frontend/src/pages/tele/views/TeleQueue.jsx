import { useState, useEffect, useCallback } from 'react'
import { IconRefresh } from '@tabler/icons-react'
import { getTeleQueue } from '../../../api/tele'
import DataRow from '../components/DataRow'
import FilterBar from '../components/FilterBar'
import AssignModal from '../modals/AssignModal'

const ACCENT = '#0369a1'

export default function TeleQueue() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [filters, setFilters]     = useState({})
  const [assignTarget, setAssignTarget] = useState(null)
  const [selected, setSelected] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Queue = tất cả data chưa giao tele (không filter by tele_id)
      const { data } = await getTeleQueue({ ...filters, page_size: 100 })
      const all = data?.results ?? data ?? []
      // Chỉ hiển thị data chưa được giao
      setCustomers(all.filter(c => !c.tele_id && !c.tele))
    } catch {
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { load() }, [load] )

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const selectedCustomers = customers.filter(c => selected.includes(c.id))

  return (
    <div>
      {/* Header bar */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', padding: '10px 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <FilterBar filters={filters} onChange={setFilters} onClear={() => setFilters({})} />
          <div style={{ display: 'flex', gap: 8 }}>
            {selected.length > 0 && (
              <button
                onClick={() => setAssignTarget(selectedCustomers)}
                style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Giao {selected.length} data →
              </button>
            )}
            <button onClick={load}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 12, cursor: 'pointer' }}>
              <IconRefresh size={14} stroke={2} />
            </button>
          </div>
        </div>
      </div>

      {/* Count */}
      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, padding: '0 2px' }}>
        {customers.length} data chưa được giao
        {selected.length > 0 && <span style={{ color: ACCENT, fontWeight: 600 }}> · Đã chọn {selected.length}</span>}
      </p>

      {/* List */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Đang tải...</div>
        ) : customers.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>✅</p>
            <p>Hàng chờ trống — tất cả data đã được giao.</p>
          </div>
        ) : (
          customers.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'stretch' }}>
              {/* Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
                <input type="checkbox" checked={selected.includes(c.id)}
                  onChange={() => toggleSelect(c.id)}
                  style={{ width: 15, height: 15, accentColor: ACCENT }} />
              </div>
              <div style={{ flex: 1 }}>
                <DataRow
                  customer={c}
                  accent={ACCENT}
                  showAssign={() => setAssignTarget([c])}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {assignTarget && (
        <AssignModal
          customers={assignTarget}
          onClose={() => { setAssignTarget(null); setSelected([]) }}
          onDone={load}
        />
      )}
    </div>
  )
}
