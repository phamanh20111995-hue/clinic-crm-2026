import { useState } from 'react'
import { IconPlus } from '@tabler/icons-react'
import ThemFreelancerModal from '../modals/ThemFreelancerModal'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')

const DEMO = [
  { id: 1, name: 'Lê Văn Khoa', contact: '0912 345 xxx · le.khoa@gmail.com', specialty: 'Quay phim · Dựng phim', specialtyBg: '#fff7ed', specialtyC: '#c2410c', tasks: ['Video Reels 30s (chờ duyệt)', 'Script series TikTok 5 tập'], fee: 7000000, statusBg: '#fef9c3', statusC: '#854d0e', statusL: 'Đang làm · 2 task' },
  { id: 2, name: 'Nguyễn Thu Hằng', contact: '0934 567 xxx · Photographer', specialty: 'Chụp ảnh · Retouch', specialtyBg: '#fdf4ff', specialtyC: '#7e22ce', tasks: ['Ảnh before/after T05 (8 ca)'], fee: 1600000, statusBg: '#dcfce7', statusC: '#15803d', statusL: 'Hoàn thành' },
  { id: 3, name: 'Trần Đức Minh', contact: '0978 123 xxx · Voice over', specialty: 'Voiceover · Dẫn chương trình', specialtyBg: '#eff6ff', specialtyC: '#1e40af', tasks: ['Voiceover video Reels 30s'], fee: 900000, statusBg: '#dcfce7', statusC: '#15803d', statusL: 'Nộp xong · Chờ check' },
]

const now = new Date()
const monthLabel = `T${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`

export default function FreelancerTab() {
  const [freelancers, setFreelancers] = useState(DEMO)
  const [addOpen, setAddOpen] = useState(false)

  const totalFee     = freelancers.reduce((s, f) => s + Number(f.fee ?? 0), 0)
  const totalTasks   = freelancers.reduce((s, f) => s + (f.tasks ?? []).length, 0)
  const doneTasks    = freelancers.filter(f => f.statusL.includes('Hoàn thành')).length
  const activeFl     = freelancers.filter(f => f.statusL.includes('Đang làm')).length

  const stats = [
    { lbl: 'Freelancer đang làm việc', val: activeFl, sub: monthLabel, c: '#0284c7' },
    { lbl: `Chi phí freelance ${monthLabel}`, val: fmt(totalFee) + 'đ', sub: 'Ngân sách: 15.000.000đ', c: '#854d0e' },
    { lbl: 'Task đang giao', val: totalTasks - doneTasks, sub: `${freelancers.filter(f => f.statusL.includes('chờ duyệt') || f.statusL.includes('Chờ')).length} chờ duyệt`, c: '#1e40af' },
    { lbl: `Task hoàn thành ${monthLabel}`, val: doneTasks, sub: 'Đúng deadline: tốt', c: '#15803d' },
  ]

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {stats.map(s => (
          <div key={s.lbl} style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 5 }}>{s.lbl}</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: s.c }}>{s.val}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2044' }}>Danh sách freelancer</span>
          <button onClick={() => setAddOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', border: 'none', borderRadius: 7, background: '#0284c7', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            <IconPlus size={12} /> Thêm freelancer
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Họ tên', 'Chuyên môn', 'Task đang làm', 'Fee T05', 'Trạng thái', ''].map(h => (
                <th key={h} style={{ padding: '7px 12px', textAlign: h === 'Fee T05' ? 'right' : 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {freelancers.map(f => (
              <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 12px' }}>
                  <b>{f.name}</b>
                  <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>{f.contact}</div>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ background: f.specialtyBg, color: f.specialtyC, padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 600 }}>{f.specialty}</span>
                </td>
                <td style={{ padding: '10px 12px', fontSize: 10, color: '#374151' }}>
                  {f.tasks.map((t, i) => <div key={i}>{t}</div>)}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#854d0e' }}>{fmt(f.fee)}đ</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ background: f.statusBg, color: f.statusC, padding: '2px 9px', borderRadius: 20, fontSize: 9, fontWeight: 600 }}>{f.statusL}</span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <button style={{ padding: '3px 9px', border: '1px solid #dde3ef', borderRadius: 6, background: '#fff', fontSize: 9, cursor: 'pointer' }}>Xem task</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '9px 14px', background: '#eff6ff', borderTop: '1px solid #dde3ef', fontSize: 10, color: '#1e40af', display: 'flex', gap: 6, alignItems: 'center' }}>
          ℹ️ Chi phí freelance tự động ghi vào khoản mục "Chi phí MKT — Sáng tạo nội dung" cho Kế toán khi xác nhận task hoàn thành.
        </div>
      </div>

      {addOpen && <ThemFreelancerModal onClose={() => setAddOpen(false)} onDone={() => {}} />}
    </div>
  )
}
