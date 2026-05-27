import React, { useState } from "react"
import { api, setAuthToken } from "../api"
import { useNavigate } from "react-router-dom"

export default function Register() {

  const [name, setName] =
    useState("")

  const [email, setEmail] =
    useState("")

  const [password, setPassword] =
    useState("")

  const nav =
    useNavigate()

  async function submit(e) {

    e.preventDefault()

    try {

      const res =
        await api.post(
          "/auth/register",
          {
            name,
            email,
            password
          }
        )

      if (
        res.data?.token
      ) {

        localStorage.setItem(
          "afx_token",
          res.data.token
        )

        setAuthToken(
          res.data.token
        )

        nav("/dashboard")

      }

    } catch (err) {

      console.log(err)

      alert(
        "Registration failed"
      )

    }

  }

  return (

    <div
      className="
      min-h-screen
      flex
      items-center
      justify-center
      bg-[#050816]
      px-4
      "
    >

      <form

        onSubmit={submit}

        className="
        w-full
        max-w-md
        bg-slate-800
        p-10
        rounded-2xl
        shadow-2xl
        space-y-6
        "
      >

        <h1
          className="
          text-4xl
          font-bold
          text-center
          text-white
          "
        >

          Register

        </h1>

        <input

          value={name}

          onChange={
            e =>
            setName(
              e.target.value
            )
          }

          placeholder="Name"

          className="
          w-full
          p-4
          rounded-lg
          bg-slate-700
          text-white
          outline-none
          placeholder:text-slate-400
          "

        />

        <input

          value={email}

          onChange={
            e =>
            setEmail(
              e.target.value
            )
          }

          placeholder="Email"

          className="
          w-full
          p-4
          rounded-lg
          bg-slate-700
          text-white
          outline-none
          placeholder:text-slate-400
          "

        />

        <input

          type="password"

          value={password}

          onChange={
            e =>
            setPassword(
              e.target.value
            )
          }

          placeholder="Password"

          className="
          w-full
          p-4
          rounded-lg
          bg-slate-700
          text-white
          outline-none
          placeholder:text-slate-400
          "

        />

        <button

          className="
          w-full
          p-4
          rounded-lg
          bg-indigo-600
          hover:bg-indigo-500
          text-white
          font-semibold
          transition
          "

        >

          Register

        </button>

        <p
          className="
          text-center
          text-slate-300
          "
        >

          Already have an account?

          <span
            onClick={() => nav("/login")}
            className="
            ml-2
            text-indigo-400
            cursor-pointer
            hover:text-indigo-300
            "
          >

            Login

          </span>

        </p>

      </form>

    </div>

  )

}