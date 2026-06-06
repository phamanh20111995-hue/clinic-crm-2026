import { useState, useEffect } from 'react'
import { IconX, IconDownload } from '@tabler/icons-react'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

export default function KetNoiAPIModal({ onClose }) {
  const [form, setForm] = useState({ platform: 'meta', account: 'act_123456789', date_from: '', date_to: '', group_by: 'campaign' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const now = new Date()
    const y = now.getFullYear(), m = String(now.getMonth() + 1).padStart(2, '0')
    set('date_from', `${y}-${m}-01`)
    set('date_to', now.toISOString().slice(0, 10))
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handlePull = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    toast.success('Đã kéo dữ liệu · Chi phí + Impression + Click đã cập nhật')
    setLoading(false)
    onClose()
  }

  const inp = { border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 12, fontFamily: 'inherit', outline: 'none', width: '100%' }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>Kéo số liệu tự động từ API</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '9px 12px', fontSize: 10, color: '#1e40af', lineHeight: 1.6 }}>
            Kết nối API Meta Business / TikTok Ads để tự động kéo: Chi phí · Impression · Click · Mess về theo ngày.
            Dữ liệu Data (lead) vẫn nhập tay vì phụ thuộc chất lượng trực page.
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Nền tảng</label>
            <select value={form.platform} onChange={e => set('platform', e.target.value)} style={inp}>
              <option value="meta">Meta (Facebook + Instagram)</option>
              <option value="tiktok">TikTok Ads</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Tài khoản quảng cáo</label>
            <select value={form.account} onChange={e => set('account', e.target.value)} style={inp}>
              <option value="act_123456789">act_123456789 — Phòng khám Da liễu SG</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Từ ngày</label>
              <input type="date" value={form.date_from} onChange={e => set('date_from', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Đến ngày</label>
              <input type="date" value={form.date_to} onChange={e => set('date_to', e.target.value)} style={inp} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Phân bổ vào nhóm dịch vụ theo</label>
            <select value={form.group_by} onChange={e => set('group_by', e.target.value)} style={inp}>
              <option value="campaign">Tên chiến dịch (Campaign name)</option>
              <option value="adset">Tên nhóm ads (Ad Set name)</option>
              <option value="manual">Nhập tay sau khi kéo</option>
            </select>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '9px 12px', fontSize: 10, color: '#15803d', lineHeight: 1.6 }}>
            Kéo tự động: Chi phí · Impression · Click<br />
            Nhập tay thêm: Mess · Data (lead) · DS thực
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handlePull} disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 7, border: 'none', background: loading ? '#d1d5db' : '#0284c7', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconDownload size={14} /> {loading ? 'Đang kéo...' : 'Kéo dữ liệu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
