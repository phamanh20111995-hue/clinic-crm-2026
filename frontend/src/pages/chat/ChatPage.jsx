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
  const [showArchive, setShowArchive] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const [editingMsg, setEditingMsg] = useState(null)
  const [editText, setEditText] = useState('')
  const [menuMsgId, setMenuMsgId] = useState(null)
  const wsRef = useRef(null)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const BASE_WS = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8001'

  useEffect(() => {
    api.get('/api/chat/channels/')
      .then(r => setChannels(r.data?.results ?? r.data ?? []))
      .finally(() => setLoading(false))
    api.get('/api/chat/contacts/').then(r => setUsers(r.data?.results ?? r.data ?? [])).catch(() => {})
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

  const sendFile = async (file) => {
    if (!file || !activeChannel) return
    const fd = new FormData()
    fd.append('file', file)
    const mtype = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file'
    fd.append('message_type', mtype)
    fd.append('content', '')
    try {
      const r = await api.post(`/api/chat/channels/${activeChannel.id}/messages/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setMessages(prev => [...prev, r.data])
    } catch { toast.error('Không gửi được file') }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) sendFile(file)
    e.target.value = ''
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

  const refreshActiveChannel = async () => {
    const r = await api.get('/api/chat/channels/')
    const list = r.data?.results ?? r.data ?? []
    setChannels(list)
    setActiveChannel(list.find(c => c.id === activeChannel.id) ?? null)
  }

  const handlePromote = async (uid) => {
    try {
      await api.post(`/api/chat/channels/${activeChannel.id}/promote-admin/`, { user_id: uid })
      toast.success('Đã bổ nhiệm phó nhóm')
      await refreshActiveChannel()
    } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi bổ nhiệm') }
  }

  const handleDemote = async (uid) => {
    try {
      await api.post(`/api/chat/channels/${activeChannel.id}/demote-admin/`, { user_id: uid })
      toast.success('Đã gỡ phó nhóm')
      await refreshActiveChannel()
    } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi gỡ phó') }
  }

  const handleTransfer = async (uid) => {
    if (!window.confirm('Chuyển quyền trưởng nhóm cho người này?')) return
    try {
      await api.post(`/api/chat/channels/${activeChannel.id}/transfer-owner/`, { user_id: uid })
      toast.success('Đã chuyển quyền trưởng nhóm')
      await refreshActiveChannel()
    } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi chuyển quyền') }
  }

  const handleEditMessage = async (msgId) => {
    if (!editText.trim()) return
    try {
      const { data } = await api.patch(`/api/chat/messages/${msgId}/edit/`, { content: editText.trim() })
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: data.content, is_edited: true } : m))
      setEditingMsg(null)
      setEditText('')
    } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi sửa tin nhắn') }
  }

  const handleRecallMessage = async (msgId) => {
    if (!window.confirm('Thu hồi tin nhắn này?')) return
    try {
      await api.post(`/api/chat/messages/${msgId}/recall/`)
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_recalled: true } : m))
      setMenuMsgId(null)
    } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi thu hồi tin nhắn') }
  }

  const isWithinOneHour = (createdAt) => createdAt && (Date.now() - new Date(createdAt).getTime()) <= 60 * 60 * 1000

  const URL_RE = /(https?:\/\/[^\s<>"']+)/g

  const renderTextWithLinks = (content, isMe) => {
    const parts = content.split(URL_RE)
    if (parts.length === 1) return content
    return parts.map((part, i) =>
      URL_RE.test(part) ? (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer"
          className={`underline decoration-1 ${isMe ? 'text-blue-200 hover:text-white' : 'text-primary-600 hover:text-primary-800'}`}>{part}</a>
      ) : part
    )
  }

  const extractUrls = (content) => (content ?? '').match(URL_RE) ?? []

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
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl flex items-center justify-between">
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
                <button onClick={() => setShowArchive(true)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:bg-gray-100">
                  Kho lưu trữ
                </button>
              </div>

              <Modal open={showArchive} onClose={() => setShowArchive(false)} title="Kho lưu trữ" size="lg">
                {(() => {
                  const media = messages.filter(m => ['image', 'video'].includes(m.message_type) && m.file_url)
                  const files = messages.filter(m => m.message_type === 'file' && m.file_url)
                  const linkMessages = messages.filter(m => (!m.message_type || m.message_type === 'text') && extractUrls(m.content).length > 0)
                  return (
                    <div className="space-y-5">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Media ({media.length})</p>
                        {media.length === 0 ? (
                          <p className="text-xs text-gray-400">Chưa có ảnh/video nào.</p>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {media.map(m => (
                              <div key={m.id} className="relative cursor-pointer group"
                                onClick={() => setLightbox({ type: m.message_type, url: m.file_url })}>
                                {m.message_type === 'video' ? (
                                  <div className="w-full h-24 bg-black rounded-lg flex items-center justify-center">
                                    <span className="text-white text-2xl">▶</span>
                                  </div>
                                ) : (
                                  <img src={m.file_url} alt="" className="w-full h-24 object-cover rounded-lg group-hover:opacity-80 transition-opacity" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">File ({files.length})</p>
                        {files.length === 0 ? (
                          <p className="text-xs text-gray-400">Chưa có file nào.</p>
                        ) : (
                          <div className="space-y-1">
                            {files.map(m => (
                              <a key={m.id} href={m.file_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-primary-600">
                                <span>📎</span>
                                <span className="truncate">{m.file_url.split('/').pop()}</span>
                                <span className="text-xs text-gray-400 ml-auto shrink-0">{fmtDateTime(m.created_at)}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Link ({linkMessages.length})</p>
                        {linkMessages.length === 0 ? (
                          <p className="text-xs text-gray-400">Chưa có link nào.</p>
                        ) : (
                          <div className="space-y-1">
                            {linkMessages.map(m => extractUrls(m.content).map((url, i) => (
                              <a key={`${m.id}-${i}`} href={url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-primary-600">
                                <span>🔗</span>
                                <span className="truncate">{url}</span>
                                <span className="text-xs text-gray-400 ml-auto shrink-0">{m.sender_name} · {fmtDateTime(m.created_at)}</span>
                              </a>
                            )))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </Modal>

              {activeChannel.channel_type === 'group' && (() => {
                const isOwner = activeChannel.created_by === user?.id
                const adminIds = activeChannel.admins ?? []
                const isAdminId = (id) => adminIds.includes(id)
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
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-sm text-gray-800 truncate">{m.display_name ?? m.email}</span>
                                {m.id === activeChannel.created_by && (
                                  <span className="shrink-0 text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">Trưởng nhóm</span>
                                )}
                                {m.id !== activeChannel.created_by && isAdminId(m.id) && (
                                  <span className="shrink-0 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Phó nhóm</span>
                                )}
                              </div>
                              {isOwner && m.id !== user?.id && m.id !== activeChannel.created_by && (
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                  {isAdminId(m.id) ? (
                                    <button onClick={() => handleDemote(m.id)}
                                      className="text-xs text-amber-600 hover:text-amber-800 font-medium">Gỡ phó</button>
                                  ) : (
                                    <button onClick={() => handlePromote(m.id)}
                                      className="text-xs text-primary-600 hover:text-primary-800 font-medium">Bổ nhiệm phó</button>
                                  )}
                                  <button onClick={() => handleTransfer(m.id)}
                                    className="text-xs text-gray-500 hover:text-gray-700 font-medium">Chuyển quyền</button>
                                  <button onClick={() => handleRemoveMember(m.id)}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium">Xóa</button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {(isOwner || isAdminId(user?.id)) && nonMembers.length > 0 && (
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
                      <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        {!isMe && (
                          <span className="text-xs text-gray-400 mb-1 px-1">{msg.sender_name}</span>
                        )}
                        {msg.is_recalled ? (
                          <div className="px-4 py-2 rounded-2xl text-sm bg-gray-200 text-gray-400 italic rounded-br-sm break-words overflow-hidden" style={{ overflowWrap: 'anywhere' }}>
                            Tin nhắn đã thu hồi
                          </div>
                        ) : editingMsg === msg.id ? (
                          <div className="flex flex-col gap-1.5">
                            <input className="input text-sm" value={editText}
                              onChange={e => setEditText(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleEditMessage(msg.id)} autoFocus />
                            <div className="flex gap-1.5 justify-end">
                              <button onClick={() => { setEditingMsg(null); setEditText('') }}
                                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-200">Hủy</button>
                              <button onClick={() => handleEditMessage(msg.id)}
                                className="text-xs text-white bg-primary-600 hover:bg-primary-700 px-2 py-1 rounded">Lưu</button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <div className={`px-4 py-2 rounded-2xl text-sm break-words overflow-hidden ${
                              isMe
                                ? 'bg-primary-600 text-white rounded-br-sm'
                                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                            }`} style={{ overflowWrap: 'anywhere' }}>
                              {msg.message_type === 'image' && msg.file_url ? (
                                <img src={msg.file_url} alt="" className="max-w-[240px] rounded-lg cursor-pointer"
                                  onClick={() => setLightbox({ type: 'image', url: msg.file_url })} />
                              ) : msg.message_type === 'video' && msg.file_url ? (
                                <video src={msg.file_url} controls className="max-w-[280px] rounded-lg"
                                  onClick={(e) => { e.preventDefault(); setLightbox({ type: 'video', url: msg.file_url }) }} />
                              ) : msg.message_type === 'file' && msg.file_url ? (
                                <a href={msg.file_url} target="_blank" rel="noopener noreferrer"
                                  className={`flex items-center gap-2 ${isMe ? 'text-white underline' : 'text-primary-600 underline'}`}>
                                  <span>📎</span>
                                  <span className="truncate max-w-[200px]">{msg.file_url.split('/').pop()}</span>
                                </a>
                              ) : (
                                renderTextWithLinks(msg.content || '', isMe)
                              )}
                            </div>
                            {isMe && isWithinOneHour(msg.created_at) && (
                              <div className="absolute top-0 right-full mr-1 hidden group-hover:flex items-center">
                                <button onClick={() => setMenuMsgId(menuMsgId === msg.id ? null : msg.id)}
                                  className="text-gray-400 hover:text-gray-600 text-xs px-1 py-0.5 rounded hover:bg-gray-100">···</button>
                                {menuMsgId === msg.id && (
                                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 whitespace-nowrap">
                                    {(!msg.message_type || msg.message_type === 'text') && (
                                      <button onClick={() => { setEditingMsg(msg.id); setEditText(msg.content || ''); setMenuMsgId(null) }}
                                        className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">Sửa</button>
                                    )}
                                    <button onClick={() => handleRecallMessage(msg.id)}
                                      className="block w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-gray-50">Thu hồi</button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        <span className="text-xs text-gray-300 mt-1 px-1">
                          {fmtDateTime(msg.created_at)}
                          {msg.is_edited && !msg.is_recalled && <span className="text-gray-400 ml-1">(đã chỉnh sửa)</span>}
                        </span>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="px-4 py-3 border-t border-gray-100 flex gap-2">
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="px-2 text-gray-400 hover:text-gray-600 text-lg" title="Đính kèm file">📎</button>
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
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightbox(null)}
          onKeyDown={(e) => e.key === 'Escape' && setLightbox(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="absolute -top-10 right-0 flex gap-3">
              <a href={lightbox.url} download className="text-white hover:text-gray-300 text-sm">⬇ Tải về</a>
              <button onClick={() => setLightbox(null)} className="text-white hover:text-gray-300 text-2xl leading-none">&times;</button>
            </div>
            {lightbox.type === 'video' ? (
              <video src={lightbox.url} controls autoPlay className="max-w-[90vw] max-h-[85vh] rounded-lg" />
            ) : (
              <img src={lightbox.url} alt="" className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg" />
            )}
          </div>
        </div>
      )}
    </AppLayout>
  )
}
