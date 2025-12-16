import React, { useState } from 'react'
import { api, setAuthToken } from '../api'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const nav = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setErr('')
    try {
      const res = await api.post('/auth/login', { email, password })
      if (res.data?.token) {
        localStorage.setItem('afx_token', res.data.token)
        setAuthToken(res.data.token)
        nav('/dashboard')
      } else {
        setErr('Login failed')
      }
    } catch (e) {
      setErr(e.response?.data?.error || 'Server error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md bg-slate-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 text-center">Login</h2>

        <form onSubmit={submit} className="space-y-4">
          <input
            className="w-full p-2 rounded bg-slate-700 text-white"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full p-2 rounded bg-slate-700 text-white"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded"
          >
            Login
          </button>

          {err && <p className="text-red-400 text-sm">{err}</p>}
        </form>
      </div>
    </div>
  )
}
