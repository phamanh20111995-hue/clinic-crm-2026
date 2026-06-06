import { useState } from 'react'
import { IconCheck, IconArrowBack, IconMessage } from '@tabler/icons-react'
import DuyetOkModal     from '../modals/DuyetOkModal'
import DuyetRejectModal from '../modals/DuyetRejectModal'
import TaskDetailModal  from '../modals/TaskDetailModal'

const DEMO_ITEMS = [
  {
    id: 1,
    title: 'Post FB — "5 lý do chọn AirFusion"',
    waitLabel: 'Chờ Lead MKT',
    waitBg: '#fef9c3', waitC: '#854d0e',
    types: [{ l: 'Content', bg: '#eff6ff', c: '#1e40af' }, { l: 'Thiết kế', bg: '#fdf4ff', c: '#7e22ce' }],
    submitter: 'Nguyễn T. Hà + Trần Minh Tú',
    submitTime: '21/05 16:30',
    deadline: '22/05',
    deadlineUrgent: true,
    files: ['caption_v2.docx', 'visual_airfusion.jpg', 'Link Figma'],
    caption: '"✨ 5 lý do hàng nghìn KH tin tưởng chọn AirFusion để trị sẹo rỗ tại Phòng khám:\n1️⃣ Công nghệ tiên tiến nhất 2026...\n2️⃣ BS KIÊN 15 năm kinh nghiệm...\n[xem đầy đủ →]"',
    comments: [{ av: 'NH', name: 'Nguyễn T. Hà', time: '21/05 16:30', text: 'Em đã sửa theo feedback lần trước, thêm CTA rõ hơn ở cuối caption.' }],
  },
  {
    id: 2,
    title: 'Video Reels 30s — Quy trình điều trị SEO rỗ (cut xong)',
    waitLabel: 'Chờ Quản lý',
    waitBg: '#fef9c3', waitC: '#854d0e',
    types: [{ l: 'Video', bg: '#fff7ed', c: '#c2410c' }, { l: 'Freelance edit', bg: '#f0fdf4', c: '#15803d' }],
    submitter: 'Lê Văn Khoa',
    submitTime: '21/05',
    deadline: '25/05',
    deadlineUrgent: false,
    files: ['video_seoro_v2.mp4 (Drive)', 'caption_video.txt'],
    caption: '',
    comments: [],
  },
  {
    id: 3,
    title: 'TikTok script — "Hỏi đáp về sẹo rỗ" series 5 tập',
    waitLabel: 'Chờ Lead MKT',
    waitBg: '#fef9c3', waitC: '#854d0e',
    types: [{ l: 'Content', bg: '#eff6ff', c: '#1e40af' }],
    submitter: 'Nguyễn T. Hà',
    submitTime: '20/05',
    deadline: '30/05',
    deadlineUrgent: false,
    files: ['script_series.docx'],
    caption: '',
    comments: [],
  },
]

export default function VongDuyetTab() {
  const [items, setItems] = useState(DEMO_ITEMS)
  const [duyetOk, setDuyetOk] = useState(null)
  const [reject, setReject] = useState(null)
  const [detail, setDetail] = useState(null)

  const remove = (id) => setItems(prev => prev.filter(i => i.id !== id))

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Quy trình */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '9px 14px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontSize: 12, fontWeight: 700, color: '#0f2044' }}>
          Quy trình duyệt chuẩn
        </div>
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', gap: 0, flexWrap: 'wrap', overflowX: 'auto' }}>
          {[
            { bg: '#ede9fe', c: '#5b21b6', icon: '✏️', l: 'Thực hiện', sub: 'Content/Design/Video' },
            { bg: '#fef9c3', c: '#854d0e', icon: '👤', l: 'Lead MKT duyệt', sub: 'Nội dung + tone' },
            { bg: '#fef9c3', c: '#854d0e', icon: '🩺', l: 'BS duyệt', sub: 'Y tế + hình ảnh (nếu có ảnh KH)' },
            { bg: '#dcfce7', c: '#15803d', icon: '✅', l: 'Đã duyệt', sub: 'Lên lịch đăng' },
          ].map((step, i, arr) => (
            <>
              <div key={step.l} style={{ textAlign: 'center', minWidth: 90 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: step.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 5px', fontSize: 14 }}>{step.icon}</div>
                <div style={{ fontSize: 10, color: step.c, fontWeight: 500 }}>{step.l}</div>
                <div style={{ fontSize: 9, color: '#94a3b8' }}>{step.sub}</div>
              </div>
              {i < arr.length - 1 && <div style={{ flex: 1, height: 2, background: '#dde3ef', minWidth: 20 }} />}
            </>
          ))}
        </div>
      </div>

      {/* Danh sách chờ duyệt */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '9px 14px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2044' }}>Nội dung chờ duyệt</span>
          <span style={{ background: '#dc2626', color: '#fff', borderRadius: 20, padding: '0 6px', fontSize: 9, fontWeight: 700 }}>{items.length}</span>
        </div>

        {items.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Không có nội dung chờ duyệt 🎉</div>
        ) : (
          items.map((item, idx) => (
            <div key={item.id} style={{ padding: '14px 16px', borderBottom: idx < items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</span>
                    <span style={{ background: item.waitBg, color: item.waitC, padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 600 }}>{item.waitLabel}</span>
                    {item.types.map(t => <span key={t.l} style={{ background: t.bg, color: t.c, padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 600 }}>{t.l}</span>)}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8 }}>
                    Nộp bởi: {item.submitter} · {item.submitTime} · DL đăng:
                    <span style={{ color: item.deadlineUrgent ? '#dc2626' : '#64748b', fontWeight: item.deadlineUrgent ? 700 : 400 }}>
                      {' '}{item.deadline}{item.deadlineUrgent ? ' (SẮP HẾT HẠN ⚠)' : ''}
                    </span>
                  </div>

                  {/* Files */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {item.files.map(f => (
                      <span key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, fontSize: 10, background: '#f8fafc', border: '1px solid #dde3ef', cursor: 'pointer' }}>📎 {f}</span>
                    ))}
                  </div>

                  {/* Caption preview */}
                  {item.caption && (
                    <div style={{ background: '#f8fafc', borderRadius: 7, padding: '10px 12px', fontSize: 11, color: '#374151', lineHeight: 1.7, borderLeft: '3px solid #0284c7', marginBottom: 10, whiteSpace: 'pre-line' }}>
                      <b>Caption:</b> {item.caption}
                    </div>
                  )}

                  {/* Comments */}
                  {item.comments.map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, paddingBottom: 6 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#dbeafe', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, flexShrink: 0 }}>{c.av}</div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 500 }}>{c.name} <span style={{ color: '#94a3b8', fontWeight: 400 }}>{c.time}</span></div>
                        <div style={{ fontSize: 10, color: '#374151', marginTop: 2 }}>{c.text}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => setDuyetOk(item)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', border: 'none', borderRadius: 7, background: '#16a34a', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    <IconCheck size={13} /> Duyệt
                  </button>
                  <button onClick={() => setReject(item)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', border: '1px solid #dc2626', borderRadius: 7, background: '#fff', color: '#dc2626', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    <IconArrowBack size={13} /> Trả lại
                  </button>
                  <button onClick={() => setDetail(item)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', border: '1px solid #dde3ef', borderRadius: 7, background: '#fff', color: '#374151', fontSize: 11, cursor: 'pointer' }}>
                    <IconMessage size={13} /> Comment
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {duyetOk && <DuyetOkModal task={duyetOk} onClose={() => setDuyetOk(null)} onDone={() => remove(duyetOk.id)} />}
      {reject  && <DuyetRejectModal task={reject} onClose={() => setReject(null)} onDone={() => remove(reject.id)} />}
      {detail  && <TaskDetailModal task={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}
