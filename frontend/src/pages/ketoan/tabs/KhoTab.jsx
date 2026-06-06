import { useState, useEffect } from 'react'
import { IconAlertTriangle, IconPackage, IconCurrencyDong, IconPlus } from '@tabler/icons-react'
import { getInventory } from '../../../api/ketoan'
import NhapKhoModal from '../modals/NhapKhoModal'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')

export default function KhoTab() {
  const [items, setItems] = useState([])
  const [showNhap, setShowNhap] = useState(false)
  const [nhapTarget, setNhapTarget] = useState(null)

  useEffect(() => {
    getInventory().then(r => setItems(r.data?.results ?? r.data ?? [])).catch(() => {})
  }, [])

  const sapHet = items.filter(i => Number(i.quantity ?? 0) < Number(i.min_quantity ?? 0))
  const totalValue = items.reduce((s, i) => s + Number(i.quantity ?? 0) * Number(i.unit_price ?? 0), 0)

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        <div style={{ background: '#fff', border: '1px solid #dc2626', borderRadius: 9, padding: '11px 13px' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><IconAlertTriangle size={13} color="#dc2626" />Sắp hết hàng</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: '#dc2626' }}>{sapHet.length}</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Dưới mức tối thiểu</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 9, padding: '11px 13px' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><IconPackage size={13} color="#b45309" />Phiếu xuất kho T05</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: '#b45309' }}>—</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Tự động khi Sale chốt</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 9, padding: '11px 13px' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><IconCurrencyDong size={13} color="#854d0e" />Giá trị kho</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#854d0e' }}>{totalValue ? fmt(totalValue) + 'đ' : '—'}</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Tổng tồn kho hiện tại</div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2044' }}>Danh sách vật tư</span>
          <button onClick={() => { setNhapTarget(null); setShowNhap(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', border: 'none', borderRadius: 7, background: '#b45309', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            <IconPlus size={13} /> Nhập kho
          </button>
        </div>

        {items.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
            API kho chưa có dữ liệu · Sẽ hiển thị khi backend triển khai
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Vật tư', 'ĐV', 'Tồn kho', 'Tối thiểu', 'Giá nhập', 'Trạng thái', ''].map(h => (
                    <th key={h} style={{ padding: '7px 11px', textAlign: ['Tồn kho', 'Tối thiểu', 'Giá nhập'].includes(h) ? 'right' : 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const low = Number(item.quantity ?? 0) < Number(item.min_quantity ?? 0)
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', background: low ? '#fef2f2' : undefined }}>
                      <td style={{ padding: '7px 11px', fontWeight: 700 }}>{item.name}</td>
                      <td style={{ padding: '7px 11px' }}>{item.unit}</td>
                      <td style={{ padding: '7px 11px', textAlign: 'right', color: low ? '#dc2626' : '#15803d', fontWeight: 600 }}>{item.quantity}</td>
                      <td style={{ padding: '7px 11px', textAlign: 'right' }}>{item.min_quantity}</td>
                      <td style={{ padding: '7px 11px', textAlign: 'right' }}>{fmt(item.unit_price)}đ</td>
                      <td style={{ padding: '7px 11px' }}>
                        <span style={{ background: low ? '#fee2e2' : '#dcfce7', color: low ? '#991b1b' : '#15803d', padding: '1px 6px', borderRadius: 10, fontSize: 9, fontWeight: 600 }}>
                          {low ? '⚠ Sắp hết' : 'Đủ hàng'}
                        </span>
                      </td>
                      <td style={{ padding: '7px 11px' }}>
                        {low ? (
                          <button onClick={() => { setNhapTarget(item); setShowNhap(true) }}
                            style={{ padding: '2px 8px', border: 'none', borderRadius: 5, background: '#b45309', color: '#fff', fontSize: 9, cursor: 'pointer', fontWeight: 600 }}>
                            Nhập thêm
                          </button>
                        ) : (
                          <button style={{ padding: '2px 8px', border: '1px solid #dde3ef', borderRadius: 5, background: '#fff', fontSize: 9, cursor: 'pointer' }}>
                            Lịch sử
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNhap && <NhapKhoModal vatTuList={items} onClose={() => setShowNhap(false)} onDone={() => { setShowNhap(false); getInventory().then(r => setItems(r.data?.results ?? r.data ?? [])).catch(() => {}) }} />}
    </div>
  )
}
