import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function Preferences(){
  const [delay, setDelay] = useState('')

  useEffect(() => {
    api.get('/users/1').then(res => setDelay(res.data.preferred_reminder_delay))
  }, [])

  async function save(){
    await api.put('/preferences/1', { preferred_reminder_delay: Number(delay) })
  }

  return (
    <div>
      <input value={delay} onChange={e=>setDelay(e.target.value)} />
      <button onClick={save}>Save</button>
    </div>
  )
}
