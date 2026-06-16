export default function Pagination({ page, count, pageSize = 20, onChange, onPageSizeChange, pageSizeOptions = [20, 50, 100, 200, 500, 1000], showPageSize = false }) {
  const total = Math.ceil(count / pageSize)

  if (!showPageSize && total <= 1) return null

  return (
    <div className="flex items-center justify-between text-sm mt-4">
      <span className="text-gray-500">
        Trang {page} / {total} ({count} kết quả)
      </span>
      <div className="flex items-center gap-2">
        {showPageSize && onPageSizeChange && (
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            className="btn-secondary text-xs px-2 py-1"
          >
            {pageSizeOptions.map(opt => (
              <option key={opt} value={opt}>Hiển thị {opt}/trang</option>
            ))}
          </select>
        )}
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="btn-secondary text-xs px-3 py-1 disabled:opacity-40"
        >← Trước</button>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= total}
          className="btn-secondary text-xs px-3 py-1 disabled:opacity-40"
        >Tiếp →</button>
      </div>
    </div>
  )
}
