require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

(async () => {
  try {
    const response = await ai.models.list();

    // response is an object with `models` array
    if (!response.models) {
      console.log("No models returned:", response);
      return;
    }

    console.log(
      response.models.map(m => m.name)
    );
  } catch (err) {
    console.error("List models error:", err);
  }
})();
