import { GoogleGenerativeAI } from '@google/generative-ai';

async function test() {
  const key = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("❌ No GEMINI_API_KEY found in .env");
    return;
  }

  console.log(`Testing API Key: ${key.substring(0, 10)}...`);
  
  const genAI = new GoogleGenerativeAI(key);

  // --- Step 1: List Available Models ---
  console.log("--- 📋 Available Models ---");
  let models = [];
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    if (data.models) {
      models = data.models
        .filter(m => m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name.replace('models/', ''));
      console.log(`Found ${models.length} compatible models.`);
    } else {
      console.log("No models found or error listing models:", data);
      return;
    }
  } catch (err) {
    console.error("Could not list models:", err.message);
    return;
  }

  // --- Step 2: Scan for Working Model ---
  console.log("\n--- ⚡ Scanning for a model with NON-ZERO Quota ---");
  
  // Prioritize stable names
  const testOrder = [
    'gemini-1.5-flash',
    'gemini-flash-latest',
    'gemini-1.5-pro',
    'gemini-pro-latest',
    'gemini-2.0-flash',
    ...models.filter(m => !['gemini-1.5-flash', 'gemini-flash-latest', 'gemini-1.5-pro', 'gemini-pro-latest', 'gemini-2.0-flash'].includes(m))
  ];

  for (const modelName of testOrder) {
    if (!models.includes(modelName) && !modelName.includes('latest')) continue;
    
    console.log(`Testing model: ${modelName}...`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Respond with OK");
      const response = await result.response;
      console.log(`✅ SUCCESS! Model ${modelName} is WORKING.`);
      console.log(`Response: ${response.text()}`);
      console.log(`\n👉 SOLUTION: Update your app to use this model name.`);
      return; // Stop after first success
    } catch (error) {
      if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
        console.log(`❌ Model ${modelName} hit Quota Limit (Limit: 0 or Exhausted).`);
      } else {
        console.log(`❌ Model ${modelName} failed with: ${error.message.substring(0, 100)}`);
      }
    }
    // Small gap to be safe
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log("\n❌ ALL models scanned. None are working with your current API key.");
  console.log("This usually means your Google Project has a hard block on the GEMINI_API service or the key is globally restricted.");
}

test();
