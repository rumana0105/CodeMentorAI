import { GoogleGenAI, Type } from "@google/genai";
import { Problem, Hint, CodeReview } from "../types";

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("GEMINI_API_KEY is not set. Please add it to your environment variables in the Settings menu.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function generateHint(
  problem: Problem,
  code: string,
  language: string = "python",
  error?: string,
  level: number = 1,
  isStuckTriggered: boolean = false
): Promise<Hint> {
  const levelDescriptions = [
    "CONCEPTUAL: Explain the core underlying concept required to solve the problem (e.g., 'Recursion' or 'Two Pointers') without mentioning the specific approach for this problem.",
    "APPROACH: Describe the high-level strategy or algorithm (e.g., 'Use a stack to keep track of open brackets').",
    "PSEUDOCODE: Provide step-by-step logic in plain English or very abstract code fragments (max 3 lines) representing the solution structure."
  ];

  const hintModePrompt = isStuckTriggered
    ? `STUCK DETECTION MODE: Gently interrupt with a short, targeted hint (1-2 sentences). Focus on pointing to the likely issue.`
    : `ON-DEMAND HINT (Level ${level}): ${levelDescriptions[Math.min(level - 1, 2)]}`;

  const prompt = `
    You are an AI programming mentor called CodeMentorAI. 
    Language: ${language}
    Problem: ${problem.title}
    Description: ${problem.description}
    Code: \`\`\`${language}\n${code}\n\`\`\`
    ${error ? `Error: ${error}` : "Status: Logically incorrect or incomplete."}
    
    TASK: ${hintModePrompt}
    
    RULES: 
    - NEVER provide full solution. 
    - NEVER provide code if Level is 1 or 2.
    - Level 3 can have 1-2 lines of abstract pseudocode.
    - Keep it encouraging and technical.
    
    Return ONLY JSON matching this schema:
    { "type": "beginner" | "logical" | "debugging", "content": "hint text here", "isStuckTrigger": boolean }
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            content: { type: Type.STRING },
            isStuckTrigger: { type: Type.BOOLEAN }
          },
          required: ["type", "content", "isStuckTrigger"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (err) {
    console.error("AI Hint Generation Error:", err);
    const message = err instanceof Error ? err.message : String(err);
    
    let content = "I'm having trouble analyzing your code right now. Try again in a moment.";
    if (message.includes("GEMINI_API_KEY")) {
      content = "AI Mentor is unavailable because the Gemini API key is not configured. Please add it in Settings.";
    } else if (message.includes("429") || message.includes("quota")) {
      content = "The AI Mentor is currently resting due to high demand (API rate limit exceeded). Please try again in 60 seconds or consider using a paid API key for uninterrupted access.";
    }

    return {
      type: "logical",
      content,
      isStuckTrigger: isStuckTriggered
    };
  }
}

export async function explainHintConcept(hint: Hint, problem: Problem, language: string = "python"): Promise<string> {
  const prompt = `Explain the concept behind this hint in ${language} for "${problem.title}": "${hint.content}". Educational only, no code.`;
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "No explanation generated.";
  } catch (err) {
    console.error("explainHintConcept error:", err);
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("429") || message.includes("quota")) {
      return "The AI Mentor has reached its limit for now. Please wait a minute before asking for more explanations.";
    }
    return "I couldn't generate an explanation at this time. Please check your API key configuration.";
  }
}

export async function generateFullSolution(
  problem: Problem,
  language: string = "python"
): Promise<string> {
  const prompt = `Provide the FULL solution for "${problem.title}". Description: ${problem.description}. Language: ${language}. ONLY return code in markdown block.`;
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "No solution generated.";
  } catch (err) {
    console.error("generateFullSolution error:", err);
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("429") || message.includes("quota")) {
      return "The AI Mentor is currently at its limit. Please wait 60 seconds before requesting a full solution.";
    }
    return "Unable to generate solution at this time. Please ensure your Gemini API key is correctly set in the Settings menu.";
  }
}

export async function reviewCode(problem: Problem, code: string, language: string = "python"): Promise<CodeReview> {
  const prompt = `
    Analyze this ${language} code for "${problem.title}".
    Problem: ${problem.description}
    Code: \`\`\`${language}\n${code}\n\`\`\`
    Provide deep technical feedback in JSON: 
    { 
      "style": "analysis of clean code, naming, and structure", 
      "optimizations": "efficiency, complexity analysis, and performance improvements", 
      "bestPractices": "idiomatic usage and design patterns", 
      "edgeCases": "missing constraints or input conditions",
      "potentialBugs": "logical errors, syntax traps, or runtime risks",
      "overallFeedback": "mentorship summary" 
    }
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            style: { type: Type.STRING },
            optimizations: { type: Type.STRING },
            bestPractices: { type: Type.STRING },
            edgeCases: { type: Type.STRING },
            potentialBugs: { type: Type.STRING },
            overallFeedback: { type: Type.STRING }
          },
          required: ["style", "optimizations", "bestPractices", "edgeCases", "potentialBugs", "overallFeedback"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (err) {
    console.error("AI Code Review Error:", err);
    const message = err instanceof Error ? err.message : String(err);
    
    let bestPractices = "Best practices analysis failed.";
    let overallFeedback = "The AI mentor encountered an issue. Please ensure your API key is configured correctly.";
    
    if (message.includes("GEMINI_API_KEY")) {
      bestPractices = "API Key missing.";
    } else if (message.includes("429") || message.includes("quota")) {
      bestPractices = "Rate limit reached.";
      overallFeedback = "The AI Mentor is currently overwhelmed with requests. Please wait a minute before requesting another code review.";
    }

    return {
      style: "Unable to analyze style.",
      optimizations: "Efficiency check unavailable.",
      bestPractices,
      edgeCases: "Unable to identify edge cases.",
      potentialBugs: "Bug analysis unavailable.",
      overallFeedback
    };
  }
}

export async function explainError(error: string, language: string = "python"): Promise<string> {
  const prompt = `Explain this ${language} error to a beginner: ${error}`;
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "No explanation generated.";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("429") || message.includes("quota")) {
      return "Rate limit exceeded. Please wait a moment.";
    }
    return "Error explanation failed. Please check your API key.";
  }
}

export async function chatWithMentor(
  message: string, 
  history: { role: "user" | "model"; parts: { text: string }[] }[] = [],
  language: string = "python", 
  context?: string
): Promise<string> {
  const systemInstruction = `
    You are CodeMentorAI, a helpful, technical, and encouraging programming mentor.
    Your goal is to guide the user towards solving their coding problems without giving the answer directly when possible.
    Primary Language: ${language}
    Project Context: ${context}
  `;

  try {
    const ai = getAI();
    const contents = [
      ...history,
      { role: "user" as const, parts: [{ text: message }] }
    ];

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction
      } as any
    });

    return result.text || "No response received.";
  } catch (err) {
    console.error("Chat Error:", err);
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("429") || message.includes("quota")) {
      return "The mentor is busy with many students. Please wait a minute.";
    }
    return "Mentor is temporarily unavailable. Check your API key.";
  }
}

export async function analyzeBehavior(
  problem: Problem,
  codeHistory: { code: string; timestamp: string }[],
  hintsUsed: number,
  timeSpentMs: number
): Promise<{ dependencyScore: number; originalThinkingScore: number; plagiarismProbability: number }> {
  const prompt = `
    Analyze this developer's behavioral patterns for the problem "${problem.title}".
    Time Spent: ${timeSpentMs / 1000}s
    Hints Used: ${hintsUsed}
    Code History (Length): ${codeHistory.length}
    Final Code: \`\`\`\n${codeHistory[codeHistory.length - 1]?.code || ""}\n\`\`\`
    
    Calculate:
    1. AI Dependency Score (0-100): High if clues/hints are taken early or code jumps in large blocks.
    2. Original Thinking Score (0-100): High if user iterates manually.
    3. Plagiarism Probability (0-100): Probability the code was copied from outside.
    
    Return JSON only.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dependencyScore: { type: Type.NUMBER },
            originalThinkingScore: { type: Type.NUMBER },
            plagiarismProbability: { type: Type.NUMBER }
          },
          required: ["dependencyScore", "originalThinkingScore", "plagiarismProbability"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (err) {
    console.error("Behavior Analysis Error:", err);
    return { dependencyScore: 0, originalThinkingScore: 100, plagiarismProbability: 0 };
  }
}

export async function generateDetailedFeedback(
  problem: Problem,
  code: string,
  language: string
): Promise<{ strengths: string; improvements: string }> {
  const prompt = `
    Review the final submission for "${problem.title}" in ${language}.
    Code: \`\`\`${language}\n${code}\n\`\`\`
    Identify 2-3 specific strengths and 2-3 specific areas for improvement.
    Return JSON only.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strengths: { type: Type.STRING },
            improvements: { type: Type.STRING }
          },
          required: ["strengths", "improvements"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (err) {
    console.error("Detailed Feedback Error:", err);
    return { strengths: "Correct logic.", improvements: "Can be more efficient." };
  }
}

export async function getRecommendedProblems(
  profile: any,
  allProblems: Problem[]
): Promise<{ problemId: string; reason: string; focusTopic: string; mastery: number }[]> {
  const prompt = `
    Analyze this student's coding profile and suggest exactly 3 problems from the available list that target their weaknesses.
    
    Student Profile:
    - Topic Stats (successful problems per category): ${JSON.stringify(profile.topicStats)}
    - Level: ${profile.level}
    - Accuracy: ${profile.accuracy}%
    - Solved Problem IDs: ${JSON.stringify(profile.solvedProblems)}
    
    Available Problems:
    ${allProblems.map(p => `- ID: ${p.id}, Title: ${p.title}, Category: ${p.category}, Difficulty: ${p.difficulty}`).join('\n')}
    
    Selection Strategy:
    1. Identify categories with 0 or low counts in Topic Stats.
    2. Prioritize problems the student HAS NOT solved yet.
    3. Match difficulty to student level.
    
    Return JSON only in this format:
    [
      { 
        "problemId": "...", 
        "reason": "A short encouraging 1-sentence reason.",
        "focusTopic": "The specific category/topic identified as weak",
        "mastery": number (0-100 estimate of current mastery in this topic)
      }
    ]
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              problemId: { type: Type.STRING },
              reason: { type: Type.STRING },
              focusTopic: { type: Type.STRING },
              mastery: { type: Type.NUMBER }
            },
            required: ["problemId", "reason", "focusTopic", "mastery"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (err) {
    console.error("Problem Recommendation Error:", err);
    const solved = profile.solvedProblems || [];
    return allProblems
      .filter(p => !solved.includes(p.id))
      .slice(0, 3)
      .map(p => ({ 
        problemId: p.id, 
        reason: "Focus on expanding your fundamentals with this challenge.",
        focusTopic: p.category,
        mastery: 0
      }));
  }
}
