import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import useAuthStore from '../../store/authStore'
import { getUserRole } from '../../utils/rolesV2'
import {
  IconChartBar, IconCurrencyDong, IconPhone, IconDatabase,
  IconStethoscope, IconUserCheck, IconSpeakerphone, IconHeart,
  IconCrown, IconPhoneCheck, IconBuilding, IconTrendingUp,
  IconPercentage, IconReceipt, IconClockDollar, IconCalendarCheck,
  IconDoorEnter, IconFilter, IconStar, IconCoin, IconWallet,
  IconListCheck, IconRefresh, IconMessage, IconTable, IconLock,
  IconPencil, IconChecks, IconUsers, IconLayoutGrid, IconFlag,
  IconBell, IconAlertTriangle, IconInfoCircle, IconTrophy,
} from '@tabler/icons-react'

// ── helpers ─────────────────────────────────────────────────
const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')
const now = new Date()
const MONTH_LABEL = `T${String(now.getMonth() + 1).padStart(2,'0')}/${now.getFullYear()}`

// ── role → kpi config ────────────────────────────────────────
function getRoleKpiKey(role) {
  const map = {
    SALE: 'sale', LEAD_SALE: 'lead',
    TELE: 'tele', LEAD_TELE: 'lead_tele',
    TRUC_PAGE: 'truc',
    BS: 'bs', KTV: 'ktv',
    MKT: 'mkt', LEAD_MKT: 'mkt',
    CSKH: 'cskh', LEAD_CSKH: 'cskh',
    QUAN_LY: 'ql', CHU_DN: 'ql',
    LE_TAN: 'letanktv', KE_TOAN: 'letanktv',
  }
  return map[role] ?? 'sale'
}

const ROLE_CFG = {
  sale: {
    color: '#15803d', icon: <IconCurrencyDong size={14}/>,
    title: 'KPI của tôi · Sale',
    tabs: [
      { id: 'sale-main', l: 'KPI của tôi', icon: <IconUserCheck size={12}/> },
      { id: 'sale-no',   l: 'Công nợ cần thu', icon: <IconClockDollar size={12}/> },
      { id: 'sale-luong',l: 'Lương ước tính', icon: <IconWallet size={12}/> },
    ],
  },
  tele: {
    color: '#0369a1', icon: <IconPhone size={14}/>,
    title: 'KPI của tôi · Tele',
    tabs: [
      { id: 'tele-main', l: 'KPI của tôi', icon: <IconUserCheck size={12}/> },
      { id: 'tele-luong',l: 'Lương ước tính', icon: <IconWallet size={12}/> },
    ],
  },
  truc: {
    color: '#6d28d9', icon: <IconDatabase size={14}/>,
    title: 'KPI của tôi · Trực page',
    tabs: [
      { id: 'truc-main', l: 'KPI của tôi', icon: <IconUserCheck size={12}/> },
    ],
  },
  bs: {
    color: '#991b1b', icon: <IconStethoscope size={14}/>,
    title: 'KPI của tôi · Bác sĩ',
    tabs: [
      { id: 'bs-main', l: 'KPI của tôi', icon: <IconUserCheck size={12}/> },
    ],
  },
  ktv: {
    color: '#0369a1', icon: <IconUserCheck size={14}/>,
    title: 'KPI của tôi · KTV',
    tabs: [
      { id: 'ktv-main', l: 'KPI của tôi', icon: <IconUserCheck size={12}/> },
    ],
  },
  mkt: {
    color: '#059669', icon: <IconSpeakerphone size={14}/>,
    title: 'KPI Marketing',
    tabs: [
      { id: 'mkt-content', l: 'KPI Content', icon: <IconPencil size={12}/> },
      { id: 'mkt-ads',     l: 'KPI Ads',     icon: <IconSpeakerphone size={12}/> },
    ],
  },
  cskh: {
    color: '#be185d', icon: <IconHeart size={14}/>,
    title: 'KPI của tôi · CSKH',
    tabs: [
      { id: 'cskh-main', l: 'KPI của tôi', icon: <IconHeart size={12}/> },
    ],
  },
  lead: {
    color: '#5b21b6', icon: <IconCrown size={14}/>,
    title: 'KPI Lead Sale + Team',
    tabs: [
      { id: 'lead-canhan', l: 'KPI cá nhân', icon: <IconUserCheck size={12}/> },
      { id: 'lead-team',   l: 'Team Sale',   icon: <IconUsers size={12}/> },
      { id: 'lead-tong',   l: 'Tổng cơ sở', icon: <IconBuilding size={12}/> },
    ],
  },
  lead_tele: {
    color: '#0284c7', icon: <IconPhoneCheck size={14}/>,
    title: 'KPI Lead Tele + Team',
    tabs: [
      { id: 'lt-canhan', l: 'KPI cá nhân', icon: <IconUserCheck size={12}/> },
      { id: 'lt-team',   l: 'Team Tele',   icon: <IconUsers size={12}/> },
      { id: 'lt-tong',   l: 'Tổng cơ sở', icon: <IconBuilding size={12}/> },
    ],
  },
  ql: {
    color: '#dc2626', icon: <IconBuilding size={14}/>,
    title: 'KPI Tổng cơ sở — Quản lý',
    tabs: [
      { id: 'ql-co-so',  l: 'Tổng cơ sở', icon: <IconBuilding size={12}/> },
      { id: 'ql-sale',   l: 'Team Sale',   icon: <IconCurrencyDong size={12}/> },
      { id: 'ql-tele',   l: 'Team Tele',   icon: <IconPhone size={12}/> },
      { id: 'ql-bs-ktv', l: 'BS / KTV',    icon: <IconStethoscope size={12}/> },
      { id: 'ql-cskh',   l: 'CSKH',        icon: <IconHeart size={12}/> },
      { id: 'ql-luong',  l: 'Bảng lương',  icon: <IconWallet size={12}/> },
    ],
  },
  letanktv: {
    color: '#b45309', icon: <IconUserCheck size={14}/>,
    title: 'KPI của tôi',
    tabs: [
      { id: 'ql-co-so', l: 'Tổng cơ sở', icon: <IconBuilding size={12}/> },
    ],
  },
}

// ── base ui helpers ───────────────────────────────────────────
function Prog({ pct, color }) {
  return (
    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden', marginTop: 7 }}>
      <div style={{ height: '100%', width: `${Math.min(pct ?? 0, 100)}%`, background: color, borderRadius: 10 }} />
    </div>
  )
}

function KpiCard({ lbl, val, sub, pct, color, icon }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${color ?? '#dde3ef'}`, borderRadius: 10, padding: '13px 14px' }}>
      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
        {icon && <span style={{ color }}>{icon}</span>}
        {lbl}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color ?? '#0f2044', lineHeight: 1.1 }}>{val}</div>
      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{sub}</div>
      {pct != null && <Prog pct={pct} color={color ?? '#0284c7'} />}
    </div>
  )
}

function CardHd({ icon, children, badge }) {
  return (
    <div style={{ padding: '9px 14px', borderBottom: '1px solid #eef1f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#0f2044', display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon} {children}
      </div>
      {badge && <span style={{ background: '#fef9c3', color: '#854d0e', borderRadius: 20, padding: '1px 8px', fontSize: 8, fontWeight: 600 }}>{badge}</span>}
    </div>
  )
}

function Card({ children, style }) {
  return <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden', ...style }}>{children}</div>
}

function Tbl({ children }) {
  return <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>{children}</table>
}
function Th({ children, r }) {
  return <th style={{ padding: '7px 12px', textAlign: r ? 'right' : 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', background: '#f8fafc', whiteSpace: 'nowrap' }}>{children}</th>
}
function Td({ children, r, style }) {
  return <td style={{ padding: '8px 12px', textAlign: r ? 'right' : 'left', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle', ...style }}>{children}</td>
}
function Bdg({ children, bg, c }) {
  return <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 600, background: bg, color: c, whiteSpace: 'nowrap' }}>{children}</span>
}

function FunnelStep({ label, value, pct, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ width: 80, fontSize: 10, color: '#64748b', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 22, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(pct ?? 0, 2)}%`, background: color, borderRadius: 6, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>{value}</span>
        </div>
      </div>
      <div style={{ width: 36, textAlign: 'right', fontSize: 10, fontWeight: 600, color, flexShrink: 0 }}>{pct}%</div>
    </div>
  )
}

function RankRow({ rank, av, avBg, avC, name, code, sub, progress, val, badge, badgeBg, badgeC }) {
  const rankBg = rank === 1 ? '#fde68a' : rank === 2 ? '#e2e8f0' : '#fee2e2'
  const rankC  = rank === 1 ? '#854d0e' : rank === 2 ? '#475569' : '#991b1b'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', background: rankBg, color: rankC, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{rank}</div>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: avBg, color: avC, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{av}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{name} <span style={{ fontSize: 9, color: '#94a3b8' }}>{code}</span></div>
        <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{sub}</div>
        {progress != null && <div style={{ marginTop: 4 }}><Prog pct={progress} color={rank === 1 ? '#15803d' : rank === 2 ? '#0284c7' : '#ea580c'} /></div>}
      </div>
      {val && <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: rank === 1 ? '#15803d' : rank === 2 ? '#0284c7' : '#ea580c' }}>{val}</div>
        {badge && <Bdg bg={badgeBg} c={badgeC}>{badge}</Bdg>}
      </div>}
    </div>
  )
}

function LuongBox({ color, bg, border, title, rows, total }) {
  return (
    <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
        <IconWallet size={14}/> {title}
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', borderBottom: `1px solid rgba(0,0,0,.06)` }}>
          <span style={{ color: '#64748b' }}>{r.label}</span>
          <span style={{ color: r.color }}>{r.val}</span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, paddingTop: 10, marginTop: 6, borderTop: '1.5px dashed rgba(0,0,0,.1)' }}>
        <span style={{ color }}>Thực lãnh (ước tính)</span>
        <span style={{ color, fontSize: 22 }}>{total}</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 10, color: '#64748b' }}>(*) Chính thức sau khi KT duyệt và chốt lương cuối tháng</div>
    </div>
  )
}

// ── SCREEN COMPONENTS ────────────────────────────────────────

function ScSaleMain() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        <KpiCard lbl="DT khoán tháng" val="65tr đ" sub="Khoán: 50tr · 130% ✓" pct={100} color="#15803d" icon={<IconTrendingUp size={13}/>} />
        <KpiCard lbl="Tỷ lệ chốt" val="83.3%" sub="5 chốt / 6 tư vấn · MT: 80%" pct={83} color="#0284c7" icon={<IconPercentage size={13}/>} />
        <KpiCard lbl="Trung bình bill" val="13tr đ" sub="65tr / 5 KH chốt · MT: 10tr" pct={100} color="#854d0e" icon={<IconReceipt size={13}/>} />
        <KpiCard lbl="Công nợ cần thu" val="9tr đ" sub="Tổng: 15tr · Đã thu: 6tr" pct={40} color="#ea580c" icon={<IconClockDollar size={13}/>} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Card>
          <CardHd icon={<IconReceipt size={13} style={{color:'#15803d'}}/>}>Chi tiết từng giao dịch</CardHd>
          <Tbl>
            <thead><tr><Th>Khách hàng</Th><Th>Dịch vụ</Th><Th r>Bill</Th><Th>Trạng thái</Th></tr></thead>
            <tbody>
              <tr><Td><b>Anh Khoi LE</b></Td><Td><span style={{fontSize:10}}>SEO rỗ · 11 buổi</span></Td><Td r><span style={{color:'#15803d',fontWeight:600}}>15.000.000đ</span></Td><Td><Bdg bg="#dcfce7" c="#15803d">TT đủ</Bdg></Td></tr>
              <tr><Td><b>Trần Thu Ngân</b></Td><Td><span style={{fontSize:10}}>SEO rỗ · 10 buổi</span></Td><Td r><span style={{fontWeight:600}}>15.000.000đ</span></Td><Td><Bdg bg="#fef9c3" c="#854d0e">Chờ KT</Bdg></Td></tr>
              <tr><Td><b>Dat Huynh</b></Td><Td><span style={{fontSize:10}}>SEO rỗ · 11 buổi</span></Td><Td r><span style={{fontWeight:600}}>15.000.000đ</span></Td><Td><Bdg bg="#dcfce7" c="#15803d">TT đủ</Bdg></Td></tr>
              <tr><Td><b>Kathy Le</b></Td><Td><span style={{fontSize:10}}>Điều trị mụn · 10 buổi</span></Td><Td r><span style={{fontWeight:600}}>10.000.000đ</span></Td><Td><Bdg bg="#dcfce7" c="#15803d">TT đủ</Bdg></Td></tr>
              <tr><Td><b>Thảo Vi</b></Td><Td><span style={{fontSize:10}}>Trẻ hoá da · 6 buổi</span></Td><Td r><span style={{fontWeight:600}}>10.000.000đ</span></Td><Td><Bdg bg="#fee2e2" c="#991b1b">Nợ 5tr</Bdg></Td></tr>
            </tbody>
            <tfoot><tr>
              <td colSpan={2} style={{padding:'8px 12px',fontWeight:700,background:'#f8fafc',borderTop:'2px solid #dde3ef'}}>TB bill / KH</td>
              <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,background:'#f8fafc',borderTop:'2px solid #dde3ef',color:'#15803d'}}>13.000.000đ</td>
              <td style={{padding:'8px 12px',background:'#f8fafc',borderTop:'2px solid #dde3ef'}}></td>
            </tr></tfoot>
          </Tbl>
        </Card>
        <Card>
          <CardHd icon={<IconFlag size={13} style={{color:'#15803d'}}/>}>Milestones {MONTH_LABEL}</CardHd>
          <div style={{padding:'12px 14px'}}>
            {[
              { bg:'#f0fdf4', c:'#15803d', label:'Đạt 50tr DT khoán', done:'✓ 12/05' },
              { bg:'#f0fdf4', c:'#15803d', label:'5 KH chốt · Tỷ lệ >80%', done:'✓ 20/05' },
              { bg:'#f0fdf4', c:'#15803d', label:'TB bill > 10tr', done:'✓ 13tr đ/KH' },
              { bg:'#fffbeb', c:'#854d0e', label:'Thu hết 15tr nợ', done:'Còn 9tr', dotC:'#ca8a04' },
              { bg:'#f8fafc', c:'#94a3b8', label:'Đạt 80tr (bonus đặc biệt)', done:'Còn 15tr', dotC:'#e2e8f0' },
            ].map((m, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:7, fontSize:11, marginBottom:5, background:m.bg }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:m.dotC ?? m.c, flexShrink:0 }} />
                <span style={{ color:m.c, fontWeight:500, flex:1 }}>{m.label}</span>
                <span style={{ fontSize:10, color: m.done.startsWith('✓') ? m.c : '#94a3b8' }}>{m.done}</span>
              </div>
            ))}
            <div style={{ marginTop:10, padding:'9px 11px', background:'#f0fdf4', borderRadius:8, fontSize:10, color:'#15803d', border:'1px solid #bbf7d0' }}>
              <b>Hoa hồng {MONTH_LABEL}:</b> 5% × 65tr = 3.250.000đ · Bậc: Vượt chỉ tiêu (&gt;50tr)
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function ScSaleNo() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
        <KpiCard lbl="Tổng còn nợ" val="9.000.000đ" sub="2 KH" color="#dc2626" />
        <KpiCard lbl="Đã thu T05" val="6.000.000đ" sub="Từ 3 KH" color="#15803d" />
        <KpiCard lbl="Quá hạn" val="1 KH" sub="Thảo Vi · +2 ngày" color="#ea580c" />
      </div>
      <Card>
        <CardHd icon={<IconListCheck size={13} style={{color:'#dc2626'}}/>}>Chi tiết công nợ</CardHd>
        <Tbl>
          <thead><tr><Th>KH</Th><Th r>Tổng HĐ</Th><Th r>Đã thu</Th><Th r>Còn nợ</Th><Th>Hạn TT</Th><Th>Trạng thái</Th></tr></thead>
          <tbody>
            <tr style={{background:'#fef2f2'}}>
              <Td><b>Thảo Vi</b></Td><Td r>18.000.000đ</Td>
              <Td r><span style={{color:'#15803d'}}>13.000.000đ</span></Td>
              <Td r><span style={{color:'#dc2626',fontWeight:700}}>5.000.000đ</span></Td>
              <Td><span style={{fontSize:10,color:'#dc2626'}}>26/05 QUÁ HẠN</span></Td>
              <Td><Bdg bg="#fee2e2" c="#991b1b">Trễ 2 ngày</Bdg></Td>
            </tr>
            <tr>
              <Td><b>Anh Khoi LE</b></Td><Td r>15.000.000đ</Td>
              <Td r><span style={{color:'#15803d'}}>11.000.000đ</span></Td>
              <Td r><span style={{color:'#854d0e',fontWeight:700}}>4.000.000đ</span></Td>
              <Td><span style={{fontSize:10}}>15/06</span></Td>
              <Td><Bdg bg="#fef9c3" c="#854d0e">Chưa đến hạn</Bdg></Td>
            </tr>
          </tbody>
          <tfoot><tr>
            <td colSpan={4} style={{padding:'8px 12px',fontWeight:700,background:'#f8fafc',borderTop:'2px solid #dde3ef'}}>Tổng</td>
            <td colSpan={2} style={{padding:'8px 12px',fontWeight:700,background:'#f8fafc',borderTop:'2px solid #dde3ef',color:'#dc2626'}}>9.000.000đ</td>
          </tr></tfoot>
        </Tbl>
      </Card>
    </div>
  )
}

function ScSaleLuong() {
  return (
    <LuongBox
      color="#15803d" bg="#f0fdf4" border="#16a34a"
      title={`Lương ước tính ${MONTH_LABEL} · S001 Nguyễn T. Thủy Linh`}
      rows={[
        { label:'Lương cứng', val:'10.000.000đ' },
        { label:'Hoa hồng 5% × 65tr DT', val:'3.250.000đ', color:'#15803d' },
        { label:'Thưởng vượt khoán', val:'2.000.000đ', color:'#1d4ed8' },
        { label:'Bonus TB bill > 10tr', val:'500.000đ', color:'#5b21b6' },
        { label:'Khấu trừ (BHXH + thuế)', val:'-1.450.000đ', color:'#dc2626' },
      ]}
      total="14.300.000đ"
    />
  )
}

function ScTeleMain() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        <KpiCard lbl="Data nhận" val="29" sub="MT: 30 · 96.7%" pct={97} color="#0369a1" icon={<IconDatabase size={13}/>} />
        <KpiCard lbl="Gọi được" val="24" sub="82.8% data · MT: 80%" pct={83} color="#15803d" icon={<IconPhoneCheck size={13}/>} />
        <KpiCard lbl="Đã hẹn" val="14" sub="48.3% · MT: 50%" pct={83} color="#854d0e" icon={<IconCalendarCheck size={13}/>} />
        <KpiCard lbl="KH đến PK" val="78.6%" sub="11/14 hẹn đã đến" pct={79} color="#15803d" icon={<IconDoorEnter size={13}/>} />
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <Card>
          <CardHd icon={<IconFilter size={13} style={{color:'#0369a1'}}/>}>Phễu chuyển đổi Tele</CardHd>
          <FunnelStep label="Data nhận"  value="29 data"  pct={100} color="#6d28d9" />
          <FunnelStep label="Gọi được"   value="24 người" pct={83}  color="#0369a1" />
          <FunnelStep label="Đã hẹn"     value="17 KH"    pct={58}  color="#0284c7" />
          <FunnelStep label="KH đến PK"  value="13 KH"    pct={45}  color="#854d0e" />
          <FunnelStep label="Đã mua DV"  value="8 KH"     pct={28}  color="#15803d" />
        </Card>
        <Card>
          <CardHd icon={<IconPhone size={13} style={{color:'#0369a1'}}/>}>Lịch sử gọi hôm nay</CardHd>
          <Tbl>
            <thead><tr><Th>Giờ</Th><Th>KH</Th><Th>Lần</Th><Th>Kết quả</Th></tr></thead>
            <tbody>
              <tr><Td>14:45</Td><Td>Lê Thị Mỹ</Td><Td>1</Td><Td><Bdg bg="#dcfce7" c="#15803d">Đã hẹn 25/05</Bdg></Td></tr>
              <tr><Td>13:15</Td><Td>Phạm Thị Lan</Td><Td>1</Td><Td><Bdg bg="#dcfce7" c="#15803d">Đã hẹn 25/05</Bdg></Td></tr>
              <tr><Td>11:30</Td><Td>Trần Văn Nam</Td><Td>1</Td><Td><Bdg bg="#dbeafe" c="#1e40af">Máy bận</Bdg></Td></tr>
              <tr><Td>10:30</Td><Td>Nguyễn Văn Tú</Td><Td>1</Td><Td><Bdg bg="#f1f5f9" c="#475569">Không nhu cầu</Bdg></Td></tr>
            </tbody>
          </Tbl>
        </Card>
      </div>
    </div>
  )
}

function ScTeleLuong() {
  return (
    <LuongBox
      color="#1d4ed8" bg="#eff6ff" border="#bfdbfe"
      title={`Lương ước tính ${MONTH_LABEL} · T002 Phạm T. Linh`}
      rows={[
        { label:'Lương cứng', val:'8.000.000đ' },
        { label:'Thưởng KPI (data 96.7%)', val:'500.000đ', color:'#1d4ed8' },
        { label:'Thưởng số lịch hẹn KH đến (11)', val:'1.100.000đ', color:'#1d4ed8' },
        { label:'Khấu trừ', val:'-950.000đ', color:'#dc2626' },
      ]}
      total="8.650.000đ"
    />
  )
}

function ScTrucMain() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        <KpiCard lbl="Tổng tương tác nhận" val="312" sub="Mess + Comment + Like + DM" color="#6d28d9" icon={<IconMessage size={13}/>} />
        <KpiCard lbl="Chuyển đổi ra data" val="89" sub="Tỷ lệ: 28.5% · MT: 30%" pct={95} color="#dc2626" icon={<IconDatabase size={13}/>} />
        <KpiCard lbl="Data nóng (phân loại)" val="31" sub="34.8% tổng data · MT: 40%" pct={87} color="#ea580c" />
        <KpiCard lbl="Thời gian phản hồi TB" val="4.2 phút" sub="MT: ≤5 phút · Đạt" pct={84} color="#854d0e" />
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <Card>
          <CardHd icon={<IconFilter size={13} style={{color:'#6d28d9'}}/>}>Phễu tương tác → data → mua</CardHd>
          <FunnelStep label="Tương tác"    value="312 lượt" pct={100} color="#6d28d9" />
          <FunnelStep label="Chuyển ra data" value="89 data" pct={28} color="#dc2626" />
          <FunnelStep label="Data nóng"    value="31"       pct={10} color="#ea580c" />
          <FunnelStep label="Đã hẹn"       value="41 KH"    pct={13} color="#854d0e" />
          <FunnelStep label="Đã mua DV"    value="24 KH"    pct={8}  color="#15803d" />
        </Card>
        <Card>
          <CardHd icon={<IconChartBar size={13} style={{color:'#6d28d9'}}/>}>Chuyển đổi theo nguồn</CardHd>
          <Tbl>
            <thead><tr><Th>Nguồn</Th><Th r>Tương tác</Th><Th r>Data</Th><Th r>Tỷ lệ CĐ</Th><Th r>DT</Th></tr></thead>
            <tbody>
              <tr><Td><Bdg bg="#ede9fe" c="#5b21b6">Facebook</Bdg></Td><Td r>156</Td><Td r>42</Td><Td r><span style={{color:'#15803d'}}>26.9%</span></Td><Td r><span style={{color:'#15803d'}}>48tr</span></Td></tr>
              <tr><Td><Bdg bg="#fee2e2" c="#991b1b">TikTok</Bdg></Td><Td r>98</Td><Td r>28</Td><Td r><span style={{color:'#15803d'}}>28.6%</span></Td><Td r><span style={{color:'#15803d'}}>35tr</span></Td></tr>
              <tr><Td><Bdg bg="#dbeafe" c="#1e40af">Zalo</Bdg></Td><Td r>38</Td><Td r>12</Td><Td r><span style={{color:'#15803d'}}>31.6%</span></Td><Td r><span style={{color:'#15803d'}}>18tr</span></Td></tr>
              <tr><Td><Bdg bg="#dcfce7" c="#15803d">Giới thiệu</Bdg></Td><Td r>20</Td><Td r>7</Td><Td r><span style={{color:'#15803d'}}>35%</span></Td><Td r><span style={{color:'#15803d'}}>12tr</span></Td></tr>
            </tbody>
          </Tbl>
        </Card>
      </div>
    </div>
  )
}

function ScBsKtvMain({ isBS }) {
  const c = isBS ? '#991b1b' : '#0369a1'
  const name = isBS ? 'BS KIÊN' : 'KTV Hà'
  const buoi = isBS ? 24 : 18
  const dt = isBS ? '34.2tr đ' : '22.5tr đ'
  const tua = isBS ? '10.8tr đ' : '3.6tr đ'
  const tuaSub = isBS ? '24 buổi × 450.000đ' : '18 buổi × 200.000đ'
  const hl = isBS ? '4.7 ⭐' : '4.5 ⭐'
  const dtMonths = isBS
    ? [['T02/2026','22.500.000đ',65],['T03/2026','28.800.000đ',84],['T04/2026','31.500.000đ',92],['T05/2026 ◀','34.200.000đ ↑',100]]
    : [['T03','16.200.000đ',72],['T04','19.800.000đ',88],['T05 ◀','22.500.000đ ↑',100]]

  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        <KpiCard lbl="DT từ buổi điều trị" val={dt} sub={`${buoi} buổi · MT: ${isBS?'30tr':'20tr'}`} pct={100} color={c} icon={<IconTrendingUp size={13}/>} />
        <KpiCard lbl="Số buổi điều trị" val={String(buoi)} sub={`MT: ${isBS?20:18} buổi/tháng · ${isBS?120:100}%`} pct={100} color="#15803d" icon={<IconCalendarCheck size={13}/>} />
        <KpiCard lbl="Hài lòng KH trung bình" val={hl} sub="MT: ≥4.5 · Đạt" pct={isBS?94:90} color="#f59e0b" icon={<IconStar size={13}/>} />
        <KpiCard lbl="Tua tháng" val={tua} sub={tuaSub} pct={isBS?85:80} color="#5b21b6" icon={<IconCoin size={13}/>} />
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <Card>
          <CardHd icon={<IconStar size={13} style={{color:'#f59e0b'}}/>}>Hài lòng KH theo buổi — {name}</CardHd>
          <Tbl>
            <thead><tr><Th>Buổi / KH</Th><Th>Dịch vụ</Th><Th>Ngày</Th><Th r>Đánh giá</Th></tr></thead>
            <tbody>
              <tr><Td><b>Kathy Le · B3</b></Td><Td><span style={{fontSize:10}}>Điều trị mụn</span></Td><Td><span style={{fontSize:10}}>15/05</span></Td><Td r><span style={{color:'#f59e0b'}}>★★★★★ 5</span></Td></tr>
              <tr><Td><b>Anh Khoi LE · B1</b></Td><Td><span style={{fontSize:10}}>SEO rỗ</span></Td><Td><span style={{fontSize:10}}>22/05</span></Td><Td r><span style={{color:'#f59e0b'}}>★★★★☆ 4</span></Td></tr>
              <tr><Td><b>Dat Huynh · B5</b></Td><Td><span style={{fontSize:10}}>SEO rỗ</span></Td><Td><span style={{fontSize:10}}>20/05</span></Td><Td r><span style={{color:'#f59e0b'}}>{isBS?'★★★★★ 5':'★★★★☆ 4'}</span></Td></tr>
            </tbody>
          </Tbl>
          <div style={{padding:'9px 14px',background:'#fffbeb',borderTop:'1px solid #fde68a',fontSize:10,color:'#854d0e'}}>
            TB: <b>{isBS?'4.7':'4.5'}/5</b> · CSKH gửi form đánh giá qua Zalo OA sau mỗi buổi
          </div>
        </Card>
        <Card>
          <CardHd icon={<IconTrendingUp size={13} style={{color:c}}/>}>DT theo tháng (xu hướng)</CardHd>
          <div style={{padding:14,display:'flex',flexDirection:'column',gap:8}}>
            {dtMonths.map(([t,v,p],i) => (
              <div key={i}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:4}}>
                  <span style={{fontWeight:i===dtMonths.length-1?600:400}}>{t}</span>
                  <span style={{color:i===dtMonths.length-1?c:'#15803d',fontWeight:i===dtMonths.length-1?600:400}}>{v}</span>
                </div>
                <Prog pct={p} color={i===dtMonths.length-1?c:'#15803d'} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function ScMKTContent() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        <KpiCard lbl="Bài content T05" val="24/30" sub="MT: 30 · 80%" pct={80} color="#059669" icon={<IconPencil size={13}/>} />
        <KpiCard lbl="Đúng deadline" val="91.7%" sub="22/24 · MT: 90%" pct={92} color="#15803d" icon={<IconChecks size={13}/>} />
        <KpiCard lbl="Duyệt lần 1" val="75%" sub="18/24 · MT: 80%" pct={75} color="#0284c7" icon={<IconChecks size={13}/>} />
        <KpiCard lbl="Mess từ content" val="342" sub="8 bài · MT: 450" pct={76} color="#5b21b6" icon={<IconMessage size={13}/>} />
      </div>
      <Card>
        <CardHd icon={<IconTrendingUp size={13} style={{color:'#059669'}}/>}>Hiệu quả top bài</CardHd>
        <Tbl>
          <thead><tr><Th>Bài đăng</Th><Th>Nền tảng</Th><Th r>Reach</Th><Th r>Tương tác</Th><Th r>Mess</Th></tr></thead>
          <tbody>
            <tr><Td><span style={{fontSize:10}}>3 lầm tưởng về sẹo rỗ</span></Td><Td><Bdg bg="#ede9fe" c="#5b21b6">TikTok</Bdg></Td><Td r><span style={{color:'#5b21b6',fontWeight:600}}>245K</span></Td><Td r>4.6K</Td><Td r><span style={{color:'#15803d',fontWeight:600}}>89</span></Td></tr>
            <tr><Td><span style={{fontSize:10}}>Before/After sẹo rỗ KH</span></Td><Td><Bdg bg="#fce7f3" c="#be185d">IG</Bdg></Td><Td r>8.2K</Td><Td r>520</Td><Td r><span style={{color:'#15803d'}}>31</span></Td></tr>
            <tr><Td><span style={{fontSize:10}}>Gặp gỡ BS KIÊN</span></Td><Td><Bdg bg="#dbeafe" c="#1e40af">Facebook</Bdg></Td><Td r>12.4K</Td><Td r>340</Td><Td r><span style={{color:'#15803d'}}>24</span></Td></tr>
          </tbody>
        </Tbl>
      </Card>
    </div>
  )
}

function ScMKTAds() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        <KpiCard lbl="Chi phí Ads" val="85.5tr đ" sub="Ngân sách: 100tr · 85.5%" pct={85} color="#0284c7" icon={<IconCoin size={13}/>} />
        <KpiCard lbl="Tổng Mess" val="342" sub="MT: 450 · 76%" pct={76} color="#5b21b6" icon={<IconMessage size={13}/>} />
        <KpiCard lbl="ROAS" val="1.41x" sub="MT: ≥1.5x · Chưa đạt" pct={70} color="#854d0e" icon={<IconTrendingUp size={13}/>} />
        <KpiCard lbl="CPL" val="960k" sub="MT: ≤800k · Cần tối ưu" pct={60} color="#dc2626" icon={<IconUsers size={13}/>} />
      </div>
      <Card>
        <CardHd icon={<IconLayoutGrid size={13} style={{color:'#0284c7'}}/>}>Hiệu quả theo nền tảng</CardHd>
        <Tbl>
          <thead><tr><Th>Nền tảng</Th><Th r>CP</Th><Th r>Mess</Th><Th r>Data</Th><Th r>CPL</Th><Th r>ROAS</Th><Th>Đánh giá</Th></tr></thead>
          <tbody>
            <tr><Td><b>Facebook</b></Td><Td r>45.2tr</Td><Td r>189</Td><Td r>48</Td><Td r>941k</Td><Td r><span style={{color:'#854d0e'}}>1.37x</span></Td><Td><Bdg bg="#fef9c3" c="#854d0e">Khá</Bdg></Td></tr>
            <tr style={{background:'#f0fdf4'}}><Td><b>TikTok</b></Td><Td r>22.3tr</Td><Td r>98</Td><Td r>27</Td><Td r><span style={{color:'#15803d'}}>826k</span></Td><Td r><span style={{color:'#15803d',fontWeight:600}}>1.59x</span></Td><Td><Bdg bg="#dcfce7" c="#15803d">Tốt nhất</Bdg></Td></tr>
            <tr style={{background:'#fef2f2'}}><Td><b>Instagram</b></Td><Td r>8.5tr</Td><Td r>32</Td><Td r>8</Td><Td r><span style={{color:'#dc2626'}}>1.063k</span></Td><Td r><span style={{color:'#dc2626'}}>1.12x</span></Td><Td><Bdg bg="#fee2e2" c="#991b1b">Kém</Bdg></Td></tr>
            <tr><Td><b>Zalo OA</b></Td><Td r>5.5tr</Td><Td r>18</Td><Td r>5</Td><Td r>1.100k</Td><Td r>1.45x</Td><Td><Bdg bg="#fef9c3" c="#854d0e">Khá</Bdg></Td></tr>
          </tbody>
        </Tbl>
      </Card>
    </div>
  )
}

function ScCSKHMain() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        <KpiCard lbl="LT đang theo dõi" val="12" sub="MT: ≤15 · Đạt" pct={80} color="#be185d" icon={<IconListCheck size={13}/>} />
        <KpiCard lbl="Hài lòng TB" val="4.6 ⭐" sub="MT: ≥4.5 · Đạt" pct={92} color="#f59e0b" icon={<IconStar size={13}/>} />
        <KpiCard lbl="Nhắc đúng hạn" val="94%" sub="MT: ≥90% · Đạt" pct={94} color="#0284c7" icon={<IconBell size={13}/>} />
        <KpiCard lbl="Tỷ lệ tái khám" val="67%" sub="8/12 LT HT · MT: 70%" pct={95} color="#5b21b6" icon={<IconRefresh size={13}/>} />
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <Card>
          <CardHd icon={<IconCurrencyDong size={13} style={{color:'#be185d'}}/>}>DT từ tái khám + giới thiệu</CardHd>
          <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:8}}>
            <div style={{background:'#fdf2f8',borderRadius:8,padding:10,border:'1px solid #fbcfe8'}}>
              <div style={{fontSize:11,fontWeight:600,color:'#be185d',marginBottom:5}}>DT từ KH tái khám {MONTH_LABEL}</div>
              <div style={{fontSize:20,fontWeight:700,color:'#be185d'}}>15.000.000đ</div>
              <div style={{fontSize:10,color:'#64748b',marginTop:3}}>4 KH quay lại · TB 3.75tr/KH</div>
            </div>
            <div style={{background:'#eff6ff',borderRadius:8,padding:10,border:'1px solid #bfdbfe'}}>
              <div style={{fontSize:11,fontWeight:600,color:'#1d4ed8',marginBottom:5}}>DT từ KH được giới thiệu {MONTH_LABEL}</div>
              <div style={{fontSize:20,fontWeight:700,color:'#1d4ed8'}}>28.000.000đ</div>
              <div style={{fontSize:10,color:'#64748b',marginTop:3}}>6 KH mới từ giới thiệu · TB 4.67tr/KH</div>
            </div>
          </div>
        </Card>
        <Card>
          <CardHd icon={<IconStar size={13} style={{color:'#f59e0b'}}/>}>Phân bổ đánh giá</CardHd>
          <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:6}}>
            {[['5⭐','#f59e0b','56%','18 KH',56],['4⭐','#fbbf24','31%','10 KH',31],['3⭐','#854d0e','9%','3',9],['≤2⭐','#dc2626','3%','1',3]].map(([star,c,pct,n,p]) => (
              <div key={star} style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:11,width:26,textAlign:'right',color:c,fontWeight:600}}>{star}</span>
                <div style={{flex:1,height:18,background:'#f1f5f9',borderRadius:5,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${p}%`,background:c,borderRadius:5,display:'flex',alignItems:'center',padding:'0 7px'}}>
                    <span style={{fontSize:10,fontWeight:600,color:'#fff'}}>{n}</span>
                  </div>
                </div>
                <span style={{fontSize:10,color:'#94a3b8',width:36}}>{pct}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function ScQLCoSo() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
        <KpiCard lbl="DT tổng cơ sở (đã duyệt)" val="120tr đ" sub="MT tháng: 150tr · 80%" pct={80} color="#dc2626" icon={<IconTrendingUp size={13}/>} />
        <KpiCard lbl="KH mới tháng" val="24 KH" sub="MT: 30 · 80%" pct={80} color="#854d0e" icon={<IconUsers size={13}/>} />
        <KpiCard lbl="Tổng buổi điều trị" val="100" sub="BS/KTV 5 người · T05" color="#0369a1" icon={<IconCalendarCheck size={13}/>} />
      </div>
      <Card>
        <CardHd icon={<IconBuilding size={13} style={{color:'#dc2626'}}/>} badge="MKT báo cáo thẳng về công ty — không qua quản lý cơ sở">KPI từng bộ phận</CardHd>
        <Tbl>
          <thead><tr><Th>Bộ phận</Th><Th>Chỉ tiêu chính</Th><Th r>Thực tế</Th><Th r>%</Th><Th>Trạng thái</Th></tr></thead>
          <tbody>
            <tr><Td><b>Sale</b> (3 người)</Td><Td><span style={{fontSize:10}}>DT khoán: 130tr</span></Td><Td r><span style={{color:'#15803d'}}>120tr</span></Td><Td r><Bdg bg="#fef9c3" c="#854d0e">92%</Bdg></Td><Td><Bdg bg="#fef9c3" c="#854d0e">Gần đạt</Bdg></Td></tr>
            <tr><Td><b>Tele</b> (3 người)</Td><Td><span style={{fontSize:10}}>Hẹn được: 50 KH</span></Td><Td r><span style={{color:'#15803d'}}>41 KH</span></Td><Td r><Bdg bg="#fef9c3" c="#854d0e">82%</Bdg></Td><Td><Bdg bg="#fef9c3" c="#854d0e">Gần đạt</Bdg></Td></tr>
            <tr><Td><b>BS / KTV</b> (5 người)</Td><Td><span style={{fontSize:10}}>100 buổi · Hài lòng ≥4.5</span></Td><Td r><span style={{color:'#15803d'}}>100 · 4.6⭐</span></Td><Td r><Bdg bg="#dcfce7" c="#15803d">100%</Bdg></Td><Td><Bdg bg="#dcfce7" c="#15803d">Đạt</Bdg></Td></tr>
            <tr><Td><b>CSKH</b></Td><Td><span style={{fontSize:10}}>Hài lòng ≥4.5 · Tái khám 70%</span></Td><Td r><span style={{color:'#15803d'}}>4.6⭐ · 67%</span></Td><Td r><Bdg bg="#fef9c3" c="#854d0e">96%</Bdg></Td><Td><Bdg bg="#fef9c3" c="#854d0e">Gần đạt</Bdg></Td></tr>
            <tr><Td><b>Kế toán</b></Td><Td><span style={{fontSize:10}}>Thu nợ 100%</span></Td><Td r><span style={{color:'#ea580c'}}>67%</span></Td><Td r><Bdg bg="#fee2e2" c="#991b1b">67%</Bdg></Td><Td><Bdg bg="#fee2e2" c="#991b1b">Cần cải thiện</Bdg></Td></tr>
          </tbody>
        </Tbl>
        <div style={{padding:'9px 14px',background:'#fffbeb',borderTop:'1px solid #fde68a',fontSize:10,color:'#854d0e',display:'flex',alignItems:'center',gap:5}}>
          <IconSpeakerphone size={11}/> MKT báo cáo trực tiếp lên cấp công ty. Quản lý cơ sở không phê duyệt ngân sách MKT.
        </div>
      </Card>
    </div>
  )
}

function ScQLSale() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        <KpiCard lbl="DT team Sale" val="120tr đ" sub="MT: 130tr · 92.3%" pct={92} color="#15803d" icon={<IconTrendingUp size={13}/>} />
        <KpiCard lbl="Tỷ lệ chốt TB" val="67%" sub="MT: 80% · Cần cải thiện" pct={67} color="#0284c7" icon={<IconPercentage size={13}/>} />
        <KpiCard lbl="TB bill / KH" val="10.5tr đ" sub="MT: ≥10tr · Đạt" pct={100} color="#854d0e" icon={<IconReceipt size={13}/>} />
        <KpiCard lbl="Tổng công nợ" val="39tr đ" sub="3 Sale · Cần thúc thu" color="#ea580c" icon={<IconClockDollar size={13}/>} />
      </div>
      <Card>
        <CardHd icon={<IconTrophy size={13} style={{color:'#854d0e'}}/>}>Xếp hạng Sale {MONTH_LABEL}</CardHd>
        <RankRow rank={1} av="TL" avBg="#dcfce7" avC="#15803d" name="Nguyễn T. Thủy Linh" code="S001" sub="DT: 65tr · Chốt: 83% · TB bill: 13tr" progress={100} val="65tr" badge="130%" badgeBg="#dcfce7" badgeC="#15803d" />
        <RankRow rank={2} av="VQ" avBg="#dbeafe" avC="#1e40af" name="Trần T. Vang Quỳnh" code="S002" sub="DT: 35tr · Chốt: 60% · TB bill: 11.7tr" progress={54} val="35tr" badge="87.5%" badgeBg="#fef9c3" badgeC="#854d0e" />
        <RankRow rank={3} av="TN" avBg="#fef9c3" avC="#854d0e" name="Lê T. Thu Nhi" code="S003" sub="DT: 20tr · Chốt: 50% · TB bill: 10tr" progress={30} val="20tr" badge="50%" badgeBg="#fee2e2" badgeC="#991b1b" />
      </Card>
    </div>
  )
}

function ScQLTele() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        <KpiCard lbl="Data nhận" val="89" sub="MT: 100 · 89%" pct={89} color="#0369a1" icon={<IconDatabase size={13}/>} />
        <KpiCard lbl="Gọi được" val="71" sub="79.8%" pct={80} color="#15803d" icon={<IconPhoneCheck size={13}/>} />
        <KpiCard lbl="Đã hẹn" val="41" sub="46.1% · MT: 50%" pct={83} color="#854d0e" icon={<IconCalendarCheck size={13}/>} />
        <KpiCard lbl="Tỷ lệ đến PK" val="78%" sub="32/41 đã hẹn" pct={78} color="#15803d" icon={<IconDoorEnter size={13}/>} />
      </div>
      <Card>
        <CardHd icon={<IconTrophy size={13} style={{color:'#854d0e'}}/>}>Xếp hạng Tele</CardHd>
        <RankRow rank={1} av="TT" avBg="#dbeafe" avC="#1e40af" name="Nguyễn T. Trang" code="T001 · Lead Tele" sub="30 data · 15 hẹn · 78.6% đến · Tỷ lệ 50%" badge="Top 1" badgeBg="#dcfce7" badgeC="#15803d" />
        <RankRow rank={2} av="PL" avBg="#dbeafe" avC="#1e40af" name="Phạm T. Linh" code="T002" sub="29 data · 14 hẹn · 78.6% đến · Tỷ lệ 48.3%" badge="Top 2" badgeBg="#dbeafe" badgeC="#1e40af" />
        <RankRow rank={3} av="LH" avBg="#dbeafe" avC="#1e40af" name="Lê T. Hương" code="T003" sub="30 data · 12 hẹn · 75% đến · Tỷ lệ 40%" badge="Cần cải thiện" badgeBg="#fef9c3" badgeC="#854d0e" />
      </Card>
    </div>
  )
}

function ScQLBSKTV() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        <KpiCard lbl="DT tổng BS/KTV" val="97.6tr đ" sub="5 người · 100 buổi" color="#991b1b" icon={<IconTrendingUp size={13}/>} />
        <KpiCard lbl="Hài lòng TB" val="4.6 ⭐" sub="MT: ≥4.5 · Đạt" pct={92} color="#f59e0b" icon={<IconStar size={13}/>} />
        <KpiCard lbl="Tổng buổi" val="100" sub="MT: 95 · 105%" pct={100} color="#15803d" icon={<IconCalendarCheck size={13}/>} />
        <KpiCard lbl="Tổng tua" val="35tr đ" sub="5 BS/KTV · T05" color="#5b21b6" icon={<IconCoin size={13}/>} />
      </div>
      <Card>
        <CardHd icon={<IconTable size={13} style={{color:'#991b1b'}}/>}>KPI từng BS/KTV</CardHd>
        <Tbl>
          <thead><tr><Th>BS/KTV</Th><Th r>Buổi</Th><Th r>DT đóng góp</Th><Th r>Tua</Th><Th r>Hài lòng TB</Th><Th>Trạng thái</Th></tr></thead>
          <tbody>
            {[
              ['BS HOÀN','BS001','fee2e2','991b1b',28,'36.4tr','12.6tr','4.5 ⭐','Đạt','dcfce7','15803d'],
              ['BS KIÊN','BS002','fee2e2','991b1b',24,'31.2tr','10.8tr','4.7 ⭐','Tốt nhất','dcfce7','15803d'],
              ['BS HƯNG','BS003','fee2e2','991b1b',8,'10.4tr','3.6tr','4.5 ⭐','Đạt','dcfce7','15803d'],
              ['KTV Lan','KTV001','dbeafe','1e40af',22,'11.2tr','4.4tr','4.6 ⭐','Đạt','dcfce7','15803d'],
              ['KTV Hà','KTV003','dbeafe','1e40af',18,'8.4tr','3.6tr','4.5 ⭐','Đạt','dcfce7','15803d'],
            ].map(([name,code,bg,c,buoi,dt,tua,hl,st,stBg,stC]) => (
              <tr key={code}>
                <Td><b>{name}</b> <Bdg bg={`#${bg}`} c={`#${c}`}>{code}</Bdg></Td>
                <Td r>{buoi}</Td>
                <Td r><span style={{color:'#15803d'}}>{dt}</span></Td>
                <Td r><span style={{color:'#5b21b6'}}>{tua}</span></Td>
                <Td r><span style={{color:'#f59e0b'}}>{hl}</span></Td>
                <Td><Bdg bg={`#${stBg}`} c={`#${stC}`}>{st}</Bdg></Td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr>
            <td style={{padding:'8px 12px',fontWeight:700,background:'#f8fafc',borderTop:'2px solid #dde3ef'}}>Tổng 5 người</td>
            <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,background:'#f8fafc',borderTop:'2px solid #dde3ef'}}>100</td>
            <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,background:'#f8fafc',borderTop:'2px solid #dde3ef',color:'#15803d'}}>97.6tr</td>
            <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,background:'#f8fafc',borderTop:'2px solid #dde3ef',color:'#5b21b6'}}>35tr</td>
            <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,background:'#f8fafc',borderTop:'2px solid #dde3ef',color:'#f59e0b'}}>4.6 ⭐ TB</td>
            <td style={{padding:'8px 12px',background:'#f8fafc',borderTop:'2px solid #dde3ef'}}></td>
          </tr></tfoot>
        </Tbl>
      </Card>
    </div>
  )
}

function ScQLLuong() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'9px 14px',fontSize:11,color:'#991b1b',display:'flex',alignItems:'center',gap:7}}>
        <IconLock size={14}/> Chỉ Quản lý / Chủ doanh nghiệp thấy bảng lương tổng. Mỗi nhân sự chỉ thấy lương của mình trong tab KPI cá nhân.
      </div>
      <Card>
        <CardHd icon={<IconTable size={13} style={{color:'#065f46'}}/>}>Bảng lương tổng {MONTH_LABEL} — 14 nhân sự</CardHd>
        <div style={{overflowX:'auto'}}>
          <Tbl>
            <thead><tr><Th>Nhân sự</Th><Th>Vai trò</Th><Th r>Lương cứng</Th><Th r>Thưởng/Tua</Th><Th r>HH</Th><Th r>Khấu trừ</Th><Th r>Thực lãnh</Th></tr></thead>
            <tbody>
              {[
                ['Nguyễn T. Thủy Linh','S001 · Lead Sale','b-ok','dcfce7','15803d','10.000.000','2.500.000','3.250.000','-1.450.000','14.300.000'],
                ['Trần T. Vang Quỳnh','S002','b-blue','dbeafe','1e40af','8.000.000','500.000','1.750.000','-1.025.000','9.225.000'],
                ['Lê T. Thu Nhi','S003','b-blue','dbeafe','1e40af','7.000.000','0','1.000.000','-640.000','7.360.000'],
                ['BS HOÀN','BS001','b-err','fee2e2','991b1b','10.000.000','12.600.000','0','-1.808.000','20.792.000'],
                ['BS KIÊN','BS002','b-err','fee2e2','991b1b','10.000.000','10.800.000','0','-1.664.000','19.136.000'],
                ['BS HƯNG','BS003','b-err','fee2e2','991b1b','10.000.000','3.600.000','0','-1.088.000','12.512.000'],
                ['KTV Lan','KTV001','b-blue','dbeafe','1e40af','7.000.000','4.400.000','0','-912.000','10.488.000'],
                ['KTV Hà','KTV003','b-blue','dbeafe','1e40af','7.000.000','3.600.000','0','-848.000','9.752.000'],
              ].map(([name,role,_cls,bg,c,luong,thuong,hh,khauch,thlah]) => (
                <tr key={name}>
                  <Td><b>{name}</b></Td>
                  <Td><Bdg bg={`#${bg}`} c={`#${c}`}>{role}</Bdg></Td>
                  <Td r>{luong}</Td>
                  <Td r><span style={{color:'#5b21b6'}}>{thuong !== '0' ? thuong : '0'}</span></Td>
                  <Td r><span style={{color:'#15803d'}}>{hh !== '0' ? hh : '0'}</span></Td>
                  <Td r><span style={{color:'#dc2626'}}>{khauch}</span></Td>
                  <Td r><span style={{fontWeight:700,color:'#065f46'}}>{thlah}</span></Td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr>
              <td colSpan={2} style={{padding:'8px 12px',fontWeight:700,background:'#f8fafc',borderTop:'2px solid #dde3ef'}}>Tổng (14 nhân sự)</td>
              <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,background:'#f8fafc',borderTop:'2px solid #dde3ef'}}>106tr</td>
              <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,background:'#f8fafc',borderTop:'2px solid #dde3ef',color:'#5b21b6'}}>+37.1tr</td>
              <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,background:'#f8fafc',borderTop:'2px solid #dde3ef',color:'#15803d'}}>+6tr</td>
              <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,background:'#f8fafc',borderTop:'2px solid #dde3ef',color:'#dc2626'}}>-12.3tr</td>
              <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,background:'#f8fafc',borderTop:'2px solid #dde3ef',color:'#065f46',fontSize:13}}>~136.8tr đ</td>
            </tr></tfoot>
          </Tbl>
        </div>
      </Card>
    </div>
  )
}

function ScLTCaNhan() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        <KpiCard lbl="Data nhận tháng" val="30" sub="MT: 30 · 100% ✓" pct={100} color="#0284c7" icon={<IconDatabase size={13}/>} />
        <KpiCard lbl="Gọi được" val="25" sub="83.3% · MT: 80% · Đạt" pct={83} color="#15803d" icon={<IconPhoneCheck size={13}/>} />
        <KpiCard lbl="Đã hẹn được" val="15" sub="50% data · MT: 50% · Đúng mục tiêu" pct={100} color="#854d0e" icon={<IconCalendarCheck size={13}/>} />
        <KpiCard lbl="KH đến PK" val="78.6%" sub="11/14 · MT: 75% · Vượt" pct={100} color="#15803d" icon={<IconDoorEnter size={13}/>} />
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <Card>
          <CardHd icon={<IconFilter size={13} style={{color:'#0284c7'}}/>}>Phễu chuyển đổi — T001 Nguyễn T. Trang</CardHd>
          <FunnelStep label="Data nhận" value="30 data" pct={100} color="#6d28d9" />
          <FunnelStep label="Gọi được"  value="25 người" pct={83}  color="#0284c7" />
          <FunnelStep label="Đã hẹn"    value="15 KH"    pct={50}  color="#854d0e" />
          <FunnelStep label="KH đến PK" value="11 KH"    pct={37}  color="#15803d" />
          <FunnelStep label="Đã mua DV" value="8 KH"     pct={27}  color="#065f46" />
        </Card>
        <Card>
          <CardHd icon={<IconWallet size={13} style={{color:'#0284c7'}}/>}>Lương ước tính {MONTH_LABEL}</CardHd>
          <div style={{padding:14}}>
            <LuongBox
              color="#1d4ed8" bg="#eff6ff" border="#bfdbfe"
              title="T001 Nguyễn T. Trang · Lead Tele"
              rows={[
                { label:'Lương cứng', val:'9.000.000đ' },
                { label:'Thưởng KPI đội (đạt 100%)', val:'1.500.000đ', color:'#1d4ed8' },
                { label:'Thưởng lịch hẹn KH đến (11)', val:'1.100.000đ', color:'#1d4ed8' },
                { label:'Phụ cấp trách nhiệm Lead', val:'500.000đ', color:'#5b21b6' },
                { label:'Khấu trừ (BHXH + thuế)', val:'-960.000đ', color:'#dc2626' },
              ]}
              total="11.140.000đ"
            />
          </div>
        </Card>
      </div>
    </div>
  )
}

function ScLTTeam() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        <KpiCard lbl="Data team nhận" val="89" sub="MT: 100 · 89%" pct={89} color="#0284c7" icon={<IconDatabase size={13}/>} />
        <KpiCard lbl="Gọi được (team)" val="71" sub="79.8% · MT: 80%" pct={80} color="#15803d" icon={<IconPhoneCheck size={13}/>} />
        <KpiCard lbl="Hẹn được (team)" val="41" sub="46.1% · MT: 50%" pct={83} color="#854d0e" icon={<IconCalendarCheck size={13}/>} />
        <KpiCard lbl="KH đến PK (team)" val="78%" sub="32/41 KH hẹn đã đến" pct={78} color="#15803d" icon={<IconDoorEnter size={13}/>} />
      </div>
      <Card>
        <CardHd icon={<IconTrophy size={13} style={{color:'#854d0e'}}/>}>So sánh hiệu suất 3 Tele</CardHd>
        <div style={{overflowX:'auto'}}>
          <Tbl>
            <thead><tr><Th>Nhân sự</Th><Th r>Data</Th><Th r>Gọi được</Th><Th r>Hẹn</Th><Th r>% Hẹn</Th><Th r>KH đến</Th><Th r>% Đến</Th><Th>Đánh giá</Th></tr></thead>
            <tbody>
              <tr style={{background:'#f0fdf4'}}>
                <Td><b>Nguyễn T. Trang</b> <Bdg bg="#dcfce7" c="#15803d">T001 · Lead</Bdg></Td>
                <Td r>30</Td><Td r>25</Td><Td r>15</Td>
                <Td r><span style={{color:'#15803d',fontWeight:600}}>50%</span></Td>
                <Td r>11</Td><Td r><span style={{color:'#15803d',fontWeight:600}}>78.6%</span></Td>
                <Td><Bdg bg="#dcfce7" c="#15803d">Tốt nhất</Bdg></Td>
              </tr>
              <tr>
                <Td><b>Phạm T. Linh</b> <Bdg bg="#dbeafe" c="#1e40af">T002</Bdg></Td>
                <Td r>29</Td><Td r>24</Td><Td r>14</Td>
                <Td r><span style={{color:'#854d0e',fontWeight:600}}>48.3%</span></Td>
                <Td r>11</Td><Td r><span style={{color:'#854d0e',fontWeight:600}}>78.6%</span></Td>
                <Td><Bdg bg="#fef9c3" c="#854d0e">Tốt</Bdg></Td>
              </tr>
              <tr>
                <Td><b>Lê T. Hương</b> <Bdg bg="#dbeafe" c="#1e40af">T003</Bdg></Td>
                <Td r>30</Td><Td r>22</Td><Td r>12</Td>
                <Td r><span style={{color:'#dc2626',fontWeight:600}}>40%</span></Td>
                <Td r>10</Td><Td r><span style={{color:'#854d0e',fontWeight:600}}>75%</span></Td>
                <Td><Bdg bg="#fee2e2" c="#991b1b">Cần cải thiện</Bdg></Td>
              </tr>
            </tbody>
            <tfoot><tr>
              <td style={{padding:'8px 12px',fontWeight:700,background:'#f8fafc',borderTop:'2px solid #dde3ef'}}>Tổng team</td>
              <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,background:'#f8fafc',borderTop:'2px solid #dde3ef'}}>89</td>
              <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,background:'#f8fafc',borderTop:'2px solid #dde3ef'}}>71</td>
              <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,background:'#f8fafc',borderTop:'2px solid #dde3ef'}}>41</td>
              <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,background:'#f8fafc',borderTop:'2px solid #dde3ef',color:'#854d0e'}}>46.1%</td>
              <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,background:'#f8fafc',borderTop:'2px solid #dde3ef'}}>32</td>
              <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,background:'#f8fafc',borderTop:'2px solid #dde3ef',color:'#15803d'}}>78%</td>
              <td style={{padding:'8px 12px',background:'#f8fafc',borderTop:'2px solid #dde3ef'}}></td>
            </tr></tfoot>
          </Tbl>
        </div>
        <div style={{padding:'9px 14px',background:'#fffbeb',borderTop:'1px solid #fde68a',fontSize:10,color:'#854d0e',display:'flex',alignItems:'center',gap:5}}>
          <IconAlertTriangle size={11}/> T003 Lê T. Hương tỷ lệ hẹn 40% — thấp hơn mục tiêu 10%. Cần coaching: cách xử lý khi KH do dự.
        </div>
      </Card>
    </div>
  )
}

function ScLTTong() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:8,padding:'9px 14px',fontSize:11,color:'#1e40af',display:'flex',alignItems:'center',gap:7}}>
        <IconInfoCircle size={14}/> Xem với quyền Lead Tele. Tổng cơ sở không bao gồm chỉ số MKT (báo cáo thẳng công ty).
      </div>
      <ScQLCoSo />
    </div>
  )
}

function ScLeadTong() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{background:'#fef9c3',border:'1px solid #fde68a',borderRadius:8,padding:'9px 14px',fontSize:11,color:'#854d0e',display:'flex',alignItems:'center',gap:7}}>
        <IconInfoCircle size={14}/> Xem với quyền Lead Sale. Một số chỉ số lương tổng chỉ Quản lý / Chủ DN mới thấy đầy đủ.
      </div>
      <ScQLCoSo />
    </div>
  )
}

// ── tab id → component ────────────────────────────────────────
function renderScreen(tabId) {
  switch (tabId) {
    case 'sale-main':    return <ScSaleMain />
    case 'sale-no':      return <ScSaleNo />
    case 'sale-luong':   return <ScSaleLuong />
    case 'tele-main':    return <ScTeleMain />
    case 'tele-luong':   return <ScTeleLuong />
    case 'truc-main':    return <ScTrucMain />
    case 'bs-main':      return <ScBsKtvMain isBS />
    case 'ktv-main':     return <ScBsKtvMain isBS={false} />
    case 'mkt-content':  return <ScMKTContent />
    case 'mkt-ads':      return <ScMKTAds />
    case 'cskh-main':    return <ScCSKHMain />
    case 'lead-canhan':  return <ScSaleMain />
    case 'lead-team':    return <ScQLSale />
    case 'lead-tong':    return <ScLeadTong />
    case 'lt-canhan':    return <ScLTCaNhan />
    case 'lt-team':      return <ScLTTeam />
    case 'lt-tong':      return <ScLTTong />
    case 'ql-co-so':     return <ScQLCoSo />
    case 'ql-sale':      return <ScQLSale />
    case 'ql-tele':      return <ScQLTele />
    case 'ql-bs-ktv':    return <ScQLBSKTV />
    case 'ql-cskh':      return <ScCSKHMain />
    case 'ql-luong':     return <ScQLLuong />
    default:             return <div style={{padding:20,color:'#94a3b8',fontSize:12}}>Đang xây dựng...</div>
  }
}

// ── main ─────────────────────────────────────────────────────
const ALL_KPI_ROLES = Object.keys(ROLE_CFG)

export default function KpiPage() {
  const user = useAuthStore(s => s.user)
  const appRole = getUserRole(user)
  const defaultKpiKey = getRoleKpiKey(appRole)
  const isManager = appRole === 'QUAN_LY' || appRole === 'CHU_DN'

  const [previewRole, setPreviewRole] = useState(null)
  const activeKey = previewRole ?? defaultKpiKey
  const cfg = ROLE_CFG[activeKey] ?? ROLE_CFG.sale

  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab')
  const validTab = cfg.tabs.find(t => t.id === rawTab) ? rawTab : cfg.tabs[0].id
  const setTab = (id) => setSearchParams({ tab: id }, { replace: true })

  // When cfg changes (role switch), reset to first tab of new cfg
  const handleSetRole = (key) => {
    const c = ROLE_CFG[key]
    if (c) {
      setPreviewRole(key === defaultKpiKey ? null : key)
      setSearchParams({ tab: c.tabs[0].id }, { replace: true })
    }
  }

  const ACCENT = cfg.color

  const ROLE_SWITCHER_LABELS = {
    sale: 'Sale', tele: 'Tele', truc: 'Trực page', bs: 'Bác sĩ',
    ktv: 'KTV', mkt: 'MKT', cskh: 'CSKH',
    lead: 'Lead Sale', lead_tele: 'Lead Tele', ql: 'Quản lý',
  }

  return (
    <AppLayout>
      {/* Subnav */}
      <div style={{ height: 40, background: '#fff', borderBottom: '1px solid #dde3ef', display: 'flex', alignItems: 'center', paddingLeft: 8, paddingRight: 8, gap: 2, flexShrink: 0, overflowX: 'auto' }}>
        {cfg.tabs.map(t => {
          const active = validTab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: 'none', borderBottom: `2px solid ${active ? ACCENT : 'transparent'}`, background: 'transparent', color: active ? ACCENT : '#64748b', fontWeight: active ? 700 : 400, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .12s', flexShrink: 0, fontFamily: 'inherit', height: 40 }}>
              {t.icon} {t.l}
            </button>
          )
        })}

        {/* Manager role preview switcher */}
        {isManager && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 12, flexShrink: 0 }}>
            <span style={{ fontSize: 9, color: '#94a3b8', whiteSpace: 'nowrap' }}>Xem KPI:</span>
            {Object.entries(ROLE_SWITCHER_LABELS).map(([key, label]) => (
              <button key={key} onClick={() => handleSetRole(key)}
                style={{ padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 500, cursor: 'pointer', border: `1.5px solid ${activeKey === key ? ROLE_CFG[key].color : '#dde3ef'}`, background: activeKey === key ? '#fff' : '#f8fafc', color: activeKey === key ? ROLE_CFG[key].color : '#64748b', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Month + title */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <select style={{ border: '1px solid #dde3ef', borderRadius: 7, padding: '3px 8px', fontSize: 10, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
            <option>Tháng {String(now.getMonth() + 1).padStart(2,'0')}/{now.getFullYear()}</option>
            <option>Tháng {String(now.getMonth()).padStart(2,'0') || '12'}/{now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()}</option>
          </select>
          <span style={{ fontSize: 10, color: ACCENT, background: ACCENT + '18', border: `1px solid ${ACCENT}44`, borderRadius: 6, padding: '3px 9px', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {cfg.title}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {renderScreen(validTab)}
      </div>
    </AppLayout>
  )
}
