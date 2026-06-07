import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '../../hooks/useNotifications'

function fmtAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60)  return 'Vừa xong'
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400)return `${Math.floor(diff / 3600)} giờ trước`
  return `${Math.floor(diff / 86400)} ngày trước`
}

export default function NotifBell() {
  const { notifs, unreadCount, loading, load, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const dropRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleOpen = () => {
    setOpen(v => !v)
    if (!open) load()   // refresh list on open
  }

  const handleItem = (n) => {
    if (!n.is_read) markRead(n.id)
  }

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 8, border: '1px solid #dde3ef',
          background: open ? '#f8fafc' : '#fff', cursor: 'pointer', flexShrink: 0,
        }}
        aria-label="Thông báo"
      >
        {/* Bell SVG */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#dc2626', color: '#fff',
            borderRadius: 99, minWidth: 16, height: 16,
            fontSize: 9, fontWeight: 700, lineHeight: '16px',
            textAlign: 'center', padding: '0 4px',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 38, right: 0, zIndex: 300,
          width: 320, background: '#fff', borderRadius: 12,
          border: '1px solid #dde3ef', boxShadow: '0 8px 32px rgba(0,0,0,.12)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f2044' }}>
              Thông báo {unreadCount > 0 && <span style={{ color: '#dc2626' }}>({unreadCount})</span>}
            </span>
            {unreadCount > 0 && (
              <button onClick={() => markAllRead()}
                style={{ fontSize: 10, color: '#0369a1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '2px 6px', borderRadius: 5 }}>
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Đang tải...</div>
            ) : notifs.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🔔</div>
                <div style={{ fontSize: 12 }}>Chưa có thông báo</div>
              </div>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleItem(n)}
                  style={{
                    padding: '10px 14px', borderBottom: '1px solid #f8fafc', cursor: 'pointer',
                    background: n.is_read ? '#fff' : '#eff6ff',
                    transition: 'background .1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = n.is_read ? '#fff' : '#eff6ff'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                      background: n.is_read ? 'transparent' : '#0369a1',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: n.is_read ? 400 : 700, color: '#0f2044', marginBottom: 2 }}>
                        {n.title}
                      </div>
                      {n.message && (
                        <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                          {n.message}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{fmtAgo(n.created_at)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
