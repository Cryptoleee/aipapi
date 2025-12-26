
import { GoogleGenAI } from "@google/genai";

export async function generateArtPrompt(userInput: string): Promise<string> {
  // Always use process.env.API_KEY directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Transform this simple idea into a high-detail artistic prompt for an image generator. The style should be modern, clean, and futuristic. Idea: ${userInput}`,
    config: {
      systemInstruction: "You are a specialized AI Art Director. Create concise but powerful prompts that emphasize lighting, texture, and futuristic aesthetics."
    }
  });
  // Use the .text property to get the generated response
  return response.text || userInput;
}

export async function generateArtImage(prompt: string): Promise<string | null> {
  // Always use process.env.API_KEY directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4",
        }
      }
    });

    // Iterate through candidates and parts to find the image part
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
}
