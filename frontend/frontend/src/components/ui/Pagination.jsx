export default function Pagination({ page, count, pageSize = 20, onChange }) {
  const total = Math.ceil(count / pageSize)
  if (total <= 1) return null

  return (
    <div className="flex items-center justify-between text-sm mt-4">
      <span className="text-gray-500">
        Trang {page} / {total} ({count} kết quả)
      </span>
      <div className="flex gap-2">
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
