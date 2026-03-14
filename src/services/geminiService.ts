import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function summarizeLesson(description: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Summarize the following lesson description into 3-5 key bullet points for a student. Keep it concise and encouraging.\n\nDescription: ${description}`,
    });
    return response.text || "No summary available.";
  } catch (error) {
    console.error("Error summarizing lesson:", error);
    return "Failed to generate summary.";
  }
}

export async function getTutorResponse(question: string, context: string, chatHistory: { role: 'user' | 'model', text: string }[]) {
  try {
    const chat = ai.chats.create({
      model: "gemini-1.5-flash",
      config: {
        systemInstruction: `You are a supportive AI Study Buddy for a platform called EduFlow. 
        Your goal is to help students understand course material. 
        When a student asks a question, provide a helpful hint or explanation that leads them to the answer, rather than just giving the final answer immediately. 
        Be encouraging and use a friendly, pastel-themed persona.
        Context about the current lesson: ${context}`,
      },
    });

    // Note: sendMessage only accepts message string, not contents object
    const response = await chat.sendMessage({ message: question });
    return response.text || "I'm not sure how to answer that right now.";
  } catch (error) {
    console.error("Error getting tutor response:", error);
    return "I'm having a bit of trouble connecting to my brain. Try again in a moment!";
  }
}
