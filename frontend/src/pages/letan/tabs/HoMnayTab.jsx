import { useState, useEffect, useCallback, useRef } from 'react'
import { IconSearch, IconRefresh, IconX } from '@tabler/icons-react'
import { getTodayAppointments, getRooms, getUsers, checkinAppointment } from '../../../api/letan'
import AppointmentRow from '../components/AppointmentRow'
import DoctorCard from '../components/DoctorCard'
import WalkInModal from '../modals/WalkInModal'
import AssignRoomModal from '../modals/AssignRoomModal'
import CheckOutModal from '../modals/CheckOutModal'
import toast from 'react-hot-toast'

const ACCENT = '#b45309'

const QUICK_FILTERS = [
  { key: '',           label: 'Tất cả' },
  { key: 'in_progress',label: 'Đang ĐT' },
  { key: 'confirmed',  label: 'Tư vấn' },
  { key: 'pending',    label: 'Chưa đến' },
  { key: 'done',       label: 'Đã về' },
]

function StatCard({ label, value, accent }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
      <p style={{ fontSize: 22, fontWeight: 700, color: accent, lineHeight: 1.1, margin: 0 }}>{value ?? 0}</p>
      <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4, margin: '4px 0 0' }}>{label}</p>
    </div>
  )
}

export default function HoMnayTab({ onWalkIn }) {
  const [appts, setAppts]           = useState([])
  const [rooms, setRooms]           = useState([])
  const [staff, setStaff]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [qFilter, setQFilter]       = useState('')
  const [search, setSearch]         = useState('')
  const [quickSdt, setQuickSdt]     = useState('')
  const [sdtResult, setSdtResult]   = useState(null)
  const [selected, setSelected]     = useState(null)
  const [modal, setModal]           = useState(null) // 'walkin'|'assign'|'checkout'
  const [modalAppt, setModalAppt]   = useState(null)
  const sdtRef = useRef()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [apptRes, roomRes, userRes] = await Promise.all([
        getTodayAppointments(),
        getRooms(),
        getUsers(),
      ])
      setAppts(apptRes.data?.results ?? apptRes.data ?? [])
      setRooms(roomRes.data?.results ?? roomRes.data ?? [])
      setStaff(userRes.data?.results ?? userRes.data ?? [])
    } catch {
      setAppts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 60s
  useEffect(() => {
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [load])

  // --- Stats ---
  const total       = appts.length
  const inProgress  = appts.filter(a => a.status === 'in_progress').length
  const consulting  = appts.filter(a => a.status === 'confirmed').length
  const waiting     = appts.filter(a => a.status === 'pending').length

  // --- Filtered list ---
  const visible = appts.filter(a => {
    if (qFilter && a.status !== qFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!a.customer_name?.toLowerCase().includes(q) && !a.customer_phone?.includes(q)) return false
    }
    return true
  })

  // Quick SĐT check
  const checkSdt = async () => {
    if (!quickSdt.trim()) return
    const found = appts.filter(a =>
      a.customer_phone?.includes(quickSdt.trim()) ||
      a.customer_name?.toLowerCase().includes(quickSdt.trim().toLowerCase())
    )
    setSdtResult(found.length > 0 ? found : 'not_found')
  }

  // --- Staff enriched with current appointment ---
  const enrichedStaff = staff.map(u => {
    const currentAppt = appts.find(a => a.status === 'in_progress' && (a.doctor === u.id || a.ktv === u.id))
    return { ...u, current_appointment: currentAppt ?? null }
  })
  const freeStaff = enrichedStaff.filter(u => !u.current_appointment)

  // Actions
  const handleCheckin = async (appt) => {
    try {
      await checkinAppointment(appt.id)
      toast.success(`Check-in ${appt.customer_name}`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi check-in')
    }
  }

  const openAssign = (appt) => { setModalAppt(appt); setModal('assign') }
  const openCheckout = (appt) => { setModalAppt(appt); setModal('checkout') }

  // Urgent: confirmed + no room
  const urgentCount = appts.filter(a => a.status === 'confirmed' && !a.room).length

  return (
    <div>
      {/* Top info bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        padding: '8px 0 12px', marginBottom: 4,
      }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>
          📋 Giai đoạn: <strong>Tư vấn</strong> → <strong>Chốt</strong> → <strong>Phân phòng ĐT</strong>
        </span>
        {urgentCount > 0 && (
          <span style={{ fontSize: 11, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>
            ⚠ {urgentCount} KH chờ phân phòng
          </span>
        )}

        {/* Quick SĐT */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            ref={sdtRef}
            placeholder="Tra SĐT / tên..."
            value={quickSdt}
            onChange={e => { setQuickSdt(e.target.value); setSdtResult(null) }}
            onKeyDown={e => e.key === 'Enter' && checkSdt()}
            style={{ border: '1px solid #dde3ef', borderRadius: 7, padding: '5px 10px', fontSize: 12, width: 160, outline: 'none' }}
          />
          <button onClick={checkSdt}
            style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, cursor: 'pointer' }}>
            Tra
          </button>
          {sdtResult && (
            <button onClick={() => { setSdtResult(null); setQuickSdt('') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
              <IconX size={14} />
            </button>
          )}
        </div>
      </div>

      {/* SĐT result */}
      {sdtResult && (
        <div style={{ marginBottom: 10, padding: '8px 12px', background: sdtResult === 'not_found' ? '#fef2f2' : '#f0fdf4', borderRadius: 8, border: `1px solid ${sdtResult === 'not_found' ? '#fecaca' : '#a7f3d0'}`, fontSize: 12 }}>
          {sdtResult === 'not_found'
            ? '❌ Không tìm thấy KH hôm nay có số/tên này'
            : sdtResult.map(a => (
              <div key={a.id}>✅ <strong>{a.customer_name}</strong> · {a.customer_phone} · {a.status_display} · {a.scheduled_at ? new Date(a.scheduled_at).toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
            ))
          }
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 14 }}>
        <StatCard label="Tổng KH hôm nay"  value={total}      accent={ACCENT} />
        <StatCard label="Đang điều trị"     value={inProgress} accent="#15803d" />
        <StatCard label="Đang tư vấn"       value={consulting} accent="#6d28d9" />
        <StatCard label="Chờ phân công"     value={urgentCount} accent="#dc2626" />
      </div>

      {/* Quick filter chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {QUICK_FILTERS.map(f => {
          const count = f.key ? appts.filter(a => a.status === f.key).length : appts.length
          return (
            <button key={f.key} onClick={() => setQFilter(f.key)}
              style={{
                padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                border: `1.5px solid ${qFilter === f.key ? ACCENT : '#dde3ef'}`,
                background: qFilter === f.key ? ACCENT : '#fff',
                color: qFilter === f.key ? '#fff' : '#6b7280',
                transition: 'all .12s',
              }}>
              {f.label} <span style={{ opacity: .7 }}>({count})</span>
            </button>
          )
        })}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ position: 'relative' }}>
            <IconSearch size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input placeholder="Tìm KH..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ border: '1px solid #dde3ef', borderRadius: 7, padding: '4px 8px 4px 24px', fontSize: 12, outline: 'none', width: 140 }} />
          </div>
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 11, cursor: 'pointer' }}>
            <IconRefresh size={13} stroke={2} /> Làm mới
          </button>
        </div>
      </div>

      {/* 2-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14, alignItems: 'start' }}>
        {/* LEFT: appointment list */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Đang tải...</div>
          ) : visible.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
              <p style={{ fontSize: 28, marginBottom: 8 }}>📋</p>
              <p>Không có KH nào{qFilter ? ' với trạng thái này' : ' hôm nay'}.</p>
            </div>
          ) : (
            visible.map(a => (
              <AppointmentRow
                key={a.id}
                appt={a}
                isSelected={selected?.id === a.id}
                onClick={setSelected}
                onCheckin={handleCheckin}
                onAssignRoom={openAssign}
                onCheckout={openCheckout}
              />
            ))
          )}
        </div>

        {/* RIGHT: staff + room diagram */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* BS/KTV realtime */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>BS / KTV realtime</span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{freeStaff.length} trống</span>
            </div>
            <div style={{ padding: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {enrichedStaff.slice(0, 10).map(u => (
                <DoctorCard key={u.id} person={u}
                  onAssign={selected && !selected.doctor && !selected.ktv ? () => {
                    setModalAppt({ ...selected, _suggest_staff: u.id })
                    setModal('assign')
                  } : undefined}
                />
              ))}
              {enrichedStaff.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#9ca3af', padding: '16px 0', fontSize: 12 }}>
                  Chưa có dữ liệu nhân viên
                </div>
              )}
            </div>
          </div>

          {/* Phòng */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Trạng thái phòng</span>
            </div>
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rooms.map(r => {
                const occupying = appts.find(a => a.status === 'in_progress' && String(a.room) === String(r.id))
                return (
                  <div key={r.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 10px', borderRadius: 8,
                    background: occupying ? '#fef2f2' : '#f0fdf4',
                    border: `1px solid ${occupying ? '#fecaca' : '#a7f3d0'}`,
                    fontSize: 12,
                  }}>
                    <span style={{ fontWeight: 600, color: occupying ? '#dc2626' : '#166534' }}>
                      {r.name}
                    </span>
                    <span style={{ color: occupying ? '#dc2626' : '#166534', fontSize: 11 }}>
                      {occupying ? `🔴 ${occupying.customer_name?.split(' ').pop()}` : '🟢 Trống'}
                    </span>
                  </div>
                )
              })}
              {rooms.length === 0 && (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '12px 0', fontSize: 12 }}>Chưa có phòng</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal === 'assign' && modalAppt && (
        <AssignRoomModal appt={modalAppt} onClose={() => setModal(null)} onDone={load} />
      )}
      {modal === 'checkout' && modalAppt && (
        <CheckOutModal appt={modalAppt} onClose={() => setModal(null)} onDone={load} />
      )}
    </div>
  )
}
