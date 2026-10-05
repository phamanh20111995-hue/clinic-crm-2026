import { useState, useEffect, useRef } from 'react'
import Modal from '../../components/ui/Modal'
import { createCustomer, updateCustomer, checkPhone } from '../../api/customers'
import { getMktUsers, getTeleUsers, getServices, getAllUsers } from '../../api/letan'
import useAuthStore from '../../store/authStore'
import { getUserRole } from '../../utils/rolesV2'
import toast from 'react-hot-toast'

const SOURCES = ['facebook', 'zalo', 'google', 'tiktok', 'referral', 'walkin', 'other']
const DATA_TYPES = [
  { value: 'nong', label: '🔥 Nóng' },
  { value: 'am',   label: '🌤 Ấm' },
  { value: 'thuong', label: '❄ Thường' },
]
const STATUS_CHOICES = [
  { value: 'chua_goi', label: 'Chưa gọi' },
  { value: 'da_goi', label: 'Đã gọi' },
  { value: 'khong_nghe', label: 'Không nghe máy' },
  { value: 'thue_bao', label: 'Thuê bao' },
  { value: 'sai_so', label: 'Sai số' },
  { value: 'tu_choi', label: 'Từ chối' },
  { value: 'hoan_so', label: 'Hoãn số' },
  { value: 'dat_lich', label: 'Đặt lịch' },
  { value: 'hen_goi', label: 'Hẹn gọi lại' },
  { value: 'khong_qt', label: 'Không quan tâm' },
  { value: 'cho_phan_cskh', label: 'Chờ phân CSKH' },
  { value: 'dang_cham_soc', label: 'Đang chăm sóc' },
]

const PROVINCES = ['Hà Nội','TP. Hồ Chí Minh','Hải Phòng','Đà Nẵng','Cần Thơ','Huế','Tuyên Quang','Lào Cai','Thái Nguyên','Phú Thọ','Bắc Ninh','Hưng Yên','Ninh Bình','Quảng Trị','Quảng Ngãi','Gia Lai','Khánh Hòa','Lâm Đồng','Đắk Lắk','Đồng Nai','Tây Ninh','Vĩnh Long','Đồng Tháp','Cà Mau','An Giang','Cao Bằng','Điện Biên','Hà Tĩnh','Lai Châu','Lạng Sơn','Nghệ An','Quảng Ninh','Thanh Hóa','Sơn La']

const CUSTOMER_GROUPS = ['Khách mới','Khách thường','Khách thân thiết','VIP','VVIP','Khách giới thiệu','Khách nội bộ']

const SectionTitle = ({ children }) => (
  <div className="col-span-2">
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide border-t border-gray-100 pt-3">{children}</p>
  </div>
)

export default function CustomerFormModal({ onClose, customer, onSaved }) {
  const isEdit = !!customer
  const currentUser = useAuthStore(s => s.user)
  const myRole = getUserRole(currentUser)
  const canAssignCskh = ['LEAD_CSKH', 'QUAN_LY', 'CHU_DN'].includes(myRole)
  const canAssignTele = ['LEAD_TELE', 'QUAN_LY', 'CHU_DN', 'TRUC_PAGE'].includes(myRole)
  const canAssignSale = ['LEAD_SALE', 'QUAN_LY', 'CHU_DN', 'LE_TAN'].includes(myRole)
  const canAssignAds  = ['LEAD_MKT', 'QUAN_LY', 'CHU_DN', 'TRUC_PAGE'].includes(myRole)
  const isLetan      = myRole === 'LE_TAN'
  const isWalkin     = form => form.source === 'walkin'
  const lockStyle    = { background: '#f8fafc', cursor: 'not-allowed' }

  const [form, setForm] = useState({
    full_name: customer?.full_name ?? '',
    phone: customer?.phone ?? '',
    email: customer?.email ?? '',
    source: customer?.source ?? 'facebook',
    data_type: customer?.data_type ?? 'thuong',
    gender: customer?.gender ?? '',
    dob: customer?.dob ?? '',
    status: customer?.status ?? 'chua_goi',
    customer_group: customer?.customer_group ?? '',
    appointment_date: customer?.next_appt?.date || customer?.appointment_date || '',
    appointment_time: customer?.next_appt?.time || customer?.appointment_time || '',
    province: customer?.province ?? '',
    address: customer?.address ?? '',
    tele: customer?.tele ?? '',
    sale: customer?.sale ?? '',
    cskh: customer?.cskh ?? '',
    ads: customer?.ads ?? '',
    services_interest: customer?.services_interest ?? [],
    notes: customer?.notes ?? '',
  })
  const [phoneChecked, setPhoneChecked] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mktUsers, setMktUsers] = useState([])
  const [teleUsers, setTeleUsers] = useState([])
  const [saleUsers, setSaleUsers] = useState([])
  const [cskhUsers, setCskhUsers] = useState([])
  const [services, setServices] = useState([])
  const [svcOpen, setSvcOpen] = useState(false)
  const svcRef = useRef(null)

  // lễ tân chỉ sửa được info khi tạo mới hoặc khi KH là walk-in
  const canEditInfo = !isLetan || !isEdit || isWalkin(form)

  useEffect(() => {
    getMktUsers().then(res => setMktUsers(res.data?.results ?? res.data ?? [])).catch(() => {})
    getTeleUsers().then(res => setTeleUsers(res.data?.results ?? res.data ?? [])).catch(() => {})
    getServices().then(res => setServices(res.data?.results ?? res.data ?? [])).catch(() => {})
    getAllUsers({ role: 'SALE' }).then(res => setSaleUsers(res.data?.results ?? res.data ?? [])).catch(() => {})
    getAllUsers({ role: 'CSKH' }).then(res => setCskhUsers(res.data?.results ?? res.data ?? [])).catch(() => {})
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!svcOpen) return
    const handler = (e) => {
      if (svcRef.current && !svcRef.current.contains(e.target)) setSvcOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [svcOpen])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handlePhoneBlur = async () => {
    if (isEdit) return
    if (!form.phone || form.phone.length < 9) return
    try {
      const { data } = await checkPhone(form.phone)
      setPhoneChecked(data.exists ? data.customer : null)
      if (data.exists) toast.error(`SĐT đã tồn tại: ${data.customer.full_name}`)
    } catch {}
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isEdit && phoneChecked) { toast.error('SĐT đã tồn tại. Không thể tạo trùng.'); return }
    setLoading(true)
    try {
      const payload = { ...form,
        dob: form.dob || null,
        appointment_date: form.appointment_date || null,
        appointment_time: form.appointment_time || '',
        tele: form.tele || null,
        sale: form.sale || null,
        cskh: form.cskh || null,
        ads: form.ads || null,
        services_interest: form.services_interest,
      }
      let res
      if (isEdit) {
        res = await updateCustomer(customer.id, payload)
        toast.success('Đã cập nhật thông tin')
      } else {
        res = await createCustomer(payload)
        toast.success('Đã thêm khách hàng mới')
      }
      if (onSaved) onSaved(res.data)
      onClose()
    } catch (err) {
      const msg = Object.values(err.response?.data ?? {}).flat().join(' ') || 'Có lỗi xảy ra'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // Tên các dịch vụ đã chọn để hiển thị trên nút
  const selectedSvcLabel = form.services_interest.length > 0
    ? services.filter(s => form.services_interest.includes(Number(s.id))).map(s => s.name).join(', ')
    : '— Chọn dịch vụ —'

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Sửa thông tin khách hàng' : 'Thêm khách hàng mới'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">

          {/* ── NHÓM 1: THÔNG TIN CÁ NHÂN ── */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
            <input required className="input" value={form.full_name}
              disabled={!canEditInfo} style={!canEditInfo ? lockStyle : undefined}
              onChange={(e) => set('full_name', e.target.value)} placeholder="Nguyễn Văn A" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
            <input required className={`input ${!isEdit && phoneChecked ? 'border-red-400' : ''}`}
              value={form.phone} onChange={(e) => set('phone', e.target.value)}
              disabled={!canEditInfo} style={!canEditInfo ? lockStyle : undefined}
              onBlur={handlePhoneBlur} placeholder="0912345678" />
            {!isEdit && phoneChecked && (
              <p className="text-xs text-red-500 mt-1">⚠️ Trùng: {phoneChecked.full_name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="input" value={form.email}
              disabled={!canEditInfo} style={!canEditInfo ? lockStyle : undefined}
              onChange={(e) => set('email', e.target.value)} placeholder="email@gmail.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
            <select className="input" value={form.gender}
              disabled={!canEditInfo} style={!canEditInfo ? lockStyle : undefined}
              onChange={(e) => set('gender', e.target.value)}>
              <option value="">-- Chọn --</option>
              <option value="M">Nam</option>
              <option value="F">Nữ</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
            <input type="date" className="input" value={form.dob}
              disabled={!canEditInfo} style={!canEditInfo ? lockStyle : undefined}
              onChange={(e) => set('dob', e.target.value)} />
          </div>

          {/* ── NHÓM 2: NGUỒN & PHÂN LOẠI ── */}
          <SectionTitle>Nguồn & phân loại</SectionTitle>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nguồn</label>
            <select className="input" value={form.source}
              disabled={!canEditInfo} style={!canEditInfo ? lockStyle : undefined}
              onChange={(e) => set('source', e.target.value)}>
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại data</label>
            <select className="input" value={form.data_type}
              disabled={!canEditInfo} style={!canEditInfo ? lockStyle : undefined}
              onChange={(e) => set('data_type', e.target.value)}>
              {DATA_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select className="input" value={form.status}
              disabled={!canEditInfo} style={!canEditInfo ? lockStyle : undefined}
              onChange={(e) => set('status', e.target.value)}>
              {STATUS_CHOICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nhóm khách</label>
            <select className="input" value={form.customer_group}
              disabled={!canEditInfo} style={!canEditInfo ? lockStyle : undefined}
              onChange={(e) => set('customer_group', e.target.value)}>
              <option value="">— Chọn nhóm —</option>
              {CUSTOMER_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* ── NHÓM 3: LỊCH HẸN & ĐỊA CHỈ ── */}
          <SectionTitle>Lịch hẹn & địa chỉ</SectionTitle>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hẹn</label>
            <input type="date" className="input" value={form.appointment_date}
              disabled={!canEditInfo} style={!canEditInfo ? lockStyle : undefined}
              onChange={(e) => set('appointment_date', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giờ hẹn</label>
            <input type="time" className="input" value={form.appointment_time}
              disabled={!canEditInfo} style={!canEditInfo ? lockStyle : undefined}
              onChange={(e) => set('appointment_time', e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/TP</label>
            <select className="input" value={form.province}
              disabled={!canEditInfo} style={!canEditInfo ? lockStyle : undefined}
              onChange={(e) => set('province', e.target.value)}>
              <option value="">— Chọn tỉnh/TP —</option>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ chi tiết</label>
            <input className="input" value={form.address}
              disabled={!canEditInfo} style={!canEditInfo ? lockStyle : undefined}
              onChange={(e) => set('address', e.target.value)} placeholder="Số nhà, đường, phường, quận (dán từ tin nhắn khách)" />
          </div>

          {/* ── NHÓM 4: PHÂN CÔNG ── */}
          <SectionTitle>Phân công</SectionTitle>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tele phụ trách</label>
            <select className="input" value={form.tele} disabled={!canAssignTele} style={!canAssignTele ? lockStyle : undefined} onChange={(e) => set('tele', e.target.value)}>
              <option value="">— Chưa giao —</option>
              {teleUsers.map((u) => <option key={u.id} value={u.id}>{u.display_name ?? u.full_name ?? u.email}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sale phụ trách</label>
            <select className="input" value={form.sale} disabled={!canAssignSale} style={!canAssignSale ? lockStyle : undefined} onChange={(e) => set('sale', e.target.value)}>
              <option value="">— Chưa giao —</option>
              {saleUsers.map((u) => <option key={u.id} value={u.id}>{u.display_name ?? u.full_name ?? u.email}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CSKH phụ trách</label>
            <select className="input" value={form.cskh} disabled={!canAssignCskh} style={!canAssignCskh ? lockStyle : undefined} onChange={(e) => set('cskh', e.target.value)}>
              <option value="">— Chưa giao —</option>
              {cskhUsers.map((u) => <option key={u.id} value={u.id}>{u.display_name ?? u.full_name ?? u.email}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ads phụ trách</label>
            <select className="input" value={form.ads} disabled={!canAssignAds} style={!canAssignAds ? lockStyle : undefined} onChange={(e) => set('ads', e.target.value)}>
              <option value="">— Chưa giao —</option>
              {mktUsers.map((u) => <option key={u.id} value={u.id}>{u.display_name ?? u.full_name ?? u.email}</option>)}
            </select>
          </div>

          {/* ── NHÓM 5: DỊCH VỤ ── */}
          <SectionTitle>Dịch vụ</SectionTitle>

          <div className="col-span-2" ref={svcRef} style={{ position: 'relative' }}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dịch vụ quan tâm</label>
            {/* Trigger button */}
            <div
              onClick={() => { if (canEditInfo) setSvcOpen(v => !v) }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                border: '1px solid #dde3ef', borderRadius: 7, padding: '8px 10px',
                fontSize: 13, cursor: canEditInfo ? 'pointer' : 'not-allowed',
                background: canEditInfo ? '#fff' : '#f8fafc',
                color: form.services_interest.length > 0 ? '#111827' : '#9ca3af',
                userSelect: 'none',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {selectedSvcLabel}
              </span>
              <span style={{ marginLeft: 8, fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>▾</span>
            </div>

            {/* Dropdown panel */}
            {svcOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: '#fff', border: '1px solid #dde3ef', borderRadius: 7,
                boxShadow: '0 8px 24px rgba(0,0,0,.12)', marginTop: 4,
                maxHeight: 200, overflowY: 'auto',
              }}>
                {services.map((s) => {
                  const checked = form.services_interest.includes(Number(s.id))
                  return (
                    <label
                      key={s.id}
                      onClick={() => set('services_interest',
                        checked
                          ? form.services_interest.filter(x => x !== Number(s.id))
                          : [...form.services_interest, Number(s.id)]
                      )}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                        background: checked ? '#eff6ff' : 'transparent',
                        borderBottom: '1px solid #f8fafc',
                        userSelect: 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        onClick={e => e.stopPropagation()}
                        style={{ accentColor: '#1e40af', width: 14, height: 14, flexShrink: 0 }}
                      />
                      <span style={{ fontWeight: checked ? 600 : 400, color: checked ? '#1e40af' : '#374151' }}>
                        {s.name}
                      </span>
                    </label>
                  )
                })}
                <div style={{ padding: '8px 12px', borderTop: '1px solid #f1f5f9', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => setSvcOpen(false)}
                    style={{ padding: '4px 14px', borderRadius: 6, border: 'none', background: '#1e40af', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Xong
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={loading || (!isEdit && !!phoneChecked) || !canEditInfo} className="btn-primary">
            {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : '+ Thêm KH'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
        </div>
      </form>
    </Modal>
  )
}
