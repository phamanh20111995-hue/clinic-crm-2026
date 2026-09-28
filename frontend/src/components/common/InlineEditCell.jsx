import { useState, useRef, useEffect, useCallback } from 'react'

function removeDiacritics(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export default function InlineEditCell({
  value,
  displayValue,
  options = [],
  onSave,
  searchable = true,
  placeholder = 'Tìm...',
  disabled = false,
  accent = '#b45309',
}) {
  const [open, setOpen]           = useState(false)
  const [search, setSearch]       = useState('')
  const [current, setCurrent]     = useState(value)
  const [saving, setSaving]       = useState(false)
  const containerRef              = useRef(null)
  const searchRef                 = useRef(null)

  // sync external value changes
  useEffect(() => { setCurrent(value) }, [value])

  const showSearch = searchable && options.length > 6

  const filtered = options.filter(o =>
    !search || removeDiacritics(o.label).includes(removeDiacritics(search))
  )

  const openDropdown = useCallback((e) => {
    if (disabled || saving) return
    e.stopPropagation()
    setOpen(true)
    setSearch('')
  }, [disabled, saving])

  const closeDropdown = useCallback(() => {
    setOpen(false)
    setSearch('')
  }, [])

  // click-outside + Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') closeDropdown() }
    const onMouse = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) closeDropdown()
    }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, closeDropdown])

  // auto-focus search input
  useEffect(() => {
    if (open && showSearch && searchRef.current) searchRef.current.focus()
  }, [open, showSearch])

  const handleSelect = useCallback(async (newVal) => {
    if (newVal === current) { closeDropdown(); return }
    const previous = current
    closeDropdown()
    setCurrent(newVal)
    setSaving(true)
    try {
      await onSave?.(newVal)
    } catch (err) {
      setCurrent(previous)
      try {
        const { default: toast } = await import('react-hot-toast')
        toast.error(err?.response?.data?.detail ?? 'Lỗi cập nhật')
      } catch {
        console.error('InlineEditCell save error:', err)
      }
    } finally {
      setSaving(false)
    }
  }, [current, onSave, closeDropdown])

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {/* Display value */}
      <span
        onDoubleClick={openDropdown}
        onClick={e => e.stopPropagation()}
        title={disabled ? undefined : 'Kích đúp để sửa'}
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
            animation: 'iec-spin .6s linear infinite',
            flexShrink: 0,
          }} />
        )}
      </span>

      {/* Dropdown */}
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
            minWidth: 180,
            padding: 4,
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
                width: '100%',
                padding: '6px 10px',
                border: '1px solid #dde3ef',
                borderRadius: 6,
                fontSize: 12,
                marginBottom: 4,
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          )}
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '8px 10px', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
                Không tìm thấy
              </div>
            ) : filtered.map(o => {
              const isActive = String(o.value) === String(current)
              return (
                <div
                  key={o.value}
                  onClick={() => handleSelect(o.value)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: isActive ? 600 : 400,
                    background: isActive ? '#fff7ed' : 'transparent',
                    color: isActive ? accent : '#111827',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#fff7ed' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  {o.label}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Spinner keyframe — injected once */}
      <style>{`@keyframes iec-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
