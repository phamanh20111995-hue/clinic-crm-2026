import { useState, useEffect, useCallback } from 'react'
import { IconPlus, IconRefresh, IconEdit, IconSend, IconTrash } from '@tabler/icons-react'
import { getCskhContracts } from '../../../api/cskh'
import { submitContract, deleteContract } from '../../../api/sale'
import ChotHDModal from '../../sale/modals/ChotHDModal'
import toast from 'react-hot-toast'

const ACCENT = '#be185d'

const STATUS_CFG = {
  draft:      { label: 'Nháp',          bg: '#f1f5f9', color: '#475569' },
  pending_kt: { label: 'Chờ KT duyệt', bg: '#fef9c3', color: '#854d0e' },
  approved:   { label: 'Đã duyệt',      bg: '#dcfce7', color: '#15803d' },
  rejected:   { label: 'Từ chối',       bg: '#fee2e2', color: '#dc2626' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? { label: status, bg: '#f1f5f9', color: '#64748b' }
  return (
    <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 9, fontWeight: 700, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  )
}

function fmtMoney(n) {
  const v = Number(n)
  if (!v) return '—'
  return v.toLocaleString('vi') + ' ₫'
}

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('vi-VN')
}

export default function HopDongTab() {
  const [contracts, setContracts]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editContract, setEditContract] = useState(null)   // contract object for edit modal

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCskhContracts()
      const data = res.data?.results ?? res.data ?? []
      setContracts(Array.isArray(data) ? data : [])
    } catch {
      setContracts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDone = (isEdit) => {
    toast.success(isEdit ? 'Đã cập nhật HĐ nháp' : 'Đã tạo HĐ nháp, chờ Kế toán duyệt', { duration: 3000 })
    load()
  }

  const handleSubmit = async (c) => {
    try {
      await submitContract(c.id)
      toast.success(`HĐ ${c.contract_no ?? c.id} đã gửi KT duyệt`)
      load()
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Lỗi gửi duyệt')
    }
  }

  const handleDelete = async (c) => {
    if (!window.confirm(`Xóa HĐ nháp ${c.contract_no ?? '#' + c.id}?`)) return
    try {
      await deleteContract(c.id)
      toast.success('Đã xóa HĐ nháp')
      load()
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Lỗi xóa')
    }
  }

  const total    = contracts.length
  const pending  = contracts.filter(c => c.approval_status === 'pending_kt').length
  const approved = contracts.filter(c => c.approval_status === 'approved').length
  const rejected = contracts.filter(c => c.approval_status === 'rejected').length
  const showActions = (status) => status === 'draft'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Topbar */}
      <div style={{ padding: '10px 16px', background: '#fff', borderBottom: '1px solid #eef1f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f2044' }}>HĐ chăm sóc</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={btnOutline}><IconRefresh size={13} /> Làm mới</button>
          <button onClick={() => setShowCreate(true)} style={btnPrimary}><IconPlus size={13} /> Tạo HĐ nháp</button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Info */}
        <div style={{ padding: '8px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 11, color: '#1e40af', display: 'flex', gap: 6 }}>
          <span>ℹ️</span>
          <span>HĐ tạo là <strong>bản nháp</strong> → Kế toán duyệt → doanh thu ghi chính thức. Bấm <strong>Làm mới</strong> để cập nhật trạng thái sau khi KT xử lý.</span>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[
            { label: 'Tổng HĐ',       val: total,    color: ACCENT },
            { label: 'Chờ KT duyệt',  val: pending,  color: '#854d0e' },
            { label: 'Đã duyệt',       val: approved, color: '#15803d' },
            { label: 'Từ chối',        val: rejected, color: '#dc2626' },
          ].map(s => (
            <div key={s.label} style={statCard}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Contract list */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden', flex: 1 }}>
          <div style={{ padding: '9px 14px', borderBottom: '1px solid #eef1f6', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#0f2044' }}>HĐ chăm sóc gần đây</span>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>{total} hợp đồng</span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Đang tải...</div>
          ) : contracts.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Chưa có HĐ chăm sóc nào</div>
              <div style={{ fontSize: 11 }}>Bấm "Tạo HĐ nháp" ở góc phải trên để tạo hợp đồng đầu tiên</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Mã HĐ', 'Khách hàng', 'Dịch vụ', 'Giá trị', 'Ngày tạo', 'Trạng thái', 'Thao tác'].map(h => (
                      <th key={h} style={{ padding: '7px 11px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contracts.map(c => (
                    <tr key={c.id} style={{ background: c.approval_status === 'rejected' ? '#fef2f2' : '#fff' }}>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: ACCENT, whiteSpace: 'nowrap' }}>
                        {c.contract_no ?? `#${c.id}`}
                      </td>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{c.customer_name ?? c.customer?.full_name ?? '—'}</div>
                        <div style={{ fontSize: 9, color: '#94a3b8' }}>{c.customer_phone ?? c.customer?.phone ?? ''}</div>
                      </td>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9', fontSize: 10, color: '#374151', maxWidth: 140 }}>
                        {c.service_name ?? c.items?.[0]?.name ?? '—'}
                      </td>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9', fontSize: 10, fontWeight: 600, color: '#0f2044', whiteSpace: 'nowrap' }}>
                        {fmtMoney(c.final_amount ?? c.total_amount)}
                      </td>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9', fontSize: 10, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {fmtDate(c.created_at)}
                      </td>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9' }}>
                        <StatusBadge status={c.approval_status} />
                      </td>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9' }}>
                        {showActions(c.approval_status) ? (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => setEditContract(c)}
                              style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 7px', borderRadius: 5, border: '1px solid #dde3ef', background: '#fff', color: '#374151', fontSize: 9, cursor: 'pointer' }}>
                              <IconEdit size={10} /> Sửa
                            </button>
                            <button onClick={() => handleSubmit(c)}
                              style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 7px', borderRadius: 5, border: 'none', background: '#854d0e', color: '#fff', fontSize: 9, fontWeight: 600, cursor: 'pointer' }}>
                              <IconSend size={10} /> Gửi duyệt
                            </button>
                            <button onClick={() => handleDelete(c)}
                              style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 7px', borderRadius: 5, border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', fontSize: 9, cursor: 'pointer' }}>
                              <IconTrash size={10} /> Xóa
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 9, color: '#94a3b8' }}>—</span>
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

      {showCreate && (
        <ChotHDModal
          onClose={() => setShowCreate(false)}
          onDone={() => handleDone(false)}
        />
      )}
      {editContract && (
        <ChotHDModal
          initialData={editContract}
          onClose={() => setEditContract(null)}
          onDone={() => { handleDone(true); setEditContract(null) }}
        />
      )}
    </div>
  )
}

const btnPrimary = { display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }
const btnOutline = { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', color: '#374151', fontSize: 11, cursor: 'pointer' }
const statCard   = { background: '#fff', borderRadius: 9, border: '1px solid #dde3ef', padding: '11px 13px' }
