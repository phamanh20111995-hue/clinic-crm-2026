import { useState, useEffect } from 'react'
import { IconAlertTriangle, IconPackage, IconCurrencyDong, IconPlus } from '@tabler/icons-react'
import { getProducts } from '../../../api/inventory'
import KetoanListShell from '../components/KetoanListShell'
import NhapKhoModal from '../modals/NhapKhoModal'
import ThemSanPhamModal from '../modals/ThemSanPhamModal'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')

const COLS = [
  { key: 'Sản phẩm', align: 'left' },
  { key: 'Loại', align: 'left' },
  { key: 'ĐV', align: 'left' },
  { key: 'Tồn', align: 'right' },
  { key: 'Định mức', align: 'right' },
  { key: 'Giá vốn', align: 'right' },
  { key: 'Giá bán', align: 'right' },
  { key: 'Lãi/ĐV', align: 'right' },
  { key: 'Trạng thái', align: 'center' },
  { key: '', align: 'right' },
]

export default function KhoTab() {
  const [items, setItems] = useState([])
  const [cat, setCat] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [showNhap, setShowNhap] = useState(false)
  const [showThem, setShowThem] = useState(false)

  const load = () => getProducts().then(r => setItems(r.data?.results ?? r.data ?? [])).catch(() => {})
  useEffect(() => { load() }, [])
  useEffect(() => { setPage(1) }, [cat, pageSize])

  const shown = cat ? items.filter(i => i.category === cat) : items
  const sapHet = items.filter(i => i.is_low_stock)
  const totalValue = items.reduce((s, i) => s + Number(i.stock ?? 0) * Number(i.cost_price ?? 0), 0)
  const paged = shown.slice((page - 1) * pageSize, page * pageSize)

  const selectStyle = { padding: '7px 10px', border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, fontFamily: 'inherit' }

  const stats = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
      <div style={{ background: '#fff', border: '1px solid #dc2626', borderRadius: 9, padding: '11px 13px' }}>
        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><IconAlertTriangle size={13} color="#dc2626" />Sắp hết hàng</div>
        <div style={{ fontSize: 19, fontWeight: 700, color: '#dc2626' }}>{sapHet.length}</div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Dưới định mức cảnh báo</div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 9, padding: '11px 13px' }}>
        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><IconPackage size={13} color="#b45309" />Số loại sản phẩm</div>
        <div style={{ fontSize: 19, fontWeight: 700, color: '#b45309' }}>{items.length}</div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Đang theo dõi tồn</div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 9, padding: '11px 13px' }}>
        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><IconCurrencyDong size={13} color="#854d0e" />Giá trị kho (giá vốn)</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#854d0e' }}>{totalValue ? fmt(totalValue) + 'đ' : '—'}</div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Tồn × giá vốn BQGQ</div>
      </div>
    </div>
  )

  const toolbar = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2044' }}>Danh sách sản phẩm</span>
        <select value={cat} onChange={e => setCat(e.target.value)} style={selectStyle}>
          <option value="">Tất cả loại</option>
          <option value="my_pham">Mỹ phẩm</option>
          <option value="thuoc_ke_don">Thuốc kê đơn</option>
          <option value="thuoc_khong_ke_don">Thuốc không kê đơn</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setShowThem(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', border: '1px solid #b45309', borderRadius: 7, background: '#fff', color: '#b45309', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
          <IconPlus size={13} /> Thêm sản phẩm
        </button>
        <button onClick={() => setShowNhap(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', border: 'none', borderRadius: 7, background: '#b45309', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
          <IconPlus size={13} /> Nhập kho
        </button>
      </div>
    </div>
  )

  return (
    <>
      <KetoanListShell
        stats={stats}
        toolbar={toolbar}
        pagination={{ page, pageSize, count: shown.length, onPage: setPage, onPageSize: setPageSize }}
      >
        {shown.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
              Chưa có sản phẩm · Bấm "Thêm sản phẩm" để tạo rồi "Nhập kho" để có tồn
            </div>
          ) : (
          <div style={{ minWidth: 1900 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '24%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '9%' }} />
              </colgroup>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {COLS.map(c => (
                    <th key={c.key || 'act'} style={{ padding: '7px 11px', textAlign: c.align, fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>{c.key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map(item => {
                  const low = item.is_low_stock
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', background: low ? '#fef2f2' : undefined }}>
                      <td style={{ padding: '7px 11px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                        {item.sku ? <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 400, marginLeft: 5 }}>{item.sku}</span> : null}
                        {item.is_prescription ? <span style={{ background: '#fee2e2', color: '#991b1b', padding: '0 5px', borderRadius: 8, fontSize: 8, fontWeight: 700, marginLeft: 5 }}>Kê đơn</span> : null}
                      </td>
                      <td style={{ padding: '7px 11px', fontSize: 10, color: '#64748b' }}>{item.category_display}</td>
                      <td style={{ padding: '7px 11px' }}>{item.unit}</td>
                      <td style={{ padding: '7px 11px', textAlign: 'right', color: low ? '#dc2626' : '#15803d', fontWeight: 600 }}>{item.stock}</td>
                      <td style={{ padding: '7px 11px', textAlign: 'right', color: '#94a3b8' }}>{item.min_stock}</td>
                      <td style={{ padding: '7px 11px', textAlign: 'right' }}>{fmt(item.cost_price)}đ</td>
                      <td style={{ padding: '7px 11px', textAlign: 'right' }}>{fmt(item.sell_price)}đ</td>
                      <td style={{ padding: '7px 11px', textAlign: 'right', color: Number(item.profit) >= 0 ? '#15803d' : '#dc2626' }}>{fmt(item.profit)}đ</td>
                      <td style={{ padding: '7px 11px', textAlign: 'center' }}>
                        <span style={{ background: low ? '#fee2e2' : '#dcfce7', color: low ? '#991b1b' : '#15803d', padding: '1px 6px', borderRadius: 10, fontSize: 9, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {low ? '⚠ Sắp hết' : 'Đủ hàng'}
                        </span>
                      </td>
                      <td style={{ padding: '7px 11px', textAlign: 'right' }}>
                        <button onClick={() => setShowNhap(true)}
                          style={{ padding: '2px 8px', border: '1px solid #dde3ef', borderRadius: 5, background: '#fff', fontSize: 9, cursor: 'pointer', fontWeight: 600, color: '#b45309', whiteSpace: 'nowrap' }}>
                          Nhập thêm
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </KetoanListShell>

      {showNhap && <NhapKhoModal products={items} onClose={() => setShowNhap(false)} onDone={() => { setShowNhap(false); load() }} />}
      {showThem && <ThemSanPhamModal onClose={() => setShowThem(false)} onDone={() => { setShowThem(false); load() }} />}
    </>
  )
}
