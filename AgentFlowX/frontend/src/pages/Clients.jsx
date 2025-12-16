import { useEffect, useState } from "react"
import { api } from "../api"

export default function Clients() {
  const [clients, setClients] = useState([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")

  function loadClients() {
    api.get("/clients")
      .then(res => setClients(res.data))
      .catch(err => {
        console.error(err)
        setError("Failed to load clients")
      })
  }

  useEffect(() => {
    loadClients()
  }, [])

  async function addClient(e) {
    e.preventDefault()
    setError("")

    try {
      await api.post("/clients", { name, email })
      setName("")
      setEmail("")
      loadClients() // 🔥 THIS WAS MISSING
    } catch (err) {
      console.error(err)
      setError("Failed to add client")
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Clients</h1>

      <form onSubmit={addClient} className="flex gap-3 mb-6">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Client name"
          className="bg-slate-700 p-2 rounded w-64"
        />
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Client email"
          className="bg-slate-700 p-2 rounded w-64"
        />
        <button className="bg-indigo-600 px-4 rounded">
          Add Client
        </button>
      </form>

      {error && <p className="text-red-400">{error}</p>}

      <table className="w-full bg-slate-800 rounded">
        <thead>
          <tr className="text-left">
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Created</th>
          </tr>
        </thead>
        <tbody>
          {clients.length === 0 && (
            <tr>
              <td colSpan="3" className="p-4 text-center text-slate-400">
                No clients yet
              </td>
            </tr>
          )}
          {clients.map(c => (
            <tr key={c.id}>
              <td className="p-3">{c.name}</td>
              <td className="p-3">{c.email}</td>
              <td className="p-3">
                {new Date(c.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
