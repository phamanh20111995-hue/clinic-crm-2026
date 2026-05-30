const VARIANTS = {
  green:  'bg-green-100 text-green-800',
  red:    'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue:   'bg-blue-100 text-blue-800',
  gray:   'bg-gray-100 text-gray-700',
  orange: 'bg-orange-100 text-orange-800',
  purple: 'bg-purple-100 text-purple-800',
}

export default function Badge({ children, variant = 'gray', className = '' }) {
  return (
    <span className={`badge ${VARIANTS[variant] ?? VARIANTS.gray} ${className}`}>
      {children}
    </span>
  )
}
