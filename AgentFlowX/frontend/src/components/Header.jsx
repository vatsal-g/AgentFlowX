import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setAuthToken } from '../api'

export default function Header(){
  const nav = useNavigate()

  const logout = () => {
    localStorage.removeItem('afx_token')
    setAuthToken(null)
    nav('/login')
  }

  const token = localStorage.getItem('afx_token')

  return (
    <header className="bg-slate-800 p-4 flex items-center justify-between">
      <div className="text-xl font-semibold">AgentFlowX</div>
      <nav className="space-x-4">
        {token ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/clients">Clients</Link>
            <Link to="/invoices">Invoices</Link>
            <Link to="/agent">Agent</Link>
            <Link to="/audit">Audit</Link>
            <Link to="/preferences">Preferences</Link>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  )
}