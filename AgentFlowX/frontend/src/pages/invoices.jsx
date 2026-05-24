import { useEffect, useState } from "react"
import { api } from "../api"

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [clientId, setClientId] = useState("")
  const [amount, setAmount] = useState("")
  const [error, setError] = useState("")

  function loadInvoices() {
    api.get("/invoices")
      .then(res => {
        console.log("INVOICE RESPONSE:", res.data)

        setInvoices(
          Array.isArray(res.data.data)
            ? res.data.data
            : []
        )
      })
      .catch(err => {
        console.error(err)
        setError("Failed to load invoices")
      })
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  async function addInvoice(e) {
    e.preventDefault()

    try {
      await api.post("/invoices", {
        clientId: Number(clientId),
        amount: Number(amount)
      })

      setClientId("")
      setAmount("")

      loadInvoices()

    } catch (err) {
      console.error(err)
      setError("Failed to create invoice")
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">
        Invoices
      </h2>

      <form onSubmit={addInvoice} className="flex gap-2 mb-6">

        <input
          placeholder="Client ID"
          value={clientId}
          onChange={(e)=>setClientId(e.target.value)}
          className="p-2 bg-slate-700 rounded"
        />

        <input
          placeholder="Amount"
          value={amount}
          onChange={(e)=>setAmount(e.target.value)}
          className="p-2 bg-slate-700 rounded"
        />

        <button className="bg-indigo-600 px-4 rounded">
          Create
        </button>

      </form>

      {error && (
        <p className="text-red-400 mb-2">
          {error}
        </p>
      )}

      <div className="space-y-2">

        {invoices.length === 0 &&
          <p>No invoices yet</p>
        }

        {Array.isArray(invoices) &&
          invoices.map(inv => (

            <div
              key={inv.id}
              className="p-4 bg-slate-800 rounded"
            >
              <div>Invoice #{inv.id}</div>
              <div>Client ID: {inv.client_id}</div>
              <div>Amount: ₹{inv.amount}</div>
              <div>Status: {inv.status || "pending"}</div>
            </div>

          ))
        }

      </div>

    </div>
  )
}