import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTodayAppointments, getRooms, getUsers, checkinAppointment, toTreatment, getSaleUsers, assignSale, updateAppointment } from '../../../api/letan'
import AppointmentTableView from '../views/AppointmentTableView'
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
  const navigate = useNavigate()
  const [appts, setAppts]         = useState([])
  const [rooms, setRooms]         = useState([])
  const [bsList, setBsList]       = useState([])
  const [ktvList, setKtvList]     = useState([])
  const [saleUsers, setSaleUsers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(null)
  const [modalAppt, setModalAppt] = useState(null)
  const [viewDate, setViewDate]   = useState(() => new URLSearchParams(window.location.search).get('date') || todayStr())

  const isToday = viewDate === todayStr()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (viewDate === todayStr()) params.delete('date')
    else params.set('date', viewDate)
    const qs = params.toString()
    window.history.replaceState(null, '', qs ? '?' + qs : window.location.pathname)
  }, [viewDate])

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
      const [roomRes, saleRes, bsRes, ktvRes] = await Promise.all([
        getRooms(),
        getSaleUsers(),
        getUsers({ role: 'BS' }),
        getUsers({ role: 'KTV' }),
      ])
      setRooms(roomRes.data?.results ?? roomRes.data ?? [])
      setSaleUsers(saleRes.data?.results ?? saleRes.data ?? [])
      setBsList(bsRes.data?.results ?? bsRes.data ?? [])
      setKtvList(ktvRes.data?.results ?? ktvRes.data ?? [])
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

  const handleAssignSale = async (appt, saleId, saleName) => {
    if (!saleId) return
    const prev = appt
    patchAppt({ ...appt, sale: saleId, sale_name: saleName ?? appt.sale_name, customer_detail: { ...(appt.customer_detail ?? {}), sale_name: saleName ?? appt.customer_detail?.sale_name } })
    try {
      const res = await assignSale(appt.id, saleId)
      patchAppt(res.data)
      toast.success(`Đã chỉ định Sale cho ${appt.customer_name}`)
    } catch (err) {
      patchAppt(prev)
      toast.error(err.response?.data?.detail ?? 'Lỗi chỉ định Sale')
      throw err
    }
  }

  const handleUpdateField = useCallback(async (appt, field, value, extra = {}) => {
    const prev = appt
    const val = value === '' ? null : value
    patchAppt({ ...appt, [field]: val, ...extra })
    try {
      const res = await updateAppointment(appt.id, { [field]: val })
      patchAppt(res.data)
      toast.success('Đã cập nhật')
    } catch (err) {
      patchAppt(prev)
      throw err
    }
  }, [patchAppt])

  const openEnqueue  = (appt) => { setModalAppt(appt); setModal('enqueue') }
  const openAssign   = (appt) => { setModalAppt(appt); setModal('assign') }
  const openCheckout = (appt) => { setModalAppt(appt); setModal('checkout') }
  const closeModal   = () => setModal(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Waiting badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14, flexShrink: 0 }}>
        {waitingAll > 0 && (
          <span style={{ fontSize: 11, background: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>
            ⏳ {waitingAll} KH đang chờ phân phòng
          </span>
        )}
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 14, flexShrink: 0 }}>
        <StatCard label="Tổng KH hôm nay"  value={total}      accent={ACCENT} />
        <StatCard label="Đang điều trị"     value={inProgress} accent="#15803d" />
        <StatCard label="Đang tư vấn"       value={consulting} accent="#92400e" />
        <StatCard label="Chờ phân phòng"    value={waitingAll} accent="#7c3aed" />
      </div>

      {/* Lịch hẹn */}
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
          onRowClick={(appt) => { const cid = appt.customer ?? appt.customer_detail?.id; if (cid) navigate('/customers/' + cid + '?from=letan') }}
          onReload={loadAll}
          viewDate={viewDate}
          onDateChange={setViewDate}
          onPrevDate={() => setViewDate(d => shiftDate(d, -1))}
          onNextDate={() => setViewDate(d => shiftDate(d, 1))}
          onTodayDate={() => setViewDate(todayStr())}
          isToday={isToday}
          rooms={rooms}
          bsList={bsList}
          ktvList={ktvList}
          onUpdateField={handleUpdateField}
        />
      </div>

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
