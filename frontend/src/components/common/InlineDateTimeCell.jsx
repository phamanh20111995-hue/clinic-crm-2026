import { useState, useRef, useEffect, useCallback } from 'react'

export default function InlineDateTimeCell({
  date,
  time,
  displayDate,
  disabled = false,
  hideTime = false,
  onSave,
  accent = '#0369a1',
}) {
  const [open, setOpen]       = useState(false)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [saving, setSaving]   = useState(false)
  const containerRef          = useRef(null)
  const dateInputRef          = useRef(null)

  const hasValue = displayDate || time

  const openPopover = useCallback((e) => {
    if (disabled || saving) return
    e.stopPropagation()
    setEditDate(date || '')
    setEditTime(time || '')
    setOpen(true)
  }, [disabled, saving, date, time])

  const closePopover = useCallback(() => {
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) return
    if (dateInputRef.current) dateInputRef.current.focus()
    const onMouse = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) closePopover()
    }
    const onKey = (e) => { if (e.key === 'Escape') closePopover() }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, closePopover])

  const handleSave = useCallback(async () => {
    closePopover()
    setSaving(true)
    try {
      await onSave?.({ date: editDate, time: editTime })
    } catch (err) {
      try {
        const { default: toast } = await import('react-hot-toast')
        toast.error(err?.response?.data?.detail ?? 'Lỗi cập nhật')
      } catch {
        console.error('InlineDateTimeCell save error:', err)
      }
    } finally {
      setSaving(false)
    }
  }, [editDate, editTime, onSave, closePopover])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSave() }
    if (e.key === 'Escape') { e.preventDefault(); closePopover() }
  }, [handleSave, closePopover])

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <span
        onDoubleClick={disabled ? undefined : openPopover}
        onClick={disabled ? undefined : e => e.stopPropagation()}
        title={disabled ? undefined : 'Kích đúp để sửa · Enter lưu · Esc hủy'}
        style={{
          cursor: disabled ? 'default' : 'cell',
          opacity: saving ? 0.55 : 1,
          transition: 'opacity .15s',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          userSelect: 'none',
          color: '#64748b',
          fontSize: 11,
        }}
      >
        {hasValue ? (
          <>
            {displayDate}
            {!hideTime && time && (
              <span style={{ fontFamily: 'monospace', marginLeft: displayDate ? 4 : 0 }}>{time}</span>
            )}
          </>
        ) : '—'}
        {saving && (
          <span style={{
            display: 'inline-block',
            width: 10, height: 10,
            border: `2px solid ${accent}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'idtc-spin .6s linear infinite',
            flexShrink: 0,
          }} />
        )}
      </span>

      {open && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 100,
            background: '#fff',
            border: '1px solid #dde3ef',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,.15)',
            padding: '12px 12px 10px',
            minWidth: 220,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <input
            ref={dateInputRef}
            type="date"
            value={editDate}
            onChange={e => setEditDate(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={e => e.stopPropagation()}
            style={{
              padding: '6px 8px',
              border: '1px solid #dde3ef',
              borderRadius: 6,
              fontSize: 12,
              outline: 'none',
              fontFamily: 'inherit',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          <input
            type="time"
            value={editTime}
            onChange={e => setEditTime(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={e => e.stopPropagation()}
            style={{
              padding: '6px 8px',
              border: '1px solid #dde3ef',
              borderRadius: 6,
              fontSize: 12,
              outline: 'none',
              fontFamily: 'inherit',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleSave}
            style={{
              padding: '6px 0',
              borderRadius: 6,
              border: 'none',
              background: accent,
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Lưu
          </button>
        </div>
      )}

      <style>{`@keyframes idtc-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
