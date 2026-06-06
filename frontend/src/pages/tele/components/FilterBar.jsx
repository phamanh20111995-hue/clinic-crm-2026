import { useState } from 'react'
import { IconSearch, IconFilter, IconX } from '@tabler/icons-react'

const STATUS_OPTS = [
  { value: '', label: 'Mọi trạng thái' },
  { value: 'chua_goi', label: 'Chưa gọi' },
  { value: 'khong_nghe', label: 'Không nghe' },
  { value: 'hen_goi', label: 'Hẹn gọi lại' },
  { value: 'dat_lich', label: 'Đặt lịch' },
  { value: 'can_tv', label: 'Cần tư vấn' },
  { value: 'khong_qt', label: 'Không quan tâm' },
]
const DATA_TYPE_OPTS = [
  { value: '', label: 'Mọi loại' },
  { value: 'nong', label: 'Nóng' },
  { value: 'am', label: 'Âm' },
  { value: 'thuong', label: 'Thường' },
]
const SOURCE_OPTS = [
  { value: '', label: 'Mọi nguồn' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'zalo', label: 'Zalo' },
  { value: 'google', label: 'Google' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'gioi_thieu', label: 'Giới thiệu' },
  { value: 'walkin', label: 'Walk-in' },
]

const inputStyle = {
  border: '1px solid #dde3ef', borderRadius: 7, padding: '6px 10px',
  fontSize: 13, outline: 'none', background: '#fff', color: '#1f2937',
}

export default function FilterBar({ filters, onChange, onClear }) {
  return (
    <div style={{
      display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
      padding: '10px 0 6px',
    }}>
      {/* Search */}
      <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160 }}>
        <IconSearch
          size={14} stroke={2}
          style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
        />
        <input
          placeholder="Tên hoặc SĐT..."
          value={filters.search ?? ''}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          style={{ ...inputStyle, width: '100%', paddingLeft: 28 }}
        />
      </div>

      {/* Data type */}
      <select
        value={filters.data_type ?? ''}
        onChange={e => onChange({ ...filters, data_type: e.target.value })}
        style={{ ...inputStyle, flex: '0 0 auto' }}
      >
        {DATA_TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Status */}
      <select
        value={filters.status ?? ''}
        onChange={e => onChange({ ...filters, status: e.target.value })}
        style={{ ...inputStyle, flex: '0 0 auto' }}
      >
        {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Source */}
      <select
        value={filters.source ?? ''}
        onChange={e => onChange({ ...filters, source: e.target.value })}
        style={{ ...inputStyle, flex: '0 0 auto' }}
      >
        {SOURCE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Clear */}
      <button
        onClick={onClear}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '6px 10px', borderRadius: 7,
          border: '1px solid #dde3ef', background: '#fff',
          fontSize: 12, color: '#6b7280', cursor: 'pointer',
        }}
      >
        <IconX size={13} stroke={2} />
        Xóa lọc
      </button>
    </div>
  )
}
