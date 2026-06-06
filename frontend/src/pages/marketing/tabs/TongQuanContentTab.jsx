import { useState } from 'react'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')

const DEMO_STATS = [
  { lbl: 'Tổng task tháng', val: 19, sub: 'Content: 8 · Design: 6 · Video: 5', c: '#0284c7' },
  { lbl: 'Đã hoàn thành', val: 8, sub: 'Đúng deadline: 7/8', c: '#15803d' },
  { lbl: 'Đang chờ duyệt', val: 3, sub: 'Cần duyệt hôm nay: 1', c: '#854d0e' },
  { lbl: 'Tổng bài đã đăng', val: '8 bài', sub: 'FB: 4 · TikTok: 3 · IG: 1', c: '#5b21b6' },
]

const DEMO_POSTS = [
  { title: '3 lầm tưởng về sẹo rỗ', platform: 'TikTok', platBg: '#ede9fe', platC: '#5b21b6', reach: '245K', engage: '4.6K', mess: 89, author: 'Video: Lê V. Khoa (FL) · Content: Nguyễn T. Hà' },
  { title: 'Gặp gỡ BS KIÊN', platform: 'Facebook', platBg: '#dbeafe', platC: '#1e40af', reach: '12.4K', engage: '340', mess: 24, author: 'Content: Nguyễn T. Hà · Design: Trần Minh Tú' },
  { title: 'Before/After sẹo rỗ KH', platform: 'Instagram', platBg: '#fce7f3', platC: '#be185d', reach: '8.2K', engage: '520', mess: 31, author: 'Ảnh: Nguyễn T. Hằng (FL) · Design: Trần Minh Tú' },
]

const now = new Date()
const monthLabel = `T${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`

export default function TongQuanContentTab() {
  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {DEMO_STATS.map(s => (
          <div key={s.lbl} style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 5 }}>{s.lbl}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.c }}>{s.val}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Task status breakdown */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f2044', marginBottom: 10 }}>Tổng quan task {monthLabel}</div>
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { l: 'Chờ brief', n: 2, bg: '#f1f5f9', c: '#475569', pct: 10 },
            { l: 'Đang làm', n: 4, bg: '#dbeafe', c: '#1e40af', pct: 21 },
            { l: 'Chờ duyệt', n: 3, bg: '#fef9c3', c: '#854d0e', pct: 16 },
            { l: 'Đã duyệt·Chờ đăng', n: 2, bg: '#dcfce7', c: '#15803d', pct: 10 },
            { l: 'Đã đăng', n: 8, bg: '#ede9fe', c: '#5b21b6', pct: 42 },
          ].map((s, i) => (
            <div key={s.l} style={{ flex: s.pct, background: s.bg, padding: '6px 8px', textAlign: 'center', borderRight: i < 4 ? '1px solid #fff' : undefined }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: s.c }}>{s.n}</div>
              <div style={{ fontSize: 8, color: s.c, fontWeight: 500, lineHeight: 1.3 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 8, gap: 6, fontSize: 10, color: '#94a3b8' }}>
          <div style={{ flex: 1, height: 5, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden', display: 'flex' }}>
            {[{ c: '#475569', p: 10 }, { c: '#1e40af', p: 21 }, { c: '#854d0e', p: 16 }, { c: '#15803d', p: 11 }, { c: '#5b21b6', p: 42 }].map((b, i) => (
              <div key={i} style={{ width: `${b.p}%`, background: b.c }} />
            ))}
          </div>
          <span>19 task tổng</span>
        </div>
      </div>

      {/* Performance table */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontSize: 12, fontWeight: 700, color: '#0f2044' }}>
          Hiệu quả nội dung đã đăng — {monthLabel}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Bài đăng', 'Nền tảng', 'Reach', 'Tương tác', 'Mess', 'Người thực hiện'].map(h => (
                <th key={h} style={{ padding: '7px 12px', textAlign: ['Reach', 'Tương tác', 'Mess'].includes(h) ? 'right' : 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DEMO_POSTS.map(p => (
              <tr key={p.title} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600 }}>{p.title}</td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{ background: p.platBg, color: p.platC, padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 600 }}>{p.platform}</span>
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: '#5b21b6', fontWeight: 600 }}>{p.reach}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{p.engage}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: '#15803d', fontWeight: 600 }}>{p.mess}</td>
                <td style={{ padding: '8px 12px', fontSize: 10, color: '#64748b' }}>{p.author}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '8px 14px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', fontSize: 10, color: '#94a3b8', textAlign: 'right' }}>
          Dữ liệu được cập nhật từ Meta Ads Manager + TikTok Ads · Mess kéo tự động mỗi ngày
        </div>
      </div>
    </div>
  )
}
