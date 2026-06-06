import { useState, useEffect } from 'react'
import { IconCoin, IconCheck, IconClock, IconWallet, IconUpload } from '@tabler/icons-react'
import { getSalaryMonthly } from '../../../api/ketoan'
import GuiLinkZaloModal from '../modals/GuiLinkZaloModal'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')

export default function LuongTuaTab() {
  const [records, setRecords] = useState([])
  const [guiTarget, setGuiTarget] = useState(null)

  useEffect(() => {
    getSalaryMonthly().then(r => {
      const data = r.data?.results ?? r.data ?? []
      setRecords(Array.isArray(data) ? data : [])
    }).catch(() => {})
  }, [])

  const confirmed = records.filter(r => r.tua_confirmed)
  const waiting = records.filter(r => !r.tua_confirmed)
  const totalTua = records.reduce((s, r) => s + Number(r.total_tua ?? 0), 0)
  const totalSessions = records.reduce((s, r) => s + Number(r.sessions ?? 0), 0)
  const totalLuong = records.reduce((s, r) => s + Number(r.total ?? 0), 0)
  const now = new Date()
  const monthLabel = `T${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[
          { icon: <IconCoin size={13} color="#5b21b6" />, l: 'Tổng tua BS/KTV', v: fmt(totalTua) + 'đ', sub: `${records.length} người · ${totalSessions} buổi`, c: '#5b21b6', bc: '#5b21b6' },
          { icon: <IconCheck size={13} color="#15803d" />, l: 'Đã xác nhận', v: `${confirmed.length} / ${records.length}`, sub: confirmed.map(r => r.user_name?.split(' ').pop()).join(' · ') || '—', c: '#15803d', bc: undefined },
          { icon: <IconClock size={13} color="#854d0e" />, l: 'Chờ xác nhận Zalo', v: String(waiting.length), sub: 'Đã gửi link · Chờ ký', c: '#854d0e', bc: undefined },
          { icon: <IconWallet size={13} color="#1e40af" />, l: 'Tổng lương ước tính', v: fmt(totalLuong) + 'đ', sub: `${records.length} nhân sự · ${monthLabel}`, c: '#1e40af', bc: undefined },
        ].map(s => (
          <div key={s.l} style={{ background: '#fff', border: `1px solid ${s.bc ?? '#dde3ef'}`, borderRadius: 9, padding: '11px 13px' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>{s.icon}{s.l}</div>
            <div style={{ fontSize: s.l === 'Tổng lương ước tính' ? 17 : 19, fontWeight: 700, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2044' }}>Bảng tua BS/KTV {monthLabel}</span>
          <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid #dde3ef', borderRadius: 6, background: '#fff', fontSize: 11, cursor: 'pointer' }}>
            <IconUpload size={11} /> Xuất bảng lương
          </button>
        </div>

        {records.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
            API lương chưa có dữ liệu · Sẽ hiển thị khi backend triển khai
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['BS/KTV', 'Số buổi', 'Đơn giá', 'Tổng tua', 'Trạng thái', 'Link Zalo'].map(h => (
                    <th key={h} style={{ padding: '7px 11px', textAlign: ['Số buổi', 'Đơn giá', 'Tổng tua'].includes(h) ? 'right' : 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '7px 11px' }}>
                      <b>{r.user_name}</b>{' '}
                      <span style={{ background: '#fee2e2', color: '#991b1b', padding: '1px 5px', borderRadius: 4, fontSize: 8, fontWeight: 600 }}>{r.user_code}</span>
                    </td>
                    <td style={{ padding: '7px 11px', textAlign: 'right' }}>{r.sessions ?? 0}</td>
                    <td style={{ padding: '7px 11px', textAlign: 'right' }}>{fmt(r.tua_rate)}đ</td>
                    <td style={{ padding: '7px 11px', textAlign: 'right', color: r.tua_confirmed ? '#15803d' : '#5b21b6', fontWeight: 600 }}>{fmt(r.total_tua)}đ</td>
                    <td style={{ padding: '7px 11px' }}>
                      <span style={{ background: r.tua_confirmed ? '#dcfce7' : '#fef9c3', color: r.tua_confirmed ? '#15803d' : '#854d0e', padding: '1px 6px', borderRadius: 10, fontSize: 9, fontWeight: 600 }}>
                        {r.tua_confirmed ? '✓ Đã xác nhận' : 'Chờ xác nhận'}
                      </span>
                    </td>
                    <td style={{ padding: '7px 11px' }}>
                      {r.tua_confirmed ? (
                        <button style={{ padding: '2px 8px', border: '1px solid #dde3ef', borderRadius: 5, background: '#fff', fontSize: 9, cursor: 'pointer' }}>Xem</button>
                      ) : (
                        <button onClick={() => setGuiTarget({ ...r, month_label: monthLabel })}
                          style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', border: '1px solid #00b259', borderRadius: 5, background: '#fff', color: '#00b259', fontSize: 9, cursor: 'pointer', fontWeight: 600 }}>
                          Gửi link
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc', borderTop: '2px solid #fde68a' }}>
                  <td style={{ padding: '7px 11px', fontWeight: 700 }}>Tổng</td>
                  <td style={{ padding: '7px 11px', textAlign: 'right', fontWeight: 700 }}>{totalSessions} buổi</td>
                  <td style={{ padding: '7px 11px', textAlign: 'right' }}>—</td>
                  <td style={{ padding: '7px 11px', textAlign: 'right', color: '#5b21b6', fontWeight: 700 }}>{fmt(totalTua)}đ</td>
                  <td colSpan={2} style={{ padding: '7px 11px', fontSize: 10, color: '#64748b' }}>{confirmed.length}/{records.length} xác nhận · Ghi lương sau khi tất cả ký</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {guiTarget && <GuiLinkZaloModal record={guiTarget} onClose={() => setGuiTarget(null)} />}
    </div>
  )
}
