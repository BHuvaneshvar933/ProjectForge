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
    You are an expert technical recruiter and resume writer. 
    Based on the following software engineering project details, generate a single, highly impressive, action-oriented resume bullet point (using the STAR method ideally). 
    It must sound extremely professional, quantify results where possible, and highlight the technical stack.

    Project Title: ${projectData.title}
    Description: ${projectData.description}
    Tech Stack: ${projectData.skills?.join(", ")}
    My Key Achievements: ${projectData.achievements?.join(", ")}
    Challenges Overcome: ${projectData.challenges?.join(", ")}

    Do NOT include any introductory or concluding text (like "Here is your bullet:"). Output ONLY the bullet point text starting with an action verb. Keep it to one powerful sentence or a two-sentence max.
  `;

  const chatCompletion = await getGroq().chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "llama-3.1-8b-instant",
    temperature: 0.7,
    max_tokens: 150,
  });

  return chatCompletion.choices[0]?.message?.content || "";
};

export const generateInterviewStory = async (projectData) => {
  const prompt = `
    You are an expert career coach for software engineers. 
    Based on the following project details, write a compelling "STAR" (Situation, Task, Action, Result) method story that the developer can use in a behavioral interview when asked a question like: 
    "Tell me about a challenging project you worked on," or "Tell me about a time you overcame a technical obstacle."

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
    model: "mixtral-8x7b-32768",
    temperature: 0.7,
    max_tokens: 500,
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

    Output EXACTLY the following JSON format. Do not include any other text, markdown blocks, or introductory text. Output ONLY valid, parseable JSON.
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
    model: "mixtral-8x7b-32768",
    temperature: 0.7,
    max_tokens: 3000,
    response_format: { type: "json_object" }
  });

  try {
    const assets = JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
    
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
    Output EXACTLY the following JSON format. Do not include any other text.
    {
      "health_score": 75,
      "status": "At Risk",
      "reasoning": "Brief explanation of why this score was given.",
      "suggestion": "One actionable step to improve."
    }
  `;

  const chatCompletion = await getGroq().chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "mixtral-8x7b-32768",
    temperature: 0.2,
    max_tokens: 500,
    response_format: { type: "json_object" }
  });

  try {
    const result = JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
    
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
    throw new Error("Failed to generate health score.");
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
    model: "mixtral-8x7b-32768",
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
