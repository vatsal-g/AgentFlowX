import { Link, useNavigate } from "react-router-dom"
import { setAuthToken } from "../api"
import AgentFlowXLogo from "../assets/Agentflowxlogo"

export default function Header() {
  const nav = useNavigate()

  const logout = () => {
    localStorage.removeItem("afx_token")
    setAuthToken(null)
    nav("/login")
  }

  const token = localStorage.getItem("afx_token")

  return (
    <header className="bg-slate-800 px-6 py-3 flex items-center justify-between">
      
      {/* ✅ LOGO ONLY */}
      <div className="flex items-center gap-3">
        <AgentFlowXLogo size={32} />
      </div>

      <nav className="space-x-5 text-sm">
        {token && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/clients">Clients</Link>
            <Link to="/invoices">Invoices</Link>
            <Link to="/agent">Agent</Link>
            <Link to="/audit">Audit</Link>
            <Link to="/preferences">Preferences</Link>
            <button
              onClick={logout}
              className="ml-4 text-red-400 hover:text-red-300"
            >
              Logout
            </button>
          </>
        )}
      </nav>
    </header>
  )
}
