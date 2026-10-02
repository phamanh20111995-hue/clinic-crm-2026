import { useState, useRef, useEffect, useCallback } from 'react'

function removeDiacritics(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function sameSet(a, b) {
  if (a.length !== b.length) return false
  const sa = new Set(a.map(String))
  return b.every(x => sa.has(String(x)))
}

export default function InlineMultiSelectCell({
  value = [],
  displayValue,
  options = [],
  onSave,
  disabled = false,
  placeholder = 'Tìm...',
  accent = '#0369a1',
}) {
  const [open, setOpen]     = useState(false)
  const [draft, setDraft]   = useState([])
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const containerRef        = useRef(null)
  const searchRef           = useRef(null)

  const showSearch = options.length > 8

  const filtered = options.filter(o =>
    !search || removeDiacritics(o.label).includes(removeDiacritics(search))
  )

  const openDropdown = useCallback((e) => {
    if (disabled || saving) return
    e.stopPropagation()
    setDraft([...value])
    setSearch('')
    setOpen(true)
  }, [disabled, saving, value])

  const closeDropdown = useCallback(() => {
    setOpen(false)
    setSearch('')
  }, [])

  const toggleItem = useCallback((id) => {
    setDraft(prev =>
      prev.some(x => String(x) === String(id))
        ? prev.filter(x => String(x) !== String(id))
        : [...prev, id]
    )
  }, [])

  const commit = useCallback(async () => {
    if (sameSet(draft, value)) { closeDropdown(); return }
    closeDropdown()
    setSaving(true)
    try {
      await onSave?.(draft)
    } catch (err) {
      try {
        const { default: toast } = await import('react-hot-toast')
        toast.error(err?.response?.data?.detail ?? 'Lỗi cập nhật')
      } catch {
        console.error('InlineMultiSelectCell save error:', err)
      }
    } finally {
      setSaving(false)
    }
  }, [draft, value, onSave, closeDropdown])

  useEffect(() => {
    if (!open) return
    if (showSearch && searchRef.current) searchRef.current.focus()
    const onMouse = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) closeDropdown()
    }
    const onKey = (e) => {
      if (e.key === 'Escape') { closeDropdown(); return }
      if (e.key === 'Enter') { e.preventDefault(); commit() }
    }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, showSearch, closeDropdown, commit])

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <span
        onDoubleClick={disabled ? undefined : openDropdown}
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
            display: 'inline-block', width: 10, height: 10,
            border: `2px solid ${accent}`, borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'imsc-spin .6s linear infinite', flexShrink: 0,
          }} />
        )}
      </span>

      {open && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100,
            background: '#fff', border: '1px solid #dde3ef', borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,.15)', minWidth: 200, padding: 4,
          }}
        >
          {showSearch && (
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={placeholder}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', padding: '6px 10px', border: '1px solid #dde3ef',
                borderRadius: 6, fontSize: 12, marginBottom: 4, outline: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          )}
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '8px 10px', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
                Không tìm thấy
              </div>
            ) : filtered.map(o => {
              const checked = draft.some(x => String(x) === String(o.value))
              return (
                <label
                  key={o.value}
                  onClick={e => { e.stopPropagation(); toggleItem(o.value) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 10px', borderRadius: 6, fontSize: 12,
                    cursor: 'pointer', userSelect: 'none',
                    background: checked ? '#eff6ff' : 'transparent',
                    color: checked ? accent : '#111827',
                    fontWeight: checked ? 600 : 400,
                  }}
                  onMouseEnter={e => { if (!checked) e.currentTarget.style.background = '#f8fafc' }}
                  onMouseLeave={e => { if (!checked) e.currentTarget.style.background = 'transparent' }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {}}
                    onClick={e => e.stopPropagation()}
                    style={{ accentColor: accent, width: 13, height: 13, flexShrink: 0 }}
                  />
                  {o.label}
                </label>
              )
            })}
          </div>
          <div style={{ borderTop: '1px solid #f1f5f9', marginTop: 4, paddingTop: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={commit}
              style={{
                padding: '4px 12px', borderRadius: 6, border: 'none',
                background: accent, color: '#fff', fontSize: 11, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Lưu
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes imsc-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
