const BLOCKED_PATTERNS = [
  /ignore previous instructions/i,
  /bypass security/i,
  /delete all/i,
  /drop table/i,
  /system prompt/i,
  /you are not an ai/i,
];

function sanitizePrompt(input) {
  if (!input || typeof input !== "string") return "";

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(input)) {
      throw new Error("prompt_injection_detected");
    }
  }

  return input.trim();
}

module.exports = { sanitizePrompt };
