import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;
let ai: GoogleGenAI | null = null;

// This prevents the app from crashing at load time if the API key is missing.
// The functions below will throw a clear error if the key is not available.
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.error("API_KEY environment variable not set. AI features are disabled.");
}

/**
 * Summarizes the given text using the Gemini API.
 * @param message The text to summarize.
 * @returns A promise that resolves to the summary string.
 */
export async function summarizeMessage(message: string): Promise<string> {
  if (!ai) {
    throw new Error("AI client is not initialized. Please configure the API_KEY.");
  }
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Summarize the following customer inquiry concisely, in one or two sentences. Focus on the main point or question.\n\n---\n\n${message}`,
    });
    return response.text;
  } catch (error) {
    console.error("Error summarizing message with Gemini:", error);
    throw new Error("Could not generate summary. Please try again.");
  }
}

/**
 * Drafts a reply to the given text using the Gemini API.
 * @param message The text to reply to.
 * @returns A promise that resolves to the draft reply string.
 */
export async function draftReply(message: string): Promise<string> {
  if (!ai) {
    throw new Error("AI client is not initialized. Please configure the API_KEY.");
  }
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Draft a professional and helpful reply to the following customer message. Keep it friendly but concise. Address the customer's main point directly. Sign off as "The BroTech Team".\n\n---\n\nCustomer Message:\n${message}`,
    });
    return response.text;
  } catch (error) {
    console.error("Error drafting reply with Gemini:", error);
    throw new Error("Could not draft reply. Please try again.");
  }
}
