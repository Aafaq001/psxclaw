require("dotenv").config({ path: ".env.local" });

async function testAnthropic() {
  const anthropicPayload = {
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1200,
    messages: [{ role: "user", content: "hello" }],
  };

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(anthropicPayload),
  });

  const data = await response.json();
  console.log("FULL Anthropic Response:", JSON.stringify(data, null, 2));
}

testAnthropic();
