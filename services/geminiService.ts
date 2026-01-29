
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
      contents: `You are a productivity expert. Parse this task: "${input}"
      Reference Date/Time: ${new Date().toLocaleString()}
      
      Instructions:
      1. Extract a clear, concise title.
      2. Identify a deadline if mentioned (ISO format).
      3. Assign a Priority based on keywords (e.g., 'urgent', 'asap', 'important' -> HIGH).
      4. Assign a Category based on content.
      5. Identify if it's a "Complex Task" that would benefit from subtasks (isComplex).
      
      CRITICAL: You MUST return EXACTLY one of these strings for priority: LOW, MEDIUM, HIGH.
      CRITICAL: You MUST return EXACTLY one of these strings for category: WORK, STUDY, HEALTH, PERSONAL, OTHER.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The core task description" },
            deadline: { type: Type.STRING, description: "ISO 8601 formatted date string" },
            priority: { 
              type: Type.STRING, 
              description: "Must be exactly 'LOW', 'MEDIUM', or 'HIGH'" 
            },
            category: { 
              type: Type.STRING, 
              description: "Must be exactly 'WORK', 'STUDY', 'HEALTH', 'PERSONAL', or 'OTHER'" 
            },
            reminder: { type: Type.STRING, description: "Suggested reminder phrase" },
            isComplex: { type: Type.BOOLEAN, description: "True if task is multi-step" }
          },
          required: ["title", "priority", "category"]
        }
      }
    });

    const parsed = JSON.parse(response.text);
    
    // Normalize to handle potential model variance in casing
    return {
      ...parsed,
      priority: (parsed.priority || 'MEDIUM').toUpperCase(),
      category: (parsed.category || 'PERSONAL').toUpperCase()
    };
  } catch (error: any) {
    console.error("AI Parsing error:", error);
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
