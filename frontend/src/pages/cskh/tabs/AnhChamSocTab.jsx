import { useState, useRef } from 'react'
import { IconUpload, IconSearch, IconPhoto } from '@tabler/icons-react'
import { uploadCarePhoto } from '../../../api/cskh'
import toast from 'react-hot-toast'

const ACCENT = '#be185d'

const DEMO_PHOTOS = [
  { id: 1, customer_name: 'Kathy Le', session: 'Buổi 3/10', date: '20/05/2026', note: 'Da cải thiện tốt', thumb: null },
  { id: 2, customer_name: 'Thảo Vi', session: 'Buổi 3/6', date: '15/05/2026', note: 'Cần theo dõi thêm', thumb: null },
]

export default function AnhChamSocTab() {
  const [photos]       = useState(DEMO_PHOTOS)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      fd.append('note', '')
      await uploadCarePhoto(fd)
      toast.success('Đã tải ảnh lên')
    } catch {
      toast.error('Chức năng upload ảnh chưa khả dụng · sẽ cập nhật sớm')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const visible = photos.filter(p =>
    !search || p.customer_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', background: '#fff', borderBottom: '1px solid #eef1f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f2044' }}>Ảnh chăm sóc</span>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <IconUpload size={13} /> {uploading ? 'Đang tải...' : 'Upload ảnh'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Info */}
        <div style={{ padding: '8px 12px', background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: 8, fontSize: 11, color: '#be185d', display: 'flex', gap: 6 }}>
          <span>📸</span>
          <span>Ảnh chăm sóc được gắn vào hồ sơ KH. Chụp ảnh trước/sau mỗi buổi điều trị để theo dõi tiến độ.</span>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: 200 }}>
          <IconSearch size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input placeholder="Tìm theo KH..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ border: '1px solid #dde3ef', borderRadius: 7, padding: '5px 8px 5px 26px', fontSize: 12, outline: 'none', width: '100%' }} />
        </div>

        {/* Grid */}
        {visible.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', padding: 60, textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
            <div>Chưa có ảnh chăm sóc · sẽ hiển thị khi có dữ liệu</div>
            <button onClick={() => fileRef.current?.click()} style={{ marginTop: 12, padding: '7px 16px', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Upload ảnh đầu tiên
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
            {visible.map(p => (
              <div key={p.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden' }}>
                <div style={{ height: 130, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.thumb
                    ? <img src={p.thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <IconPhoto size={40} color="#94a3b8" stroke={1} />
                  }
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: '#0f2044' }}>{p.customer_name}</div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{p.session} · {p.date}</div>
                  {p.note && <div style={{ fontSize: 10, color: '#374151', marginTop: 3, fontStyle: 'italic' }}>{p.note}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
