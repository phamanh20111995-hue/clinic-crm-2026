import { useState } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import { enqueueAppointment } from '../../../api/letan'
import toast from 'react-hot-toast'

const ACCENT = '#b45309'
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }

const VISIT_TYPES = [
  { key: 'tu_van',    label: 'Tư vấn',   color: '#7c3aed', bg: '#ede9fe' },
  { key: 'dieu_tri',  label: 'Điều trị', color: '#dc2626', bg: '#fee2e2' },
  { key: 'tai_kham',  label: 'Tái khám', color: '#15803d', bg: '#dcfce7' },
  { key: 'khieu_nai', label: 'Khiếu nại',color: '#92400e', bg: '#fef3c7' },
]

export default function EnqueueModal({ appt, onClose, onDone }) {
  const [selected, setSelected] = useState('tu_van')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await enqueueAppointment(appt.id, selected)
      const label = VISIT_TYPES.find(v => v.key === selected)?.label ?? selected
      toast.success(`${appt.customer_name} → hàng chờ ${label}`)
      onDone?.(res.data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi thêm hàng chờ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Chọn loại lượt</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{appt.customer_name} · {appt.customer_phone}</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={20} /></button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {VISIT_TYPES.map(v => (
            <button
              key={v.key}
              onClick={() => setSelected(v.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderRadius: 9, cursor: 'pointer',
                border: `2px solid ${selected === v.key ? v.color : '#dde3ef'}`,
                background: selected === v.key ? v.bg : '#fff',
                color: selected === v.key ? v.color : '#374151',
                fontWeight: selected === v.key ? 700 : 500,
                fontSize: 14, transition: 'all .12s',
              }}
            >
              {selected === v.key && <IconCheck size={16} stroke={2.5} />}
              {v.label}
            </button>
          ))}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : ACCENT, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <IconCheck size={15} stroke={2.5} />
              {saving ? 'Đang lưu...' : 'Vào hàng chờ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
