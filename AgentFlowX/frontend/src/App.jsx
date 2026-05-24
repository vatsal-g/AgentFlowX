import { Routes, Route, Navigate } from "react-router-dom"

import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import Clients from "./pages/Clients"
import Invoices from "./pages/Invoices"
import Agent from "./pages/Agent"
import Audit from "./pages/Audit"
import Preferences from "./pages/Preferences"
import AppLayout from "./layouts/AppLayout"
import Anomalies from "./pages/Anomalies"

function PrivateRoute({ children }) {
  const token = localStorage.getItem("afx_token")
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* PROTECTED */}
      <Route
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/agent" element={<Agent />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/anomalies" element={<Anomalies />} />
      </Route>
    </Routes>
  )
}
