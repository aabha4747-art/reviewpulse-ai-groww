
const { setTimeout: sleep } = require("node:timers/promises");

function isRetryable(error) {
  const status = Number(error?.status ?? error?.code);
  const message = String(error?.message || "").toLowerCase();

  return (
    [429, 500, 502, 503, 504].includes(status) ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("abort")
  );
}

async function generateWithRetry(ai, request, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Gemini attempt ${attempt}/${maxAttempts}`);

      const response = await ai.models.generateContent({
        ...request,
        config: {
          ...request.config,
          httpOptions: {
            ...request.config?.httpOptions,
            timeout: 20000
          }
        }
      });

      console.log("Gemini response received.");
      return response;

    } catch (error) {
      console.error(
        `Gemini attempt ${attempt} failed: ${error.message}`
      );

      if (!isRetryable(error) || attempt === maxAttempts) {
        throw error;
      }

      const delay = attempt * 2000;
      console.log(`Retrying after ${delay / 1000} seconds...`);

      await sleep(delay);
    }
  }
}

module.exports = { generateWithRetry };
