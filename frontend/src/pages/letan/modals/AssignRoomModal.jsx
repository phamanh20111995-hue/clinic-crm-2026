import { useState, useEffect } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import { assignRoom, getRooms, getAvailableStaff } from '../../../api/letan'
import toast from 'react-hot-toast'

const ACCENT = '#b45309'

const VISIT_TYPES = [
  { value: 'tu_van',    label: 'Tư vấn',    emoji: '💬', desc: 'Khách mới' },
  { value: 'dieu_tri',  label: 'Điều trị',  emoji: '💉', desc: 'Làm dịch vụ' },
  { value: 'tai_kham',  label: 'Tái khám',  emoji: '🔄', desc: 'KH cũ theo dõi' },
  { value: 'khieu_nai', label: 'Khiếu nại', emoji: '⚠️', desc: 'Cần xử lý' },
]

// room_type values from backend Room model
const TREATMENT_TYPES  = ['treatment', 'dental']
const CONSULT_TYPES    = ['consultation']

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 100, padding: 16,
}
const modalBox = {
  background: '#fff', borderRadius: 12, width: '100%', maxWidth: 500,
  maxHeight: '92vh', overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,.2)',
}
const inputStyle = {
  width: '100%', border: '1px solid #dde3ef', borderRadius: 7,
  padding: '7px 10px', fontSize: 13, boxSizing: 'border-box',
  outline: 'none', fontFamily: 'inherit', background: '#fff',
}
const lbl = {
  fontSize: 12, color: '#374151', display: 'block',
  marginBottom: 4, fontWeight: 600,
}
const sectionLabel = {
  fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase',
  letterSpacing: '0.06em', marginBottom: 8,
}

function RoomChip({ room, selected, onClick }) {
  const typeLabel = room.room_type === 'treatment' ? 'Điều trị'
                  : room.room_type === 'dental'    ? 'Nha khoa'
                  : 'Tư vấn'
  const active = selected === String(room.id)
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
        border: `2px solid ${active ? ACCENT : '#dde3ef'}`,
        background: active ? '#fff7ed' : '#fff',
        color: active ? ACCENT : '#374151',
        fontSize: 12, fontWeight: 600, textAlign: 'center',
        transition: 'all .12s',
      }}
    >
      {room.name}
      <div style={{ fontSize: 10, fontWeight: 400, color: active ? '#b45309aa' : '#9ca3af', marginTop: 2 }}>
        {typeLabel}
      </div>
    </button>
  )
}

export default function AssignRoomModal({ appt, onClose, onDone }) {
  const [visitType, setVisitType] = useState(appt.visit_type || 'tu_van')
  const [room, setRoom]           = useState(appt.room ? String(appt.room) : '')
  const [doctor, setDoctor]       = useState(appt.doctor ? String(appt.doctor) : '')
  const [ktv, setKtv]             = useState(appt.ktv   ? String(appt.ktv)   : '')
  const [sale, setSale]           = useState(appt.sale  ? String(appt.sale)  : '')

  const [allRooms, setAllRooms]   = useState([])
  const [doctors, setDoctors]     = useState([])
  const [ktvList, setKtvList]     = useState([])
  const [saleList, setSaleList]   = useState([])
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    getRooms({ is_active: true })
      .then(r => setAllRooms(r.data?.results ?? r.data ?? []))
      .catch(() => {})
    getAvailableStaff({ date: today, role: 'BS' })
      .then(r => setDoctors(r.data?.results ?? r.data ?? []))
      .catch(() => {})
    getAvailableStaff({ date: today, role: 'KTV' })
      .then(r => setKtvList(r.data?.results ?? r.data ?? []))
      .catch(() => {})
    getAvailableStaff({ date: today, role: 'SALE' })
      .then(r => setSaleList(r.data?.results ?? r.data ?? []))
      .catch(() => {})
  }, [])

  // Reset room selection when visit type changes (different room pools)
  const handleVisitTypeChange = (vt) => {
    setVisitType(vt)
    setRoom('')
  }

  const isDieuTri = visitType === 'dieu_tri'

  // Filter rooms by visit type
  const filteredRooms = allRooms.filter(r =>
    isDieuTri ? TREATMENT_TYPES.includes(r.room_type) : CONSULT_TYPES.includes(r.room_type)
  )
  const roomsToShow = filteredRooms.length ? filteredRooms : []

  const handleSave = async () => {
    if (isDieuTri && !room) {
      toast.error('Vui lòng chọn phòng điều trị')
      return
    }
    setSaving(true)
    try {
      const payload = { visit_type: visitType }
      if (room)   payload.room   = Number(room)
      if (doctor) payload.doctor = Number(doctor)
      // KTV only for điều trị
      if (isDieuTri && ktv)  payload.ktv  = Number(ktv)
      // Sale only for non-điều trị
      if (!isDieuTri && sale) payload.sale = Number(sale)

      const res = await assignRoom(appt.id, payload)
      toast.success(isDieuTri ? 'Đã phân phòng điều trị' : 'Đã phân phòng tư vấn')
      onDone?.(res.data)
      onClose()
    } catch (err) {
      const data = err?.response?.data
      if (data && typeof data === 'object') {
        const msgs = Object.entries(data).map(([k, v]) =>
          `${k}: ${Array.isArray(v) ? v.join(', ') : v}`
        )
        toast.error(msgs.join(' | '))
      } else {
        toast.error(data?.detail ?? 'Lỗi phân phòng')
      }
    } finally {
      setSaving(false)
    }
  }

  const visitTypeInfo = VISIT_TYPES.find(v => v.value === visitType)

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modalBox}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid #f1f5f9',
        }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, margin: 0, color: '#0f2044' }}>Phân phòng</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
              {appt.customer_name}
              {appt.service_name ? ` · ${appt.service_name}` : ''}
            </p>
          </div>
          <button onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
            <IconX size={20} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── 1. Loại lượt ── */}
          <div>
            <p style={sectionLabel}>Loại lượt</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {VISIT_TYPES.map(vt => {
                const active = visitType === vt.value
                return (
                  <button key={vt.value} onClick={() => handleVisitTypeChange(vt.value)}
                    style={{
                      padding: '8px 6px', borderRadius: 9, cursor: 'pointer', textAlign: 'center',
                      border: `2px solid ${active ? ACCENT : '#dde3ef'}`,
                      background: active ? '#fff7ed' : '#f8fafc',
                      color: active ? ACCENT : '#6b7280',
                      transition: 'all .12s',
                    }}>
                    <div style={{ fontSize: 16, marginBottom: 2 }}>{vt.emoji}</div>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>{vt.label}</div>
                    <div style={{ fontSize: 9, color: active ? '#b45309aa' : '#9ca3af', marginTop: 1 }}>{vt.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── 2. Phòng ── */}
          <div>
            <p style={sectionLabel}>
              {isDieuTri ? 'Phòng điều trị *' : 'Phòng tư vấn (tuỳ chọn)'}
            </p>
            {roomsToShow.length === 0 ? (
              <div style={{
                padding: '12px 14px', borderRadius: 8, background: '#f8fafc',
                border: '1px dashed #dde3ef', fontSize: 12, color: '#94a3b8', textAlign: 'center',
              }}>
                {isDieuTri
                  ? 'Chưa có phòng điều trị — có thể gán sau'
                  : 'Chưa có phòng tư vấn — có thể để trống'}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 6 }}>
                {/* Allow clearing selection for non-required types */}
                {!isDieuTri && room && (
                  <button onClick={() => setRoom('')}
                    style={{
                      padding: '8px 6px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                      border: '2px solid #dde3ef', background: '#fff',
                      color: '#9ca3af', fontSize: 11,
                    }}>
                    ✕ Bỏ chọn
                    <div style={{ fontSize: 9, marginTop: 2 }}>Để trống</div>
                  </button>
                )}
                {roomsToShow.map(r => (
                  <RoomChip
                    key={r.id}
                    room={r}
                    selected={room}
                    onClick={() => setRoom(String(r.id))}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── 3. Nhân sự ── */}
          <div>
            <p style={sectionLabel}>Nhân sự thực hiện</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {/* Bác sĩ — always shown */}
              <div>
                <label style={lbl}>Bác sĩ</label>
                <select value={doctor} onChange={e => setDoctor(e.target.value)} style={inputStyle}>
                  <option value="">— Chưa chỉ định —</option>
                  {doctors.map(u => (
                    <option key={u.id} value={u.id}>{u.display_name ?? u.email}</option>
                  ))}
                </select>
              </div>

              {/* KTV — chỉ cho điều trị */}
              {isDieuTri ? (
                <div>
                  <label style={lbl}>Kỹ thuật viên</label>
                  <select value={ktv} onChange={e => setKtv(e.target.value)} style={inputStyle}>
                    <option value="">— Chưa chỉ định —</option>
                    {ktvList.map(u => (
                      <option key={u.id} value={u.id}>{u.display_name ?? u.email}</option>
                    ))}
                  </select>
                </div>
              ) : (
                /* Sale — tư vấn / tái khám / khiếu nại */
                <div>
                  <label style={lbl}>Sale tư vấn</label>
                  <select value={sale} onChange={e => setSale(e.target.value)} style={inputStyle}>
                    <option value="">— Chưa chỉ định —</option>
                    {saleList.map(u => (
                      <option key={u.id} value={u.id}>{u.display_name ?? u.email}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* ── Summary chip ── */}
          <div style={{
            padding: '8px 12px', borderRadius: 8,
            background: isDieuTri ? '#f0fdf4' : '#eff6ff',
            border: `1px solid ${isDieuTri ? '#bbf7d0' : '#bfdbfe'}`,
            fontSize: 11, color: isDieuTri ? '#15803d' : '#1d4ed8',
          }}>
            {isDieuTri
              ? `▶ Xác nhận sẽ chuyển sang trạng thái "Đang điều trị"`
              : `💬 Xác nhận sẽ chuyển sang trạng thái "Đang tư vấn"`}
          </div>

          {/* ── Buttons ── */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Hủy
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 20px', borderRadius: 7, border: 'none',
                background: saving ? '#d1d5db' : ACCENT,
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}>
              <IconCheck size={15} stroke={2.5} />
              {saving ? 'Đang lưu...' : `Phân phòng ${visitTypeInfo?.label ?? ''}`}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
