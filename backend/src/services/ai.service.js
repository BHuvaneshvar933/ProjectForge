import Groq from "groq-sdk";
import Team from "../models/team.model.js";
import Project from "../models/project.model.js";

let groqInstance = null;
const getGroq = () => {
  if (!groqInstance) {
    groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqInstance;
};

export const generateResumeBullet = async (projectData) => {
  const prompt = `
    You are an expert technical recruiter, resume writer, and ATS (Applicant Tracking System) optimization specialist. 
    Based on the following software engineering project details, generate 3 to 4 highly impressive, action-oriented resume bullet points (using the STAR method ideally). 
    They must sound extremely professional, quantify results where possible, and highlight the technical stack in a way that passes ATS parsers perfectly (avoid overly complex phrasing that ATS might misread, use standard keywords).

    Project Title: ${projectData.title}
    Description: ${projectData.description}
    Tech Stack: ${projectData.skills?.join(", ")}
    My Key Achievements: ${projectData.achievements?.join(", ")}
    Challenges Overcome: ${projectData.challenges?.join(", ")}

    Do NOT include any introductory or concluding text (like "Here are your bullets:"). Output ONLY the bullet points, each on a new line starting with a bullet symbol (-) and an action verb. Keep each bullet to one powerful sentence or a two-sentence max.
  `;

  const chatCompletion = await getGroq().chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "openai/gpt-oss-120b",
    temperature: 0.7,
    max_tokens: 500,
  });

  return chatCompletion.choices[0]?.message?.content || "";
};

export const generateInterviewStory = async (projectData) => {
  const prompt = `
    You are an expert career coach and technical recruiter. 
    Based on the following project details, write a compelling "STAR" (Situation, Task, Action, Result) method story that the developer can use in a behavioral interview.
    Ensure the story incorporates the technical stack naturally as industry-standard keywords so the candidate can adapt it easily for ATS-friendly written applications or verbal interviews.

    Project Title: ${projectData.title}
    Description: ${projectData.description}
    Tech Stack: ${projectData.skills?.join(", ")}
    My Key Achievements: ${projectData.achievements?.join(", ")}
    Challenges Overcome: ${projectData.challenges?.join(", ")}
    My Biggest Takeaway: ${projectData.takeaway}

    Format the response nicely using markdown:
    **The Situation:** ...
    **The Task:** ...
    **The Action:** ...
    **The Result & Takeaway:** ...

    Do not include any conversational filler (e.g., "Here is your story!"). Just return the formatted story.
  `;

  const chatCompletion = await getGroq().chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "openai/gpt-oss-120b",
    temperature: 0.7,
    max_tokens: 1500,
  });

  return chatCompletion.choices[0]?.message?.content || "";
};

export const generateCareerAssets = async (projectData, projectId, userId) => {
  const prompt = `
    You are an expert technical recruiter, resume writer, and career coach.
    Based on the following software engineering project details, generate a comprehensive suite of career assets for the developer.

    Project Title: ${projectData.title}
    Description: ${projectData.description}
    Tech Stack: ${projectData.skills?.join(", ")}
    You are an elite Silicon Valley technical recruiter and senior engineering manager. Your task is to generate a comprehensive suite of career assets for a developer based on their recent project.
    
    You MUST enforce the following strict industry best practices for the generated content:
    
    1. RESUME BULLETS:
       - MUST follow the "XYZ Formula": Accomplished [X] as measured by [Y], by doing [Z].
       - MUST use strong action verbs (e.g., Engineered, Architected, Spearheaded, Optimized). Do NOT use weak words like "Helped with" or "Responsible for".
       - Focus on IMPACT, technical judgment, and outcomes. If metrics aren't provided, use placeholders like "[X]%" or "[Y]ms".
       - Generate exactly 3 bullet points.
       
    2. PORTFOLIO DESCRIPTION:
       - Limit to 2 highly polished paragraphs.
       - Paragraph 1: What problem did this project solve and what was the real-world use case?
       - Paragraph 2: What was the tech stack, why was it chosen, and what architectural hurdle was overcome?
       
    3. LINKEDIN POSTS:
       - MUST provide value to the reader (e.g., sharing a lesson learned, explaining a trade-off). No generic bragging.
       - "professional": Focus on the architectural decisions and business impact.
       - "technical": Focus on the specific tools, debugging process, and code quality.
       - "buildInPublic": Casual, story-driven tone about overcoming the biggest challenge.
       
    4. INTERVIEW ANSWER (STAR Method):
       - Answer the prompt: "Tell me about a challenging technical problem you solved on this project."
       - MUST follow strict proportions: Situation (10%), Task (10%), Action (60%), Result (20%).
       - The Action section MUST use "I" statements, focusing on the individual's specific technical decisions and problem-solving steps.
       
    Project Data:
    ${JSON.stringify(projectData, null, 2)}

    You MUST output ONLY a valid JSON object. Do not include any other text, markdown blocks, or introductory text. Output ONLY valid, parseable JSON.
    Example format:
    {
      "resumeBullets": ["bullet 1", "bullet 2", "bullet 3"],
      "portfolioDescription": "A professional 2-paragraph summary...",
      "linkedinPosts": {
        "professional": "Post 1...",
        "technical": "Post 2...",
        "buildInPublic": "Post 3..."
      },
      "interviewAnswer": "A well-structured STAR method story..."
    }
  `;

  const chatCompletion = await getGroq().chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "openai/gpt-oss-120b",
    temperature: 0.7,
    max_tokens: 3000
  });

  try {
    let rawContent = chatCompletion.choices[0]?.message?.content || "{}";
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : "{}";
    const assets = JSON.parse(jsonString);
    
    if (!assets || Object.keys(assets).length === 0) {
      throw new Error("AI returned empty assets");
    }
    
    if (projectId && userId && Object.keys(assets).length > 0) {
      await Team.findOneAndUpdate(
        { projectId, userId, status: "active", isDeleted: false },
        { $set: { careerAssets: assets } }
      );
    }
    
    return assets;
  } catch (e) {
    console.error("AI Generation Error: ", e);
    throw new Error("Failed to generate career assets correctly. Please try again.");
  }
};

export const generateProjectHealthScore = async (projectId, projectData, tasks, team) => {
  const prompt = `
    You are an expert Agile Project Manager and AI health assessor.
    Based on the following project context, calculate a realistic Project Health Score (0-100) and provide a status, reasoning, and actionable suggestion.

    Project Title: ${projectData.title}
    Status: ${projectData.status}
    Timeline: ${JSON.stringify(projectData.timeline)}
    
    Total Team Members: ${team.length}
    Total Tasks: ${tasks.length}
    Completed Tasks: ${tasks.filter(t => t.status === 'done').length}
    Overdue Tasks: ${tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length}
    In-Progress Tasks: ${tasks.filter(t => t.status === 'in-progress').length}
    
    Analyze the task completion rate, team activity, and deadline proximity.
    You MUST output ONLY a valid JSON object. Do not explain anything outside the JSON.
    Example:
    {
      "health_score": 75,
      "status": "At Risk",
      "reasoning": "Brief explanation of why this score was given.",
      "suggestion": "One actionable step to improve."
    }
  `;

  const chatCompletion = await getGroq().chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "openai/gpt-oss-120b",
    temperature: 0.2,
    max_tokens: 500
  });

  try {
    let rawContent = chatCompletion.choices[0]?.message?.content || "{}";
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : "{}";
    const parsed = JSON.parse(jsonString);
    
    const result = {
      health_score: parsed.health_score || parsed.HealthScore || parsed.healthScore || parsed.score,
      status: parsed.status || parsed.Status,
      reasoning: parsed.reasoning || parsed.Reasoning,
      suggestion: parsed.suggestion || parsed.Suggestion
    };
    
    if (result.health_score === undefined || !result.status || !result.reasoning || !result.suggestion) {
      throw new Error("AI failed to return the required JSON structure. Raw output: " + rawContent);
    }
    
    await Project.findByIdAndUpdate(projectId, {
      $set: {
        "metrics.aiHealthScore": result.health_score,
        "metrics.aiHealthStatus": result.status,
        "metrics.aiHealthReasoning": result.reasoning,
        "metrics.aiHealthSuggestion": result.suggestion,
        "metrics.aiLastGeneratedAt": new Date()
      }
    });

    return result;
  } catch (e) {
    console.error("AI Health Score Error: ", e);
    throw new Error("Failed to generate health score: " + e.message);
  }
};

export const generateWeeklyProjectSummary = async (projectId, projectData, tasks, team) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const completedThisWeek = tasks.filter(t => t.status === 'done' && t.updatedAt && new Date(t.updatedAt) > sevenDaysAgo);
  const createdThisWeek = tasks.filter(t => t.createdAt && new Date(t.createdAt) > sevenDaysAgo);
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done');

  const prompt = `
    You are an expert Project Manager. Write a concise, 1-2 paragraph weekly digest for the project owner.
    
    Project Title: ${projectData.title}
    Total Team Size: ${team.length}
    Tasks Completed This Week: ${completedThisWeek.length}
    New Tasks Created This Week: ${createdThisWeek.length}
    Total Overdue Tasks: ${overdueTasks.length}

    Summarize the week's progress. Be highly professional but readable. Point out any blocking issues (like overdue tasks) and provide a recommendation for next week.
    Do not use introductory greetings (like "Here is the summary"). Just return the raw summary text.
  `;

  const chatCompletion = await getGroq().chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "openai/gpt-oss-120b",
    temperature: 0.5,
    max_tokens: 600,
  });

  const summary = chatCompletion.choices[0]?.message?.content || "";

  if (summary) {
    await Project.findByIdAndUpdate(projectId, {
      $set: {
        "metrics.aiWeeklySummary": summary,
        "metrics.aiLastGeneratedAt": new Date()
      }
    });
  }

  return summary;
};
