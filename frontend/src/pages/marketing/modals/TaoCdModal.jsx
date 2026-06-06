import { useState, useEffect } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import { createCampaign, updateCampaign } from '../../../api/marketing'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

const PLATFORMS = [
  { v: 'fb', l: 'Facebook' },
  { v: 'tiktok', l: 'TikTok' },
  { v: 'ig', l: 'Instagram' },
  { v: 'zalo', l: 'Zalo' },
  { v: 'web', l: 'Website / SEO' },
  { v: 'seed', l: 'Ads Seeding' },
]
const SERVICES = ['Sẹo rỗ (BS Kiên)', 'Xóa trẻ hoá (BS Hưng)', 'Trẻ hoá da', 'Nhóm ads khác']

export default function TaoCdModal({ onClose, onDone, campaign = null }) {
  const isEdit = !!campaign?.id
  const [form, setForm] = useState({
    name: campaign?.name ?? '',
    platform: campaign?.platform ?? 'fb',
    service: campaign?.service ?? SERVICES[0],
    staff: campaign?.staff ?? 'NV1',
    date_from: campaign?.date_from ?? new Date().toISOString().slice(0, 10),
    date_to: campaign?.date_to ?? '',
    budget: campaign?.budget ?? '',
    target_cpl: campaign?.target_cpl ?? '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nhập tên chiến dịch'); return }
    setSaving(true)
    try {
      if (isEdit) await updateCampaign(campaign.id, form)
      else await createCampaign(form)
      toast.success(isEdit ? 'Đã cập nhật chiến dịch' : 'Đã tạo chiến dịch')
      onDone?.(); onClose()
    } catch {
      toast.error('Lỗi lưu chiến dịch')
    } finally { setSaving(false) }
  }

  const inp = { border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 12, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, boxShadow: '0 24px 60px rgba(0,0,0,.22)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>{isEdit ? 'Chỉnh sửa chiến dịch' : 'Tạo chiến dịch ads'}</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Tên chiến dịch <span style={{ color: '#dc2626' }}>*</span></label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="VD: Sẹo rỗ AirFusion - T06/2026" style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Nền tảng</label>
              <select value={form.platform} onChange={e => set('platform', e.target.value)} style={inp}>
                {PLATFORMS.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>NV phụ trách</label>
              <select value={form.staff} onChange={e => set('staff', e.target.value)} style={inp}>
                <option value="NV1">NV1 — Trực page SG</option>
                <option value="NV2">NV2 — Trực page HN</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Dịch vụ / Nhóm ads</label>
            <select value={form.service} onChange={e => set('service', e.target.value)} style={inp}>
              {SERVICES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Ngày bắt đầu</label>
              <input type="date" value={form.date_from} onChange={e => set('date_from', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Ngày kết thúc</label>
              <input type="date" value={form.date_to} onChange={e => set('date_to', e.target.value)} style={inp} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Ngân sách (đ)</label>
              <input type="number" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="0" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Mục tiêu CPL (đ)</label>
              <input type="number" value={form.target_cpl} onChange={e => set('target_cpl', e.target.value)} placeholder="VD: 900000" style={inp} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : '#0284c7', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconCheck size={14} /> {saving ? '...' : (isEdit ? 'Lưu' : 'Tạo chiến dịch')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
