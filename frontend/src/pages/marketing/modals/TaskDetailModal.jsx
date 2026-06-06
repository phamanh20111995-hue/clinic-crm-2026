import { useState } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

const TYPE_BADGE = {
  content:  { bg: '#eff6ff', c: '#1e40af', l: 'Content' },
  design:   { bg: '#fdf4ff', c: '#7e22ce', l: 'Thiết kế' },
  video:    { bg: '#fff7ed', c: '#c2410c', l: 'Video' },
  freelance:{ bg: '#f0fdf4', c: '#15803d', l: 'Freelance' },
}

export default function TaskDetailModal({ task, onClose }) {
  const [comment, setComment] = useState('')

  const t = task ?? {
    title: 'Caption + Hashtag — 10 post SEO rỗ T05',
    types: ['content'],
    campaign: 'Campaign: SEO rỗ T05',
    assignee: 'Nguyễn T. Hà',
    deadline: '23/05',
    status: 'doing',
    progress: 60,
    files: ['caption_v2.docx', 'visual_airfusion.jpg'],
    comments: [{ av: 'NH', name: 'Nguyễn T. Hà', time: '21/05 16:30', text: 'Em đã sửa theo feedback, thêm CTA rõ hơn ở cuối caption.' }],
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>Chi tiết task</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f2044' }}>{t.title}</div>

          {/* Badges */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {(t.types ?? []).map(tp => {
              const b = TYPE_BADGE[tp] ?? TYPE_BADGE.content
              return <span key={tp} style={{ background: b.bg, color: b.c, padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 600 }}>{b.l}</span>
            })}
          </div>

          {/* Info */}
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', fontSize: 11, color: '#374151', lineHeight: 1.8 }}>
            <div>📣 {t.campaign}</div>
            <div>👤 {t.assignee}</div>
            <div>📅 Deadline: <b style={{ color: '#dc2626' }}>{t.deadline}</b></div>
            {t.progress != null && (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 10, color: '#64748b', marginBottom: 3 }}>Tiến độ: {t.progress}%</div>
                <div style={{ height: 5, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${t.progress}%`, background: '#0284c7', borderRadius: 10 }} />
                </div>
              </div>
            )}
          </div>

          {/* Files */}
          {(t.files ?? []).length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>File đính kèm</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {t.files.map(f => (
                  <span key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, fontSize: 10, background: '#f8fafc', border: '1px solid #dde3ef', cursor: 'pointer' }}>📎 {f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Lịch sử comment</div>
            {(t.comments ?? []).map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, paddingBottom: 8, borderBottom: '1px solid #f1f5f9', marginBottom: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#dbeafe', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{c.av}</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 500 }}>{c.name} <span style={{ color: '#94a3b8', fontWeight: 400 }}>{c.time}</span></div>
                  <div style={{ fontSize: 10, color: '#374151', marginTop: 2 }}>{c.text}</div>
                </div>
              </div>
            ))}
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2} placeholder="Thêm comment..."
              style={{ width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 12, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Đóng</button>
            <button onClick={() => { toast.success('Đã gửi comment'); setComment(''); onClose() }}
              style={{ padding: '7px 16px', borderRadius: 7, border: 'none', background: '#0284c7', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Gửi comment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
