import { useState, useEffect, useCallback } from 'react'
import { IconCheck, IconX, IconEdit, IconRefresh, IconInfoCircle, IconGitBranch } from '@tabler/icons-react'
import { getContracts } from '../../../api/ketoan'
import DuyetModal from '../modals/DuyetModal'
import TuChoiModal from '../modals/TuChoiModal'
import SuaTruocModal from '../modals/SuaTruocModal'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')

export default function DuyetHDTab() {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(false)
  const [duyetTarget, setDuyetTarget] = useState(null)
  const [tuChoiTarget, setTuChoiTarget] = useState(null)
  const [suaTarget, setSuaTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await getContracts({ approval_status: 'pending_kt' })
      setContracts(r.data?.results ?? r.data ?? [])
    } catch { } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const isCskh = c => c.created_by_role === 'CSKH' || c.created_by_role === 'LEAD_CSKH'
  const isLan2 = c => c.reject_count > 0

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
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
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2044' }}>HĐ chờ duyệt{contracts.length > 0 ? ` (${contracts.length})` : ''}</span>
          <button onClick={load} style={{ border: '1px solid #dde3ef', borderRadius: 6, background: '#fff', padding: '4px 8px', cursor: 'pointer', color: '#64748b' }}>
            <IconRefresh size={13} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Đang tải...</div>
        ) : contracts.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#15803d', fontSize: 12 }}>
            ✅ Không có HĐ nào chờ duyệt
          </div>
        ) : contracts.map(c => (
          <div key={c.id} style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', background: isCskh(c) ? '#fdf2f8' : undefined }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 6 }}>
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
        ))}

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
