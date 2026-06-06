import { useState, useEffect } from 'react'
import { IconInfoCircle } from '@tabler/icons-react'
import { getContracts } from '../../../api/ketoan'

export default function HoSoThueTab() {
  const [contracts, setContracts] = useState([])

  useEffect(() => {
    getContracts({ approval_status: 'approved', loai_dv: 'benh_ly' })
      .then(r => setContracts(r.data?.results ?? r.data ?? []))
      .catch(() => {})
  }, [])

  const checkDoc = (c, type) => {
    const docs = c.documents ?? {}
    switch (type) {
      case 'hd_dien_tu': return c.invoice_issued
      case 'cccd': return docs.cccd ?? false
      case 'anh_ts': return (c.images?.length ?? 0) >= 2
      case 'benh_an': return docs.medical_record ?? false
      default: return false
    }
  }

  const countDocs = c => [checkDoc(c, 'hd_dien_tu'), checkDoc(c, 'cccd'), checkDoc(c, 'anh_ts'), checkDoc(c, 'benh_an')].filter(Boolean).length

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 11, color: '#1e40af', display: 'flex', gap: 8 }}>
        <IconInfoCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>DV Bệnh lý được miễn VAT. Cần đầy đủ <b>4 loại hồ sơ</b>: (1) HĐ điện tử · (2) CCCD KH · (3) Ảnh trước/sau · (4) Bệnh án BS ký. Thiếu 1 trong 4 → không được miễn thuế.</div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2044' }}>Danh sách hồ sơ bệnh lý</span>
        </div>

        {contracts.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
            Chưa có HĐ bệnh lý được duyệt · Khi có HĐ bệnh lý sẽ hiển thị tại đây
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['KH', 'Dịch vụ', 'HĐ', 'HĐ điện tử', 'CCCD', 'Ảnh T/S', 'Bệnh án BS', 'Trạng thái'].map(h => (
                    <th key={h} style={{ padding: '7px 11px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contracts.map(c => {
                  const cnt = countDocs(c)
                  const full = cnt === 4
                  const checks = {
                    hd_dien_tu: checkDoc(c, 'hd_dien_tu'),
                    cccd: checkDoc(c, 'cccd'),
                    anh_ts: checkDoc(c, 'anh_ts'),
                    benh_an: checkDoc(c, 'benh_an'),
                  }
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', background: !full ? '#fef2f2' : undefined }}>
                      <td style={{ padding: '7px 11px', fontWeight: 700 }}>{c.customer_name}</td>
                      <td style={{ padding: '7px 11px', fontSize: 10 }}>{c.items?.[0]?.name ?? '—'}</td>
                      <td style={{ padding: '7px 11px', fontSize: 10 }}>{c.contract_no}</td>
                      {[checks.hd_dien_tu, checks.cccd, checks.anh_ts, checks.benh_an].map((ok, i) => (
                        <td key={i} style={{ padding: '7px 11px' }}>
                          <span style={{ background: ok ? '#dcfce7' : '#fee2e2', color: ok ? '#15803d' : '#991b1b', padding: '1px 6px', borderRadius: 10, fontSize: 8, fontWeight: 600 }}>
                            {ok ? '✓' : '✗ Thiếu'}
                          </span>
                        </td>
                      ))}
                      <td style={{ padding: '7px 11px' }}>
                        <span style={{ background: full ? '#dcfce7' : '#fee2e2', color: full ? '#15803d' : '#991b1b', padding: '1px 6px', borderRadius: 10, fontSize: 9, fontWeight: 600 }}>
                          {full ? `Đầy đủ ${cnt}/4` : `Thiếu ${cnt}/4`}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
