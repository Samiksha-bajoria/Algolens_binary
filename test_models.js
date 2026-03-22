fetch("https://generativelanguage.googleapis.com/v1beta/models?key=GEMINI_API_KEY")
  .then(r => r.json())
  .then(d => {
    if (d.error) {
      console.log("ERROR:", d.error);
      return;
    }
    const supported = d.models
      .filter(m => m.supportedGenerationMethods.includes("generateContent"))
      .map(m => m.name)
      .join("\n");
    console.log("AVAILABLE MODELS FOR GENERATE CONTENT:\n", supported);
  })
  .catch(console.error);
