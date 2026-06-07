import { useState, useEffect, useCallback } from 'react'
import { IconSend, IconPhone, IconNotes } from '@tabler/icons-react'
import { getSatisfactionReviews } from '../../../api/cskh'
import GuiFormModal from '../modals/GuiFormModal'

const ACCENT = '#be185d'

const DEMO_REVIEWS = [
  { id: 1, initials: 'KL', bg: '#dbeafe', color: '#1e40af', customer_name: 'Kathy Le', rating: 5, date: '20/05/2026', comment: 'Điều trị mụn rất hiệu quả, da cải thiện rõ rệt sau 3 buổi. BS KIÊN nhiệt tình. CSKH nhắc lịch đúng giờ. Sẽ giới thiệu bạn bè!', service: 'Điều trị mụn BL · BS KIÊN · CS001 Kiều Anh', alert: false },
  { id: 2, initials: 'AK', bg: '#dcfce7', color: '#15803d', customer_name: 'Anh Khoi LE', rating: 4, date: '22/05/2026', comment: 'Kết quả tốt sau buổi 1. Mong phòng khám có thêm ca tối cho dân đi làm.', service: '', alert: false },
  { id: 3, initials: 'TV', bg: '#ede9fe', color: '#5b21b6', customer_name: 'Thảo Vi', rating: 3, date: '15/05', comment: 'Kết quả chưa như mong đợi sau 3 buổi.', service: '', alert: true },
]

function Stars({ count }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: 14, color: i <= count ? '#fbbf24' : '#e5e7eb' }}>{i <= count ? '★' : '☆'}</span>
      ))}
    </span>
  )
}

export default function DanhGiaTab() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)
  const [filterRating, setFilterRating] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getSatisfactionReviews()
      const data = res.data?.results ?? res.data ?? []
      setReviews(Array.isArray(data) ? data : [])
    } catch {
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const avg   = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0
  const pct5  = reviews.filter(r => r.rating === 5).length
  const pct4  = reviews.filter(r => r.rating === 4).length
  const pctLow= reviews.filter(r => r.rating <= 3).length
  const satPct= reviews.length ? Math.round(reviews.filter(r => r.rating >= 4).length / reviews.length * 100) : 0

  const visible = filterRating ? reviews.filter(r => {
    if (filterRating === '5') return r.rating === 5
    if (filterRating === '4') return r.rating === 4
    if (filterRating === '3') return r.rating <= 3
    return true
  }) : reviews

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', background: '#fff', borderBottom: '1px solid #eef1f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f2044' }}>Đánh giá hài lòng</span>
        <button onClick={() => setModal('gui-form')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <IconSend size={13} /> Gửi form đánh giá
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[
            { label: 'Đánh giá TB', val: `${avg} ⭐`, sub: `/5 · ${reviews.length} đánh giá`, color: '#f59e0b' },
            { label: 'Hài lòng (4-5 sao)', val: `${satPct}%`, sub: `${reviews.filter(r => r.rating >= 4).length} / ${reviews.length} KH`, color: '#15803d' },
            { label: 'Có nhận xét', val: reviews.filter(r => r.comment).length, sub: `${reviews.length ? Math.round(reviews.filter(r => r.comment).length / reviews.length * 100) : 0}% gửi nhận xét`, color: '#1e40af' },
            { label: 'Chờ đánh giá', val: 8, sub: 'KH chưa phản hồi', color: ACCENT },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 9, border: '1px solid #dde3ef', padding: '11px 13px' }}>
              <div style={{ fontSize: 19, fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{s.label}</div>
              <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Review list */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden', flex: 1 }}>
          <div style={{ padding: '9px 14px', borderBottom: '1px solid #eef1f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#0f2044' }}>Đánh giá gần đây</span>
            <div style={{ display: 'flex', gap: 5 }}>
              {[['', 'Tất cả'], ['5', `5⭐ (${pct5})`], ['4', `4⭐ (${pct4})`], ['3', `≤3⭐ (${pctLow})`]].map(([v, l]) => (
                <button key={v} onClick={() => setFilterRating(v)}
                  style={{ padding: '2px 9px', borderRadius: 20, fontSize: 9, fontWeight: 700, cursor: 'pointer', border: 'none', background: filterRating === v ? ACCENT : '#f1f5f9', color: filterRating === v ? '#fff' : '#475569' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Đang tải...</div>
          ) : visible.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 14px', borderBottom: '1px solid #f1f5f9', background: r.alert ? '#fef9f0' : '#fff' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: r.bg ?? '#ede9fe', color: r.color ?? '#5b21b6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                {r.initials ?? r.customer_name?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{r.customer_name}</span>
                  <Stars count={r.rating} />
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>{r.date}</span>
                  {r.alert && <span style={{ padding: '1px 7px', borderRadius: 20, fontSize: 8, fontWeight: 700, background: '#fef9c3', color: '#854d0e' }}>Cần liên hệ lại</span>}
                </div>
                {r.comment && <div style={{ fontSize: 11, color: '#374151', marginTop: 4, fontStyle: 'italic' }}>"{r.comment}"</div>}
                {r.service && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{r.service}</div>}
                {r.alert && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 5 }}>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 6, border: `1px solid ${ACCENT}`, background: '#fff', color: ACCENT, fontSize: 9, cursor: 'pointer' }}>
                      <IconPhone size={11} /> Gọi hỏi thăm
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 6, border: '1px solid #dde3ef', background: '#fff', color: '#374151', fontSize: 9, cursor: 'pointer' }}>
                      <IconNotes size={11} /> Ghi chú
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal === 'gui-form' && <GuiFormModal onClose={() => setModal(null)} />}
    </div>
  )
}
