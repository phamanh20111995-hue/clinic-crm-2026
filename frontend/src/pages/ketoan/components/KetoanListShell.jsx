// Khung dùng chung cho tab Kế toán — bám đúng cơ chế CustomerTable (Tele):
// card flex:1 overflow:hidden → vùng cuộn overflowX:auto/overflowY:scroll flex:1 → bảng minWidth lớn
// footer position:fixed bám đáy viewport.
export default function KetoanListShell({ stats, toolbar, children, pagination, framed = true }) {
  const hasPag = !!pagination
  const totalPages = hasPag ? Math.max(1, Math.ceil((pagination.count ?? 0) / (pagination.pageSize || 20))) : 1

  const selStyle = { padding: '6px 10px', border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }
  const btnStyle = dis => ({ padding: '6px 12px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 12, cursor: dis ? 'default' : 'pointer', opacity: dis ? 0.4 : 1, fontFamily: 'inherit' })

  const scrollInner = (
    <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1, minHeight: 0, minWidth: 0 }}>
      {children}
    </div>
  )

  return (
    <>
      <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '14px 16px 0' }}>
        {stats ? <div style={{ flexShrink: 0, marginBottom: 12 }}>{stats}</div> : null}
        {toolbar ? <div style={{ flexShrink: 0, marginBottom: 10 }}>{toolbar}</div> : null}

        {framed ? (
          <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, minWidth: 0 }}>
            {scrollInner}
          </div>
        ) : (
          <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {scrollInner}
          </div>
        )}
      </div>

      {hasPag && (
        <div style={{ position: 'fixed', bottom: 0, left: 'var(--sidebar-w)', right: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 24px', background: '#fff', borderTop: '1px solid #dde3ef' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>Trang {pagination.page} / {totalPages} ({pagination.count ?? 0} kết quả)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select value={pagination.pageSize} onChange={e => pagination.onPageSize(Number(e.target.value))} style={selStyle}>
              {[20, 50, 100, 200, 500, 1000].map(o => <option key={o} value={o}>Hiển thị {o}/trang</option>)}
            </select>
            <button disabled={pagination.page <= 1} onClick={() => pagination.onPage(pagination.page - 1)} style={btnStyle(pagination.page <= 1)}>← Trước</button>
            <button disabled={pagination.page >= totalPages} onClick={() => pagination.onPage(pagination.page + 1)} style={btnStyle(pagination.page >= totalPages)}>Tiếp →</button>
          </div>
        </div>
      )}
    </>
  )
}
