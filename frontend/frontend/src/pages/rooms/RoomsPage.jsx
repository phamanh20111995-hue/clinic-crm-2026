import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import api from '../../api/client'
import { fmtTime } from '../../utils/format'

const ROOM_TYPE_COLORS = {
  treatment: 'blue', consultation: 'green', reception: 'yellow', other: 'gray',
}
const ROOM_TYPE_LABELS = {
  treatment: '🛏 Điều trị', consultation: '💬 Tư vấn', reception: '🏢 Lễ tân', other: '📦 Khác',
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    const params = {}
    if (typeFilter) params.room_type = typeFilter
    api.get('/api/rooms/', { params })
      .then(r => setRooms(r.data?.results ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [typeFilter])

  return (
    <DashboardLayout title="Sơ đồ phòng">
      <div className="space-y-4">
        {/* Filter */}
        <div className="flex gap-2">
          {[['', 'Tất cả'], ...Object.entries(ROOM_TYPE_LABELS)].map(([v, l]) => (
            <button key={v} onClick={() => setTypeFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                typeFilter === v
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
              }`}>
              {l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rooms.map(room => {
              const appt = room.current_appointment
              const occupied = !!appt
              return (
                <div key={room.id}
                  className={`card border-2 transition-all ${
                    occupied ? 'border-blue-300 bg-blue-50/40' : 'border-gray-100 hover:border-gray-200'
                  }`}>
                  {/* Room header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{room.name}</h3>
                      <Badge variant={ROOM_TYPE_COLORS[room.room_type] ?? 'gray'} className="mt-1">
                        {ROOM_TYPE_LABELS[room.room_type] ?? room.room_type}
                      </Badge>
                    </div>
                    <div className={`w-3 h-3 rounded-full mt-1 ${occupied ? 'bg-blue-500 animate-pulse' : 'bg-green-400'}`} />
                  </div>

                  {/* Status */}
                  {occupied ? (
                    <div className="bg-white rounded-lg p-3 border border-blue-100 text-sm space-y-1">
                      <p className="font-medium text-gray-900 truncate">{appt.customer_name}</p>
                      <p className="text-gray-500 text-xs truncate">{appt.services?.join(', ') ?? '—'}</p>
                      <p className="text-xs text-blue-600 font-medium">
                        Vào: {fmtTime(appt.scheduled_at)}
                      </p>
                      {appt.doctor_name && <p className="text-xs text-gray-400">BS: {appt.doctor_name}</p>}
                      {appt.ktv_name && <p className="text-xs text-gray-400">KTV: {appt.ktv_name}</p>}
                    </div>
                  ) : (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100 text-center">
                      <p className="text-sm text-green-700 font-medium">🟢 Phòng trống</p>
                      {room.capacity > 1 && (
                        <p className="text-xs text-green-500 mt-0.5">Sức chứa: {room.capacity}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
