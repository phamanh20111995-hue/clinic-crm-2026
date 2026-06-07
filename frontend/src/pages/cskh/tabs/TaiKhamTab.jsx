import { useState, useEffect, useCallback } from 'react'
import { IconBrandWhatsapp, IconCalendarPlus } from '@tabler/icons-react'
import { getFollowUpList } from '../../../api/cskh'
import NhacZaloModal from '../modals/NhacZaloModal'

const ACCENT = '#be185d'

const DEMO_ROWS = [
  { id: 1, customer_name: 'Phạm Minh Đức', service: 'Điều trị mụn 10 buổi', completed_date: '15/04', followup_date: '15/05 · Quá hạn 7 ngày', status: 'chua-tai-kham', isLate: true },
  { id: 2, customer_name: 'Dat Huynh', service: 'Đang điều trị · 5/11', completed_date: '—', followup_date: 'Chưa đến hạn', status: 'dang-dt', isLate: false },
]

export default function TaiKhamTab() {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)
  const [selRow, setSelRow]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getFollowUpList()
      const data = res.data?.results ?? res.data ?? []
      setRows(data.length > 0 ? data : DEMO_ROWS)
    } catch {
      setRows(DEMO_ROWS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const late    = rows.filter(r => r.isLate).length
  const done    = rows.filter(r => r.status === 'da-tai-kham').length
  const pending = rows.filter(r => r.status === 'chua-tai-kham').length

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', background: '#fff', borderBottom: '1px solid #eef1f6', flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f2044' }}>Tái khám — Bảo trì sau điều trị</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { label: 'Cần tái khám 1 tháng', val: pending, color: ACCENT },
            { label: 'Đã tái khám T05',       val: done,    color: '#15803d', sub: '67% quay lại' },
            { label: 'DT từ tái khám',         val: '15tr đ', color: '#854d0e', sub: '4 KH mua thêm DV' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 9, border: '1px solid #dde3ef', padding: '11px 13px' }}>
              <div style={{ fontSize: 19, fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{s.label}</div>
              {s.sub && <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden', flex: 1 }}>
          <div style={{ padding: '9px 14px', background: '#f8fafc', borderBottom: '1px solid #eef1f6' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#0f2044' }}>Theo dõi tái khám</span>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Đang tải...</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔄</div>
              <div>Chưa có dữ liệu · sẽ hiển thị khi có KH hoàn thành liệu trình</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Khách hàng', 'LT hoàn thành', 'Ngày HT', 'Tái khám', 'Trạng thái', 'Hành động'].map(h => (
                      <th key={h} style={{ padding: '7px 11px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{r.customer_name}</td>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9', fontSize: 10 }}>{r.service}</td>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9', fontSize: 10 }}>{r.completed_date}</td>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9', fontSize: 10, color: r.isLate ? '#dc2626' : '#94a3b8' }}>{r.followup_date}</td>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 700, background: r.status === 'chua-tai-kham' ? '#fee2e2' : r.status === 'da-tai-kham' ? '#dcfce7' : '#f1f5f9', color: r.status === 'chua-tai-kham' ? '#dc2626' : r.status === 'da-tai-kham' ? '#15803d' : '#64748b' }}>
                          {r.status === 'chua-tai-kham' ? 'Chưa tái khám' : r.status === 'da-tai-kham' ? 'Đã tái khám' : 'Đang ĐT'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9' }}>
                        {r.status === 'chua-tai-kham' && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => { setSelRow(r); setModal('nhac') }}
                              style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 6, border: 'none', background: ACCENT, color: '#fff', fontSize: 9, cursor: 'pointer' }}>
                              Nhắc
                            </button>
                            <button style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 6, border: '1px solid #dde3ef', background: '#fff', color: '#374151', fontSize: 9, cursor: 'pointer' }}>
                              <IconCalendarPlus size={10} /> Đặt lịch
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal === 'nhac' && selRow && <NhacZaloModal appt={selRow} onClose={() => { setModal(null); setSelRow(null) }} />}
    </div>
  )
}
