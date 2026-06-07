import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconRefresh, IconSearch, IconUserPlus, IconEye } from '@tabler/icons-react'
import { getCustomersQueue, assignCskh, getUsers } from '../../../api/cskh'
import toast from 'react-hot-toast'

const ACCENT = '#be185d'

function AssignModal({ customer, cskhList, onClose, onDone }) {
  const [cskhId, setCskhId] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!cskhId) { toast.error('Vui lòng chọn nhân viên CSKH'); return }
    setSaving(true)
    try {
      await assignCskh(customer.id, cskhId)
      toast.success(`Đã phân ${customer.full_name} cho CSKH`)
      onDone()
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Lỗi phân công')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, width: '100%', maxWidth: 420 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f2044', marginBottom: 4 }}>Phân nhân viên CSKH</div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
          KH: <strong>{customer.full_name}</strong> — {customer.phone}
        </div>

        <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
          Chọn nhân viên CSKH
        </label>
        <select value={cskhId} onChange={e => setCskhId(e.target.value)}
          style={{ width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '8px 10px', fontSize: 12, outline: 'none', background: '#fff', marginBottom: 16 }}>
          <option value="">— Chọn nhân viên —</option>
          {cskhList.map(u => (
            <option key={u.id} value={u.id}>{u.display_name ?? u.email}</option>
          ))}
        </select>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '7px 16px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 12, cursor: 'pointer' }}>Hủy</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '7px 20px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : ACCENT, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Đang lưu...' : 'Phân công'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function HangChoTab() {
  const navigate = useNavigate()
  const [rows, setRows]         = useState([])
  const [cskhList, setCskhList] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [selRow, setSelRow]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [qRes, uRes] = await Promise.all([
        getCustomersQueue(),
        getUsers({ role: 'CSKH' }).catch(() => ({ data: [] })),
      ])
      const data = qRes.data?.results ?? qRes.data ?? []
      setRows(Array.isArray(data) ? data : [])
      const users = uRes.data?.results ?? uRes.data ?? []
      setCskhList(Array.isArray(users) ? users : [])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const visible = rows.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return r.full_name?.toLowerCase().includes(q) || r.phone?.includes(q)
  })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Topbar */}
      <div style={{ padding: '10px 16px', background: '#fff', borderBottom: '1px solid #eef1f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f2044' }}>Hàng chờ phân CSKH</span>
          {rows.length > 0 && (
            <span style={{ background: '#dc2626', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>{rows.length}</span>
          )}
        </div>
        <button onClick={load} style={btnOutline}><IconRefresh size={13} /> Làm mới</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Info banner */}
        <div style={{ padding: '8px 12px', background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: 8, fontSize: 11, color: ACCENT, display: 'flex', gap: 6 }}>
          <span>ℹ️</span>
          <span>KH vào hàng chờ sau khi Kế toán duyệt hợp đồng. Lead CSKH phân nhân viên để bắt đầu chăm sóc.</span>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: 220 }}>
          <IconSearch size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input placeholder="Tìm tên / SĐT..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ border: '1px solid #dde3ef', borderRadius: 7, padding: '5px 8px 5px 26px', fontSize: 12, outline: 'none', width: '100%' }} />
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden', flex: 1 }}>
          <div style={{ padding: '9px 14px', borderBottom: '1px solid #eef1f6', background: '#f8fafc' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#0f2044' }}>
              Chờ phân ({visible.length})
            </span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Đang tải...</div>
          ) : visible.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Hàng chờ trống</div>
              <div style={{ fontSize: 11 }}>Tất cả KH đã được phân nhân viên CSKH</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Khách hàng', 'Dịch vụ / Nguồn', 'Sale phụ trách', 'Ngày vào hàng', 'Hành động'].map(h => (
                      <th key={h} style={{ padding: '7px 11px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map(r => (
                    <tr key={r.id} style={{ background: '#fff' }}>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{r.full_name}</div>
                        <div style={{ fontSize: 9, color: '#94a3b8' }}>{r.phone}</div>
                      </td>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9', fontSize: 10, color: '#374151' }}>
                        {r.service ?? r.source_display ?? r.data_type_display ?? '—'}
                      </td>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9', fontSize: 10, color: '#374151' }}>
                        {r.sale_name ?? '—'}
                      </td>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9', fontSize: 10, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => setSelRow(r)}
                            style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 10px', borderRadius: 6, border: 'none', background: ACCENT, color: '#fff', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}>
                            <IconUserPlus size={11} /> Phân CSKH
                          </button>
                          <button onClick={() => navigate(`/customers/${r.id}`)}
                            style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 6, border: '1px solid #dde3ef', background: '#fff', color: '#374151', fontSize: 9, cursor: 'pointer' }}>
                            <IconEye size={11} /> Hồ sơ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selRow && (
        <AssignModal
          customer={selRow}
          cskhList={cskhList}
          onClose={() => setSelRow(null)}
          onDone={() => { setSelRow(null); load() }}
        />
      )}
    </div>
  )
}

const btnOutline = { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', color: '#374151', fontSize: 11, cursor: 'pointer' }
