import { useNavigate } from "react-router-dom"

export default function Topbar() {
  const nav = useNavigate()

  function logout() {
    localStorage.removeItem("afx_token")
    nav("/login")
  }

  return (
    <header className="h-14 bg-slate-800 flex items-center justify-end px-6">
      <button
        onClick={logout}
        className="bg-red-600 px-4 py-1 rounded"
      >
        Logout
      </button>
    </header>
  )
}
