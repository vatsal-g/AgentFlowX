require("dotenv").config();

const { query } = require("./db");
const { sanitizePrompt } = require("./ai.guard");
const { runGemini } = require("./ai.gemini");

/* =========================
   DB ACTIONS
========================= */

async function createClient({ name, email }, userId) {
console.log("client been created via gemini:")
console.log({
  userId,
  name,
  email})
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
console.log("insert result")
  console.log(result.rows);
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

const systemPrompt =  `

You are AgentFlowX.

You manage business actions.

Rules:

If user wants to:

- create client
- create invoice

Return ONLY JSON.

Extract values from the user's request.

Examples:

Single:

{
 "action":"create_client",
 "data":{
   "name":"<user_name>",
   "email":"<user_email_or_null>"
 }
}

Multiple:

[
 {
   "action":"create_client",
   "data":{
     "name":"<user_name>",
     "email":null
   }
 },
 {
   "action":"create_invoice",
   "data":{
     "amount":<user_amount>
   }
 }
]

Do NOT always use Rahul.
Use actual values provided by the user.

No markdown.
No explanation.
Only JSON.

For normal questions:
respond naturally.

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
console.log("Gemini is responding")
console.log(message);
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
const cleaned = message
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

console.log("CLEANED RESPONSE:", cleaned);

let parsed = JSON.parse(cleaned);
      const outputs = []

      let createdClient =
        null

      for (
        const item
        of parsed
      ) {

        if (
          item.action ===
          "create_client"
        ) {
          console.log("Action done",item)

          createdClient =
            await createClient(
              item.data,
              userId
            )

          outputs.push(
            `Client ${createdClient.name} created`
          )

        }

        else if (
          item.action ===
          "create_invoice"
        ) {

          if (
            !item.data.clientId
            &&
            createdClient
          ) {

            item.data.clientId =
              createdClient.id

          }

          const invoice =
            await createInvoice(
              item.data,
              userId
            )

          outputs.push(
            `Invoice ₹${invoice.amount} created`
          )

        }

      }

      return {

        ok: true,

        message:
          outputs.join("\n")

      }

    } catch {

      return {

        ok: true,

        message:
          String(message)

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