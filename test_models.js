import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

async function listModels() {
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key found in .env");
    return;
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    // There is no listModels in the current GenAI SDK, we have to use the REST API
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    console.log("Supported Models:");
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Failed to list models:", e);
  }
}

listModels();
