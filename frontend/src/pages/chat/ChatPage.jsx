import { useEffect, useState, useRef } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Spinner from '../../components/ui/Spinner'
import api from '../../api/client'
import useAuthStore from '../../store/authStore'
import Modal from '../../components/ui/Modal'
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
  const [leftTab, setLeftTab] = useState('chat')
  const [showPanel, setShowPanel] = useState(false)
  const [addMemberIds, setAddMemberIds] = useState([])
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

  const channelDisplayName = (ch) => {
    if (ch.channel_type === 'direct') {
      return ch.members?.find(m => m.id !== user?.id)?.display_name ?? ch.name ?? 'Chat'
    }
    return ch.name || ch.members?.map(m => m.display_name).join(', ')
  }

  const createChannel = async () => {
    if (selectedUsers.length < 2) { toast.error('Nhóm cần ít nhất 3 người. Để chat 1-1, dùng tab Danh bạ.'); return }
    if (!channelName.trim()) { toast.error('Vui lòng nhập tên nhóm.'); return }
    try {
      const { data } = await api.post('/api/chat/channels/', {
        channel_type: 'group',
        name: channelName.trim(),
        member_ids: selectedUsers,
      })
      setChannels(prev => [data, ...prev])
      setActiveChannel(data)
      setShowNewChannel(false)
      setSelectedUsers([])
      setChannelName('')
    } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi tạo kênh') }
  }

  const openDirect = async (targetUser) => {
    try {
      const { data } = await api.post('/api/chat/channels/direct/', { user_id: targetUser.id })
      setChannels(prev => prev.find(c => c.id === data.id) ? prev : [data, ...prev])
      setActiveChannel(data)
      setLeftTab('chat')
    } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi mở chat') }
  }

  const reloadChannels = () =>
    api.get('/api/chat/channels/').then(r => setChannels(r.data?.results ?? r.data ?? [])).catch(() => {})

  const handleRemoveMember = async (uid) => {
    try {
      await api.post(`/api/chat/channels/${activeChannel.id}/remove-member/`, { user_id: uid })
      toast.success('Đã xóa thành viên')
      const r = await api.get('/api/chat/channels/')
      const list = r.data?.results ?? r.data ?? []
      setChannels(list)
      setActiveChannel(list.find(c => c.id === activeChannel.id) ?? null)
    } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi xóa thành viên') }
  }

  const handleAddMembers = async () => {
    if (!addMemberIds.length) return
    try {
      await api.post(`/api/chat/channels/${activeChannel.id}/members/`, { user_ids: addMemberIds })
      toast.success('Đã thêm thành viên')
      setAddMemberIds([])
      const r = await api.get('/api/chat/channels/')
      const list = r.data?.results ?? r.data ?? []
      setChannels(list)
      setActiveChannel(list.find(c => c.id === activeChannel.id) ?? null)
    } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi thêm thành viên') }
  }

  const handleLeave = async () => {
    try {
      await api.post(`/api/chat/channels/${activeChannel.id}/leave/`)
      toast.success('Đã rời nhóm')
      setShowPanel(false)
      setActiveChannel(null)
      reloadChannels()
    } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi rời nhóm') }
  }

  const handleDisband = async () => {
    if (!window.confirm('Bạn có chắc muốn giải tán nhóm? Toàn bộ tin nhắn sẽ bị xóa.')) return
    try {
      await api.post(`/api/chat/channels/${activeChannel.id}/disband/`)
      toast.success('Đã giải tán nhóm')
      setShowPanel(false)
      setActiveChannel(null)
      reloadChannels()
    } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi giải tán nhóm') }
  }

  const sortedContacts = users
    .filter(u => u.id !== user?.id)
    .sort((a, b) => (a.display_name ?? a.email).localeCompare(b.display_name ?? b.email))

  return (
    <AppLayout title="Chat nội bộ">
      <div className="flex gap-4 h-[calc(100vh-8rem)]">
        {/* Channel list */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button onClick={() => setLeftTab('chat')}
              className={`flex-1 text-sm py-2 font-medium transition-colors ${
                leftTab === 'chat' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}>Trò chuyện</button>
            <button onClick={() => setLeftTab('contacts')}
              className={`flex-1 text-sm py-2 font-medium transition-colors ${
                leftTab === 'contacts' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}>Danh bạ</button>
          </div>

          {leftTab === 'chat' ? (
            <>
              <button onClick={() => setShowNewChannel(true)}
                className="btn-primary text-sm w-full">+ Tạo nhóm</button>

              <Modal open={showNewChannel} onClose={() => setShowNewChannel(false)} title="Tạo nhóm mới" size="md">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên nhóm</label>
                    <input className="input w-full text-sm" placeholder="Nhập tên nhóm" value={channelName}
                      onChange={e => setChannelName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thành viên</label>
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                      {users.filter(u => u.id !== user?.id).map(u => (
                        <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1.5">
                          <input type="checkbox" className="rounded border-gray-300" checked={selectedUsers.includes(u.id)}
                            onChange={e => setSelectedUsers(prev =>
                              e.target.checked ? [...prev, u.id] : prev.filter(x => x !== u.id))} />
                          <span className="text-sm text-gray-700 truncate">{u.display_name ?? u.email}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {selectedUsers.length > 0 && (
                    <p className="text-sm text-gray-500">Đã chọn {selectedUsers.length} người</p>
                  )}
                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                    <button onClick={() => setShowNewChannel(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">Hủy</button>
                    <button onClick={createChannel} className="btn-primary px-4 py-2 text-sm">Tạo nhóm</button>
                  </div>
                </div>
              </Modal>

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
                        {ch.channel_type === 'direct' ? '👤' : '👥'} {channelDisplayName(ch)}
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
            </>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-1">
              {sortedContacts.map(u => (
                <button key={u.id} onClick={() => openDirect(u)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-gray-100 text-gray-700">
                  <p className="font-medium truncate">👤 {u.display_name ?? u.email}</p>
                  {u.role && <p className="text-xs text-gray-400 truncate">{u.role}</p>}
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
                {activeChannel.channel_type === 'group' ? (
                  <div className="cursor-pointer" onClick={() => { setShowPanel(true); setAddMemberIds([]) }}>
                    <p className="font-semibold text-gray-800 hover:text-primary-600 transition-colors">
                      {channelDisplayName(activeChannel)}
                    </p>
                    <p className="text-xs text-gray-400">{activeChannel.members?.length} thành viên</p>
                  </div>
                ) : (
                  <p className="font-semibold text-gray-800">{channelDisplayName(activeChannel)}</p>
                )}
              </div>

              {activeChannel.channel_type === 'group' && (() => {
                const isOwner = activeChannel.created_by === user?.id
                const memberIds = activeChannel.members?.map(m => m.id) ?? []
                const nonMembers = users.filter(u => !memberIds.includes(u.id))
                return (
                  <Modal open={showPanel} onClose={() => setShowPanel(false)} title="Quản lý nhóm" size="md">
                    <div className="space-y-5">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Thành viên ({activeChannel.members?.length})</p>
                        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                          {activeChannel.members?.map(m => (
                            <div key={m.id} className="flex items-center justify-between px-3 py-2">
                              <div>
                                <span className="text-sm text-gray-800">{m.display_name ?? m.email}</span>
                                {m.id === activeChannel.created_by && (
                                  <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">Trưởng nhóm</span>
                                )}
                              </div>
                              {isOwner && m.id !== user?.id && (
                                <button onClick={() => handleRemoveMember(m.id)}
                                  className="text-xs text-red-500 hover:text-red-700 font-medium">Xóa</button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {isOwner && nonMembers.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Thêm thành viên</p>
                          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                            {nonMembers.map(u => (
                              <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1.5">
                                <input type="checkbox" className="rounded border-gray-300" checked={addMemberIds.includes(u.id)}
                                  onChange={e => setAddMemberIds(prev =>
                                    e.target.checked ? [...prev, u.id] : prev.filter(x => x !== u.id))} />
                                <span className="text-sm text-gray-700 truncate">{u.display_name ?? u.email}</span>
                              </label>
                            ))}
                          </div>
                          {addMemberIds.length > 0 && (
                            <button onClick={handleAddMembers}
                              className="btn-primary text-sm px-4 py-1.5 mt-2">Thêm {addMemberIds.length} người</button>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <button onClick={handleLeave}
                          className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700">Rời nhóm</button>
                        {isOwner && (
                          <button onClick={handleDisband}
                            className="px-4 py-2 text-sm rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 font-medium">Giải tán nhóm</button>
                        )}
                      </div>
                    </div>
                  </Modal>
                )
              })()}

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
    </AppLayout>
  )
}
