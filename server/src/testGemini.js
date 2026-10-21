
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

async function testGemini() {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    console.log("Testing model:", model);

    const response = await ai.models.generateContent({
      model,
      contents: "Reply with exactly: Gemini connection successful"
    });

    console.log("SUCCESS!");
    console.log("Response:", response.text);

  } catch (error) {
    console.log("TEST FAILED");
    console.log("Status:", error.status);
    console.log("Message:", error.message);
  }
}

testGemini();
