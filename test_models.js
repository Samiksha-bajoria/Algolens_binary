fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyCas9o8VJ0a0NVSK3xHp-R8UJJnvmX7lp4")
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
