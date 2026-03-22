// @ts-nocheck
import { GoogleGenerativeAI } from '@google/generative-ai';

async function test() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("❌ No GEMINI_API_KEY found in .env");
    return;
  }

  console.log(`Testing API Key: ${key.substring(0, 10)}...`);
  
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const result = await model.generateContent("Hello, respond with 'OK' if you see this.");
    const response = await result.response;
    console.log("✅ API is working! Response:", response.text());
  } catch (error: any) {
    console.error("❌ API Test Failed:");
    console.error(error.message);
    if (error.status === 429) {
      console.error("👉 This is a Quota/Rate Limit error. Wait 60s and try again.");
    }
  }
}

test();
