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
  const [open, setOpen]       = useState(false)
  const [search, setSearch]   = useState('')
  const [current, setCurrent] = useState(value)
  const [draft, setDraft]     = useState(value)
  const [saving, setSaving]   = useState(false)
  const containerRef          = useRef(null)
  const searchRef             = useRef(null)
  const listRef               = useRef(null)

  useEffect(() => { setCurrent(value) }, [value])

  const showSearch = searchable && options.length > 6

  const filtered = options.filter(o =>
    !search || removeDiacritics(o.label).includes(removeDiacritics(search))
  )

  const openDropdown = useCallback((e) => {
    if (disabled || saving) return
    e.stopPropagation()
    setDraft(current)
    setSearch('')
    setOpen(true)
  }, [disabled, saving, current])

  const closeDropdown = useCallback(() => {
    setOpen(false)
    setSearch('')
  }, [])

  const commit = useCallback(async (val) => {
    closeDropdown()
    if (val === current) return
    const previous = current
    setCurrent(val)
    setSaving(true)
    try {
      await onSave?.(val)
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

  // click-outside + keyboard navigation
  useEffect(() => {
    if (!open) return

    const onMouse = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) closeDropdown()
    }

    const onKey = (e) => {
      if (e.key === 'Escape') { closeDropdown(); return }
      if (e.key === 'Enter') {
        e.preventDefault()
        commit(draft)
        return
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        if (filtered.length === 0) return
        const idx = filtered.findIndex(o => String(o.value) === String(draft))
        let next
        if (e.key === 'ArrowDown') next = idx < filtered.length - 1 ? idx + 1 : 0
        else next = idx > 0 ? idx - 1 : filtered.length - 1
        setDraft(filtered[next].value)
        // scroll item into view
        if (listRef.current) {
          const items = listRef.current.querySelectorAll('[data-opt]')
          if (items[next]) items[next].scrollIntoView({ block: 'nearest' })
        }
      }
    }

    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, closeDropdown, commit, draft, filtered])

  useEffect(() => {
    if (open && showSearch && searchRef.current) searchRef.current.focus()
  }, [open, showSearch])

  // when search changes, if draft no longer in filtered list, reset draft to first filtered
  useEffect(() => {
    if (!open) return
    const still = filtered.find(o => String(o.value) === String(draft))
    if (!still && filtered.length > 0) setDraft(filtered[0].value)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
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
          <div ref={listRef} style={{ maxHeight: 240, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '8px 10px', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
                Không tìm thấy
              </div>
            ) : filtered.map(o => {
              const isDraft = String(o.value) === String(draft)
              return (
                <div
                  key={o.value}
                  data-opt
                  onClick={() => setDraft(o.value)}
                  onDoubleClick={() => commit(o.value)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: isDraft ? 600 : 400,
                    background: isDraft ? '#fff7ed' : 'transparent',
                    color: isDraft ? accent : '#111827',
                  }}
                  onMouseEnter={e => { if (!isDraft) e.currentTarget.style.background = '#f8fafc' }}
                  onMouseLeave={e => { if (!isDraft) e.currentTarget.style.background = 'transparent' }}
                >
                  {o.label}
                </div>
              )
            })}
          </div>
          {/* Nút Lưu */}
          <div style={{ borderTop: '1px solid #f1f5f9', marginTop: 4, paddingTop: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => commit(draft)}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                border: 'none',
                background: accent,
                color: '#fff',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Lưu
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes iec-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
