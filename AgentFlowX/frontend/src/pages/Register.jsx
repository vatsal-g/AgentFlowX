import React, { useState } from 'react'
import { api, setAuthToken } from '../api'
import { useNavigate } from 'react-router-dom'

export default function Register(){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const nav = useNavigate()

  async function submit(e){
    e.preventDefault()
    const res = await api.post('/auth/register', { name, email, password })
    if(res.data?.token){
      localStorage.setItem('afx_token', res.data.token)
      setAuthToken(res.data.token)
      nav('/dashboard')
    }
  }

  return (
    <form onSubmit={submit}>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" />
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
      <button>Register</button>
    </form>
  )
}
