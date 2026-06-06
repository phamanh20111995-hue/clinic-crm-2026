import { useState, useEffect } from 'react'
import { IconAlertTriangle, IconUsers, IconCheck, IconClock, IconX, IconCalendar, IconAdjustments, IconUpload } from '@tabler/icons-react'
import { getAttendanceToday } from '../../../api/ketoan'
import ViPhamModal from '../modals/ViPhamModal'
import LyDoVangModal from '../modals/LyDoVangModal'
import BangCongThangModal from '../modals/BangCongThangModal'
import ChinhCongModal from '../modals/ChinhCongModal'
import NghiPhepKTModal from '../modals/NghiPhepKTModal'

const SHIFT_LABEL = { sang: '☀️ Sáng', chieu: '🌤 Chiều', toi: '🌙 Tối' }

const STATUS_STYLE = {
  ontime:  { bg: '#dcfce7', c: '#15803d', label: '✓ Đúng giờ' },
  late:    { bg: '#fef9c3', c: '#854d0e', label: '⚠ Muộn' },
  absent:  { bg: '#fee2e2', c: '#991b1b', label: '✗ Vắng' },
  leave:   { bg: '#ede9fe', c: '#6d28d9', label: '~ Nghỉ phép' },
}

const initials = name => (name ?? '?').split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()

export default function ChamCongTab() {
  const [records, setRecords] = useState([])
  const [viPhamTarget, setViPhamTarget] = useState(null)
  const [vangTarget, setVangTarget] = useState(null)
  const [bangCongOpen, setBangCongOpen] = useState(false)
  const [chinhCongOpen, setChinhCongOpen] = useState(false)
  const [nghiPhepTarget, setNghiPhepTarget] = useState(null)

  const load = () => getAttendanceToday().then(r => {
    const data = r.data?.results ?? r.data ?? []
    setRecords(Array.isArray(data) ? data : [])
  }).catch(() => {})

  useEffect(() => { load() }, [])

  const violations = records.filter(r => r.status === 'late' || r.status === 'absent')
  const ontime = records.filter(r => r.status === 'ontime').length
  const late = records.filter(r => r.status === 'late').length
  const absent = records.filter(r => r.status === 'absent').length
  const onLeave = records.filter(r => r.status === 'leave').length

  const shifts = ['sang', 'chieu', 'toi']
  const byShift = s => records.filter(r => r.shift === s)

  const today = new Date()
  const dateLabel = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Alert bar */}
      {violations.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 9, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconAlertTriangle size={14} color="#b45309" />
          <span style={{ fontSize: 11, color: '#92400e', fontWeight: 600 }}>
            {violations.length} vi phạm hôm nay:
          </span>
          <span style={{ fontSize: 11, color: '#92400e' }}>
            {violations.map(r => r.user_name?.split(' ').pop()).join(', ')}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#b45309', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => setViPhamTarget(violations[0])}>
            Xử lý vi phạm →
          </span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
        {[
          { icon: <IconUsers size={13} color="#0369a1" />, l: 'Tổng nhân sự', v: records.length, sub: `${dateLabel}`, c: '#0369a1' },
          { icon: <IconCheck size={13} color="#15803d" />, l: 'Đúng giờ', v: ontime, sub: `${records.length ? Math.round(ontime/records.length*100) : 0}%`, c: '#15803d' },
          { icon: <IconClock size={13} color="#854d0e" />, l: 'Đi muộn', v: late, sub: late ? 'Xem chi tiết →' : '—', c: '#854d0e' },
          { icon: <IconX size={13} color="#991b1b" />, l: 'Vắng mặt', v: absent, sub: absent ? 'Chưa có lý do' : '—', c: '#991b1b' },
          { icon: <IconCalendar size={13} color="#6d28d9" />, l: 'Nghỉ phép', v: onLeave, sub: 'Đã duyệt', c: '#6d28d9' },
        ].map(s => (
          <div key={s.l} style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 9, padding: '11px 13px' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>{s.icon}{s.l}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2044' }}>Bảng chấm công hôm nay — {dateLabel}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setBangCongOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid #dde3ef', borderRadius: 6, background: '#fff', fontSize: 11, cursor: 'pointer' }}>
              <IconCalendar size={11} /> Bảng công tháng
            </button>
            <button onClick={() => setNghiPhepTarget({})}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid #dde3ef', borderRadius: 6, background: '#fff', fontSize: 11, cursor: 'pointer' }}>
              Nghỉ phép
            </button>
            <button onClick={() => setChinhCongOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid #dde3ef', borderRadius: 6, background: '#fff', fontSize: 11, cursor: 'pointer' }}>
              <IconAdjustments size={11} /> Chỉnh công
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid #dde3ef', borderRadius: 6, background: '#fff', fontSize: 11, cursor: 'pointer' }}>
              <IconUpload size={11} /> Xuất
            </button>
          </div>
        </div>

        {records.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
            API chấm công chưa có dữ liệu · Sẽ hiển thị khi backend triển khai
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {shifts.map(shift => {
              const rows = byShift(shift)
              if (!rows.length) return null
              return (
                <div key={shift}>
                  <div style={{ padding: '6px 14px', background: '#f0f9ff', borderBottom: '1px solid #e0f2fe', fontSize: 10, fontWeight: 700, color: '#0369a1' }}>
                    {SHIFT_LABEL[shift]}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Nhân viên', 'Vai trò', 'Giờ vào', 'Giờ ra', 'Trạng thái', 'Ghi chú', ''].map(h => (
                          <th key={h} style={{ padding: '6px 11px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(r => {
                        const st = STATUS_STYLE[r.status] ?? STATUS_STYLE.ontime
                        const rowBg = r.status === 'late' ? '#fffef0' : r.status === 'absent' ? '#fff5f5' : '#fff'
                        return (
                          <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', background: rowBg }}>
                            <td style={{ padding: '7px 11px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#4338ca', flexShrink: 0 }}>
                                  {initials(r.user_name)}
                                </div>
                                <div>
                                  <b style={{ fontSize: 11 }}>{r.user_name}</b>
                                  <div style={{ fontSize: 9, color: '#94a3b8' }}>{r.user_code}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '7px 11px', color: '#64748b' }}>{r.role_label ?? '—'}</td>
                            <td style={{ padding: '7px 11px', fontWeight: 600 }}>{r.check_in ?? '—'}</td>
                            <td style={{ padding: '7px 11px', color: '#64748b' }}>{r.check_out ?? '—'}</td>
                            <td style={{ padding: '7px 11px' }}>
                              <span style={{ background: st.bg, color: st.c, padding: '1px 7px', borderRadius: 10, fontSize: 9, fontWeight: 600 }}>{st.label}</span>
                            </td>
                            <td style={{ padding: '7px 11px', color: '#64748b', fontSize: 10 }}>{r.note ?? '—'}</td>
                            <td style={{ padding: '7px 11px' }}>
                              {r.status === 'late' && (
                                <button onClick={() => setViPhamTarget(r)}
                                  style={{ padding: '2px 8px', border: '1px solid #fde68a', borderRadius: 5, background: '#fffbeb', color: '#854d0e', fontSize: 9, cursor: 'pointer', fontWeight: 600 }}>
                                  Xử lý
                                </button>
                              )}
                              {r.status === 'absent' && (
                                <button onClick={() => setVangTarget(r)}
                                  style={{ padding: '2px 8px', border: '1px solid #fecaca', borderRadius: 5, background: '#fff5f5', color: '#991b1b', fontSize: 9, cursor: 'pointer', fontWeight: 600 }}>
                                  Lý do
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '8px 14px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>🖥 Dữ liệu đồng bộ từ máy ZKTeco · Cập nhật mỗi 5 phút</span>
        </div>
      </div>

      {viPhamTarget && <ViPhamModal record={viPhamTarget} onClose={() => setViPhamTarget(null)} onDone={load} />}
      {vangTarget && <LyDoVangModal record={vangTarget} onClose={() => setVangTarget(null)} onDone={load} />}
      {bangCongOpen && <BangCongThangModal onClose={() => setBangCongOpen(false)} />}
      {chinhCongOpen && <ChinhCongModal onClose={() => setChinhCongOpen(false)} onDone={load} />}
      {nghiPhepTarget && <NghiPhepKTModal leave={nghiPhepTarget} onClose={() => setNghiPhepTarget(null)} onDone={load} />}
    </div>
  )
}
