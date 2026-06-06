import { useState, useEffect } from 'react'
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react'
import { getContracts } from '../../../api/sale'
import ThuNoModal from '../modals/ThuNoModal'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')

export default function CongNoTab() {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(false)
  const [thuNoTarget, setThuNoTarget] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const r = await getContracts({ payment_status: 'partial,unpaid,pending', approval_status: 'approved' })
      const all = r.data?.results ?? r.data ?? []
      setContracts(all.filter(c => {
        const con = Number(c.final_amount ?? 0) - Number(c.paid_amount ?? 0)
        return con > 0
      }))
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const totalDebt = contracts.reduce((s, c) => s + (Number(c.final_amount ?? 0) - Number(c.paid_amount ?? 0)), 0)

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Banner */}
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconAlertCircle size={18} color="#dc2626" />
          <div>
            <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 700 }}>Tổng công nợ</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626' }}>{fmt(totalDebt)}đ</div>
          </div>
        </div>
        <button onClick={load} style={{ padding: '6px 8px', border: '1px solid #fecaca', borderRadius: 7, background: '#fff', cursor: 'pointer', color: '#dc2626' }}>
          <IconRefresh size={14} />
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 70px', gap: 8, fontSize: 10, fontWeight: 700, color: '#64748b' }}>
          <span>Khách hàng / HĐ</span>
          <span style={{ textAlign: 'right' }}>Tổng HĐ</span>
          <span style={{ textAlign: 'right' }}>Đã thu</span>
          <span style={{ textAlign: 'right' }}>Còn nợ</span>
          <span></span>
        </div>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Đang tải...</div>
        ) : contracts.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#15803d', fontSize: 12 }}>Không có công nợ</div>
        ) : contracts.map(c => {
          const con = Number(c.final_amount ?? 0) - Number(c.paid_amount ?? 0)
          return (
            <div key={c.id} style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 70px', gap: 8, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f2044' }}>{c.customer_name}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>{c.contract_no} · {c.created_at?.slice(0, 10)}</div>
              </div>
              <div style={{ fontSize: 12, textAlign: 'right', color: '#374151' }}>{fmt(c.final_amount)}</div>
              <div style={{ fontSize: 12, textAlign: 'right', color: '#15803d' }}>{fmt(c.paid_amount)}</div>
              <div style={{ fontSize: 12, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{fmt(con)}</div>
              <div>
                <button onClick={() => setThuNoTarget(c)}
                  style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: 'none', background: '#15803d', color: '#fff', cursor: 'pointer', fontWeight: 600, width: '100%' }}>
                  Thu
                </button>
              </div>
            </div>
          )
        })}
        {contracts.length > 0 && (
          <div style={{ padding: '10px 14px', borderTop: '2px solid #dde3ef', display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 70px', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>Tổng ({contracts.length} HĐ)</div>
            <div style={{ fontSize: 11, textAlign: 'right', fontWeight: 700 }}>{fmt(contracts.reduce((s, c) => s + Number(c.final_amount ?? 0), 0))}</div>
            <div style={{ fontSize: 11, textAlign: 'right', fontWeight: 700, color: '#15803d' }}>{fmt(contracts.reduce((s, c) => s + Number(c.paid_amount ?? 0), 0))}</div>
            <div style={{ fontSize: 11, textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>{fmt(totalDebt)}</div>
            <div></div>
          </div>
        )}
      </div>

      {thuNoTarget && <ThuNoModal contract={thuNoTarget} onClose={() => setThuNoTarget(null)} onDone={() => { setThuNoTarget(null); load() }} />}
    </div>
  )
}
