import { useState, useEffect, useCallback } from 'react'
import { IconBrandWhatsapp, IconSend, IconCheck } from '@tabler/icons-react'
import { getReminders } from '../../../api/cskh'
import NhacZaloModal from '../modals/NhacZaloModal'
import NhacTatCaModal from '../modals/NhacTatCaModal'
import toast from 'react-hot-toast'

const ACCENT = '#be185d'

const DEMO_ROWS = [
  { id: 1, customer_name: 'Thảo Vi', service: 'Trẻ hoá da · Buổi 4/6 · TRỄ LỊCH', date: '26/05 · Đã trễ 2 ngày', confirmed: 'Chưa phản hồi', reminded: 'Đã nhắc 1 lần', status: 'tre-lich' },
  { id: 2, customer_name: 'Kathy Le', service: 'Điều trị mụn · Buổi 4/10', date: '25/05 · 09:00 (còn 3 ngày)', confirmed: 'Chưa xác nhận', reminded: 'Chưa nhắc', status: 'chua-nhac' },
  { id: 3, customer_name: 'Dat Huynh', service: 'SEO rỗ · Buổi 6/11', date: '28/05 · 10:00 (còn 6 ngày)', confirmed: 'Đã xác nhận', reminded: 'Đã nhắc', status: 'xong' },
]

export default function NhacLichTab() {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)
  const [selRow, setSelRow]   = useState(null)

  const today = new Date().toLocaleDateString('vi', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getReminders({ status: 'confirmed', date: new Date().toISOString().slice(0, 10) })
      const data = res.data?.results ?? res.data ?? []
      setRows(data.length > 0 ? data : DEMO_ROWS)
    } catch {
      setRows(DEMO_ROWS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const chuaNhac = rows.filter(r => r.status === 'chua-nhac' || r.status === 'tre-lich')

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', background: '#fff', borderBottom: '1px solid #eef1f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2044' }}>
          Nhắc lịch hôm nay — {today}
        </div>
        <button onClick={() => setModal('nhac-tat-ca')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, border: 'none', background: '#00b259', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <IconBrandWhatsapp size={14} /> Gửi tất cả Zalo
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Info box */}
        <div style={{ padding: '8px 12px', background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: 8, fontSize: 11, color: '#be185d', display: 'flex', gap: 6 }}>
          <span>ℹ️</span>
          <span>{chuaNhac.length} KH cần nhắc lịch hôm nay. Nhắc trước buổi khám 2–3 ngày qua Zalo để KH xác nhận, tránh bỏ lịch.</span>
        </div>

        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden', flex: 1 }}>
          <div style={{ padding: '9px 14px', background: '#f8fafc', borderBottom: '1px solid #eef1f6' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#0f2044' }}>Danh sách cần nhắc</span>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Đang tải...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Khách hàng', 'Dịch vụ / Buổi', 'Lịch hẹn', 'KH xác nhận', 'Đã nhắc', 'Hành động'].map(h => (
                      <th key={h} style={{ padding: '7px 11px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id} style={{ background: r.status === 'tre-lich' ? '#fef2f2' : '#fff' }}>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: r.status === 'tre-lich' ? '#dc2626' : '#111827' }}>
                        {r.customer_name}
                        {r.status === 'tre-lich' && <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 20, fontSize: 8, fontWeight: 700, background: '#fee2e2', color: '#dc2626' }}>Trễ!</span>}
                      </td>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9', color: r.status === 'tre-lich' ? '#dc2626' : '#374151', fontSize: 10 }}>{r.service}</td>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9', fontSize: 10, color: r.status === 'tre-lich' ? '#dc2626' : '#374151', whiteSpace: 'nowrap' }}>{r.date}</td>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 700, background: r.confirmed === 'Đã xác nhận' ? '#dcfce7' : '#f1f5f9', color: r.confirmed === 'Đã xác nhận' ? '#15803d' : '#475569' }}>
                          {r.confirmed}
                        </span>
                      </td>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 700, background: r.reminded === 'Đã nhắc' || r.reminded?.startsWith('Đã nhắc') ? '#dbeafe' : '#f1f5f9', color: r.reminded === 'Đã nhắc' || r.reminded?.startsWith('Đã nhắc') ? '#1e40af' : '#475569' }}>
                          {r.reminded}
                        </span>
                      </td>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9' }}>
                        {r.status === 'xong' ? (
                          <button style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 6, border: 'none', background: '#15803d', color: '#fff', fontSize: 9, fontWeight: 600, cursor: 'default' }}>
                            <IconCheck size={11} /> Xong
                          </button>
                        ) : (
                          <button onClick={() => { setSelRow(r); setModal('nhac-zalo') }}
                            style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 6, border: 'none', background: r.status === 'tre-lich' ? ACCENT : '#00b259', color: '#fff', fontSize: 9, fontWeight: 600, cursor: 'pointer' }}>
                            {r.status === 'tre-lich' ? '⚠ Nhắc gấp' : <><IconBrandWhatsapp size={11} /> Gửi Zalo</>}
                          </button>
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

      {modal === 'nhac-zalo'  && selRow  && <NhacZaloModal appt={selRow} onClose={() => { setModal(null); setSelRow(null) }} />}
      {modal === 'nhac-tat-ca'&& <NhacTatCaModal count={chuaNhac.length} onClose={() => setModal(null)} />}
    </div>
  )
}
