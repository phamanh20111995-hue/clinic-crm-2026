export default function StatCard({ label, value, accent = '#6d28d9', sub }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 10,
      border: '1px solid #dde3ef',
      boxShadow: '0 1px 4px rgba(0,0,0,.07)',
      padding: '14px 16px',
    }}>
      <p style={{ fontSize: 22, fontWeight: 700, color: accent, lineHeight: 1.1 }}>
        {value ?? '—'}
      </p>
      <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{label}</p>
      {sub && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</p>}
    </div>
  )
}
