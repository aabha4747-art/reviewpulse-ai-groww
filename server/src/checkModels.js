
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

async function checkModels() {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    console.log("Checking available Gemini models...\n");

    const models = await ai.models.list();

    for await (const model of models) {
      const name = model.name || "";
      const methods = model.supportedActions || [];

      if (name.includes("gemini")) {
        console.log(name);
        console.log("Actions:", methods.join(", ") || "Not listed");
        console.log("------------------------");
      }
    }
  } catch (error) {
    console.error("Error checking models:");
    console.error("Status:", error.status);
    console.error("Message:", error.message);
  }
}

checkModels();
