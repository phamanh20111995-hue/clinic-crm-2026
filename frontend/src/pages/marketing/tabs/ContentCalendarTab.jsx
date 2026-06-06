import { useState } from 'react'
import { IconChevronLeft, IconChevronRight, IconPlus } from '@tabler/icons-react'
import TaskDetailModal from '../modals/TaskDetailModal'

const PLAT_STYLE = {
  facebook:  { bg: '#dbeafe', c: '#1e40af', icon: '📘' },
  tiktok:    { bg: '#ede9fe', c: '#5b21b6', icon: '🎵' },
  instagram: { bg: '#fce7f3', c: '#be185d', icon: '📸' },
  zalo:      { bg: '#dcfce7', c: '#15803d', icon: '💬' },
  pending:   { bg: '#fef9c3', c: '#854d0e', icon: '⏳' },
  done:      { bg: '#dcfce7', c: '#15803d', icon: '✅' },
}

// Demo events cho tuần hiện tại
const DEMO_EVENTS = {
  0: [ // T2
    { time: '10:00', plat: 'tiktok', title: 'Quy trình điều trị' },
    { time: '19:00', plat: 'instagram', title: 'Story: Before/After' },
  ],
  1: [ // T3
    { time: '14:00', plat: 'tiktok', title: 'BS KIÊN Q&A' },
  ],
  2: [ // T4
    { time: '08:00', plat: 'facebook', title: 'Sẹo rỗ trước-sau' },
    { time: '19:00', plat: 'tiktok', title: 'Hỏi đáp sẹo rỗ T1' },
  ],
  3: [ // T5 (hôm nay demo)
    { time: '10:00', plat: 'pending', title: 'Chờ duyệt...' },
  ],
  4: [ // T6
    { time: '08:00', plat: 'done', title: 'Post FB: 5 lý do AirFusion' },
    { time: '14:00', plat: 'facebook', title: 'Post FB: Trẻ hoá da' },
    { time: '19:00', plat: 'instagram', title: 'Story IG: Tip dưỡng da' },
  ],
  5: [ // T7
    { time: '08:00', plat: 'instagram', title: 'Story Zalo: Flash sale' },
    { time: '14:00', plat: 'facebook', title: 'Post FB: Trẻ hoá da' },
  ],
  6: [ // CN
    { time: '10:00', plat: 'tiktok', title: 'Reels: Hành trình 30 ngày' },
    { time: '14:00', plat: 'facebook', title: 'Post FB: Tổng kết tuần' },
  ],
}

const DAY_NAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function getWeekDates(offset = 0) {
  const now = new Date()
  const dow = now.getDay() === 0 ? 6 : now.getDay() - 1
  const mon = new Date(now)
  mon.setDate(now.getDate() - dow + offset * 7)
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d })
}

function fmtDate(d) { return `${d.getDate()}/${d.getMonth() + 1}` }

export default function ContentCalendarTab() {
  const [weekOff, setWeekOff] = useState(0)
  const [taskDetail, setTaskDetail] = useState(null)
  const weekDates = getWeekDates(weekOff)

  const weekLabel = `${fmtDate(weekDates[0])} – ${fmtDate(weekDates[6])}/${weekDates[6].getFullYear()}`
  const todayIdx  = weekDates.findIndex(d => d.toDateString() === new Date().toDateString())

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => setWeekOff(w => w - 1)}
          style={{ width: 28, height: 28, border: '1px solid #dde3ef', borderRadius: 6, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconChevronLeft size={14} />
        </button>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2044', minWidth: 160, textAlign: 'center' }}>
          Content Calendar — Tuần {weekLabel}
        </span>
        <button onClick={() => setWeekOff(w => w + 1)}
          style={{ width: 28, height: 28, border: '1px solid #dde3ef', borderRadius: 6, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconChevronRight size={14} />
        </button>
        {weekOff !== 0 && <button onClick={() => setWeekOff(0)} style={{ fontSize: 11, color: '#0284c7', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Tuần này</button>}
        <button style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', border: 'none', borderRadius: 7, background: '#0284c7', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          <IconPlus size={12} /> Thêm lịch đăng
        </button>
      </div>

      {/* Grid */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7,1fr)', gap: 1, background: '#dde3ef', borderRadius: 8, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ background: '#f8fafc', padding: '6px 4px', fontSize: 10, fontWeight: 600, color: '#64748b' }} />
          {weekDates.map((d, i) => {
            const isToday = i === todayIdx
            return (
              <div key={i} style={{ background: isToday ? '#fffbeb' : '#f8fafc', padding: '6px', textAlign: 'center', fontSize: 10, fontWeight: isToday ? 700 : 400, color: isToday ? '#854d0e' : '#64748b' }}>
                {DAY_NAMES[i]}<br />
                <span>{fmtDate(d)}{isToday ? ' ◀' : ''}</span>
              </div>
            )
          })}

          {/* Time rows */}
          {['08:00', '10:00', '14:00', '19:00'].map(time => (
            <>
              <div key={`t-${time}`} style={{ background: '#f8fafc', padding: '8px 4px 8px 8px', fontSize: 9, fontWeight: 500, color: '#94a3b8', minHeight: 60, display: 'flex', alignItems: 'flex-start' }}>{time}</div>
              {weekDates.map((d, di) => {
                const isToday = di === todayIdx
                const events = (DEMO_EVENTS[di] ?? []).filter(e => e.time === time)
                return (
                  <div key={`${time}-${di}`} style={{ background: isToday ? '#fffbeb' : '#fff', padding: '4px 6px', minHeight: 60 }}>
                    {events.map((ev, ei) => {
                      const ps = PLAT_STYLE[ev.plat] ?? PLAT_STYLE.facebook
                      return (
                        <div key={ei} onClick={() => setTaskDetail({ title: ev.title, types: ['content'], campaign: '', assignee: '', deadline: fmtDate(d), files: [], comments: [] })}
                          style={{ background: ps.bg, color: ps.c, padding: '2px 5px', borderRadius: 4, fontSize: 9, fontWeight: 500, cursor: 'pointer', marginBottom: 2, lineHeight: 1.4 }}>
                          {ps.icon} {ev.title}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {Object.entries(PLAT_STYLE).map(([k, v]) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#64748b' }}>
            <span style={{ background: v.bg, color: v.c, padding: '1px 7px', borderRadius: 4, fontSize: 9, fontWeight: 500 }}>{v.icon} {k.charAt(0).toUpperCase() + k.slice(1)}</span>
          </span>
        ))}
      </div>

      {taskDetail && <TaskDetailModal task={taskDetail} onClose={() => setTaskDetail(null)} />}
    </div>
  )
}
