export const fetchGemini = async (prompt: string, key: string) => {
  // 1. Fetch available models
  const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  const modelsRes = await fetch(modelsUrl);
  if (!modelsRes.ok) throw new Error("Failed to fetch available models.");
  const modelsData = await modelsRes.json();
  
  // 2. Find a working model (prefer flash, fallback to pro, must support generateContent)
  const validModels = modelsData.models.filter((m: any) => 
    m.supportedGenerationMethods?.includes("generateContent") && m.name.includes("gemini")
  );
  if (validModels.length === 0) throw new Error("No compatible Gemini models found for this API Key.");
  
  // Prefer 1.5-flash, else take the first valid one
  const selectedModel = validModels.find((m: any) => m.name.includes("1.5-flash"))?.name || validModels[0].name;

  // 3. Make the actual request
  const url = `https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${key}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
  });

  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
};
