import { useState } from "react"
import axios from "axios"
const API_BASE = "https://agentflowx.onrender.com"
async function sendCommand(command) {

  const token =
    localStorage.getItem("afx_token");

  const payload =
    JSON.parse(
      atob(token.split(".")[1])
    );

  const res = await axios.post(
    `${API_BASE}/api/agent`,
    {
      userId: payload.id,
      command
    }
  );

  return res.data;
}

export default function Agent() {

  const [command, setCommand] =
    useState("")

  const [messages, setMessages] =
    useState([])

  const [loading, setLoading] =
    useState(false)

  async function handleSend() {

    if (!command.trim())
      return

    const text = command

    setMessages(prev => [
      ...prev,
      {
        role: "user",
        text
      }
    ])

    setCommand("")

    try {

      setLoading(true)

      const result =
        await sendCommand(text)

      const formatted =
        (
          typeof result.message === "string"
            ? result.message
            : JSON.stringify(
                result.message || result,
                null,
                2
              )
        )
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .replace(/"/g, "")
          .replace(/[{}\[\],]/g, "")
          .replace(/action:/g, "\nAction:")
          .replace(/data:/g, "")
          .replace(/name:/g, "\nName:")
          .replace(/email:/g, "\nEmail:")
          .replace(/amount:/g, "\nAmount: ₹")
          .replace(/clientId:/g, "")
          .replace(/create_client/g, "Create Client")
          .replace(/create_invoice/g, "Create Invoice")
          .trim()

      setMessages(prev => [
        ...prev,
        {
          role: "agent",
          text: formatted
        }
      ])

    } catch {

      setMessages(prev => [
        ...prev,
        {
          role: "agent",
          text:
            "Something went wrong"
        }
      ])

    } finally {

      setLoading(false)

    }
  }

  function handleKey(e) {

    if (
      e.key === "Enter"
      &&
      !e.shiftKey
    ) {

      e.preventDefault()

      handleSend()
    }
  }

  return (

    <div
      className="
      h-full
      w-full
      bg-[#050816]
      text-white
      flex
      flex-col
      overflow-hidden
      rounded-2xl
      "
    >

      <div
        className="
        flex-1
        overflow-y-auto
        p-8
        space-y-4
        "
      >

        {
          messages.length === 0 && (

            <div
              className="
              h-full
              flex
              items-center
              justify-center
              text-5xl
              text-slate-300
              "
            >

              Ask AgentFlowX

            </div>

          )
        }

        {
          messages.map(
            (
              msg,
              i
            ) => (

              <div
                key={i}
                className={`
                  max-w-[70%]
                  p-4
                  rounded-3xl
                  whitespace-pre-wrap

                  ${
                    msg.role ===
                    "user"

                    ?

                    "ml-auto bg-indigo-600"

                    :

                    "bg-slate-900"
                  }
                `}
              >

                {
                  msg.text
                }

              </div>

            )
          )
        }

      </div>

      <div
        className="
        p-8
        "
      >

        <div
          className="
          flex
          items-center
          bg-[#171717]
          rounded-full
          px-6
          py-4
          "
        >

          <input

            value={command}

            onChange={
              (e)=>
              setCommand(
                e.target.value
              )
            }

            onKeyDown={
              handleKey
            }

            placeholder="Ask AgentFlowX"

            className="
            flex-1
            bg-transparent
            outline-none
            text-lg
            placeholder:text-slate-500
            "

          />

          <button

            onClick={
              handleSend
            }

            className="
            ml-4
            px-5
            py-2
            rounded-full
            bg-indigo-600
            hover:bg-indigo-500
            "

          >

            {
              loading
                ? "..."
                : "Send"
            }

          </button>

        </div>

      </div>

    </div>

  )
}