const axios = require("axios");
const { ClientSecretCredential } = require("@azure/identity");

/*
ENV REQUIRED:
AZURE_TENANT_ID
AZURE_CLIENT_ID
AZURE_CLIENT_SECRET
AZURE_FOUNDRY_ENDPOINT   (example: https://agentflowx.eastus.inference.ai.azure.com)
*/

const credential = new ClientSecretCredential(
  process.env.AZURE_TENANT_ID,
  process.env.AZURE_CLIENT_ID,
  process.env.AZURE_CLIENT_SECRET
);

async function runFoundryChat(systemPrompt, userPrompt) {
  // 1️⃣ Get Azure AD token for Cognitive Services
  const token = await credential.getToken(
    "https://cognitiveservices.azure.com/.default"
  );

  // 2️⃣ Call Azure AI Foundry inference endpoint
  const response = await axios.post(
    `${process.env.AZURE_FOUNDRY_ENDPOINT}/chat/completions`,
    {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0
    },
    {
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Content-Type": "application/json"
      }
    }
  );

  // 3️⃣ Return assistant message
  return response.data.choices[0].message.content;
}

module.exports = { runFoundryChat };
