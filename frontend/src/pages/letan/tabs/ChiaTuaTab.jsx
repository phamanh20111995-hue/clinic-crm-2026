import { useState, useEffect, useCallback } from 'react'
import { IconSend, IconRefresh } from '@tabler/icons-react'
import { getTodayAppointments, confirmTua } from '../../../api/letan'
import toast from 'react-hot-toast'

const ACCENT = '#b45309'

export default function ChiaTuaTab() {
  const [appts, setAppts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getTodayAppointments()
      const all = res.data?.results ?? res.data ?? []
      setAppts(all.filter(a => a.status === 'done' || a.status === 'in_progress'))
    } catch {
      setAppts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSendZalo = async (appt) => {
    setSending(s => ({ ...s, [appt.id]: true }))
    try {
      await confirmTua(appt.id, { via_zalo: true })
      toast.success(`Đã gửi Zalo xác nhận tua cho ${appt.customer_name}`)
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi gửi Zalo')
    } finally {
      setSending(s => ({ ...s, [appt.id]: false }))
    }
  }

  const totalSessions = appts.length
  const confirmed = appts.filter(a => a.tua_confirmed).length

  return (
    <div>
      {/* Header stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '10px 18px' }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: ACCENT, margin: 0 }}>{totalSessions}</p>
          <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>Buổi điều trị hôm nay</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '10px 18px' }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#15803d', margin: 0 }}>{confirmed}</p>
          <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>Đã xác nhận tua</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '10px 18px' }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#dc2626', margin: 0 }}>{totalSessions - confirmed}</p>
          <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>Chờ xác nhận</p>
        </div>
        <button onClick={load} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 12, cursor: 'pointer' }}>
          <IconRefresh size={13} /> Làm mới
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Đang tải...</div>
        ) : appts.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
            <p style={{ fontSize: 28, margin: '0 0 8px' }}>📋</p>
            <p>Chưa có buổi điều trị nào hôm nay</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Khách hàng', 'Dịch vụ', 'BS / KTV', 'Phòng', 'Giờ kết thúc', 'Xác nhận tua', 'Thao tác'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: 11, color: '#6b7280', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid #dde3ef' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appts.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: i < appts.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <p style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>{a.customer_name}</p>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{a.customer_phone}</p>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#374151' }}>{a.service_name ?? '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#374151' }}>
                    {[a.doctor_name, a.ktv_name].filter(Boolean).join(' / ') || '—'}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#374151' }}>{a.room_name ?? '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#374151' }}>
                    {a.checked_out_at ? new Date(a.checked_out_at).toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {a.tua_confirmed
                      ? <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>✅ Đã xác nhận</span>
                      : <span style={{ fontSize: 11, background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>⏳ Chờ</span>
                    }
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {!a.tua_confirmed && (
                      <button onClick={() => handleSendZalo(a)} disabled={sending[a.id]}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: 'none', background: sending[a.id] ? '#d1d5db' : '#0ea5e9', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        <IconSend size={11} />
                        {sending[a.id] ? '...' : 'Gửi Zalo'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
