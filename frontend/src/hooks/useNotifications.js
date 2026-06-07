import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import { getNotifications, markNotifRead, markAllNotifRead } from '../api/notifications'

const BASE_WS = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8001'

export function useNotifications() {
  const accessToken = useAuthStore(s => s.accessToken)
  const [notifs, setNotifs]   = useState([])
  const [loading, setLoading] = useState(false)
  const wsRef = useRef(null)

  const load = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const r = await getNotifications()
      setNotifs(r.data?.results ?? r.data ?? [])
    } catch {
      // silently ignore — no notification API yet is non-fatal
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  // Initial load + WS connection
  useEffect(() => {
    if (!accessToken) return
    load()

    const ws = new WebSocket(`${BASE_WS}/ws/notifications/?token=${accessToken}`)
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'notification' || data.id) {
          const notif = {
            id:         data.id ?? Date.now(),
            title:      data.title ?? 'Thông báo mới',
            message:    data.message ?? data.body ?? '',
            is_read:    false,
            created_at: data.created_at ?? new Date().toISOString(),
          }
          setNotifs(prev => [notif, ...prev])
          toast(notif.title, {
            icon: '🔔',
            duration: 4000,
            style: { fontSize: 13, maxWidth: 360 },
          })
        }
      } catch {
        // malformed WS frame — ignore
      }
    }
    wsRef.current = ws
    return () => { ws.close(); wsRef.current = null }
  }, [accessToken])  // reconnect if token changes

  const unreadCount = notifs.filter(n => !n.is_read).length

  const handleMarkRead = async (pk) => {
    try {
      await markNotifRead(pk)
    } catch { /* optimistic — ignore server error */ }
    setNotifs(prev => prev.map(n => n.id === pk ? { ...n, is_read: true } : n))
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotifRead()
    } catch { /* optimistic */ }
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  return { notifs, unreadCount, loading, load, markRead: handleMarkRead, markAllRead: handleMarkAllRead }
}
