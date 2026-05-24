require("dotenv").config();

const { query } = require("./db");
const { sanitizePrompt } = require("./ai.guard");
const { runGemini } = require("./ai.gemini");

/* =========================
   DB ACTIONS
========================= */

async function createClient({ name, email }, userId) {

  const result = await query(
    `
    INSERT INTO clients
    (user_id,name,email)

    VALUES
    ($1,$2,$3)

    RETURNING *
    `,
    [
      userId,
      name,
      email || null
    ]
  )

  return result.rows[0]
}

async function createInvoice(
  {
    clientId,
    amount
  },
  userId
) {

  const result =
    await query(
      `
      INSERT INTO invoices
      (
        user_id,
        client_id,
        amount
      )

      VALUES
      (
        $1,
        $2,
        $3
      )

      RETURNING *
      `,
      [
        userId,
        clientId,
        amount
      ]
    )

  return result.rows[0]
}

const ACTION_MAP = {

  create_client:
    createClient,

  create_invoice:
    createInvoice,

}

/* =========================
   SYSTEM PROMPT
========================= */

const systemPrompt = `

You are AgentFlowX.

You help users manage business tasks.

Rules:

1.
If user wants to:

- create client
- create invoice

Return ONLY JSON.

Create client:

{
 "action":"create_client",
 "data":{
   "name":"Rahul",
   "email":"rahul@gmail.com"
 }
}

Create invoice:

{
 "action":"create_invoice",
 "data":{
   "clientId":1,
   "amount":5000
 }
}

2.
For every other question:

Respond naturally.

Examples:

User:
How are you

Assistant:
I am doing well.

User:
Give reminder

Assistant:
I cannot create reminders yet but I can help.

Never return empty output.

`

/* =========================
   MAIN AGENT
========================= */

async function runAgent(
  userId,
  userCommand
) {

  try {

    const safeCommand =
      sanitizePrompt(
        userCommand
      )

    const message =
      await runGemini(
        `
${systemPrompt}

User:
${safeCommand}
`
      )

    if (
      !message
      ||
      !message.trim()
    ) {

      return {

        ok: true,

        message:
          "I could not generate a response."

      }
    }

    try {

      const parsed =
        JSON.parse(
          message
        )

      const fn =
        ACTION_MAP[
          parsed.action
        ]

      if (
        !fn
      ) {

        return {

          ok: true,

          message:
            "I understood the request but could not execute it."

        }
      }

      const result =
        await fn(
          parsed.data,
          userId
        )

      if (
        parsed.action ===
        "create_client"
      ) {

        return {

          ok: true,

          message:
            `Client ${result.name} created successfully`

        }
      }

      if (
        parsed.action ===
        "create_invoice"
      ) {

        return {

          ok: true,

          message:
            `Invoice created successfully for client ${result.client_id}`

        }
      }

      return {

        ok: true,

        message:
          "Action completed"

      }

    } catch {

      return {

        ok: true,

        message:
          String(
            message
          )

      }

    }

  } catch (err) {

    console.error(
      "runAgent Error:",
      err
    )

    return {

      ok: false,

      message:
        "AgentFlowX encountered an error."

    }

  }

}

module.exports = {
  runAgent
}