import { useState, useEffect } from 'react'
import { IconChevronLeft, IconChevronRight, IconPlus, IconSettings, IconAlertTriangle } from '@tabler/icons-react'
import { getShifts, getLeaves } from '../../../api/ketoan'
import ThemCaModal from '../modals/ThemCaModal'
import CauHinhCaModal from '../modals/CauHinhCaModal'
import NghiPhepKTModal from '../modals/NghiPhepKTModal'

const SHIFT_CHIPS = {
  sang:   { bg: '#dbeafe', c: '#1d4ed8', label: 'Sáng' },
  chieu:  { bg: '#fef9c3', c: '#854d0e', label: 'Chiều' },
  toi:    { bg: '#ede9fe', c: '#6d28d9', label: 'Tối' },
  full:   { bg: '#dcfce7', c: '#15803d', label: 'Full' },
  nghi:   { bg: '#f1f5f9', c: '#64748b', label: 'Nghỉ' },
  phep:   { bg: '#fae8ff', c: '#7e22ce', label: 'Phép' },
}

const DAY_NAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function getWeekDates(offsetWeeks = 0) {
  const now = new Date()
  const day = now.getDay() === 0 ? 6 : now.getDay() - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + offsetWeeks * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function fmt(d) { return `${d.getDate()}/${d.getMonth() + 1}` }

export default function CaLamViecTab() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [shifts, setShifts] = useState([])
  const [leaves, setLeaves] = useState([])
  const [themCaOpen, setThemCaOpen] = useState(false)
  const [cauHinhOpen, setCauHinhOpen] = useState(false)
  const [nghiPhepTarget, setNghiPhepTarget] = useState(null)

  const weekDates = getWeekDates(weekOffset)

  const load = () => {
    const from = weekDates[0].toISOString().slice(0, 10)
    const to = weekDates[6].toISOString().slice(0, 10)
    getShifts({ date_from: from, date_to: to }).then(r => {
      const d = r.data?.results ?? r.data ?? []
      setShifts(Array.isArray(d) ? d : [])
    })
    getLeaves({ status: 'approved' }).then(r => {
      const d = r.data?.results ?? r.data ?? []
      setLeaves(Array.isArray(d) ? d : [])
    })
  }

  useEffect(() => { load() }, [weekOffset])

  // Build staff list from shifts + leaves
  const staffMap = {}
  shifts.forEach(s => {
    if (!staffMap[s.user_id]) staffMap[s.user_id] = { id: s.user_id, name: s.user_name, code: s.user_code }
  })
  leaves.forEach(l => {
    if (!staffMap[l.user_id]) staffMap[l.user_id] = { id: l.user_id, name: l.user_name, code: l.user_code }
  })
  const staffList = Object.values(staffMap)

  const getCell = (userId, date) => {
    const dateStr = date.toISOString().slice(0, 10)
    const shift = shifts.find(s => s.user_id === userId && s.date === dateStr)
    if (shift) return SHIFT_CHIPS[shift.shift] ?? SHIFT_CHIPS.sang
    const onLeave = leaves.some(l => l.user_id === userId && l.start_date <= dateStr && l.end_date >= dateStr)
    if (onLeave) return SHIFT_CHIPS.phep
    return null
  }

  // Violations from leaves
  const pendingLeaves = leaves.filter(l => l.status === 'pending')

  const weekLabel = `${fmt(weekDates[0])} – ${fmt(weekDates[6])}/${weekDates[6].getFullYear()}`

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setWeekOffset(w => w - 1)}
            style={{ width: 28, height: 28, border: '1px solid #dde3ef', borderRadius: 6, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2044', minWidth: 140, textAlign: 'center' }}>
            Tuần {weekLabel}
          </span>
          <button onClick={() => setWeekOffset(w => w + 1)}
            style={{ width: 28, height: 28, border: '1px solid #dde3ef', borderRadius: 6, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconChevronRight size={14} />
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)}
              style={{ fontSize: 11, color: '#0369a1', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Hôm nay
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setNghiPhepTarget({})}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', border: '1px solid #dde3ef', borderRadius: 6, background: '#fff', fontSize: 11, cursor: 'pointer' }}>
            Nghỉ phép
          </button>
          <button onClick={() => setThemCaOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', border: 'none', borderRadius: 6, background: '#0369a1', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            <IconPlus size={12} /> Thêm ca
          </button>
          <button onClick={() => setCauHinhOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', border: '1px solid #dde3ef', borderRadius: 6, background: '#fff', fontSize: 11, cursor: 'pointer' }}>
            <IconSettings size={12} /> Cấu hình
          </button>
        </div>
      </div>

      {/* Schedule grid */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', minWidth: 140 }}>Nhân viên</th>
                {weekDates.map((d, i) => {
                  const isToday = d.toDateString() === new Date().toDateString()
                  return (
                    <th key={i} style={{ padding: '8px 10px', textAlign: 'center', fontSize: 10, fontWeight: 600, color: isToday ? '#0369a1' : '#64748b', borderBottom: '1px solid #eef1f6', background: isToday ? '#f0f9ff' : undefined, minWidth: 72 }}>
                      <div>{DAY_NAMES[i]}</div>
                      <div style={{ fontWeight: isToday ? 700 : 400 }}>{fmt(d)}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {staffList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 28, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
                    API ca làm việc chưa có dữ liệu · Sẽ hiển thị khi backend triển khai
                  </td>
                </tr>
              ) : (
                staffList.map(staff => (
                  <tr key={staff.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '7px 14px' }}>
                      <b style={{ fontSize: 11 }}>{staff.name}</b>
                      {staff.code && <span style={{ marginLeft: 5, background: '#f1f5f9', color: '#64748b', padding: '1px 5px', borderRadius: 4, fontSize: 8 }}>{staff.code}</span>}
                    </td>
                    {weekDates.map((d, i) => {
                      const cell = getCell(staff.id, d)
                      const isToday = d.toDateString() === new Date().toDateString()
                      return (
                        <td key={i} style={{ padding: '6px 8px', textAlign: 'center', background: isToday ? '#fafeff' : undefined }}>
                          {cell ? (
                            <span style={{ background: cell.bg, color: cell.c, padding: '2px 8px', borderRadius: 8, fontSize: 9, fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {cell.label}
                            </span>
                          ) : (
                            <span style={{ color: '#e2e8f0', fontSize: 10 }}>—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div style={{ padding: '8px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {Object.entries(SHIFT_CHIPS).map(([k, v]) => (
            <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#64748b' }}>
              <span style={{ background: v.bg, color: v.c, padding: '1px 7px', borderRadius: 8, fontSize: 9, fontWeight: 600 }}>{v.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Pending leaves / violations */}
      {pendingLeaves.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', background: '#fffbeb', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconAlertTriangle size={13} color="#b45309" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>Đơn nghỉ phép chờ duyệt ({pendingLeaves.length})</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Nhân viên', 'Từ ngày', 'Đến ngày', 'Số ngày', 'Lý do', ''].map(h => (
                  <th key={h} style={{ padding: '6px 11px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingLeaves.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '7px 11px' }}><b>{l.user_name}</b></td>
                  <td style={{ padding: '7px 11px', color: '#64748b' }}>{l.start_date}</td>
                  <td style={{ padding: '7px 11px', color: '#64748b' }}>{l.end_date}</td>
                  <td style={{ padding: '7px 11px' }}>{l.days ?? '—'} ngày</td>
                  <td style={{ padding: '7px 11px', color: '#64748b' }}>{l.reason ?? '—'}</td>
                  <td style={{ padding: '7px 11px' }}>
                    <button onClick={() => setNghiPhepTarget(l)}
                      style={{ padding: '2px 10px', border: 'none', borderRadius: 5, background: '#15803d', color: '#fff', fontSize: 9, cursor: 'pointer', fontWeight: 600 }}>
                      Duyệt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {themCaOpen && <ThemCaModal staffList={staffList} onClose={() => setThemCaOpen(false)} onDone={load} />}
      {cauHinhOpen && <CauHinhCaModal onClose={() => setCauHinhOpen(false)} />}
      {nghiPhepTarget && <NghiPhepKTModal leave={nghiPhepTarget} onClose={() => setNghiPhepTarget(null)} onDone={load} />}
    </div>
  )
}
