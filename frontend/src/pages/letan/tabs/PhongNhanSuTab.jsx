import { useState, useEffect, useCallback } from 'react'
import { getRooms, getUsers, getTodayAppointments } from '../../../api/letan'
import DoctorCard from '../components/DoctorCard'

function todayStr() {
  const d = new Date()
  const y  = d.getFullYear()
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export default function PhongNhanSuTab() {
  const [staff, setStaff] = useState([])
  const [rooms, setRooms] = useState([])
  const [appts, setAppts] = useState([])

  const load = useCallback(async () => {
    try {
      const [userRes, roomRes, apptRes] = await Promise.all([
        getUsers(),
        getRooms(),
        getTodayAppointments({ date: todayStr() }),
      ])
      setStaff(userRes.data?.results ?? userRes.data ?? [])
      setRooms(roomRes.data?.results ?? roomRes.data ?? [])
      setAppts(apptRes.data?.results ?? apptRes.data ?? [])
    } catch {}
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [load])

  const enrichedStaff = staff.map(u => {
    const currentAppt = appts.find(a => a.status === 'in_progress' && (a.doctor === u.id || a.ktv === u.id))
    return { ...u, current_appointment: currentAppt ?? null }
  })
  const freeStaff = enrichedStaff.filter(u => !u.current_appointment)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      {/* BS / KTV */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>BS / KTV realtime</span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{freeStaff.length} trống</span>
        </div>
        <div style={{ padding: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {enrichedStaff.slice(0, 20).map(u => (
            <DoctorCard key={u.id} person={u} />
          ))}
          {enrichedStaff.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#9ca3af', padding: '16px 0', fontSize: 12 }}>
              Chưa có dữ liệu nhân viên
            </div>
          )}
        </div>
      </div>

      {/* Trạng thái phòng */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Trạng thái phòng</span>
        </div>
        <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rooms.map(r => {
            const occupying = appts.find(a =>
              (a.status === 'in_progress' || a.status === 'consulting') && String(a.room) === String(r.id)
            )
            return (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '7px 10px', borderRadius: 8,
                background: occupying ? '#fef2f2' : '#f0fdf4',
                border: `1px solid ${occupying ? '#fecaca' : '#a7f3d0'}`,
                fontSize: 12,
              }}>
                <span style={{ fontWeight: 600, color: occupying ? '#dc2626' : '#166534' }}>
                  {r.name}
                </span>
                <span style={{ color: occupying ? '#dc2626' : '#166534', fontSize: 11 }}>
                  {occupying ? `🔴 ${occupying.customer_name?.split(' ').pop()}` : '🟢 Trống'}
                </span>
              </div>
            )
          })}
          {rooms.length === 0 && (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '12px 0', fontSize: 12 }}>Chưa có phòng</div>
          )}
        </div>
      </div>
    </div>
  )
}
