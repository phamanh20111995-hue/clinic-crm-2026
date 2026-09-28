import { useState, useEffect } from 'react'
import { IconSearch, IconRefresh, IconFilter, IconX } from '@tabler/icons-react'

const ACCENT = '#b45309'

const STATUS_CFG = {
  pending:         { label: 'Chưa đến',   bg: '#fef9c3', color: '#854d0e' },
  confirmed:       { label: 'Đã đến',     bg: '#dbeafe', color: '#1e40af' },
  waiting_consult: { label: 'Chờ TV',     bg: '#ede9fe', color: '#6d28d9' },
  waiting_treat:   { label: 'Chờ ĐT',     bg: '#fce7f3', color: '#9d174d' },
  consulting:      { label: 'Đang TV',    bg: '#fef3c7', color: '#92400e' },
  in_progress:     { label: 'Đang ĐT',   bg: '#dcfce7', color: '#166534' },
  done:            { label: 'Đã về',      bg: '#f3f4f6', color: '#9ca3af' },
  cancelled:       { label: 'Đã hủy',    bg: '#fee2e2', color: '#dc2626' },
}

const HD_STATUS_CFG = {
  draft:      { label: 'Nháp',      bg: '#f3f4f6', color: '#6b7280' },
  pending_kt: { label: 'Chờ duyệt', bg: '#fef3c7', color: '#92400e' },
  approved:   { label: 'Đã duyệt',  bg: '#dcfce7', color: '#166534' },
  rejected:   { label: 'Từ chối',   bg: '#fee2e2', color: '#dc2626' },
}

const STATUS_FILTER_OPTIONS = [
  { value: '',               label: 'Tất cả trạng thái' },
  { value: 'pending',        label: 'Chưa đến' },
  { value: 'confirmed',      label: 'Đã đến' },
  { value: 'waiting_consult',label: 'Chờ TV' },
  { value: 'waiting_treat',  label: 'Chờ ĐT' },
  { value: 'consulting',     label: 'Đang TV' },
  { value: 'in_progress',    label: 'Đang ĐT' },
  { value: 'done',           label: 'Đã về' },
  { value: 'cancelled',      label: 'Đã hủy' },
]

const VISIT_TYPE_OPTIONS = [
  { value: '', label: 'Tất cả loại lượt' },
  { value: 'tu_van',   label: 'Tư vấn' },
  { value: 'dieu_tri', label: 'Điều trị' },
  { value: 'tai_kham', label: 'Tái khám' },
]

const selectStyle = {
  padding: '7px 10px', border: '1px solid #dde3ef', borderRadius: 7,
  fontSize: 12, outline: 'none', fontFamily: 'inherit', background: '#fff',
}

const EMPTY = <span style={{ color: '#94a3b8' }}>—</span>

function fmtTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function fmtMoney(n) {
  if (!n || Number(n) === 0) return null
  return Number(n).toLocaleString('vi') + ' ₫'
}

function StatusBadge({ status, status_display }) {
  const cfg = STATUS_CFG[status] ?? { bg: '#f1f5f9', color: '#64748b' }
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
      {status_display ?? cfg.label}
    </span>
  )
}

function HdStatusBadge({ hd_status }) {
  if (!hd_status?.latest) return EMPTY
  const cfg = HD_STATUS_CFG[hd_status.latest]
  if (!cfg) return EMPTY
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
      {cfg.label}{hd_status.pending_count > 0 ? ` ·${hd_status.pending_count}` : ''}
    </span>
  )
}

const HEADERS = [
  'Giờ hẹn', 'Loại lượt', 'Trạng thái', 'Phòng', 'BS tư vấn', 'BS điều trị', 'KTV điều trị',
  'Khách hàng', 'SĐT', 'Nguồn', 'Nhóm KH', 'Tỉnh/thành', 'Loại data', 'DV quan tâm',
  'Tele', 'Sale', 'CSKH', 'Ads',
  'Tình trạng HĐ', 'Buổi còn lại', 'Công nợ',
]

const navBtnStyle = {
  border: '1px solid #dde3ef', borderRadius: 7, padding: '6px 10px',
  background: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
}

const pgBtnStyle = (disabled) => ({
  padding: '6px 12px', borderRadius: 7, border: '1px solid #dde3ef',
  background: '#fff', fontSize: 12, cursor: disabled ? 'default' : 'pointer',
  fontFamily: 'inherit', opacity: disabled ? 0.4 : 1,
})

export default function AppointmentTableView({
  appointments = [],
  saleUsers = [],
  onCheckin,
  onEnqueue,
  onAssignRoom,
  onCheckout,
  onAssignSale,
  onRowClick,
  onReload,
  loading = false,
  viewDate,
  onDateChange,
  onPrevDate,
  onNextDate,
  onTodayDate,
  isToday,
}) {
  const [search,          setSearch]         = useState('')
  const [statusFilter,    setStatusFilter]   = useState('')
  const [visitFilter,     setVisitFilter]    = useState('')
  const [page,            setPage]           = useState(1)
  const [pageSize,        setPageSize]       = useState(20)
  const [showFilterPanel, setShowFilterPanel]= useState(false)

  // Advanced filter states
  const [sourceF,   setSourceF]   = useState('')
  const [groupF,    setGroupF]    = useState('')
  const [dataTypeF, setDataTypeF] = useState('')
  const [staffF,    setStaffF]    = useState('')
  const [saleF,     setSaleF]     = useState('')
  const [serviceF,  setServiceF]  = useState('')

  // Distinct options from appointments
  const distinctSources   = [...new Set(appointments.map(a => a.customer_detail?.source_display).filter(Boolean))]
  const distinctGroups    = [...new Set(appointments.map(a => a.customer_detail?.customer_group).filter(Boolean))]
  const distinctDataTypes = [...new Set(appointments.map(a => a.customer_detail?.data_type_display).filter(Boolean))]
  const distinctStaff     = [...new Set([
    ...appointments.map(a => a.doctor_name),
    ...appointments.map(a => a.bs_dieu_tri_name),
    ...appointments.map(a => a.ktv_name),
  ].filter(Boolean))]
  const distinctSales     = [...new Set(appointments.map(a => a.customer_detail?.sale_name).filter(Boolean))]
  const distinctServices  = [...new Set(appointments.map(a => a.service_name).filter(Boolean))]

  const hasAdvancedFilter = sourceF || groupF || dataTypeF || staffF || saleF || serviceF

  // Reset page on any filter change
  useEffect(() => { setPage(1) }, [search, statusFilter, visitFilter, sourceF, groupF, dataTypeF, staffF, saleF, serviceF])

  const visible = appointments.filter(a => {
    if (statusFilter && a.status !== statusFilter) return false
    if (visitFilter  && a.visit_type !== visitFilter) return false
    if (sourceF   && a.customer_detail?.source_display !== sourceF) return false
    if (groupF    && a.customer_detail?.customer_group !== groupF) return false
    if (dataTypeF && a.customer_detail?.data_type_display !== dataTypeF) return false
    if (staffF    && a.doctor_name !== staffF && a.bs_dieu_tri_name !== staffF && a.ktv_name !== staffF) return false
    if (saleF     && a.customer_detail?.sale_name !== saleF) return false
    if (serviceF  && a.service_name !== serviceF) return false
    if (search) {
      const q  = search.toLowerCase()
      const cd = a.customer_detail ?? {}
      if (
        !a.customer_name?.toLowerCase().includes(q) &&
        !a.customer_phone?.includes(q) &&
        !cd.full_name?.toLowerCase().includes(q) &&
        !cd.phone?.includes(q)
      ) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize))
  const safePage   = Math.min(page, totalPages)
  const pageItems  = visible.slice((safePage - 1) * pageSize, safePage * pageSize)

  const clearAdvanced = () => {
    setSourceF(''); setGroupF(''); setDataTypeF(''); setStaffF(''); setSaleF(''); setServiceF('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0 }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Date navigator */}
        {viewDate !== undefined && (
          <>
            <button onClick={onPrevDate} style={navBtnStyle}>←</button>
            <input
              type="date"
              value={viewDate}
              onChange={e => onDateChange?.(e.target.value)}
              style={{ border: '1px solid #dde3ef', borderRadius: 7, padding: '6px 10px', fontSize: 12, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
            />
            <button onClick={onNextDate} style={navBtnStyle}>→</button>
            <button
              onClick={onTodayDate}
              disabled={isToday}
              style={{ ...navBtnStyle, opacity: isToday ? 0.4 : 1, cursor: isToday ? 'default' : 'pointer', fontWeight: 600, color: ACCENT, borderColor: isToday ? '#dde3ef' : ACCENT }}
            >
              Hôm nay
            </button>
          </>
        )}

        <div style={{ position: 'relative', width: 220 }}>
          <IconSearch size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <input
            placeholder="Tìm tên, SĐT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7, border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
          {STATUS_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select value={visitFilter} onChange={e => setVisitFilter(e.target.value)} style={selectStyle}>
          {VISIT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Nút Bộ lọc */}
        <button
          onClick={() => setShowFilterPanel(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '7px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            border: showFilterPanel ? '1px solid #6d28d9' : '1px solid #dde3ef',
            background: showFilterPanel ? '#ede9fe' : '#fff',
            color: showFilterPanel ? '#6d28d9' : 'inherit',
            fontWeight: showFilterPanel ? 600 : 400,
            position: 'relative',
          }}
        >
          <IconFilter size={13} stroke={2} /> Bộ lọc
          {hasAdvancedFilter && (
            <span style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: '#6d28d9' }} />
          )}
        </button>

        {/* Nút Làm mới */}
        {onReload && (
          <button
            onClick={onReload}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <IconRefresh size={13} stroke={2} /> Làm mới
          </button>
        )}
      </div>

      {/* Advanced filter panel */}
      {showFilterPanel && (
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: 16, marginTop: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            <select value={sourceF} onChange={e => setSourceF(e.target.value)} style={selectStyle}>
              <option value="">Tất cả nguồn</option>
              {distinctSources.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={groupF} onChange={e => setGroupF(e.target.value)} style={selectStyle}>
              <option value="">Tất cả nhóm KH</option>
              {distinctGroups.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={dataTypeF} onChange={e => setDataTypeF(e.target.value)} style={selectStyle}>
              <option value="">Tất cả loại data</option>
              {distinctDataTypes.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={staffF} onChange={e => setStaffF(e.target.value)} style={selectStyle}>
              <option value="">Tất cả BS / KTV</option>
              {distinctStaff.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={saleF} onChange={e => setSaleF(e.target.value)} style={selectStyle}>
              <option value="">Tất cả Sale</option>
              {distinctSales.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={serviceF} onChange={e => setServiceF(e.target.value)} style={selectStyle}>
              <option value="">Tất cả dịch vụ</option>
              {distinctServices.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          {hasAdvancedFilter && (
            <div style={{ marginTop: 10, textAlign: 'right' }}>
              <button
                onClick={clearAdvanced}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 11, color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <IconX size={12} /> Xóa lọc
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, color: '#9ca3af', fontSize: 13 }}>
            Đang tải...
          </div>
        ) : (
          <div style={{ overflowX: 'auto', overflowY: 'scroll', flex: 1, minHeight: 0 }}>
            <table style={{ width: '100%', minWidth: 2700, borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 2 }}>
                  {HEADERS.map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap', background: '#f8fafc' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={HEADERS.length} style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                      Không có lịch hẹn nào
                    </td>
                  </tr>
                ) : pageItems.map(appt => {
                  const cd    = appt.customer_detail ?? {}
                  const money = fmtMoney(cd.total_debt)
                  return (
                    <tr
                      key={appt.id}
                      onClick={() => onRowClick?.(appt)}
                      style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      {/* ── NHÓM LỄ TÂN ── */}
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: ACCENT }}>
                          {fmtTime(appt.scheduled_at)}
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        {appt.visit_type_display || EMPTY}
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        <StatusBadge status={appt.status} status_display={appt.status_display} />
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        {appt.room_name || EMPTY}
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        {appt.doctor_name || EMPTY}
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        {appt.bs_dieu_tri_name || EMPTY}
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        {appt.ktv_name || EMPTY}
                      </td>

                      {/* ── NHÓM KHÁCH ── */}
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 600, color: '#0f2044' }}>
                          {cd.full_name || appt.customer_name}
                        </span>
                        {appt.is_walkin && (
                          <span style={{ marginLeft: 5, fontSize: 10, color: ACCENT, fontWeight: 600 }}>[Walk-in]</span>
                        )}
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontFamily: 'monospace', color: '#374151' }}>
                          {cd.phone || appt.customer_phone || EMPTY}
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        {cd.source_display || EMPTY}
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        {cd.customer_group || EMPTY}
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        {cd.province || EMPTY}
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        {cd.data_type_display || EMPTY}
                      </td>
                      <td style={{ padding: '9px 12px', maxWidth: 180 }}>
                        <span style={{ color: '#64748b', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {cd.services_interest_names?.length
                            ? cd.services_interest_names.join(', ')
                            : EMPTY}
                        </span>
                      </td>

                      {/* ── NHÓM PHÂN CÔNG ── */}
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        {cd.tele_name || EMPTY}
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                        {saleUsers.length > 0 && appt.status !== 'done' && appt.status !== 'cancelled' ? (
                          <select
                            value={appt.sale ?? ''}
                            onChange={e => onAssignSale?.(appt, e.target.value)}
                            style={{ border: '1px solid #dde3ef', borderRadius: 6, fontSize: 11, padding: '3px 6px' }}
                          >
                            <option value="">— Chỉ định —</option>
                            {saleUsers.map(u => (
                              <option key={u.id} value={u.id}>
                                {u.display_name ?? u.full_name ?? u.email}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ color: '#64748b' }}>{cd.sale_name || appt.sale_name || '—'}</span>
                        )}
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        {cd.cskh_name || EMPTY}
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        {cd.ads_name || EMPTY}
                      </td>

                      {/* ── NHÓM NGHIỆP VỤ ── */}
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        <HdStatusBadge hd_status={cd.hd_status} />
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                        {cd.buoi_con_lai != null ? cd.buoi_con_lai : EMPTY}
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        {money
                          ? <span style={{ color: '#dc2626', fontWeight: 600 }}>{money}</span>
                          : EMPTY}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination bar — fixed bottom */}
      <div style={{
        position: 'fixed', bottom: 0, left: 'var(--sidebar-w)', right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 24px', background: '#fff', borderTop: '1px solid #dde3ef',
      }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>
          Trang {safePage} / {totalPages} ({visible.length} kết quả)
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
            style={selectStyle}
          >
            {[20, 50, 100, 200, 500, 1000].map(n => (
              <option key={n} value={n}>Hiển thị {n}/trang</option>
            ))}
          </select>
          <button
            disabled={safePage <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            style={pgBtnStyle(safePage <= 1)}
          >
            ← Trước
          </button>
          <button
            disabled={safePage >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            style={pgBtnStyle(safePage >= totalPages)}
          >
            Tiếp →
          </button>
        </div>
      </div>
    </div>
  )
}
