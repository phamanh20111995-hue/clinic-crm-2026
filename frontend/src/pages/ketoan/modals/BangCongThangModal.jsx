import { useEffect } from 'react'
import { IconX, IconDownload } from '@tabler/icons-react'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

const DANH_GIA = { good: { l: 'Tốt', bg: '#dcfce7', c: '#15803d' }, warn: { l: 'Cần cải thiện', bg: '#fef9c3', c: '#854d0e' }, bad: { l: 'Vi phạm', bg: '#fee2e2', c: '#991b1b' } }

const getEval = (late, absent) => {
  if (absent > 0) return 'bad'
  if (late >= 3) return 'warn'
  return 'good'
}

export default function BangCongThangModal({ onClose, records = [], monthLabel }) {
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 680, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>Bảng công {monthLabel}</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Nhân viên', 'Ngày công', 'Lần muộn', 'Phút muộn', 'Vắng KP', 'Đánh giá'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: ['Ngày công', 'Lần muộn', 'Phút muộn', 'Vắng KP'].includes(h) ? 'right' : 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Không có dữ liệu</td></tr>
              ) : records.map((r, i) => {
                const ev = getEval(r.late_count ?? 0, r.absent_count ?? 0)
                const d = DANH_GIA[ev]
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: ev === 'bad' ? '#fef2f2' : ev === 'warn' ? '#fffbeb' : undefined }}>
                    <td style={{ padding: '7px 10px', fontWeight: 700 }}>{r.user_name}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right' }}>{r.working_days ?? 0}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: (r.late_count ?? 0) >= 3 ? '#dc2626' : '#15803d', fontWeight: (r.late_count ?? 0) >= 3 ? 700 : 400 }}>{r.late_count ?? 0}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: (r.late_minutes ?? 0) > 0 ? '#d97706' : '#15803d' }}>{r.late_minutes ?? 0}p</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: (r.absent_count ?? 0) > 0 ? '#dc2626' : undefined, fontWeight: (r.absent_count ?? 0) > 0 ? 700 : 400 }}>{r.absent_count ?? 0}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ background: d.bg, color: d.c, padding: '1px 7px', borderRadius: 10, fontSize: 9, fontWeight: 600 }}>{d.l}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 18px', borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Đóng</button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', borderRadius: 7, border: 'none', background: '#0369a1', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <IconDownload size={13} /> Xuất Excel
          </button>
        </div>
      </div>
    </div>
  )
}
