const { askAzureOpenAI } = require("./azureOpenAI.service");

/**
 * Detect invoice anomalies using Azure OpenAI
 */
async function detectInvoiceAnomalies(userId, invoices) {
  if (!invoices || invoices.length === 0) {
    return {
      riskLevel: "low",
      message: "No invoices available for analysis",
      anomalies: [],
    };
  }

  // Prepare compact invoice summary
  const invoiceSummary = invoices.map((inv) => ({
    amount: inv.amount,
    currency: inv.currency,
    due_at: inv.due_at,
    created_at: inv.created_at,
    status: inv.status || "pending",
  }));

  // Single prompt (REST-safe)
  const prompt = `
You are a financial risk detection AI.

Rules:
- Flag unusually high invoice amounts
- Flag repeated late payments
- Flag abnormal frequency or spikes
- Output STRICT JSON ONLY (no markdown, no text)

Return format:
{
  "riskLevel": "low | medium | high",
  "anomalies": [
    {
      "type": "string",
      "description": "string"
    }
  ]
}

Invoices:
${JSON.stringify(invoiceSummary, null, 2)}
`;

  const response = await askAzureOpenAI(prompt);

  try {
    return JSON.parse(response);
  } catch (err) {
    return {
      riskLevel: "unknown",
      message: "AI analysis failed",
      raw: response,
    };
  }
}

module.exports = { detectInvoiceAnomalies };
