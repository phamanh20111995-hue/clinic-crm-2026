import { useState, useEffect } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import { getTeleUsers, assignCustomer } from '../../../api/tele'
import toast from 'react-hot-toast'

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 100, padding: 16,
}

export default function AssignModal({ customers = [], onClose, onDone }) {
  const [teleUsers, setTeleUsers] = useState([])
  const [selectedTele, setSelectedTele] = useState('')
  const [saving, setSaving] = useState(false)

  // Support single customer (object) or list
  const list = Array.isArray(customers) ? customers : [customers]

  useEffect(() => {
    getTeleUsers()
      .then(r => setTeleUsers(r.data?.results ?? r.data ?? []))
      .catch(() => {})
  }, [])

  const handleAssign = async () => {
    if (!selectedTele) { toast.error('Chọn nhân viên Tele'); return }
    setSaving(true)
    try {
      await Promise.all(list.map(c => assignCustomer(c.id, { tele: selectedTele })))
      toast.success(`Đã giao ${list.length} data cho Tele`)
      onDone?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi giao data')
    } finally {
      setSaving(false)
    }
  }

  const selectedUser = teleUsers.find(u => String(u.id) === String(selectedTele))

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>
            Giao data cho Tele ({list.length} KH)
          </p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}>
            <IconX size={20} />
          </button>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {/* KH list preview */}
          <div style={{ marginBottom: 14, padding: 10, background: '#f8fafc', borderRadius: 8, border: '1px solid #dde3ef' }}>
            {list.slice(0, 5).map(c => (
              <div key={c.id} style={{ fontSize: 13, color: '#374151', padding: '2px 0' }}>
                {c.full_name} · {c.phone}
              </div>
            ))}
            {list.length > 5 && (
              <div style={{ fontSize: 12, color: '#9ca3af' }}>+ {list.length - 5} KH khác...</div>
            )}
          </div>

          {/* Select Tele */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Chọn nhân viên Tele *
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
              {teleUsers.map(u => (
                <label key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                  border: `1.5px solid ${String(selectedTele) === String(u.id) ? '#0369a1' : '#dde3ef'}`,
                  background: String(selectedTele) === String(u.id) ? '#eff6ff' : '#fff',
                }}>
                  <input type="radio" name="tele" value={u.id}
                    checked={String(selectedTele) === String(u.id)}
                    onChange={() => setSelectedTele(u.id)}
                    style={{ accentColor: '#0369a1' }} />
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: '#0369a1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
                  }}>
                    {(u.display_name || u.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{u.display_name ?? u.email}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>{u.email}</p>
                  </div>
                </label>
              ))}
              {teleUsers.length === 0 && (
                <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '12px 0' }}>
                  Không có Tele nào
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>
              Hủy
            </button>
            <button onClick={handleAssign} disabled={saving || !selectedTele}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 20px', borderRadius: 7, border: 'none',
                background: selectedTele && !saving ? '#0369a1' : '#d1d5db',
                color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              }}>
              <IconCheck size={15} stroke={2.5} />
              {saving ? 'Đang giao...' : 'Giao data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
