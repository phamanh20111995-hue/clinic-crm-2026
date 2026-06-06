import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { login } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import Spinner from '../../components/ui/Spinner'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await login(form.email, form.password)
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      setAuth(
        { email: data.email, display_name: data.display_name, role: data.role },
        data.access,
        data.refresh
      )
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.detail ?? 'Email hoặc mật khẩu không đúng.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary-700 font-bold text-3xl mx-auto mb-4 shadow-lg">C</div>
          <h1 className="text-2xl font-bold text-white">CRM Phòng Khám</h1>
          <p className="text-primary-200 text-sm mt-1">Da liễu + Nha khoa Hà Nội</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Đăng nhập</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                className="input"
                placeholder="email@phongkham.vn"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <input
                type="password"
                required
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 flex items-center justify-center gap-2 py-2.5">
              {loading && <Spinner size="sm" />}
              Đăng nhập
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-6">Demo: sale@demo.vn / Demo@123456</p>
        </div>
      </div>
    </div>
  )
}
