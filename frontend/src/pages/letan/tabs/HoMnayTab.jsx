import { useState, useEffect, useCallback } from 'react'
import { getTodayAppointments, getRooms, getUsers, checkinAppointment, toTreatment, getSaleUsers, assignSale } from '../../../api/letan'
import AppointmentTableView from '../views/AppointmentTableView'
import DoctorCard from '../components/DoctorCard'
import AssignRoomModal from '../modals/AssignRoomModal'
import CheckOutModal from '../modals/CheckOutModal'
import EnqueueModal from '../modals/EnqueueModal'
import toast from 'react-hot-toast'

const ACCENT = '#b45309'

function todayStr() {
  const d = new Date()
  const y  = d.getFullYear()
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function shiftDate(dateStr, delta) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + delta)
  const y  = d.getFullYear()
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
      <p style={{ fontSize: 22, fontWeight: 700, color: accent, lineHeight: 1.1, margin: 0 }}>{value ?? 0}</p>
      <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4, margin: '4px 0 0' }}>{label}</p>
    </div>
  )
}

export default function HoMnayTab({ onWalkIn }) {
  const [appts, setAppts]         = useState([])
  const [rooms, setRooms]         = useState([])
  const [staff, setStaff]         = useState([])
  const [saleUsers, setSaleUsers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [mode, setMode]           = useState('lich') // 'lich' | 'realtime'
  const [modal, setModal]         = useState(null)
  const [modalAppt, setModalAppt] = useState(null)
  const [viewDate, setViewDate]   = useState(todayStr)

  const isToday = viewDate === todayStr()

  const patchAppt = useCallback((updated) => {
    setAppts(prev => prev.map(a => a.id === updated.id ? updated : a))
  }, [])

  const loadAppts = useCallback(async () => {
    try {
      const res = await getTodayAppointments({ date: viewDate })
      setAppts(res.data?.results ?? res.data ?? [])
    } catch {}
  }, [viewDate])

  const loadStatic = useCallback(async () => {
    try {
      const [roomRes, userRes, saleRes] = await Promise.all([getRooms(), getUsers(), getSaleUsers()])
      setRooms(roomRes.data?.results ?? roomRes.data ?? [])
      setStaff(userRes.data?.results ?? userRes.data ?? [])
      setSaleUsers(saleRes.data?.results ?? saleRes.data ?? [])
    } catch {}
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadAppts(), loadStatic()])
    setLoading(false)
  }, [loadAppts, loadStatic])

  useEffect(() => { loadAll() }, [loadAll])

  // Auto-refresh 30s chỉ khi xem hôm nay
  useEffect(() => {
    if (!isToday) return
    const t = setInterval(loadAppts, 30000)
    return () => clearInterval(t)
  }, [loadAppts, isToday])

  // Stats
  const total      = appts.length
  const inProgress = appts.filter(a => a.status === 'in_progress').length
  const consulting = appts.filter(a => a.status === 'consulting').length
  const waitingAll = appts.filter(a => a.status === 'waiting_consult' || a.status === 'waiting_treat').length

  // Actions
  const handleCheckin = async (appt) => {
    const prev = appt
    patchAppt({ ...appt, status: 'confirmed', status_display: 'Xác nhận đến' })
    try {
      const res = await checkinAppointment(appt.id)
      patchAppt(res.data)
      toast.success(`Check-in ${appt.customer_name}`)
    } catch (err) {
      patchAppt(prev)
      toast.error(err.response?.data?.detail ?? 'Lỗi check-in')
    }
  }

  const handleToTreatment = async (appt) => {
    const prev = appt
    patchAppt({ ...appt, status: 'waiting_treat', visit_type: 'dieu_tri', room: null, room_name: null, status_display: 'Chờ điều trị' })
    try {
      const res = await toTreatment(appt.id)
      patchAppt(res.data)
      toast.success(`${appt.customer_name} → chờ điều trị`)
    } catch (err) {
      patchAppt(prev)
      toast.error(err.response?.data?.detail ?? 'Lỗi chuyển điều trị')
    }
  }

  const handleAssignSale = async (appt, saleId) => {
    if (!saleId) return
    try {
      const res = await assignSale(appt.id, saleId)
      patchAppt(res.data)
      toast.success(`Đã chỉ định Sale cho ${appt.customer_name}`)
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi chỉ định Sale')
    }
  }

  const openEnqueue  = (appt) => { setModalAppt(appt); setModal('enqueue') }
  const openAssign   = (appt) => { setModalAppt(appt); setModal('assign') }
  const openCheckout = (appt) => { setModalAppt(appt); setModal('checkout') }
  const closeModal   = () => setModal(null)

  // Staff enriched
  const enrichedStaff = staff.map(u => {
    const currentAppt = appts.find(a => a.status === 'in_progress' && (a.doctor === u.id || a.ktv === u.id))
    return { ...u, current_appointment: currentAppt ?? null }
  })
  const freeStaff = enrichedStaff.filter(u => !u.current_appointment)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Mode toggle + waiting badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14, flexShrink: 0 }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 1, background: '#f1f5f9', borderRadius: 8, padding: 2, flexShrink: 0 }}>
          <button
            onClick={() => setMode('lich')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 14px', borderRadius: 6, border: 'none',
              background: mode === 'lich' ? ACCENT : 'transparent',
              color: mode === 'lich' ? '#fff' : '#6b7280',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
            }}
          >
            📅 Lịch hẹn
          </button>
          <button
            onClick={() => setMode('realtime')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 14px', borderRadius: 6, border: 'none',
              background: mode === 'realtime' ? ACCENT : 'transparent',
              color: mode === 'realtime' ? '#fff' : '#6b7280',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
            }}
          >
            🏥 Phòng &amp; BS
          </button>
        </div>

        {/* Waiting badge */}
        {waitingAll > 0 && (
          <span style={{ fontSize: 11, background: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>
            ⏳ {waitingAll} KH đang chờ phân phòng
          </span>
        )}
      </div>

      {/* Stat cards — always visible */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 14, flexShrink: 0 }}>
        <StatCard label="Tổng KH hôm nay"  value={total}      accent={ACCENT} />
        <StatCard label="Đang điều trị"     value={inProgress} accent="#15803d" />
        <StatCard label="Đang tư vấn"       value={consulting} accent="#92400e" />
        <StatCard label="Chờ phân phòng"    value={waitingAll} accent="#7c3aed" />
      </div>

      {/* Mode: Lịch hẹn */}
      {mode === 'lich' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <AppointmentTableView
            appointments={appts}
            saleUsers={saleUsers}
            loading={loading}
            onCheckin={handleCheckin}
            onEnqueue={openEnqueue}
            onAssignRoom={openAssign}
            onCheckout={openCheckout}
            onAssignSale={handleAssignSale}
            onRowClick={() => {}}
            onReload={loadAll}
            viewDate={viewDate}
            onDateChange={setViewDate}
            onPrevDate={() => setViewDate(d => shiftDate(d, -1))}
            onNextDate={() => setViewDate(d => shiftDate(d, 1))}
            onTodayDate={() => setViewDate(todayStr())}
            isToday={isToday}
          />
        </div>
      )}

      {/* Mode: Phòng & BS */}
      {mode === 'realtime' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* BS / KTV */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>BS / KTV realtime</span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{freeStaff.length} trống</span>
            </div>
            <div style={{ padding: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {enrichedStaff.slice(0, 20).map(u => (
                <DoctorCard key={u.id} person={u} />
              ))}
              {enrichedStaff.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#9ca3af', padding: '16px 0', fontSize: 12 }}>
                  Chưa có dữ liệu nhân viên
                </div>
              )}
            </div>
          </div>

          {/* Trạng thái phòng */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Trạng thái phòng</span>
            </div>
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rooms.map(r => {
                const occupying = appts.find(a =>
                  (a.status === 'in_progress' || a.status === 'consulting') && String(a.room) === String(r.id)
                )
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
      )}

      {/* Modals */}
      {modal === 'enqueue' && modalAppt && (
        <EnqueueModal appt={modalAppt} onClose={closeModal} onDone={patchAppt} />
      )}
      {modal === 'assign' && modalAppt && (
        <AssignRoomModal appt={modalAppt} onClose={closeModal} onDone={patchAppt} />
      )}
      {modal === 'checkout' && modalAppt && (
        <CheckOutModal appt={modalAppt} onClose={closeModal} onDone={patchAppt} />
      )}
    </div>
  )
}
