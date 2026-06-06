import { useState, useRef } from 'react'
import { IconUpload, IconPhoto, IconX } from '@tabler/icons-react'
import { getTodayAppointments } from '../../../api/letan'
import api from '../../../api/client'
import toast from 'react-hot-toast'

const ACCENT = '#b45309'

export default function AnhDieuTriTab() {
  const [appts, setAppts]       = useState([])
  const [selected, setSelected] = useState(null)
  const [previews, setPreviews] = useState([])
  const [files, setFiles]       = useState([])
  const [uploading, setUploading] = useState(false)
  const [loaded, setLoaded]     = useState(false)
  const fileRef = useRef()

  const loadAppts = async () => {
    try {
      const res = await getTodayAppointments()
      const all = res.data?.results ?? res.data ?? []
      setAppts(all.filter(a => ['in_progress', 'done'].includes(a.status)))
      setLoaded(true)
    } catch {
      toast.error('Không tải được lịch hẹn')
    }
  }

  const handleFileChange = (e) => {
    const chosen = Array.from(e.target.files)
    if (!chosen.length) return
    const newPreviews = chosen.map(f => URL.createObjectURL(f))
    setFiles(prev => [...prev, ...chosen])
    setPreviews(prev => [...prev, ...newPreviews])
  }

  const removePreview = (idx) => {
    URL.revokeObjectURL(previews[idx])
    setPreviews(p => p.filter((_, i) => i !== idx))
    setFiles(f => f.filter((_, i) => i !== idx))
  }

  const handleUpload = async () => {
    if (!selected) { toast.error('Chọn lịch hẹn trước'); return }
    if (!files.length) { toast.error('Chọn ít nhất 1 ảnh'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      files.forEach(f => fd.append('photos', f))
      await api.post(`/api/appointments/${selected}/photos/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success(`Đã tải ${files.length} ảnh lên`)
      setPreviews([])
      setFiles([])
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi tải ảnh')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 14, alignItems: 'start' }}>
      {/* LEFT: appointment picker */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Chọn KH</span>
          <button onClick={loadAppts} style={{ fontSize: 11, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            {loaded ? 'Làm mới' : 'Tải danh sách'}
          </button>
        </div>
        {!loaded ? (
          <div style={{ padding: '20px 14px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
            Nhấn "Tải danh sách" để xem KH hôm nay
          </div>
        ) : appts.length === 0 ? (
          <div style={{ padding: '20px 14px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Chưa có KH đang/đã điều trị</div>
        ) : (
          appts.map(a => (
            <div key={a.id} onClick={() => setSelected(a.id)}
              style={{
                padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                background: selected === a.id ? '#fff7ed' : '#fff',
                borderLeft: selected === a.id ? `3px solid ${ACCENT}` : '3px solid transparent',
                transition: 'background .1s',
              }}>
              <p style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>{a.customer_name}</p>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{a.service_name ?? '—'} · {a.room_name ?? '—'}</p>
            </div>
          ))
        )}
      </div>

      {/* RIGHT: upload area */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
            {selected ? `Ảnh điều trị — ${appts.find(a => a.id === selected)?.customer_name ?? ''}` : 'Chưa chọn KH'}
          </span>
        </div>
        <div style={{ padding: 16 }}>
          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${ACCENT}60`, borderRadius: 10, padding: '32px 20px',
              textAlign: 'center', cursor: 'pointer', background: '#fff7ed',
              marginBottom: previews.length ? 14 : 0,
            }}>
            <IconPhoto size={32} style={{ color: ACCENT, opacity: .6, marginBottom: 8 }} />
            <p style={{ fontSize: 13, color: ACCENT, fontWeight: 600, margin: '0 0 4px' }}>Nhấn để chọn ảnh</p>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>JPG, PNG, HEIC — nhiều ảnh cùng lúc</p>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleFileChange} />
          </div>

          {/* Previews */}
          {previews.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginBottom: 14 }}>
              {previews.map((src, i) => (
                <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid #dde3ef' }}>
                  <img src={src} alt="" style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
                  <button onClick={() => removePreview(i)}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,.55)', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                    <IconX size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {previews.length > 0 && (
            <button onClick={handleUpload} disabled={uploading || !selected}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 8, border: 'none', background: uploading ? '#d1d5db' : ACCENT, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <IconUpload size={14} />
              {uploading ? 'Đang tải...' : `Tải lên ${files.length} ảnh`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
