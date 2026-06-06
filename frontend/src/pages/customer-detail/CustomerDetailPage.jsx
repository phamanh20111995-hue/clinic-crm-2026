import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { IconChevronLeft, IconRefresh } from '@tabler/icons-react'
import AppLayout from '../../components/layout/AppLayout'
import useAuthStore from '../../store/authStore'
import { getUserRole } from '../../utils/rolesV2'
import { getCustomerDetail, getCustomerContracts, getCustomerAppts } from '../../api/customerDetail'
import TongQuanTab  from './tabs/TongQuanTab'
import HanhTrinhTab from './tabs/HanhTrinhTab'
import TaiChinhTab  from './tabs/TaiChinhTab'
import LieuTrinhTab from './tabs/LieuTrinhTab'
import AnhTab       from './tabs/AnhTab'

const ACCENT = '#1e40af'

// ─── Role permission matrix ──────────────────────────────────────────────────
const FULL_ROLES   = ['QUAN_LY', 'CHU_DN', 'KE_TOAN', 'LEAD_SALE', 'LEAD_TELE']
const CSKH_ROLES   = ['CSKH', 'LEAD_CSKH']
const LIMITED_ROLES = ['TELE', 'LE_TAN', 'MKT']
// SALE handled separately (own customers only)

function getTabsForRole(role) {
  const ALL = [
    { key: 'tongquan',  label: 'Tổng quan' },
    { key: 'hanhtrinh', label: 'Hành trình' },
    { key: 'taichinch', label: 'Tài chính' },
    { key: 'lieutrinh', label: 'Liệu trình' },
    { key: 'anh',       label: 'Ảnh điều trị' },
  ]
  if (FULL_ROLES.includes(role)) return ALL
  if (CSKH_ROLES.includes(role)) return ALL.filter(t => t.key !== 'taichinch')
  if (role === 'SALE') return ALL  // SALE sees all tabs for own customer
  // TELE, LE_TAN, MKT
  return ALL.filter(t => !['taichinch'].includes(t.key))
}

function canUploadPhoto(role) {
  return ['LE_TAN', 'QUAN_LY', 'CHU_DN', 'CSKH', 'LEAD_CSKH'].includes(role)
}

// ─── Sub-nav tabs (inline, not using AppLayout tabs because we need colors) ──
function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e5e7eb', overflowX: 'auto' }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          style={{
            padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: 'none', background: 'none', whiteSpace: 'nowrap',
            color: active === t.key ? ACCENT : '#6b7280',
            borderBottom: active === t.key ? `2px solid ${ACCENT}` : '2px solid transparent',
            marginBottom: -2, transition: 'color .12s',
          }}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CustomerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const role = getUserRole(user)

  const [customer,  setCustomer]  = useState(null)
  const [contracts, setContracts] = useState([])
  const [appts,     setAppts]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [activeTab, setActiveTab] = useState('tongquan')

  const tabs = getTabsForRole(role)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [custRes, contractRes, apptRes] = await Promise.all([
        getCustomerDetail(id),
        getCustomerContracts(id),
        getCustomerAppts(id),
      ])
      setCustomer(custRes.data)
      setContracts(contractRes.data?.results ?? contractRes.data ?? [])
      setAppts(apptRes.data?.results ?? apptRes.data ?? [])
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) {
        setError('403')
      } else {
        setError('general')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  // Ensure active tab is in allowed tabs
  useEffect(() => {
    if (tabs.length && !tabs.find(t => t.key === activeTab)) {
      setActiveTab(tabs[0].key)
    }
  }, [role])

  const backBtn = (
    <button onClick={() => navigate(-1)}
      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 12, cursor: 'pointer' }}>
      <IconChevronLeft size={14} /> Quay lại
    </button>
  )

  const refreshBtn = (
    <button onClick={load}
      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 12, cursor: 'pointer' }}>
      <IconRefresh size={14} /> Làm mới
    </button>
  )

  return (
    <AppLayout
      title={customer ? `Hồ sơ: ${customer.full_name}` : 'Hồ sơ khách hàng'}
      meta={customer?.phone ?? id}
      actions={<div style={{ display: 'flex', gap: 6 }}>{backBtn}{refreshBtn}</div>}
    >
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
          <p style={{ fontSize: 28, margin: '0 0 8px' }}>⏳</p>
          <p>Đang tải hồ sơ...</p>
        </div>
      ) : error === '403' ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
          <p style={{ fontSize: 40, margin: '0 0 8px' }}>🚫</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#374151', margin: '0 0 6px' }}>Không có quyền xem hồ sơ này</p>
          <p style={{ fontSize: 13 }}>Bạn chỉ được xem hồ sơ khách hàng do mình phụ trách.</p>
        </div>
      ) : error ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
          <p style={{ fontSize: 28, margin: '0 0 8px' }}>⚠️</p>
          <p>Không tải được hồ sơ. <button onClick={load} style={{ color: ACCENT, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>Thử lại</button></p>
        </div>
      ) : customer ? (
        <div>
          {/* Tab bar */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', marginBottom: 14, overflow: 'hidden' }}>
            <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
          </div>

          {/* Tab content */}
          {activeTab === 'tongquan'  && <TongQuanTab  customer={customer} contracts={contracts} />}
          {activeTab === 'hanhtrinh' && <HanhTrinhTab customer={customer} appointments={appts} />}
          {activeTab === 'taichinch' && <TaiChinhTab  contracts={contracts} />}
          {activeTab === 'lieutrinh' && <LieuTrinhTab appointments={appts} />}
          {activeTab === 'anh'       && <AnhTab customer={customer} images={customer.images ?? []} canUpload={canUploadPhoto(role)} />}
        </div>
      ) : null}
    </AppLayout>
  )
}
