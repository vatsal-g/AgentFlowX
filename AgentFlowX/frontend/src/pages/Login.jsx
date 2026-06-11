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
   <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4">

    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 border border-slate-200">

      <div className="text-center mb-8">

        <h1 className="text-4xl font-bold text-slate-900">
          AgentFlowX
        </h1>

        <p className="text-slate-500 mt-2">
          AI Powered Business Automation
        </p>

      </div>

      <h2 className="text-2xl font-semibold text-slate-800 mb-6 text-center">
        Welcome Back
      </h2>

      <form onSubmit={submit} className="space-y-5">

        <input
          className="w-full p-4 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-4 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="
          w-full
          py-4
          rounded-xl
          bg-gradient-to-r
          from-indigo-600
          to-violet-600
          text-white
          font-semibold
          shadow-lg
          hover:scale-[1.02]
          transition-all
          "
        >
          Sign In
        </button>

        {err && (
          <p className="text-red-500 text-center text-sm">
            {err}
          </p>
        )}

      </form>

      <p className="text-center text-slate-600 mt-6">
        Don't have an account?

        <a
          href="/register"
          className="ml-2 text-indigo-600 font-semibold hover:text-indigo-500"
        >
          Sign Up
        </a>
      </p>

    </div>

  </div>
)
}
