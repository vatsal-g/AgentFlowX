import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function Audit(){
  const [logs, setLogs] = useState([])

  useEffect(() => {
    api.get('/audit/1').then(res => setLogs(res.data))
  }, [])

  return (
    <div>
      {logs.map(l => (
        <div key={l.id}>{l.action}</div>
      ))}
    </div>
  )
}
