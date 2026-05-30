import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import LogCallModal from './LogCallModal'
import { getTeleQueue } from '../../api/calls'
import { fmtPhone, fmtDate } from '../../utils/format'

const DATA_TYPE = {
  nong:   { label: '🔥 Nóng', color: 'red' },
  am:     { label: '🌤 Âm',   color: 'yellow' },
  thuong: { label: '❄ Thường',color: 'gray' },
}

const STATUS_LABELS = {
  moi: 'Mới', dang_tu_van: 'Đang tư vấn', da_tu_van: 'Đã tư vấn',
  khong_lien_lac: 'Không liên lạc',
}

export default function TeleQueuePage() {
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [calling, setCalling] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getTeleQueue()
      setQueue(Array.isArray(data) ? data : data.results ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const groups = {
    nong:   queue.filter((c) => c.data_type === 'nong'),
    am:     queue.filter((c) => c.data_type === 'am'),
    thuong: queue.filter((c) => c.data_type === 'thuong'),
  }

  return (
    <DashboardLayout title="Hàng chờ Tele">
      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(DATA_TYPE).map(([key, d]) => (
            <div key={key} className="card text-center py-4">
              <p className="text-2xl font-bold text-gray-900">{groups[key].length}</p>
              <Badge variant={d.color} className="mt-1">{d.label}</Badge>
            </div>
          ))}
        </div>

        {/* Queue list */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : queue.length === 0 ? (
          <EmptyState icon="📭" title="Hàng chờ trống" description="Không có KH nào trong hàng chờ" />
        ) : (
          Object.entries(groups).map(([key, items]) =>
            items.length === 0 ? null : (
              <div key={key} className="card p-0">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                  <h3 className="font-semibold text-gray-700">
                    {DATA_TYPE[key].label} — {items.length} khách
                  </h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-blue-50/40 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <p className="font-medium text-gray-900 truncate">{c.full_name}</p>
                          <span className="text-xs text-gray-400 font-mono">{fmtPhone(c.phone)}</span>
                          {c.call_count > 0 && (
                            <span className="text-xs text-gray-400">📞 Lần {c.call_count}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{c.source}</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-gray-400">
                            {STATUS_LABELS[c.status] ?? c.status}
                          </span>
                          {c.notes && (
                            <>
                              <span className="text-gray-300">·</span>
                              <span className="text-xs text-gray-500 truncate max-w-xs">{c.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        <span className="text-xs text-gray-400">{fmtDate(c.created_at)}</span>
                        <button
                          onClick={() => setCalling(c)}
                          className="btn-primary text-xs px-3 py-1.5"
                        >📞 Gọi</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )
        )}
      </div>

      {calling && (
        <LogCallModal
          customer={calling}
          onClose={() => { setCalling(null); load() }}
        />
      )}
    </DashboardLayout>
  )
}
