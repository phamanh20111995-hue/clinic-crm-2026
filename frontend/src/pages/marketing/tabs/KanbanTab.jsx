import { useState } from 'react'
import TaskDetailModal from '../modals/TaskDetailModal'

const TYPE_BADGE = {
  content:  { bg: '#eff6ff', c: '#1e40af', l: 'Content' },
  design:   { bg: '#fdf4ff', c: '#7e22ce', l: 'Thiết kế' },
  video:    { bg: '#fff7ed', c: '#c2410c', l: 'Video' },
  freelance:{ bg: '#f0fdf4', c: '#15803d', l: 'Freelance' },
}

const PLAT_BADGE = { facebook: '#dbeafe', tiktok: '#ede9fe', instagram: '#fce7f3', zalo: '#dcfce7' }

const DL_COLOR = (dl) => {
  if (!dl) return '#64748b'
  const today = new Date().getDate()
  const day = parseInt(dl)
  if (day < today) return '#dc2626'
  if (day - today <= 2) return '#854d0e'
  return '#15803d'
}

const DEMO_COLS = [
  {
    k: 'brief', l: 'Chờ brief', bg: '#f1f5f9', c: '#475569', badgeBg: '#475569',
    cards: [
      { id: 1, title: 'Video Reel — Hành trình điều trị sẹo 30 ngày', types: ['video'], platform: 'TikTok + Reels', campaign: 'SEO rỗ T05', assignee: 'Chưa giao — cần brief', deadline: '25/05', av: '?', avBg: '#fee2e2', avC: '#991b1b' },
      { id: 2, title: 'Banner KV — Chương trình tháng 6', types: ['design'], platform: 'Facebook + Zalo', campaign: 'T06 prep', assignee: 'Chưa giao', deadline: '05/06', av: '?', avBg: '#f1f5f9', avC: '#475569' },
    ],
  },
  {
    k: 'doing', l: 'Đang làm', bg: '#dbeafe', c: '#1e40af', badgeBg: '#1e40af',
    cards: [
      { id: 3, title: 'Caption + Hashtag — 10 post SEO rỗ T05', types: ['content'], platform: 'Facebook', campaign: 'SEO rỗ T05', assignee: 'Nguyễn T. Hà', deadline: '23/05', av: 'NH', avBg: '#dbeafe', avC: '#1e40af', progress: 60 },
      { id: 4, title: 'Thumbnail video — Trẻ hoá da Thermage', types: ['design', 'video'], platform: '', campaign: '', assignee: 'Trần Minh Tú', deadline: '26/05', av: 'MT', avBg: '#fdf4ff', avC: '#7e22ce', progress: 40 },
      { id: 5, title: 'Script video "1 ngày tại phòng khám" 60s', types: ['content', 'video', 'freelance'], platform: '', campaign: '', assignee: 'Lê Văn Khoa (FL) · Fee: 3.5tr', deadline: '24/05', av: 'LK', avBg: '#fff7ed', avC: '#c2410c', progress: 75 },
      { id: 6, title: 'Story Instagram — Before/After sẹo rỗ', types: ['design'], platform: 'Instagram', campaign: '', assignee: 'Trần Minh Tú', deadline: '28/05', av: 'MT', avBg: '#fdf4ff', avC: '#7e22ce', progress: 20 },
    ],
  },
  {
    k: 'review', l: 'Chờ duyệt nội bộ', bg: '#fef9c3', c: '#854d0e', badgeBg: '#854d0e',
    cards: [
      { id: 7, title: 'Post FB — "5 lý do chọn AirFusion" (có caption + visual)', types: ['content', 'design'], platform: 'Facebook', campaign: '', assignee: 'Nguyễn T. Hà + Trần Minh Tú', deadline: '22/05', av: 'NH', avBg: '#dbeafe', avC: '#1e40af', reviewLabel: 'Chờ Lead MKT duyệt' },
      { id: 8, title: 'Video Reels 30s — Quy trình điều trị SEO rỗ', types: ['video', 'freelance'], platform: '', campaign: '', assignee: 'Lê Văn Khoa (edit)', deadline: '25/05', av: 'LK', avBg: '#fff7ed', avC: '#c2410c', reviewLabel: 'Chờ Quản lý duyệt' },
      { id: 9, title: 'TikTok script — "Hỏi đáp về sẹo rỗ" series 5 tập', types: ['content'], platform: 'TikTok', campaign: '', assignee: '', deadline: '30/05', av: '?', avBg: '#f1f5f9', avC: '#475569', reviewLabel: 'Chờ Lead MKT duyệt' },
    ],
  },
  {
    k: 'done', l: 'Đã đăng', bg: '#ede9fe', c: '#5b21b6', badgeBg: '#5b21b6',
    cards: [
      { id: 10, title: 'Post TikTok — "3 lầm tưởng về sẹo rỗ" (viral 245K views)', types: ['video'], platform: 'TikTok', campaign: '', assignee: '', deadline: '18/05', av: 'LK', avBg: '#fff7ed', avC: '#c2410c', stats: '245K views · 1.2K share · 3.4K like' },
      { id: 11, title: 'Post FB — "Gặp gỡ BS KIÊN" (giới thiệu bác sĩ)', types: ['content', 'design'], platform: 'Facebook', campaign: '', assignee: '', deadline: '16/05', av: 'NH', avBg: '#dbeafe', avC: '#1e40af', stats: 'Reach: 12.400 · 89 comment' },
    ],
  },
]

const TYPE_FILTERS = [
  { k: 'all', l: 'Tất cả' },
  { k: 'content', l: 'Content' },
  { k: 'design', l: 'Thiết kế' },
  { k: 'video', l: 'Video/Phim' },
  { k: 'freelance', l: 'Freelance' },
]

export default function KanbanTab() {
  const [filter, setFilter] = useState('all')
  const [taskDetail, setTaskDetail] = useState(null)

  const filterCard = (c) => filter === 'all' || c.types.includes(filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: '#64748b' }}>Lọc:</span>
        {TYPE_FILTERS.map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)}
            style={{ padding: '3px 11px', borderRadius: 20, fontSize: 10, fontWeight: 500, cursor: 'pointer', border: `1.5px solid ${filter === f.k ? '#0284c7' : '#dde3ef'}`, background: filter === f.k ? '#eff6ff' : '#f8fafc', color: filter === f.k ? '#0284c7' : '#374151', transition: 'all .12s' }}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Kanban board */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '12px 16px', display: 'flex', gap: 10 }}>
        {DEMO_COLS.map(col => {
          const filtered = col.cards.filter(filterCard)
          return (
            <div key={col.k} style={{ minWidth: 240, width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: col.bg, color: col.c, padding: '6px 10px', borderRadius: 7, flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 600 }}>{col.l}</span>
                <span style={{ background: col.badgeBg, color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 9, fontWeight: 700 }}>{filtered.length}</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filtered.map(card => (
                  <div key={card.id} onClick={() => setTaskDetail(card)}
                    style={{ background: '#fff', border: `1px solid ${card.reviewLabel ? '#fde68a' : '#dde3ef'}`, borderRadius: 8, padding: 10, cursor: 'pointer', transition: 'all .12s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#0284c7'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,.07)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = card.reviewLabel ? '#fde68a' : '#dde3ef'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>

                    {card.reviewLabel && (
                      <div style={{ fontSize: 9, fontWeight: 600, color: '#854d0e', marginBottom: 4 }}>⚠ {card.reviewLabel}</div>
                    )}

                    <div style={{ fontSize: 11, fontWeight: 600, color: '#1a2233', marginBottom: 5, lineHeight: 1.4 }}>{card.title}</div>

                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 5 }}>
                      {card.types.map(t => {
                        const b = TYPE_BADGE[t]
                        return <span key={t} style={{ background: b.bg, color: b.c, padding: '1px 7px', borderRadius: 20, fontSize: 8, fontWeight: 600 }}>{b.l}</span>
                      })}
                      {card.platform && <span style={{ background: '#f1f5f9', color: '#475569', padding: '1px 7px', borderRadius: 20, fontSize: 8 }}>{card.platform}</span>}
                    </div>

                    {card.campaign && <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 2 }}>📣 {card.campaign}</div>}
                    {card.assignee && <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 4 }}>👤 {card.assignee}</div>}

                    {card.stats && (
                      <div style={{ fontSize: 9, color: '#5b21b6', marginBottom: 4 }}>📊 {card.stats}</div>
                    )}

                    {card.progress != null && (
                      <div style={{ marginBottom: 6 }}>
                        <div style={{ height: 4, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${card.progress}%`, background: '#0284c7', borderRadius: 10 }} />
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: 9, color: DL_COLOR(card.deadline?.slice(0, 2)), fontWeight: col.k === 'review' ? 600 : 400 }}>
                        🕐 {card.deadline}
                      </span>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: card.avBg, color: card.avC, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700 }}>
                        {card.av}
                      </div>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div style={{ padding: '20px 10px', textAlign: 'center', color: '#94a3b8', fontSize: 10 }}>Không có task</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {taskDetail && <TaskDetailModal task={{ ...taskDetail, title: taskDetail.title, comments: [{ av: 'NH', name: 'Nguyễn T. Hà', time: '21/05 16:30', text: 'Em đã cập nhật nội dung theo yêu cầu.' }], files: ['brief.docx'] }} onClose={() => setTaskDetail(null)} />}
    </div>
  )
}
