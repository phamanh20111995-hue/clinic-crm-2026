import { useState, useRef } from 'react'
import { IconUpload, IconPhoto } from '@tabler/icons-react'
import { getMyCustomers, uploadCustomerImg } from '../../../api/sale'
import toast from 'react-hot-toast'

const LOAI_ANH = [
  { v: 'before', l: 'Trước điều trị' },
  { v: 'after', l: 'Sau điều trị' },
  { v: 'during', l: 'Trong liệu trình' },
  { v: 'other', l: 'Khác' },
]

export default function AnhDieuTriTab() {
  const [customers, setCustomers] = useState([])
  const [customersLoaded, setCustomersLoaded] = useState(false)
  const [khId, setKhId] = useState('')
  const [loai, setLoai] = useState('before')
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [drag, setDrag] = useState(false)
  const fileRef = useRef()

  const loadCustomers = () => {
    if (customersLoaded) return
    getMyCustomers().then(r => { setCustomers(r.data?.results ?? r.data ?? []); setCustomersLoaded(true) }).catch(() => {})
  }

  const addFiles = newFiles => {
    const imgs = Array.from(newFiles).filter(f => f.type.startsWith('image/'))
    if (!imgs.length) { toast.error('Chỉ upload ảnh (jpg/png/webp)'); return }
    setFiles(prev => [...prev, ...imgs].slice(0, 10))
  }

  const handleUpload = async () => {
    if (!khId) { toast.error('Chọn khách hàng'); return }
    if (!files.length) { toast.error('Chọn ít nhất 1 ảnh'); return }
    setUploading(true)
    let ok = 0
    for (const file of files) {
      try {
        const fd = new FormData()
        fd.append('image', file)
        fd.append('image_type', loai)
        await uploadCustomerImg(khId, fd)
        ok++
      } catch { toast.error(`Lỗi upload ${file.name}`) }
    }
    if (ok > 0) toast.success(`Đã upload ${ok} ảnh`)
    setFiles([])
    setUploading(false)
  }

  const inputStyle = { width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box' }

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '14px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2044', marginBottom: 12 }}>
          <IconPhoto size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />Upload ảnh điều trị
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Khách hàng <span style={{ color: '#dc2626' }}>*</span></label>
            <select value={khId} onFocus={loadCustomers} onChange={e => setKhId(e.target.value)} style={inputStyle}>
              <option value="">— Chọn KH —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} — {c.phone}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Loại ảnh</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {LOAI_ANH.map(o => (
                <button key={o.v} onClick={() => setLoai(o.v)}
                  style={{ padding: '5px 10px', borderRadius: 6, border: `2px solid ${loai === o.v ? '#15803d' : '#dde3ef'}`, background: loai === o.v ? '#f0fdf4' : '#fff', fontSize: 11, fontWeight: loai === o.v ? 700 : 400, color: loai === o.v ? '#15803d' : '#374151', cursor: 'pointer' }}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }}
            onClick={() => fileRef.current?.click()}
            style={{ border: `2px dashed ${drag ? '#15803d' : '#dde3ef'}`, borderRadius: 8, padding: '24px', textAlign: 'center', cursor: 'pointer', background: drag ? '#f0fdf4' : '#fafafa', transition: 'all .15s' }}>
            <IconUpload size={24} color={drag ? '#15803d' : '#9ca3af'} style={{ margin: '0 auto 6px' }} />
            <div style={{ fontSize: 12, color: '#64748b' }}>Kéo thả hoặc click để chọn ảnh</div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>jpg, png, webp · tối đa 10 ảnh</div>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
          </div>

          {files.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
              {files.map((f, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 6, border: '1px solid #dde3ef' }} />
                  <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                    style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.5)', color: '#fff', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <button onClick={handleUpload} disabled={uploading || !files.length}
            style={{ padding: '8px', borderRadius: 8, border: 'none', background: uploading || !files.length ? '#d1d5db' : '#15803d', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {uploading ? 'Đang upload...' : `Upload ${files.length > 0 ? files.length + ' ảnh' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
