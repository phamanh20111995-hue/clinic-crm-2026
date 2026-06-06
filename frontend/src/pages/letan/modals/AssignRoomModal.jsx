import { useState, useEffect } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import { getRooms, getUsers, updateAppointment } from '../../../api/letan'
import toast from 'react-hot-toast'

const ACCENT = '#b45309'
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }

export default function AssignRoomModal({ appt, onClose, onDone }) {
  const [rooms, setRooms]   = useState([])
  const [users, setUsers]   = useState([])
  const [room, setRoom]     = useState(appt.room ?? '')
  const [doctor, setDoctor] = useState(appt.doctor ?? '')
  const [ktv, setKtv]       = useState(appt.ktv ?? '')
  const [status, setStatus] = useState('in_progress')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getRooms().then(r => setRooms(r.data?.results ?? r.data ?? [])).catch(() => {})
    getUsers().then(r => setUsers(r.data?.results ?? r.data ?? [])).catch(() => {})
  }, [])

  const inputStyle = { width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box' }
  const label = { fontSize: 12, color: '#374151', display: 'block', marginBottom: 4, fontWeight: 500 }

  const treatmentRooms = rooms.filter(r => r.room_type === 'treatment' || r.room_type === 'dental')
  const allRooms = rooms

  const handleSave = async () => {
    if (!room) { toast.error('Chọn phòng điều trị'); return }
    setSaving(true)
    try {
      await updateAppointment(appt.id, {
        room: room || null,
        doctor: doctor || null,
        ktv: ktv || null,
        status,
      })
      toast.success('Đã phân phòng & cập nhật')
      onDone?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi phân phòng')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Phân phòng điều trị</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
              {appt.customer_name} · {appt.service_name ?? 'Không xác định DV'}
            </p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={20} /></button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Phòng */}
          <div>
            <label style={label}>Phòng điều trị *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 6 }}>
              {(treatmentRooms.length ? treatmentRooms : allRooms).map(r => (
                <button key={r.id} onClick={() => setRoom(String(r.id))}
                  style={{
                    padding: '8px 6px', borderRadius: 8, border: `2px solid ${String(room) === String(r.id) ? ACCENT : '#dde3ef'}`,
                    background: String(room) === String(r.id) ? '#fff7ed' : '#fff',
                    color: String(room) === String(r.id) ? ACCENT : '#374151',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>
                  {r.name}
                  <div style={{ fontSize: 10, fontWeight: 400, color: '#9ca3af', marginTop: 2 }}>{r.room_type === 'treatment' ? 'Điều trị' : r.room_type === 'dental' ? 'Nha khoa' : 'TV'}</div>
                </button>
              ))}
            </div>
          </div>

          {/* BS + KTV */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={label}>Bác sĩ</label>
              <select value={doctor} onChange={e => setDoctor(e.target.value)} style={inputStyle}>
                <option value="">— Chưa chỉ định —</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.display_name ?? u.email}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Kỹ thuật viên</label>
              <select value={ktv} onChange={e => setKtv(e.target.value)} style={inputStyle}>
                <option value="">— Chưa chỉ định —</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.display_name ?? u.email}</option>)}
              </select>
            </div>
          </div>

          {/* Trạng thái */}
          <div>
            <label style={label}>Chuyển trạng thái sang</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { v: 'in_progress', l: '▶ Đang điều trị', c: '#15803d' },
                { v: 'confirmed',   l: '💬 Tiếp tục tư vấn', c: '#6d28d9' },
              ].map(o => (
                <button key={o.v} onClick={() => setStatus(o.v)}
                  style={{
                    flex: 1, padding: '7px 10px', borderRadius: 7,
                    border: `1.5px solid ${status === o.v ? o.c : '#dde3ef'}`,
                    background: status === o.v ? o.c + '12' : '#fff',
                    color: status === o.v ? o.c : '#6b7280',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : ACCENT, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <IconCheck size={15} stroke={2.5} />
              {saving ? 'Đang lưu...' : 'Xác nhận phân phòng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
