import { useState, useEffect } from 'react'
import { IconPhone, IconCalendar, IconAlertTriangle, IconUser } from '@tabler/icons-react'
import { getSaleKpi, getTodayAppts, getContracts } from '../../../api/sale'
import GhiTuVanModal from '../modals/GhiTuVanModal'
import ChotHDModal from '../modals/ChotHDModal'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')

export default function ViecHomNayTab({ onOpenChotHD }) {
  const [kpi, setKpi] = useState(null)
  const [appts, setAppts] = useState([])
  const [rejected, setRejected] = useState([])
  const [tuVanTarget, setTuVanTarget] = useState(null)
  const [chotTarget, setChotTarget] = useState(null)

  useEffect(() => {
    getSaleKpi().then(r => setKpi(r.data)).catch(() => {})
    getTodayAppts().then(r => setAppts(r.data?.results ?? r.data ?? [])).catch(() => {})
    getContracts({ approval_status: 'rejected' }).then(r => setRejected(r.data?.results ?? r.data ?? [])).catch(() => {})
  }, [])

  const pct = kpi ? Math.min(100, Math.round(((kpi.revenue ?? 0) / (kpi.target ?? 1)) * 100)) : 0

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[
          { l: 'Doanh thu hôm nay', v: fmt(kpi?.revenue_today) + 'đ', c: '#15803d' },
          { l: 'Tháng này', v: fmt(kpi?.revenue) + 'đ', c: '#1d4ed8' },
          { l: 'Mục tiêu', v: fmt(kpi?.target) + 'đ', c: '#d97706' },
          { l: 'Đạt', v: pct + '%', c: pct >= 100 ? '#15803d' : pct >= 70 ? '#d97706' : '#dc2626' },
        ].map(card => (
          <div key={card.l} style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{card.l}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: card.c }}>{card.v}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      {kpi && (
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 6 }}>
            <span>Tiến độ tháng</span><span>{pct}%</span>
          </div>
          <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: pct + '%', background: pct >= 100 ? '#15803d' : pct >= 70 ? '#d97706' : '#ef4444', borderRadius: 4, transition: 'width .4s' }} />
          </div>
        </div>
      )}

      {/* Rejected contracts */}
      {rejected.length > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>
            <IconAlertTriangle size={14} /> {rejected.length} HĐ bị KT từ chối
          </div>
          {rejected.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #fecaca' }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2044' }}>{c.contract_no}</span>
                <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>{c.customer_name}</span>
                {c.reject_reason && <div style={{ fontSize: 10, color: '#dc2626', marginTop: 1 }}>"{c.reject_reason}"</div>}
              </div>
              <button onClick={() => onOpenChotHD?.(c, 'sua')}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #dc2626', background: '#fff', color: '#dc2626', cursor: 'pointer', fontWeight: 600 }}>
                Sửa
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Today appointments */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2044' }}>
            <IconCalendar size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
            KH hôm nay ({appts.length})
          </span>
        </div>
        {appts.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Không có lịch hôm nay</div>
        ) : appts.map(a => (
          <div key={a.id} style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconUser size={16} color="#15803d" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2044' }}>{a.customer_name}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{a.time_slot} · {a.service_name}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setTuVanTarget(a.customer)}
                style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #dde3ef', background: '#fff', cursor: 'pointer' }}>
                Tư vấn
              </button>
              <button onClick={() => setChotTarget(a.customer)}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#15803d', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                Chốt HĐ
              </button>
            </div>
          </div>
        ))}
      </div>

      {tuVanTarget && (
        <GhiTuVanModal customer={tuVanTarget} onClose={() => setTuVanTarget(null)} onDone={() => setTuVanTarget(null)} />
      )}
      {chotTarget && (
        <ChotHDModal defaultCustomer={chotTarget} onClose={() => setChotTarget(null)} onDone={() => setChotTarget(null)} />
      )}
    </div>
  )
}
