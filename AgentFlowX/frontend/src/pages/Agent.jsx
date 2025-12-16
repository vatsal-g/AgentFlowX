import React, { useState } from 'react'
import { api } from '../api'

export default function Agent(){
  const [cmd, setCmd] = useState('')
  const [resp, setResp] = useState(null)

  async function run(){
    const r = await api.post('/agent', { userId: 1, command: cmd })
    setResp(r.data)
  }

  return (
    <div>
      <textarea value={cmd} onChange={e=>setCmd(e.target.value)} />
      <button onClick={run}>Run</button>
      <pre>{JSON.stringify(resp, null, 2)}</pre>
    </div>
  )
}
