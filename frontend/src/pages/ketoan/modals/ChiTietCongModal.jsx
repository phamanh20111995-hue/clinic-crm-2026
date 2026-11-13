import { useState, useEffect } from 'react'
import { IconX, IconCalendarStats } from '@tabler/icons-react'
import { getMonthlyAttendance } from '../../../api/attendance'

// Modal Chi tiết công của 1 nhân viên trong tháng.
// Dùng chung: Bảng lương Kế toán, HCNS, /me. Props: row (bản ghi lương), month, year, onClose.
const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')
const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const ST = {
  on_time: { c: 'p-on',   l: 'Đúng giờ' },
  late:    { c: 'p-late', l: 'Đi muộn' },
  early:   { c: 'p-early', l: 'Về sớm' },
  absent:  { c: 'p-abs',  l: 'Vắng (ko phép)' },
  leave:   { c: 'p-leave', l: 'Nghỉ phép' },
}
const pill = {
  'p-on': { background: '#dcfce7', color: '#15803d' },
  'p-late': { background: '#fef9c3', color: '#854d0e' },
  'p-early': { background: '#ffedd5', color: '#9a3412' },
  'p-abs': { background: '#fee2e2', color: '#b91c1c' },
  'p-leave': { background: '#e0e7ff', color: '#3730a3' },
}
const SRC = { machine: '🖐️ Máy', manual: '✍️ Tay', face: '😊 Khuôn mặt' }

export default function ChiTietCongModal({ row, month, year, onClose }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getMonthlyAttendance({ user_id: row.user, year, month })
      .then(r => {
        const d = r.data || {}
        const recs = d.records ?? (Array.isArray(d) ? d : [])
        recs.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
        setRecords(recs)
      })
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }, [row.user, month, year])

  const working = Number(row.working_days || 0)
  const present = Number(row.actual_days || 0)
  const absent = Number(row.absent_days || 0)
  const lateMin = Number(row.late_minutes_total || 0)
  const leaveCnt = records.filter(r => r.status === 'leave').length
  const hasData = records.length > 0 || leaveCnt > 0
  const ratio = working > 0 ? present / working : 1
  const p1 = Number(row.base || 0)
  const p2 = Number(row.competency || 0) + Number(row.allowance || 0)
  const deduct = Number(row.deductions || 0)

  const lbl = { fontSize: 12, fontWeight: 700, color: '#0f2044', margin: '2px 0 8px' }
  const card = (n, k, color) => (
    <div style={{ border: '1px solid #eef1f6', borderRadius: 10, padding: 10, textAlign: 'center' }}>
      <div style={{ fontSize: 19, fontWeight: 800, color }}>{n}</div>
      <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>{k}</div>
    </div>
  )
  const dcell = { padding: '7px 10px', fontSize: 12, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }
  const dth = { ...dcell, fontSize: 10, fontWeight: 600, color: '#64748b', background: '#f8fafc', textAlign: 'left', position: 'sticky', top: 0 }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: 760, maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(15,23,42,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid #eef1f6', position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
          <IconCalendarStats size={18} color="#6d28d9" />
          <span style={{ fontSize: 15, fontWeight: 800, color: '#0f2044' }}>Chi tiết công — {row.user_name} · T{month}/{year}</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}><IconX size={18} /></button>
        </div>

        <div style={{ padding: 20 }}>
          {/* Thẻ tóm tắt */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 14 }}>
            {card(working, 'Công chuẩn', '#1e40af')}
            {card(present, 'Ngày đi làm', '#15803d')}
            {card(leaveCnt || '0', 'Nghỉ phép', '#3730a3')}
            {card(absent, 'Vắng (ko phép)', '#b91c1c')}
            {card(lateMin + "'", 'Tổng phút muộn', '#854d0e')}
          </div>

          {/* Công thức ra P1/P2 */}
          <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: '12px 14px', fontSize: 12.5, color: '#4c1d95', lineHeight: 1.9, marginBottom: 16 }}>
            {hasData ? (
              <div>Tỷ lệ công = Ngày đi làm ÷ Công chuẩn = <b>{present} ÷ {working || '—'}</b> = <b>{(ratio * 100).toFixed(1)}%</b></div>
            ) : (
              <div>⚠️ <b>Chưa có dữ liệu chấm công</b> tháng này → hưởng <b>đủ P1/P2 (100%)</b>. (Khi máy chấm công đồng bộ, P1/P2 sẽ chia theo tỷ lệ công.)</div>
            )}
            <div>P1 · Vị trí: <b>{fmt(p1)}đ</b></div>
            <div>P2 · Năng lực + phụ cấp: <b>{fmt(p2)}đ</b></div>
            <div style={{ color: '#6b7280' }}>P3 · Hiệu suất (hoa hồng/tua/thưởng) không chia công · Khấu trừ muộn/vắng: <b style={{ color: deduct > 0 ? '#dc2626' : '#15803d' }}>{deduct > 0 ? '−' + fmt(deduct) : '0'}đ</b></div>
          </div>

          {/* Bảng chấm công theo ngày */}
          <div style={lbl}>Bảng chấm công theo ngày</div>
          <div style={{ border: '1px solid #eef1f6', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={dth}>Ngày</th><th style={dth}>Thứ</th><th style={dth}>Giờ vào</th><th style={dth}>Giờ ra</th><th style={dth}>Trạng thái</th><th style={{ ...dth, textAlign: 'right' }}>Phút muộn</th><th style={dth}>Nguồn</th>
              </tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ ...dcell, textAlign: 'center', color: '#94a3b8', padding: 24 }}>Đang tải…</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={7} style={{ ...dcell, textAlign: 'center', color: '#94a3b8', padding: 24 }}>Chưa có dữ liệu chấm công tháng này (máy chấm công chưa đồng bộ)</td></tr>
                ) : records.map(r => {
                  const dt = new Date((r.date || '') + 'T00:00:00')
                  const st = ST[r.status] || ST.on_time
                  return (
                    <tr key={r.id}>
                      <td style={dcell}>{r.date ? `${String(dt.getDate()).padStart(2, '0')}/${dt.getMonth() + 1}` : '—'}</td>
                      <td style={dcell}>{r.date ? DOW[dt.getDay()] : '—'}</td>
                      <td style={dcell}>{r.check_in || '—'}</td>
                      <td style={dcell}>{r.check_out || '—'}</td>
                      <td style={dcell}><span style={{ ...pill[st.c], padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{r.status_display || st.l}</span></td>
                      <td style={{ ...dcell, textAlign: 'right', color: r.late_minutes > 0 ? '#dc2626' : '#94a3b8' }}>{r.late_minutes > 0 ? r.late_minutes + "'" : '—'}</td>
                      <td style={{ ...dcell, color: '#64748b' }}>{SRC[r.source] || r.source_display || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>Nguồn: 🖐️ Máy (ZKTeco) · ✍️ Nhập tay · 😊 Khuôn mặt + GPS (tương lai) — tất cả đổ chung về 1 bảng, lương tự ăn.</div>
        </div>
      </div>
    </div>
  )
}
