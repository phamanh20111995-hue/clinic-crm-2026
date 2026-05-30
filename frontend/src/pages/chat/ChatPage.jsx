import { useEffect, useState, useRef } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Spinner from '../../components/ui/Spinner'
import api from '../../api/client'
import useAuthStore from '../../store/authStore'
import { fmtDateTime } from '../../utils/format'
import toast from 'react-hot-toast'

export default function ChatPage() {
  const { user, accessToken } = useAuthStore()
  const [channels, setChannels] = useState([])
  const [activeChannel, setActiveChannel] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)
  const [showNewChannel, setShowNewChannel] = useState(false)
  const [users, setUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [channelName, setChannelName] = useState('')
  const wsRef = useRef(null)
  const bottomRef = useRef(null)
  const BASE_WS = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8001'

  useEffect(() => {
    api.get('/api/chat/channels/')
      .then(r => setChannels(r.data?.results ?? r.data ?? []))
      .finally(() => setLoading(false))
    api.get('/api/auth/users/').then(r => setUsers(r.data?.results ?? r.data ?? [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!activeChannel) return
    setMsgLoading(true)
    api.get(`/api/chat/channels/${activeChannel.id}/messages/`)
      .then(r => setMessages(r.data?.results ?? r.data ?? []))
      .finally(() => setMsgLoading(false))

    // WebSocket
    if (wsRef.current) wsRef.current.close()
    const ws = new WebSocket(`${BASE_WS}/ws/chat/${activeChannel.id}/?token=${accessToken}`)
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'message') {
        setMessages(prev => [...prev, {
          id: data.message_id, sender: data.sender_id, sender_name: data.sender_name,
          content: data.content, created_at: data.created_at,
        }])
      }
    }
    wsRef.current = ws
    return () => ws.close()
  }, [activeChannel?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'message', content: text.trim() }))
      setText('')
    } else {
      // Fallback to REST
      api.post(`/api/chat/channels/${activeChannel.id}/messages/`, { content: text.trim() })
        .then(r => setMessages(prev => [...prev, r.data]))
        .catch(() => toast.error('Không gửi được tin nhắn'))
      setText('')
    }
  }

  const createChannel = async () => {
    if (!selectedUsers.length) { toast.error('Chọn ít nhất 1 thành viên'); return }
    try {
      const { data } = await api.post('/api/chat/channels/', {
        channel_type: selectedUsers.length === 1 ? 'direct' : 'group',
        name: channelName || selectedUsers.map(id => users.find(u => u.id === id)?.display_name ?? id).join(', '),
        member_ids: selectedUsers,
      })
      setChannels(prev => [data, ...prev])
      setActiveChannel(data)
      setShowNewChannel(false)
      setSelectedUsers([])
      setChannelName('')
    } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi tạo kênh') }
  }

  return (
    <DashboardLayout title="Chat nội bộ">
      <div className="flex gap-4 h-[calc(100vh-8rem)]">
        {/* Channel list */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-2">
          <button onClick={() => setShowNewChannel(!showNewChannel)}
            className="btn-primary text-sm w-full">+ Kênh mới</button>

          {showNewChannel && (
            <div className="card p-3 space-y-2 text-sm">
              <input className="input text-sm" placeholder="Tên kênh (tuỳ chọn)" value={channelName}
                onChange={e => setChannelName(e.target.value)} />
              <div className="max-h-36 overflow-y-auto space-y-1">
                {users.filter(u => u.id !== user?.id).map(u => (
                  <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded p-1">
                    <input type="checkbox" checked={selectedUsers.includes(u.id)}
                      onChange={e => setSelectedUsers(prev =>
                        e.target.checked ? [...prev, u.id] : prev.filter(x => x !== u.id))} />
                    <span className="truncate">{u.display_name ?? u.email}</span>
                  </label>
                ))}
              </div>
              <button onClick={createChannel} className="btn-primary w-full text-sm py-1.5">Tạo</button>
            </div>
          )}

          {loading ? <Spinner /> : (
            <div className="flex-1 overflow-y-auto space-y-1">
              {channels.map(ch => (
                <button key={ch.id} onClick={() => setActiveChannel(ch)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeChannel?.id === ch.id
                      ? 'bg-primary-600 text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}>
                  <p className="font-medium truncate">
                    {ch.channel_type === 'direct' ? '👤' : '👥'} {ch.name || ch.members.map(m => m.display_name).join(', ')}
                  </p>
                  {ch.last_message && (
                    <p className={`text-xs truncate mt-0.5 ${activeChannel?.id === ch.id ? 'text-blue-100' : 'text-gray-400'}`}>
                      {ch.last_message.content}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col card p-0 overflow-hidden">
          {!activeChannel ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-4xl mb-2">💬</p>
                <p className="text-sm">Chọn kênh chat để bắt đầu</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                <p className="font-semibold text-gray-800">
                  {activeChannel.name || activeChannel.members?.map(m => m.display_name).join(', ')}
                </p>
                <p className="text-xs text-gray-400">{activeChannel.members?.length} thành viên</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgLoading ? (
                  <div className="flex justify-center py-8"><Spinner /></div>
                ) : messages.map(msg => {
                  const isMe = msg.sender === user?.id || msg.sender_id === user?.id
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        {!isMe && (
                          <span className="text-xs text-gray-400 mb-1 px-1">{msg.sender_name}</span>
                        )}
                        <div className={`px-4 py-2 rounded-2xl text-sm ${
                          isMe
                            ? 'bg-primary-600 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-xs text-gray-300 mt-1 px-1">
                          {fmtDateTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="px-4 py-3 border-t border-gray-100 flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Nhập tin nhắn..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                />
                <button type="submit" disabled={!text.trim()} className="btn-primary px-4">Gửi →</button>
              </form>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
