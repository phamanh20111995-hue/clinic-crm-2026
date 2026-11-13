import AppLayout from '../layout/AppLayout'

// Trang shell dùng chung cho các module mới (Phase A — chưa nối backend)
export default function PlaceholderPage({ title, subtitle, icon = '🧩' }) {
  return (
    <AppLayout title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 10, textAlign: 'center', padding: 20 }}>
        <div style={{ fontSize: 40 }}>{icon}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#0f2044' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: '#64748b', maxWidth: 480 }}>{subtitle}</div>}
        <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 600, background: '#ede9fe', color: '#6d28d9', borderRadius: 99, padding: '5px 14px' }}>
          Sắp có · đang phát triển
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>UI shell — chưa nối dữ liệu</div>
      </div>
    </AppLayout>
  )
}
