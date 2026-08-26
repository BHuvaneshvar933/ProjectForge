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
    
    IMPORTANT STRICT RULES:
    1. You must ONLY use the facts, metrics, tools, and achievements explicitly provided in the project details below. DO NOT invent, hallucinate, or make up any data, scale, technologies, or results.
    2. If the provided data is too sparse or empty (e.g., no skills, no achievements, and a very short description), you MUST return exactly the phrase: "Too less info" and nothing else.

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
    
    IMPORTANT STRICT RULES:
    1. You must ONLY use the facts, metrics, tools, and achievements explicitly provided in the project details below. DO NOT invent, hallucinate, or make up any data, scale, technologies, or results.
    2. If the provided data is too sparse or empty (e.g., no skills, no achievements, and a very short description), you MUST return exactly the phrase: "Too less info" and nothing else.

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
       
    IMPORTANT STRICT RULES:
    1. You must ONLY use the facts, metrics, tools, and achievements explicitly provided in the project details below. DO NOT invent, hallucinate, or make up any data, scale, technologies, or results.
    2. If the provided data is too sparse or empty (e.g., no skills, no achievements, and a very short description), you MUST return a JSON object with empty strings or arrays for all fields, or fields saying "Too less info".
       
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
  // Deterministic Math
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) : 0;
  
  const now = new Date();
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length;
  
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const staleTasks = tasks.filter(t => t.status !== 'done' && t.updatedAt && new Date(t.updatedAt) < sevenDaysAgo).length;
  
  const unassignedTasks = tasks.filter(t => t.status !== 'done' && !t.assignedTo).length;

  const workload = {};
  team.forEach(m => { if (m?.userId) workload[m.userId._id || m.userId] = 0; });
  tasks.forEach(t => {
    if (t.status !== 'done' && t.assignedTo) {
      const aId = t.assignedTo._id ? t.assignedTo._id.toString() : t.assignedTo.toString();
      if (workload[aId] !== undefined) workload[aId]++;
    }
  });
  
  const activeMembersCounts = Object.values(workload).filter(c => c > 0);
  const meanWorkload = activeMembersCounts.length > 0 ? activeMembersCounts.reduce((a, b) => a + b, 0) / activeMembersCounts.length : 0;
  const maxWorkload = activeMembersCounts.length > 0 ? Math.max(...activeMembersCounts) : 0;
  const isImbalanced = activeMembersCounts.length > 1 && maxWorkload > meanWorkload * 1.5 && maxWorkload - meanWorkload >= 2;

  const activeMembersCount = team.filter(m => m.status === 'active').length;

  let healthScore = 100;
  const components = [];

  // Progress Component
  const progressImpact = completionRate === 1 ? 40 : Math.round(completionRate * 40);
  if (totalTasks === 0) {
    components.push({ name: "Progress", impact: 0, fact: "No tasks defined" });
  } else {
    components.push({ name: "Progress", impact: progressImpact, fact: `${Math.round(completionRate * 100)}% of defined tasks are complete` });
  }

  // Overdue Tasks
  if (overdueTasks > 0) {
    const impact = Math.max(-30, overdueTasks * -10);
    healthScore += impact;
    components.push({ name: "Schedule", impact, fact: `${overdueTasks} overdue task(s)` });
  }

  // Stale Tasks
  if (staleTasks > 0) {
    const impact = Math.max(-15, staleTasks * -5);
    healthScore += impact;
    components.push({ name: "Velocity", impact, fact: `${staleTasks} stale task(s)` });
  }

  // Unassigned Tasks
  if (unassignedTasks > 0) {
    const impact = Math.max(-15, unassignedTasks * -5);
    healthScore += impact;
    components.push({ name: "Planning", impact, fact: `${unassignedTasks} unassigned active task(s)` });
  }

  // Team Capacity
  if (activeMembersCount === 1) {
    healthScore -= 20;
    components.push({ name: "Team Capacity", impact: -20, fact: "Only 1 active team member" });
  }

  // Workload Imbalance
  if (isImbalanced) {
    healthScore -= 15;
    components.push({ name: "Workload", impact: -15, fact: "Severe workload imbalance detected" });
  }

  // Bound score
  healthScore = Math.max(0, Math.min(100, healthScore));
  let status = "Healthy";
  if (healthScore < 50) status = "Critical";
  else if (healthScore < 80) status = "At Risk";

  const prompt = `
    You are an expert Agile Project Manager.
    I have calculated the deterministic project health score and components.
    
    Health Score: ${healthScore}
    Status: ${status}
    
    Components Facts:
    ${components.map(c => `- ${c.name} (Impact: ${c.impact}): ${c.fact}`).join("\\n")}
    
    Your job is to provide human-readable reasoning for EACH component based ONLY on the fact provided.
    Also identify the main risk and provide a recommendation.
    
    Output ONLY a valid JSON object matching this exact structure:
    {
      "components": [
        { "name": "...", "impact": Number, "reasoning": "..." }
      ],
      "main_risk": "Short phrase identifying the biggest risk",
      "recommendation": "One clear actionable step"
    }
  `;

  const chatCompletion = await getGroq().chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "openai/gpt-oss-120b",
    temperature: 0.2,
    max_tokens: 600
  });

  try {
    let rawContent = chatCompletion.choices[0]?.message?.content || "{}";
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : "{}";
    const parsed = JSON.parse(jsonString);
    
    const result = {
      health_score: healthScore,
      status: status,
      components: parsed.components || components,
      main_risk: parsed.main_risk || "Unknown",
      suggestion: parsed.recommendation || parsed.suggestion || "Review project metrics."
    };
    
    await Project.findByIdAndUpdate(projectId, {
      $set: {
        "metrics.aiHealthScore": result.health_score,
        "metrics.aiHealthStatus": result.status,
        "metrics.aiHealthComponents": result.components,
        "metrics.aiHealthMainRisk": result.main_risk,
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
  const staleTasks = tasks.filter(t => t.status !== 'done' && t.updatedAt && new Date(t.updatedAt) < sevenDaysAgo);

  const formatTask = t => `${t.title}${t.description ? ` - ${t.description.substring(0, 50)}` : ''}`;

  const prompt = `
    You are an expert Project Manager. Write a structured weekly digest for the project owner.
    
    Project Title: ${projectData.title}
    Total Team Size: ${team.length}
    Tasks Completed This Week: ${completedThisWeek.length > 0 ? completedThisWeek.map(formatTask).join(" | ") : "None"}
    New Tasks Created This Week: ${createdThisWeek.length > 0 ? createdThisWeek.map(formatTask).join(" | ") : "None"}
    Overdue Tasks: ${overdueTasks.length > 0 ? overdueTasks.map(formatTask).join(" | ") : "None"}
    Stale Tasks: ${staleTasks.length > 0 ? staleTasks.map(formatTask).join(" | ") : "None"}

    Summarize the week's progress. Be highly professional but readable. 
    CRITICAL: Do NOT just repeat the raw task titles verbatim. Write insightful, descriptive sentences summarizing what was accomplished, especially if the original task titles are very short (e.g., "cg"). Group related tasks together.

    Output ONLY a valid JSON object matching this exact structure:
    {
      "headline": "A one-line summary at the top (e.g. Strong progress this week)",
      "completed": ["Insightful summary of completed work 1", "Insightful summary of completed work 2"],
      "started": ["Insightful summary of newly started work 1"],
      "risks": ["Describe risk 1 (e.g., specific overdue tasks or team size constraints)"],
      "next_actions": ["Actionable next step 1", "Actionable next step 2"]
    }
    
    IMPORTANT: If there are no items for a category, return an empty array []. Do NOT invent or hallucinate tasks or risks if none exist in the data.
  `;

  const chatCompletion = await getGroq().chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "openai/gpt-oss-120b",
    temperature: 0.3,
    max_tokens: 600,
  });

  try {
    let rawContent = chatCompletion.choices[0]?.message?.content || "{}";
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : "{}";
    const parsed = JSON.parse(jsonString);
    
    const summaryData = {
      headline: parsed.headline || "Weekly Progress Update",
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      started: Array.isArray(parsed.started) ? parsed.started : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      next_actions: Array.isArray(parsed.next_actions) ? parsed.next_actions : []
    };

    await Project.findByIdAndUpdate(projectId, {
      $set: {
        "metrics.aiWeeklySummary": summaryData,
        "metrics.aiLastGeneratedAt": new Date()
      }
    });

    return summaryData;
  } catch (e) {
    console.error("AI Weekly Summary Error: ", e);
    throw new Error("Failed to generate weekly summary: " + e.message);
  }
};

export const generateDeveloperContribution = async (userId, tasks, projectData) => {
  // First data source: tasks explicitly assigned to the user that are completed.
  const myCompletedTasks = tasks.filter(t => {
    const assignedId = typeof t.assignedTo === 'object' && t.assignedTo !== null 
      ? t.assignedTo._id?.toString() 
      : t.assignedTo?.toString();
    return assignedId === userId.toString() && t.status === 'done';
  });

  const prompt = `
    You are an expert career coach helping a software engineer document their developer journey.
    Based on their objective activity in this project, generate a contribution suggestion.

    Project Title: ${projectData.title}
    Project Description: ${projectData.description}
    
    Objective Activity (Completed Assigned Tasks):
    ${myCompletedTasks.length === 0 ? "No tasks explicitly assigned and completed yet." : myCompletedTasks.map(t => "- " + t.title + (t.description ? ": " + t.description : "")).join("\\n")}

    CRITICAL ANTI-HALLUCINATION RULES:
    1. Use ONLY information present in the supplied project/task data.
    2. Do NOT invent responsibilities, technologies, impact, leadership, or achievements.
    3. If insufficient information exists (e.g., no completed tasks and no other data), output:
       { "summary": "Insufficient data to generate a contribution.", "skills": [], "potentialAchievements": [] }

    Output your suggestion as a strict JSON object with this exact structure:
    {
      "summary": "A 1-2 sentence description of what was actually built or contributed.",
      "skills": ["Skill1", "Skill2"],
      "potentialAchievements": ["One sentence describing a potential milestone or achievement based strictly on the tasks."]
    }
  `;

  const chatCompletion = await getGroq().chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "openai/gpt-oss-120b",
    temperature: 0.3,
    max_tokens: 600,
  });

  try {
    let rawContent = chatCompletion.choices[0]?.message?.content || "{}";
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : "{}";
    const parsed = JSON.parse(jsonString);
    return {
      summary: parsed.summary || "Insufficient data to generate a contribution.",
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      potentialAchievements: Array.isArray(parsed.potentialAchievements) ? parsed.potentialAchievements : []
    };
  } catch (e) {
    console.error("AI Contribution Error: ", e);
    throw new Error("Failed to parse contribution JSON.");
  }
};

export const generateEngineeringAssessment = async (projectData) => {
  const prompt = `
    You are an expert Senior Engineering Mentor. Your task is to review a software project's deterministic execution metrics and provide an evidence-based assessment.
    
    IMPORTANT STRICT RULES:
    1. DO NOT claim to objectively determine if a student is "developing well". Instead, frame it as "evidence-based guidance".
    2. Every strength, weakness, and recommendation must be directly traceable to one or more supplied metrics. Do not recommend practices merely because they are generally considered good engineering practices (e.g. do not recommend adding automated tests unless you have test metrics). If the available data is insufficient to support an assessment, explicitly state that evidence is unavailable.
    3. DO NOT judge a metric as "high" or "low" (e.g. deployment frequency) unless you have a baseline. Simply state the metric.
    4. If pull request data is zero or missing, DO NOT assume there is a lack of code review. Instead, state: "No pull-request activity is currently recorded, so code-review activity cannot be assessed."
    5. The assessment MUST clearly reference the provided data (e.g., "Because you have 5 overdue tasks...").
    6. Be encouraging but practical. Do not invent metrics or data.
    7. Output ONLY a valid, parseable JSON object.

    Project Evidence:
    ${JSON.stringify(projectData, null, 2)}

    Output your assessment as a strict JSON object with this exact structure:
    {
      "message": "A 2-3 sentence overall mentor evaluation linking the raw metrics to engineering health.",
      "strengths": ["One or two specific positive observations backed by data."],
      "areasForImprovement": ["One or two specific negative observations backed by data."],
      "recommendedActions": ["1-3 actionable steps the team should take right now to improve, derived strictly from the evidence."]
    }
  `;

  const chatCompletion = await getGroq().chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "openai/gpt-oss-120b",
    temperature: 0.3,
    max_tokens: 800,
  });

  try {
    let rawContent = chatCompletion.choices[0]?.message?.content || "{}";
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : "{}";
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("AI Engineering Assessment Error: ", e);
    throw new Error("Failed to parse engineering assessment JSON.");
  }
};
