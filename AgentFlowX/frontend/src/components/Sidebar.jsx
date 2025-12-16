import { NavLink } from "react-router-dom"

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/clients", label: "Clients" },
  { to: "/invoices", label: "Invoices" },
  { to: "/agent", label: "AI Agent" },
  { to: "/audit", label: "Audit Log" },
  { to: "/preferences", label: "Preferences" },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-800 p-4">
      <h1 className="text-xl font-bold mb-6">AgentFlowX</h1>

      <nav className="space-y-2">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded ${
                isActive ? "bg-indigo-600" : "hover:bg-slate-700"
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
