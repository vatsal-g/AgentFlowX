import { useEffect, useState } from "react"
import { api } from "../api"

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    api.get("/dashboard")
      .then(res => setStats(res.data))
      .catch(err => {
        console.error(err)
        setError("Failed to load dashboard")
      })
  }, [])

  if (error) return <p className="text-red-400">{error}</p>
  if (!stats) return <p>Loading...</p>

  return (
    <div className="grid grid-cols-3 gap-6">
      <StatCard title="Total Clients" value={stats.totalClients} />
      <StatCard title="Total Invoices" value={stats.totalInvoices} />
      <StatCard title="Total Revenue" value={`₹${stats.totalRevenue}`} />
    </div>
  )
}

function StatCard({ title, value }) {
  return (
    <div className="bg-slate-800 p-6 rounded-lg">
      <p className="text-slate-400">{title}</p>
      <h2 className="text-3xl font-bold mt-2">{value}</h2>
    </div>
  )
}
