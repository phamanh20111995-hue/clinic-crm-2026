import { useState, useEffect, useCallback } from 'react'
import { IconCheck, IconX, IconEdit, IconRefresh, IconInfoCircle, IconGitBranch } from '@tabler/icons-react'
import { getContracts } from '../../../api/ketoan'
import { getPendingPayments, verifyPayment } from '../../../api/payments'
import toast from 'react-hot-toast'
import DuyetModal from '../modals/DuyetModal'
import TuChoiModal from '../modals/TuChoiModal'
import SuaTruocModal from '../modals/SuaTruocModal'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')
const ACCENT = '#b45309'

export default function DuyetHDTab() {
  const [contracts, setContracts] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [duyetTarget, setDuyetTarget] = useState(null)
  const [tuChoiTarget, setTuChoiTarget] = useState(null)
  const [suaTarget, setSuaTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rc, rp] = await Promise.all([
        getContracts({ approval_status: 'pending_kt' }),
        getPendingPayments(),
      ])
      setContracts(rc.data?.results ?? rc.data ?? [])
      setPayments(rp.data ?? [])
    } catch { } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const doVerify = async (p, action, note = '') => {
    try {
      await verifyPayment(p.id, { action, note })
      toast.success(action === 'confirm' ? 'Đã xác nhận' : 'Đã báo lệch')
      load()
    } catch (e) { toast.error(e.response?.data?.detail ?? 'Lỗi xử lý') }
  }

  const isCskh = c => c.created_by_role === 'CSKH' || c.created_by_role === 'LEAD_CSKH'
  const isLan2 = c => c.reject_count > 0

  const hdItems = contracts.map(c => ({ kind: 'hd', time: c.created_at, c }))
  const thuWaiting = payments.filter(p => p.verify_status === 'cho_xac_nhan')
  const thuLech = payments.filter(p => p.verify_status === 'lech')
  const thuItems = payments.map(p => ({ kind: 'thu', time: p.received_at || p.created_at, p }))

  const sortDesc = arr => arr.slice().sort((a, b) => new Date(b.time) - new Date(a.time))

  const filtered =
    filter === 'hd'   ? sortDesc(hdItems)
    : filter === 'thu'  ? sortDesc(thuWaiting.map(p => ({ kind: 'thu', time: p.received_at || p.created_at, p })))
    : filter === 'lech' ? sortDesc(thuLech.map(p => ({ kind: 'thu', time: p.received_at || p.created_at, p })))
    : sortDesc([...hdItems, ...thuItems])

  const hdCount = contracts.length
  const thuWaitingCount = thuWaiting.length
  const lechCount = thuLech.length
  const totalCount = hdCount + payments.length

  const segBtn = (key, label) => (
    <button
      key={key}
      onClick={() => setFilter(key)}
      style={{
        padding: '4px 10px',
        border: `1px solid ${filter === key ? ACCENT : '#dde3ef'}`,
        borderRadius: 7,
        background: filter === key ? ACCENT : '#fff',
        color: filter === key ? '#fff' : '#64748b',
        fontSize: 10,
        fontWeight: filter === key ? 700 : 400,
        cursor: 'pointer',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
      }}
    >{label}</button>
  )

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Info banners */}
      <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 11, color: '#92400e', display: 'flex', gap: 8 }}>
        <IconInfoCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        <div><b>Luồng tự động:</b> Sale / CSKH nhập HĐ → bấm "Gửi duyệt" → HĐ tự chảy vào đây · KT nhận thông báo in-app ngay. Duyệt → DT ghi chính thức → phát HĐ điện tử.</div>
      </div>

      <div style={{ padding: '8px 14px', background: '#fff', border: '1px solid #fde68a', borderRadius: 8, fontSize: 11, color: '#854d0e', display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconGitBranch size={14} />
        <div>
          <b>Ai tạo HĐ:</b>{' '}
          <span style={{ background: '#dcfce7', color: '#15803d', padding: '1px 7px', borderRadius: 5, fontWeight: 600, margin: '0 4px' }}>Sale</span> khi tư vấn chốt ·
          <span style={{ background: '#fce7f3', color: '#be185d', padding: '1px 7px', borderRadius: 5, fontWeight: 600, margin: '0 4px' }}>CSKH</span> khi chăm sóc tái khám mua thêm ·
          cả 2 đều tạo <b>bản nháp</b> → Kế toán duyệt tại đây
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        {/* Header + filter */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2044' }}>
            Việc cần xử lý{filtered.length > 0 ? ` (${filtered.length})` : ''}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {segBtn('all',  `Tất cả (${totalCount})`)}
              {segBtn('hd',   `Hóa đơn mới (${hdCount})`)}
              {segBtn('thu',  `Thu nợ (${thuWaitingCount})`)}
              {segBtn('lech', `Lệch (${lechCount})`)}
            </div>
            <button onClick={load} style={{ border: '1px solid #dde3ef', borderRadius: 6, background: '#fff', padding: '4px 8px', cursor: 'pointer', color: '#64748b' }}>
              <IconRefresh size={13} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#15803d', fontSize: 12 }}>
            ✅ Không có việc cần xử lý
          </div>
        ) : filtered.map(item => {
          if (item.kind === 'hd') {
            const c = item.c
            return (
              <div key={`hd-${c.id}`} style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', background: isCskh(c) ? '#fdf2f8' : undefined }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ background: '#dbeafe', color: '#1e40af', padding: '1px 7px', borderRadius: 5, fontSize: 9, fontWeight: 600 }}>Hóa đơn khách mới</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f2044' }}>{c.contract_no}</span>
                      {isLan2(c) ? (
                        <>
                          <span style={{ background: '#fef9c3', color: '#854d0e', padding: '1px 7px', borderRadius: 10, fontSize: 9, fontWeight: 700 }}>Chờ duyệt lần 2</span>
                          <span style={{ background: '#ede9fe', color: '#5b21b6', padding: '1px 7px', borderRadius: 10, fontSize: 8, fontWeight: 700 }}>Đã từ chối 1 lần</span>
                        </>
                      ) : (
                        <span style={{ background: '#fef9c3', color: '#854d0e', padding: '1px 7px', borderRadius: 10, fontSize: 9, fontWeight: 700 }}>Chờ duyệt</span>
                      )}
                      {isCskh(c) ? (
                        <span style={{ background: '#fce7f3', color: '#be185d', padding: '1px 7px', borderRadius: 5, fontSize: 9, fontWeight: 600 }}>CSKH nhập — tái khám</span>
                      ) : (
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '1px 7px', borderRadius: 5, fontSize: 9, fontWeight: 600 }}>Sale nhập</span>
                      )}
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>{c.created_at?.slice(0, 10)}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 11 }}>
                      <div><span style={{ color: '#94a3b8' }}>KH:</span> <b>{c.customer_name}</b></div>
                      <div><span style={{ color: '#94a3b8' }}>DV:</span> {c.items?.[0]?.name ?? '—'}</div>
                      <div><span style={{ color: '#94a3b8' }}>Loại:</span> <span style={{ color: '#854d0e', fontWeight: 500 }}>{c.loai_dv === 'benh_ly' ? 'Bệnh lý · Miễn VAT' : 'Thẩm mỹ · VAT 10%'}</span></div>
                      <div><span style={{ color: '#94a3b8' }}>Sale nhập:</span> <b>{fmt(c.final_amount)}đ</b></div>
                      <div><span style={{ color: '#94a3b8' }}>Người gửi:</span> {c.created_by_name}</div>
                    </div>

                    {c.reject_reason && (
                      <div style={{ marginTop: 6, fontSize: 11, color: '#7c3aed', background: '#f5f3ff', padding: '4px 8px', borderRadius: 5, display: 'inline-block' }}>
                        Từ chối trước: "{c.reject_reason}" → Sale đã sửa
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                    <button onClick={() => setDuyetTarget(c)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: 'none', borderRadius: 6, background: '#15803d', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      <IconCheck size={12} /> Duyệt
                    </button>
                    <button onClick={() => setTuChoiTarget(c)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: 'none', borderRadius: 6, background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      <IconX size={12} /> Từ chối
                    </button>
                    <button onClick={() => setSuaTarget(c)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: '1px solid #dde3ef', borderRadius: 6, background: '#fff', fontSize: 11, cursor: 'pointer' }}>
                      <IconEdit size={12} /> Sửa nhỏ
                    </button>
                  </div>
                </div>
              </div>
            )
          }

          // kind === 'thu'
          const p = item.p
          const isLech = p.verify_status === 'lech'
          const breakdowns = [
            Number(p.cash_amount) > 0 && `TM ${fmt(p.cash_amount)}đ`,
            Number(p.transfer_amount) > 0 && `CK ${fmt(p.transfer_amount)}đ`,
            Number(p.installment_amount) > 0 && `Trả góp ${fmt(p.installment_amount)}đ`,
          ].filter(Boolean)
          return (
            <div key={`thu-${p.id}`} style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', background: isLech ? '#fff8f8' : undefined }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '1px 7px', borderRadius: 5, fontSize: 9, fontWeight: 600 }}>Thu nợ khách cũ</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f2044' }}>{p.contract_no}</span>
                    {isLech ? (
                      <span style={{ background: '#fee2e2', color: '#991b1b', padding: '1px 7px', borderRadius: 10, fontSize: 9, fontWeight: 700 }}>Lệch - cần sửa</span>
                    ) : (
                      <span style={{ background: '#fef9c3', color: '#854d0e', padding: '1px 7px', borderRadius: 10, fontSize: 9, fontWeight: 700 }}>Chờ xác nhận</span>
                    )}
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>{(p.received_at || '').slice(0, 10)}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 11 }}>
                    <div><span style={{ color: '#94a3b8' }}>KH:</span> <b>{p.customer_name}</b></div>
                    <div><span style={{ color: '#94a3b8' }}>Người ghi:</span> {p.received_by_name}</div>
                    <div><span style={{ color: '#94a3b8' }}>Tổng thu:</span> <b style={{ color: '#0f2044' }}>{fmt(p.total)}đ</b></div>
                  </div>
                  {breakdowns.length > 0 && (
                    <div style={{ marginTop: 4, fontSize: 10, color: '#64748b' }}>
                      {breakdowns.join(' · ')}
                    </div>
                  )}
                  {isLech && p.verify_note && (
                    <div style={{ marginTop: 4, fontSize: 10, color: '#991b1b', fontWeight: 600 }}>Lý do lệch: {p.verify_note}</div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0, alignItems: 'flex-end' }}>
                  {isLech ? (
                    <span style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', whiteSpace: 'nowrap' }}>⏳ Chờ Sale sửa lại</span>
                  ) : (
                    <>
                      <button onClick={() => doVerify(p, 'confirm')}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: 'none', borderRadius: 6, background: '#15803d', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        <IconCheck size={12} /> Xác nhận
                      </button>
                      <button
                        onClick={() => {
                          const r = window.prompt('Nhập lý do lệch (vd: khách đưa 50 ghi 20):')
                          if (r === null) return
                          if (r.trim() === '') { toast.error('Cần nhập lý do lệch'); return }
                          doVerify(p, 'flag', r.trim())
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: 'none', borderRadius: 6, background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        <IconX size={12} /> Báo lệch
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        <div style={{ padding: '8px 14px', background: '#f0fdf4', borderTop: '1px solid #bbf7d0', fontSize: 11, color: '#15803d', display: 'flex', alignItems: 'center', gap: 5 }}>
          🔒 DT chỉ ghi chính thức sau khi KT bấm Duyệt. HĐ nháp và chờ duyệt không tính vào báo cáo.
        </div>
      </div>

      {duyetTarget && <DuyetModal contract={duyetTarget} onClose={() => setDuyetTarget(null)} onDone={() => { setDuyetTarget(null); load() }} />}
      {tuChoiTarget && <TuChoiModal contract={tuChoiTarget} onClose={() => setTuChoiTarget(null)} onDone={() => { setTuChoiTarget(null); load() }} />}
      {suaTarget && <SuaTruocModal contract={suaTarget} onClose={() => setSuaTarget(null)} onDone={() => { setSuaTarget(null); load() }} />}
    </div>
  )
}
