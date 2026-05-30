import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export default function TopBar({ title }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between flex-shrink-0">
      <h1 className="text-base font-semibold text-gray-800">{title}</h1>
      <div className="text-sm text-gray-500">
        {format(time, 'HH:mm — EEEE, dd/MM/yyyy', { locale: vi })}
      </div>
    </header>
  )
}
