const { GoogleGenerativeAI } = require("@google/generative-ai")

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
)

async function runGemini(prompt) {

  const models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash"
  ]

  let lastError

  for (const modelName of models) {

    try {

      console.log("Trying:", modelName)

      const model =
        genAI.getGenerativeModel({
          model: modelName
        })

      const result =
        await model.generateContent(prompt)

      return result.response.text()

    } catch (err) {

      console.log(
        "Model failed:",
        modelName
      )

      lastError = err
    }
  }

  throw lastError
}

module.exports = {
  runGemini
}