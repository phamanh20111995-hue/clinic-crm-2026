import { useState, useRef } from 'react'
import { IconUpload, IconX, IconZoomIn } from '@tabler/icons-react'
import { uploadCustomerImage } from '../../../api/customerDetail'
import toast from 'react-hot-toast'

const ACCENT = '#1e40af'

const TYPE_LABEL = {
  before: 'Trước',
  after: 'Sau',
  progress: 'Tiến trình',
  other: 'Khác',
}

export default function AnhTab({ customer, images: initImages, canUpload }) {
  const [images, setImages] = useState(initImages ?? [])
  const [lightbox, setLightbox]   = useState(null)
  const [previews, setPreviews]   = useState([])
  const [files, setFiles]         = useState([])
  const [imgType, setImgType]     = useState('progress')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const handleFileChange = (e) => {
    const chosen = Array.from(e.target.files)
    if (!chosen.length) return
    setFiles(f => [...f, ...chosen])
    setPreviews(p => [...p, ...chosen.map(f => URL.createObjectURL(f))])
  }

  const removePreview = (i) => {
    URL.revokeObjectURL(previews[i])
    setPreviews(p => p.filter((_, j) => j !== i))
    setFiles(f => f.filter((_, j) => j !== i))
  }

  const handleUpload = async () => {
    if (!files.length) return
    setUploading(true)
    try {
      const results = await Promise.all(files.map(f => {
        const fd = new FormData()
        fd.append('image', f)
        fd.append('image_type', imgType)
        return uploadCustomerImage(customer.id, fd)
      }))
      const newImgs = results.map(r => r.data)
      setImages(prev => [...newImgs, ...prev])
      setPreviews([])
      setFiles([])
      toast.success(`Đã tải ${results.length} ảnh`)
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi tải ảnh')
    } finally {
      setUploading(false)
    }
  }

  // Group images by type
  const grouped = {}
  images.forEach(img => {
    const t = img.image_type ?? 'other'
    if (!grouped[t]) grouped[t] = []
    grouped[t].push(img)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Upload panel */}
      {canUpload && (
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Tải ảnh lên</span>
          </div>
          <div style={{ padding: 16 }}>
            {/* Type selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {Object.entries(TYPE_LABEL).map(([v, l]) => (
                <button key={v} onClick={() => setImgType(v)}
                  style={{ padding: '5px 14px', borderRadius: 7, border: `1.5px solid ${imgType === v ? ACCENT : '#dde3ef'}`, background: imgType === v ? ACCENT : '#fff', color: imgType === v ? '#fff' : '#6b7280', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {l}
                </button>
              ))}
            </div>

            <div onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${ACCENT}50`, borderRadius: 10, padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#eff6ff', marginBottom: previews.length ? 12 : 0 }}>
              <IconUpload size={24} style={{ color: ACCENT, opacity: .7, marginBottom: 6 }} />
              <p style={{ fontSize: 12, color: ACCENT, fontWeight: 600, margin: 0 }}>Nhấn để chọn ảnh</p>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>JPG, PNG, HEIC — nhiều ảnh</p>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleFileChange} />
            </div>

            {previews.length > 0 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8, marginBottom: 12 }}>
                  {previews.map((src, i) => (
                    <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid #dde3ef' }}>
                      <img src={src} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
                      <button onClick={() => removePreview(i)}
                        style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,.6)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconX size={10} />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={handleUpload} disabled={uploading}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 7, border: 'none', background: uploading ? '#d1d5db' : ACCENT, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <IconUpload size={14} />
                  {uploading ? 'Đang tải...' : `Tải lên ${files.length} ảnh (${TYPE_LABEL[imgType]})`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Gallery */}
      {images.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '40px 16px', textAlign: 'center', color: '#9ca3af' }}>
          <p style={{ fontSize: 28, margin: '0 0 8px' }}>🖼️</p>
          <p>Chưa có ảnh điều trị</p>
        </div>
      ) : Object.entries(grouped).map(([type, imgs]) => (
        <div key={type} style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Ảnh {TYPE_LABEL[type] ?? type}</span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{imgs.length} ảnh</span>
          </div>
          <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
            {imgs.map(img => (
              <div key={img.id} onClick={() => setLightbox(img.image)}
                style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: '1px solid #dde3ef' }}>
                <img src={img.image} alt="" style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background .15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,.3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}>
                  <IconZoomIn size={24} style={{ color: '#fff', opacity: 0 }} />
                </div>
                <div style={{ padding: '4px 8px', fontSize: 10, color: '#6b7280' }}>
                  {img.uploaded_by_name && <span>{img.uploaded_by_name}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'zoom-out' }}>
          <img src={lightbox} alt="" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 10, objectFit: 'contain', boxShadow: '0 0 60px rgba(0,0,0,.5)' }} />
          <button onClick={() => setLightbox(null)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconX size={20} />
          </button>
        </div>
      )}
    </div>
  )
}
