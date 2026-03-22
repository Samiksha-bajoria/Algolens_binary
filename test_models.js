fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyDuJvKgE2WOiNhDrpsBY09kgHyR0JO5OYc")
  .then(r => r.json())
  .then(d => {
    if (d.error) {
      console.log("ERROR:", d.error);
      return;
    }
    const supported = d.models
      .filter((m: any) => m.supportedGenerationMethods.includes("generateContent"))
      .map((m: any) => m.name)
      .join("\\n");
    console.log("AVAILABLE MODELS FOR GENERATE CONTENT:\\n", supported);
  })
  .catch(console.error);
