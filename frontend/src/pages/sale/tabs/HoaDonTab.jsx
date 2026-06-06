import { useState, useEffect, useCallback } from 'react'
import { IconSearch, IconRefresh } from '@tabler/icons-react'
import { getContracts } from '../../../api/sale'
import SuaHDModal from '../modals/SuaHDModal'
import ThuNoModal from '../modals/ThuNoModal'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')

const STATUS_LABEL = {
  draft: { l: 'Nháp', c: '#64748b', bg: '#f1f5f9' },
  pending_kt: { l: 'Chờ KT', c: '#d97706', bg: '#fffbeb' },
  approved: { l: 'Đã duyệt', c: '#15803d', bg: '#f0fdf4' },
  rejected: { l: 'Từ chối', c: '#dc2626', bg: '#fef2f2' },
}
const PAY_LABEL = {
  pending: { l: 'Chưa thu', c: '#dc2626' },
  partial: { l: 'Một phần', c: '#d97706' },
  received: { l: 'Đủ', c: '#15803d' },
  unpaid: { l: 'Chưa thu', c: '#dc2626' },
}

const PIPELINE = [
  { k: 'draft', l: 'Nháp' },
  { k: 'pending_kt', l: 'Chờ KT duyệt' },
  { k: 'approved', l: 'Đã duyệt' },
  { k: 'rejected', l: 'Từ chối' },
]

export default function HoaDonTab() {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [suaTarget, setSuaTarget] = useState(null)
  const [thuNoTarget, setThuNoTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterStatus) params.approval_status = filterStatus
      if (search) params.search = search
      const r = await getContracts(params)
      setContracts(r.data?.results ?? r.data ?? [])
    } catch { } finally { setLoading(false) }
  }, [filterStatus, search])

  useEffect(() => { load() }, [load])

  const counts = PIPELINE.reduce((acc, p) => {
    acc[p.k] = contracts.filter(c => c.approval_status === p.k).length
    return acc
  }, {})

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {PIPELINE.map((p, i) => {
          const s = STATUS_LABEL[p.k]
          return (
            <button key={p.k} onClick={() => setFilterStatus(filterStatus === p.k ? '' : p.k)}
              style={{ padding: '8px', borderRadius: 8, border: `2px solid ${filterStatus === p.k ? s.c : '#dde3ef'}`, background: filterStatus === p.k ? s.bg : '#fff', cursor: 'pointer', textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>Bước {i + 1}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: s.c }}>{p.l}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: s.c }}>{counts[p.k] ?? 0}</div>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <IconSearch size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm HĐ, tên KH..."
            style={{ width: '100%', paddingLeft: 26, border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 8px 7px 26px', fontSize: 12, boxSizing: 'border-box' }} />
        </div>
        <button onClick={load} style={{ padding: '7px 10px', border: '1px solid #dde3ef', borderRadius: 7, background: '#fff', cursor: 'pointer', color: '#64748b' }}>
          <IconRefresh size={14} />
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Đang tải...</div>
        ) : contracts.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Không có hoá đơn nào</div>
        ) : contracts.map(c => {
          const st = STATUS_LABEL[c.approval_status] ?? STATUS_LABEL.draft
          const py = PAY_LABEL[c.payment_status] ?? PAY_LABEL.pending
          const isRejected = c.approval_status === 'rejected'
          const hasDebt = c.payment_status === 'partial' || c.payment_status === 'pending' || c.payment_status === 'unpaid'
          return (
            <div key={c.id} style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2044' }}>{c.contract_no}</span>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: st.bg, color: st.c, fontWeight: 600 }}>{st.l}</span>
                  <span style={{ fontSize: 10, color: py.c, fontWeight: 600 }}>{py.l}</span>
                </div>
                <div style={{ fontSize: 11, color: '#374151', fontWeight: 600 }}>{c.customer_name}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>{fmt(c.final_amount)}đ · {c.created_at?.slice(0, 10)}</div>
                {isRejected && c.reject_reason && (
                  <div style={{ fontSize: 10, color: '#dc2626', marginTop: 1 }}>"{c.reject_reason}"</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                {isRejected && (
                  <button onClick={() => setSuaTarget(c)}
                    style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #dc2626', background: '#fff', color: '#dc2626', cursor: 'pointer', fontWeight: 600 }}>
                    Sửa
                  </button>
                )}
                {hasDebt && c.approval_status === 'approved' && (
                  <button onClick={() => setThuNoTarget(c)}
                    style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: 'none', background: '#15803d', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                    Thu nợ
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
        DT chỉ ghi nhận khi KT duyệt HĐ. HĐ nháp/từ chối không tính vào doanh số.
      </div>

      {suaTarget && <SuaHDModal contract={suaTarget} onClose={() => setSuaTarget(null)} onDone={() => { setSuaTarget(null); load() }} />}
      {thuNoTarget && <ThuNoModal contract={thuNoTarget} onClose={() => setThuNoTarget(null)} onDone={() => { setThuNoTarget(null); load() }} />}
    </div>
  )
}
