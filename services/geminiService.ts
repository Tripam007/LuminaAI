
import { GoogleGenAI, Type } from "@google/genai";
import { Priority, Category, Task } from "../types";

// Dynamic initialization helper to ensure we always use the latest API key injected by the platform
const getAIClient = () => {
  // Always use process.env.API_KEY directly and instantiate per request
  return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
};

export const parseNaturalLanguageTask = async (input: string) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Parse the following task and extract details in JSON format. 
      Input: "${input}"
      Reference Date/Time: ${new Date().toLocaleString()}
      Rules:
      - Deadline should be in ISO format.
      - Priority must be one of: LOW, MEDIUM, HIGH.
      - Category must be one of: WORK, STUDY, HEALTH, PERSONAL, OTHER.
      - Suggest a logical reminder string (e.g., "1 hour before", "9 AM day of") if a deadline exists.
      - Default to MEDIUM priority and PERSONAL category if unclear.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            deadline: { type: Type.STRING },
            priority: { type: Type.STRING },
            category: { type: Type.STRING },
            reminder: { type: Type.STRING },
            isComplex: { type: Type.BOOLEAN }
          },
          required: ["title", "priority", "category"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("AI Parsing error:", error);
    if (error.message?.includes("Requested entity was not found")) {
      // This indicates a stale or invalid API key project.
      // We handle this in the UI by prompting for a new key.
    }
    return null;
  }
};

export const suggestReminderTime = async (task: Task) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on the following task, suggest the most effective reminder time to ensure it gets done.
      Task Title: "${task.title}"
      Deadline: "${task.deadline || 'No deadline'}"
      Priority: "${task.priority}"
      Current Time: "${new Date().toLocaleString()}"
      
      Respond with a short, friendly reminder suggestion (e.g. "2 hours before", "Tomorrow morning at 9:00 AM").`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestion: { type: Type.STRING },
            reasoning: { type: Type.STRING }
          },
          required: ["suggestion"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Reminder Suggestion error:", error);
    return null;
  }
};

export const generateSubtasks = async (taskTitle: string) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Break down the following complex task into 3-5 actionable subtasks.
      Task: "${taskTitle}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    return JSON.parse(response.text) as string[];
  } catch (error) {
    console.error("AI Subtask error:", error);
    return [];
  }
};

export const getProductivityInsights = async (tasks: Task[]) => {
  try {
    const ai = getAIClient();
    const taskSummary = tasks.map(t => `${t.title} (${t.completed ? 'Done' : 'Pending'})`).join(', ');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these tasks and provide productivity insights.
      Tasks: ${taskSummary}
      Provide:
      1. A short motivational summary.
      2. One specific productivity tip based on the task mix.
      3. A productivity score (0-100).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            tip: { type: Type.STRING },
            productivityScore: { type: Type.NUMBER }
          },
          required: ["summary", "tip", "productivityScore"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Insights error:", error);
    return null;
  }
};
