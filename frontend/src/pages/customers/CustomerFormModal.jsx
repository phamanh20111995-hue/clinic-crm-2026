import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import { createCustomer, updateCustomer, checkPhone } from '../../api/customers'
import { getMktUsers, getTeleUsers, getServices, getAllUsers } from '../../api/letan'
import useAuthStore from '../../store/authStore'
import { getUserRole } from '../../utils/rolesV2'
import toast from 'react-hot-toast'

const SOURCES = ['facebook', 'zalo', 'google', 'tiktok', 'referral', 'walkin', 'other']
const DATA_TYPES = [
  { value: 'nong', label: '🔥 Nóng' },
  { value: 'am',   label: '🌤 Âm' },
  { value: 'thuong', label: '❄ Thường' },
]
const STATUS_CHOICES = [
  { value: 'chua_goi', label: 'Chưa gọi' },
  { value: 'da_goi', label: 'Đã gọi' },
  { value: 'khong_nghe', label: 'Không nghe máy' },
  { value: 'thue_bao', label: 'Thuê bao' },
  { value: 'sai_so', label: 'Sai số' },
  { value: 'tu_choi', label: 'Từ chối' },
  { value: 'hoan_so', label: 'Hoàn số' },
  { value: 'dat_lich', label: 'Đặt lịch' },
  { value: 'hen_goi', label: 'Hẹn gọi lại' },
  { value: 'khong_qt', label: 'Không quan tâm' },
  { value: 'cho_phan_cskh', label: 'Chờ phân CSKH' },
  { value: 'dang_cham_soc', label: 'Đang chăm sóc' },
]

const PROVINCES = ['Hà Nội','TP. Hồ Chí Minh','Hải Phòng','Đà Nẵng','Cần Thơ','Huế','Tuyên Quang','Lào Cai','Thái Nguyên','Phú Thọ','Bắc Ninh','Hưng Yên','Ninh Bình','Quảng Trị','Quảng Ngãi','Gia Lai','Khánh Hòa','Lâm Đồng','Đắk Lắk','Đồng Nai','Tây Ninh','Vĩnh Long','Đồng Tháp','Cà Mau','An Giang','Cao Bằng','Điện Biên','Hà Tĩnh','Lai Châu','Lạng Sơn','Nghệ An','Quảng Ninh','Thanh Hóa','Sơn La']

const CUSTOMER_GROUPS = ['Khách mới','Khách thường','Khách thân thiết','VIP','VVIP','Khách giới thiệu','Khách nội bộ']

export default function CustomerFormModal({ onClose, customer, onSaved }) {
  const isEdit = !!customer
  const currentUser = useAuthStore(s => s.user)
  const myRole = getUserRole(currentUser)
  const canAssignCskh = ['LEAD_CSKH', 'QUAN_LY', 'CHU_DN'].includes(myRole)
  const canAssignTele = ['LEAD_TELE', 'QUAN_LY', 'CHU_DN'].includes(myRole)
  const canAssignSale = ['LEAD_SALE', 'QUAN_LY', 'CHU_DN'].includes(myRole)
  const canAssignAds = ['LEAD_MKT', 'QUAN_LY', 'CHU_DN', 'TRUC_PAGE'].includes(myRole)
  const lockStyle = { background: '#f8fafc', cursor: 'not-allowed' }
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
    appointment_date: customer?.appointment_date ?? '',
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

  useEffect(() => {
    getMktUsers().then(res => setMktUsers(res.data?.results ?? res.data ?? [])).catch(() => {})
    getTeleUsers().then(res => setTeleUsers(res.data?.results ?? res.data ?? [])).catch(() => {})
    getServices().then(res => setServices(res.data?.results ?? res.data ?? [])).catch(() => {})
    getAllUsers({ role: 'SALE' }).then(res => setSaleUsers(res.data?.results ?? res.data ?? [])).catch(() => {})
    getAllUsers({ role: 'CSKH' }).then(res => setCskhUsers(res.data?.results ?? res.data ?? [])).catch(() => {})
  }, [])

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

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Sửa thông tin khách hàng' : 'Thêm khách hàng mới'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
            <input required className="input" value={form.full_name}
              onChange={(e) => set('full_name', e.target.value)} placeholder="Nguyễn Văn A" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
            <input required className={`input ${!isEdit && phoneChecked ? 'border-red-400' : ''}`}
              value={form.phone} onChange={(e) => set('phone', e.target.value)}
              onBlur={handlePhoneBlur} placeholder="0912345678" />
            {!isEdit && phoneChecked && (
              <p className="text-xs text-red-500 mt-1">⚠️ Trùng: {phoneChecked.full_name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="input" value={form.email}
              onChange={(e) => set('email', e.target.value)} placeholder="email@gmail.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
            <select className="input" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
              <option value="">-- Chọn --</option>
              <option value="M">Nam</option>
              <option value="F">Nữ</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
            <input type="date" className="input" value={form.dob}
              onChange={(e) => set('dob', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nguồn</label>
            <select className="input" value={form.source} onChange={(e) => set('source', e.target.value)}>
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại data</label>
            <select className="input" value={form.data_type} onChange={(e) => set('data_type', e.target.value)}>
              {DATA_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
              {STATUS_CHOICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nhóm khách</label>
            <select className="input" value={form.customer_group} onChange={(e) => set('customer_group', e.target.value)}>
              <option value="">— Chọn nhóm —</option>
              {CUSTOMER_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hẹn</label>
            <input type="date" className="input" value={form.appointment_date}
              onChange={(e) => set('appointment_date', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/TP</label>
            <input list="province-list" className="input" value={form.province}
              onChange={(e) => set('province', e.target.value)} placeholder="Hà Nội, TP.HCM..." />
            <datalist id="province-list">
              {PROVINCES.map((p) => <option key={p} value={p} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ads phụ trách</label>
            <select className="input" value={form.ads} disabled={!canAssignAds} style={!canAssignAds ? lockStyle : undefined} onChange={(e) => set('ads', e.target.value)}>
              <option value="">— Chưa giao —</option>
              {mktUsers.map((u) => <option key={u.id} value={u.id}>{u.display_name ?? u.full_name ?? u.email}</option>)}
            </select>
          </div>
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
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dịch vụ quan tâm</label>
            <div style={{ border: '1px solid #dde3ef', borderRadius: 7, padding: 8, maxHeight: 140, overflowY: 'auto' }}>
              {services.map((s) => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '2px 0', cursor: 'pointer' }}>
                  <input type="checkbox"
                    checked={form.services_interest.includes(Number(s.id))}
                    onChange={() => set('services_interest',
                      form.services_interest.includes(Number(s.id))
                        ? form.services_interest.filter(x => x !== Number(s.id))
                        : [...form.services_interest, Number(s.id)]
                    )} />
                  {s.name}
                </label>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
            <textarea className="input resize-none" rows={2} value={form.address}
              onChange={(e) => set('address', e.target.value)} placeholder="Số nhà, đường, phường..." />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea className="input resize-none" rows={2} value={form.notes}
              onChange={(e) => set('notes', e.target.value)} placeholder="Thông tin thêm..." />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={loading || (!isEdit && !!phoneChecked)} className="btn-primary">
            {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : '+ Thêm KH'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">Huỷ</button>
        </div>
      </form>
    </Modal>
  )
}
