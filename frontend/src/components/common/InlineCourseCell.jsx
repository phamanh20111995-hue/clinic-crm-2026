import { useState, useEffect, useRef, useCallback } from 'react'
import { getCustomerCourses } from '../../api/letan'
import toast from 'react-hot-toast'

function sameSet(a, b) {
  if (a.length !== b.length) return false
  const sa = new Set(a.map(String))
  return b.every(x => sa.has(String(x)))
}

const spinKeyframes = `@keyframes icc-spin{to{transform:rotate(360deg)}}`

export default function InlineCourseCell({
  customerId,
  value = [],
  visitType,
  disabled = false,
  onSave,
  accent = '#b45309',
}) {
  const [open, setOpen]               = useState(false)
  const [draft, setDraft]             = useState([])
  const [courses, setCourses]         = useState([])
  const [loadingCourses, setLoading]  = useState(false)
  const [fetched, setFetched]         = useState(false)
  const [saving, setSaving]           = useState(false)
  const wrapRef                       = useRef(null)

  const isDisabled = disabled || visitType !== 'dieu_tri'

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        setDraft([...value])
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, value])

  // Lazy fetch — once per open
  const openDropdown = useCallback(() => {
    if (isDisabled) return
    setDraft([...value])
    setOpen(true)
    if (fetched) return
    setLoading(true)
    getCustomerCourses(customerId)
      .then(res => {
        const all = res.data?.results ?? res.data ?? []
        setCourses(all.filter(c => Number(c.buoi_con_lai) > 0))
        setFetched(true)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isDisabled, value, fetched, customerId])

  const toggleItem = (id) => {
    setDraft(prev =>
      prev.map(String).includes(String(id))
        ? prev.filter(x => String(x) !== String(id))
        : [...prev, id]
    )
  }

  const commit = async () => {
    if (sameSet(draft, value)) { setOpen(false); return }
    setOpen(false)
    const prev = [...value]
    setSaving(true)
    try {
      await onSave(draft)
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Lỗi lưu gói điều trị')
      try { await onSave(prev) } catch (_) {}
    } finally {
      setSaving(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit() }
    if (e.key === 'Escape') { setOpen(false); setDraft([...value]) }
  }

  // Disabled state
  if (isDisabled) {
    return <span style={{ color: '#94a3b8' }}>—</span>
  }

  const displayText = value.length
    ? `✓ ${value.length} gói`
    : '— chọn gói —'

  const displayColor = value.length ? accent : '#94a3b8'

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }} onKeyDown={onKeyDown}>
      <style>{spinKeyframes}</style>

      {saving ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9ca3af' }}>
          <span style={{ width: 12, height: 12, border: '2px solid #e5e7eb', borderTopColor: accent, borderRadius: '50%', display: 'inline-block', animation: 'icc-spin .7s linear infinite' }} />
          Đang lưu...
        </span>
      ) : (
        <span
          onDoubleClick={openDropdown}
          onClick={e => e.stopPropagation()}
          title="Kích đúp để chọn gói điều trị hôm nay"
          style={{
            display: 'inline-block', fontSize: 12, fontWeight: value.length ? 600 : 400,
            color: displayColor, cursor: 'default', userSelect: 'none',
            borderRadius: 5, padding: '2px 4px',
          }}
        >
          {displayText}
        </span>
      )}

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 999, marginTop: 4,
          background: '#fff', border: '1px solid #dde3ef', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,.13)', minWidth: 260, maxWidth: 340,
          padding: 12,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '0 0 8px' }}>Ghi nhận buổi cho gói:</p>

          {loadingCourses ? (
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Đang tải gói…</p>
          ) : courses.length === 0 ? (
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 12px', fontSize: 11, color: '#92400e' }}>
              ⚠️ Khách không còn gói liệu trình nào còn buổi. Chờ Sale bán thêm.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 220, overflowY: 'auto' }}>
                {courses.map(c => {
                  const checked = draft.map(String).includes(String(c.id))
                  return (
                    <label
                      key={c.id}
                      onClick={() => toggleItem(c.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
                        background: checked ? '#fff7ed' : '#f8fafc',
                        border: `1px solid ${checked ? '#fbbf24' : '#dde3ef'}`,
                        fontSize: 12, userSelect: 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        onClick={e => e.stopPropagation()}
                        style={{ accentColor: accent, width: 14, height: 14, flexShrink: 0 }}
                      />
                      <span style={{ flex: 1, fontWeight: checked ? 600 : 400, color: checked ? accent : '#374151' }}>
                        {c.service_name} — còn {c.buoi_con_lai}/{c.so_buoi} buổi
                      </span>
                    </label>
                  )
                })}
              </div>
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={commit}
                  style={{
                    padding: '6px 16px', borderRadius: 7, border: 'none',
                    background: accent, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Lưu
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
