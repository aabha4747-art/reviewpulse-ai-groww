
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

async function checkModels() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  try {
    console.log("Checking available Gemini models...\n");

    const models = await ai.models.list();

    for await (const model of models) {
      if (
        model.name?.includes("gemini") &&
        model.supportedActions?.includes("generateContent")
      ) {
        console.log(model.name);
      }
    }
  } catch (error) {
    console.error("Could not list models:", error.message);
  }
}

checkModels();
