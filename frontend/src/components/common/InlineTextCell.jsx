import { useState, useRef, useEffect, useCallback } from 'react'

export default function InlineTextCell({
  value,
  displayValue,
  disabled = false,
  onSave,
  placeholder = '',
  accent = '#0369a1',
}) {
  const [open, setOpen]     = useState(false)
  const [editVal, setEditVal] = useState('')
  const [saving, setSaving] = useState(false)
  const containerRef        = useRef(null)
  const inputRef            = useRef(null)

  const openEdit = useCallback((e) => {
    if (disabled || saving) return
    e.stopPropagation()
    setEditVal(value || '')
    setOpen(true)
  }, [disabled, saving, value])

  const closeEdit = useCallback(() => {
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) return
    if (inputRef.current) inputRef.current.focus()
    const onMouse = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) closeEdit()
    }
    document.addEventListener('mousedown', onMouse)
    return () => document.removeEventListener('mousedown', onMouse)
  }, [open, closeEdit])

  const commit = useCallback(async () => {
    const trimmed = editVal.trim()
    if (trimmed === (value || '').trim()) { closeEdit(); return }
    closeEdit()
    setSaving(true)
    try {
      await onSave?.(trimmed)
    } catch (err) {
      try {
        const { default: toast } = await import('react-hot-toast')
        toast.error(
          err?.response?.data?.phone?.[0] ??
          err?.response?.data?.detail ??
          'Lỗi cập nhật'
        )
      } catch {
        console.error('InlineTextCell save error:', err)
      }
    } finally {
      setSaving(false)
    }
  }, [editVal, value, onSave, closeEdit])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit() }
    if (e.key === 'Escape') { e.preventDefault(); closeEdit() }
  }, [commit, closeEdit])

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {open ? (
        <input
          ref={inputRef}
          type="text"
          value={editVal}
          placeholder={placeholder}
          onChange={e => setEditVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={e => e.stopPropagation()}
          style={{
            padding: '6px 8px',
            border: `1px solid ${accent}`,
            borderRadius: 6,
            fontSize: 12,
            outline: 'none',
            fontFamily: 'monospace',
            minWidth: 120,
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <span
          onDoubleClick={disabled ? undefined : openEdit}
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
          }}
        >
          {displayValue}
          {saving && (
            <span style={{
              display: 'inline-block',
              width: 10, height: 10,
              border: `2px solid ${accent}`,
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'itc-spin .6s linear infinite',
              flexShrink: 0,
            }} />
          )}
        </span>
      )}
      <style>{`@keyframes itc-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
