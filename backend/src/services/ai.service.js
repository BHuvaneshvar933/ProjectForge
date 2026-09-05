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
You are an expert technical recruiter, resume writer, and ATS optimization specialist.

Your task is to convert the user's VERIFIED project information into concise, professional, ATS-friendly resume bullet points.

STRICT FACTUALITY RULES:
1. Use ONLY information explicitly provided in the input.
2. NEVER invent technologies, frameworks, libraries, metrics, users, performance improvements, percentages, scale, business impact, or responsibilities.
3. NEVER infer a numerical result unless that exact number is provided.
4. Do not exaggerate the user's contribution.
5. Do not claim that a technology was used merely because it is commonly associated with the type of project.
6. If an achievement is not explicitly provided, do not manufacture one.
7. You may improve wording, structure, clarity, and professionalism, but you must preserve the factual meaning.
8. If the provided information is insufficient to create meaningful bullets without inventing facts, return exactly:
Too less info

OUTPUT REQUIREMENTS:
- Return exactly 3 or 4 bullet points.
- Each bullet must describe a real contribution supported by the input.
- Prefer strong action verbs such as Developed, Implemented, Designed, Integrated, Automated, Optimized, Built, Engineered, or Configured when factually appropriate.
- Mention technologies only when explicitly present in the input.
- Quantify impact ONLY when a verified metric is provided.
- Keep each bullet concise and resume-ready.
- Avoid generic statements such as "Worked on a project" or "Responsible for development."
- Do not include headings, explanations, introductory text, or commentary.
- Return plain text bullets only.

QUALITY STANDARD:
Every claim in the output must be traceable to a fact in the input.
If removing a claim would introduce information not present in the input, remove that claim.

---
Project Title:
${projectData.title}

Project Description:
${projectData.description}

Tech Stack:
${projectData.skills?.join(", ") || "None provided"}

Key Achievements:
${projectData.achievements?.join(", ") || "None provided"}

Challenges Overcome:
${projectData.challenges?.join(", ") || "None provided"}

Generate the bullets using only these facts.
`;

  const chatCompletion = await getGroq().chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "openai/gpt-oss-120b",
    temperature: 0.3,
    max_tokens: 500,
  });

  return chatCompletion.choices[0]?.message?.content || "";
};

export const generateInterviewStory = async (projectData) => {
  const prompt = `
You are an expert technical interviewer and career coach.

Your task is to transform the user's VERIFIED project challenge information into a strong behavioral interview answer using the STAR framework.

STRICT FACTUALITY RULES:
1. Use ONLY facts explicitly provided in the input.
2. NEVER invent events, technologies, decisions, metrics, team sizes, deadlines, failures, users, results, or responsibilities.
3. NEVER create a fictional outcome.
4. Do not assume what the user did unless the input explicitly states it.
5. Do not convert an implied possibility into a stated fact.
6. You may reorganize and professionally phrase the provided information.
7. You may make the story coherent by connecting provided facts, but you must not add new factual information.
8. If there is insufficient information to produce a credible STAR story without fabrication, return exactly:
Too less info

OUTPUT FORMAT:
Return ONLY the following four sections in Markdown:

**The Situation**
[Situation based strictly on provided facts]

**The Task**
[Task/responsibility based strictly on provided facts]

**The Action**
[Actions explicitly supported by the input]

**The Result & Takeaway**
[Only verified results and the provided takeaway]

QUALITY REQUIREMENTS:
- Make the answer sound natural when spoken in an interview.
- Keep it specific rather than generic.
- Highlight technical problem-solving where supported by the input.
- Do not add fake metrics.
- Do not claim success unless success is supported by the input.
- Do not use phrases such as "This significantly improved..." unless that improvement is explicitly provided.
- Do not include any introduction or explanation outside the four required sections.

---
Project Title:
${projectData.title}

Project Description:
${projectData.description}

Tech Stack:
${projectData.skills?.join(", ") || "None provided"}

Challenge:
${projectData.challenges?.join(", ") || "None provided"}

Action Taken & Result:
${projectData.achievements?.join(", ") || "None provided"}

Takeaway:
${projectData.takeaway || "None provided"}

Use only the information provided above.
`;

  const chatCompletion = await getGroq().chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "openai/gpt-oss-120b",
    temperature: 0.3,
    max_tokens: 1500,
  });

  return chatCompletion.choices[0]?.message?.content || "";
};

export const generateCareerAssets = async (projectData, projectId, userId) => {
  const prompt = `
You are an expert technical career strategist, resume writer, portfolio writer, LinkedIn content strategist, and technical interviewer.

Your task is to generate a career-assets package from VERIFIED project information.

The input contains facts supplied by the user and/or ProjectForge's database.

FACTUALITY IS MORE IMPORTANT THAN CREATIVITY.

STRICT ANTI-HALLUCINATION RULES:
1. Use ONLY facts explicitly present in the input.
2. NEVER invent technologies, features, metrics, users, scale, performance improvements, business outcomes, responsibilities, architecture decisions, or project results.
3. NEVER assume that a technology was used because it is common for the project type.
4. NEVER create numerical metrics unless explicitly provided.
5. NEVER exaggerate the user's contribution.
6. You may improve wording and presentation but may not add factual claims.
7. If a section cannot be generated accurately from the available information, use a concise statement based on the available facts rather than inventing information.
8. The output must remain faithful to the source information.

RESUME BULLETS:
- Generate exactly 3 bullets.
- Use the XYZ-style structure when possible:
  "Accomplished X by doing Y, resulting in Z."
- Only include X, Y, and Z when supported by the input.
- Do not invent metrics or results.

PORTFOLIO DESCRIPTION:
- Generate exactly 2 paragraphs.
- Paragraph 1: Explain the problem and solution using only provided facts.
- Paragraph 2: Explain the technical implementation and technology choices ONLY when those choices are explicitly provided.
- Do not invent architectural decisions.

LINKEDIN POSTS:
Generate exactly 3 distinct posts:
1. professional
2. technical
3. buildInPublic

Each post must:
- Be based exclusively on provided facts.
- Have a distinct tone and audience.
- Avoid fake achievements and unsupported claims.
- Avoid generic motivational filler.
- Not claim measurable impact without evidence.

INTERVIEW ANSWER:
- Generate a STAR-method answer.
- Use only verified facts.
- Structure it with Situation, Task, Action, Result & Takeaway.
- Do not fabricate missing details.

JSON REQUIREMENTS:
Return ONLY valid JSON.
Do not use Markdown fences.
Do not add explanations before or after the JSON.

The JSON structure MUST be exactly:

{
  "resumeBullets": [
    "string",
    "string",
    "string"
  ],
  "portfolioDescription": "string",
  "linkedinPosts": {
    "professional": "string",
    "technical": "string",
    "buildInPublic": "string"
  },
  "interviewAnswer": {
    "situation": "string",
    "task": "string",
    "action": "string",
    "resultAndTakeaway": "string"
  }
}

All JSON must be syntactically valid.
Use double quotes for JSON strings.
Escape internal quotation marks correctly.
Do not include trailing commas.

---
PROJECT:
Title: ${projectData.title}
Description: ${projectData.description}

TECHNOLOGY:
Tech Stack: ${projectData.skills?.join(", ") || "None provided"}

ACHIEVEMENTS:
${projectData.achievements?.join(", ") || "None provided"}

CHALLENGES:
${projectData.challenges?.join(", ") || "None provided"}

TAKEAWAY:
${projectData.takeaway || "None provided"}

Return only the required JSON structure.
`;

  const chatCompletion = await getGroq().chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "openai/gpt-oss-120b",
    temperature: 0.1, 
    max_tokens: 3000
  });

  try {
    let rawContent = chatCompletion.choices[0]?.message?.content || "{}";
    
    // Fallback parsing strategy
    let assets;
    try {
      assets = JSON.parse(rawContent);
    } catch (parseError) {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : "{}";
      assets = JSON.parse(jsonString);
    }
    
    // Strict Schema Validation
    if (!assets || typeof assets !== 'object') throw new Error("Invalid output format");
    
    const validatedAssets = {
      resumeBullets: Array.isArray(assets.resumeBullets) ? assets.resumeBullets : [],
      portfolioDescription: typeof assets.portfolioDescription === 'string' ? assets.portfolioDescription : "",
      linkedinPosts: {
        professional: typeof assets.linkedinPosts?.professional === 'string' ? assets.linkedinPosts.professional : "",
        technical: typeof assets.linkedinPosts?.technical === 'string' ? assets.linkedinPosts.technical : "",
        buildInPublic: typeof assets.linkedinPosts?.buildInPublic === 'string' ? assets.linkedinPosts.buildInPublic : ""
      },
      interviewAnswer: {
        situation: typeof assets.interviewAnswer?.situation === 'string' ? assets.interviewAnswer.situation : "",
        task: typeof assets.interviewAnswer?.task === 'string' ? assets.interviewAnswer.task : "",
        action: typeof assets.interviewAnswer?.action === 'string' ? assets.interviewAnswer.action : "",
        resultAndTakeaway: typeof assets.interviewAnswer?.resultAndTakeaway === 'string' ? assets.interviewAnswer.resultAndTakeaway : ""
      }
    };
    
    if (projectId && userId) {
      await Team.findOneAndUpdate(
        { projectId, userId, status: "active", isDeleted: false },
        { $set: { careerAssets: validatedAssets } }
      );
    }
    
    return validatedAssets;
  } catch (e) {
    console.error("AI Generation Error: ", e);
    throw new Error("Failed to generate career assets correctly. Please try again.");
  }
};

export const generateHealthExplanation = async (project, metrics) => {
  if (metrics.status === "Insufficient Data") {
    return {
      main_risk: "Insufficient data to calculate a health score.",
      suggestion: "Create tasks, assign team members, and set deadlines to begin tracking project health."
    };
  }

  const prompt = `
You are an expert Agile project manager analyzing a project's health metrics.
The backend has already deterministically calculated the health score, status, and identified key factors and risks.

AUTHORITATIVE METRICS (DO NOT RECALCULATE):
Score: ${metrics.score}/100
Status: ${metrics.status}
Confidence: ${metrics.confidence}
Provisional: ${metrics.isProvisional}

DIMENSIONS:
- Progress: ${metrics.dimensions.progress.score}/${metrics.dimensions.progress.max}
- Schedule: ${metrics.dimensions.schedule.score}/${metrics.dimensions.schedule.max}
- Activity: ${metrics.dimensions.activity.score}/${metrics.dimensions.activity.max}
- Engagement: ${metrics.dimensions.engagement.score}/${metrics.dimensions.engagement.max}

IDENTIFIED FACTORS:
${metrics.factors.map(f => `- ${f}`).join('\n')}

IDENTIFIED RISKS:
${metrics.risks.map(r => `- ${r}`).join('\n')}

YOUR TASK:
Based on the provided metrics and risks, output exactly two things in JSON format:
1. main_risk: A concise 1-sentence summary of the biggest risk to the project's success.
2. suggestion: A concrete, actionable suggestion for the team to improve their health.

RULES:
1. DO NOT invent metrics, tasks, or team members.
2. Only use the provided factors and risks.
3. If there are no risks, the main_risk should be something like "No major risks identified at this time."

OUTPUT FORMAT (Valid JSON only):
{
  "main_risk": "string",
  "suggestion": "string"
}
`;

  const chatCompletion = await getGroq().chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "openai/gpt-oss-120b",
    temperature: 0.3,
    max_tokens: 500,
  });

  try {
    let rawContent = chatCompletion.choices[0]?.message?.content || "{}";
    let output;
    try {
      output = JSON.parse(rawContent);
    } catch (parseError) {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : "{}";
      output = JSON.parse(jsonString);
    }
    
    return {
      main_risk: output.main_risk || "Unable to determine main risk.",
      suggestion: output.suggestion || "Focus on completing outstanding tasks."
    };
  } catch (error) {
    console.error("AI Explanation Error:", error);
    return {
      main_risk: "Analysis failed.",
      suggestion: "Please try again later."
    };
  }
};



export const generateWeeklyProjectSummary = async (projectId, projectData, tasks, team) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const completedThisWeek = tasks.filter(t => t.status === 'done' && t.updatedAt && new Date(t.updatedAt) > sevenDaysAgo);
  const createdThisWeek = tasks.filter(t => t.createdAt && new Date(t.createdAt) > sevenDaysAgo);
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done');
  const staleTasks = tasks.filter(t => t.status !== 'done' && t.updatedAt && new Date(t.updatedAt) < sevenDaysAgo);

  const formatTask = t => `- ${t.title}${t.description ? ` (${t.description.substring(0, 80)})` : ''}`;

  const prompt = `
You are an expert technical project manager writing a concise weekly engineering progress summary.

The backend has already filtered the project's tasks to include ONLY tasks that fall into the relevant categories for the seven-day reporting period.
Your job is to summarize those verified tasks.

STRICT FACTUALITY RULES:
1. Use ONLY the tasks provided in the input.
2. NEVER invent completed work, started work, risks, or next actions.
3. NEVER claim that a feature was deployed, tested, optimized, released, or used unless explicitly stated in the input.
4. NEVER invent metrics or impact.
5. NEVER assume why a task was important unless that context is provided.
6. Do not mention tasks that are not present in the input.
7. Do not claim that something happened "this week" based on your own date calculations; the backend has already determined the reporting period.
8. Combine related tasks into meaningful themes when appropriate.
9. Preserve important technical details from the task descriptions.
10. If there is insufficient evidence for a category, return an empty array rather than fabricating information.

VERIFIED BACKEND DATA:
Project Title: ${projectData.title}

Completed Tasks (Past 7 Days):
${completedThisWeek.length > 0 ? completedThisWeek.map(formatTask).join("\n") : "No tasks were recorded as completed during the reporting period."}

Newly Created/Started Tasks (Past 7 Days):
${createdThisWeek.length > 0 ? createdThisWeek.map(formatTask).join("\n") : "No new tasks were recorded during the reporting period."}

Overdue Tasks (Risks):
${overdueTasks.length > 0 ? overdueTasks.map(formatTask).join("\n") : "No overdue tasks."}

Stale Tasks (Risks):
${staleTasks.length > 0 ? staleTasks.map(formatTask).join("\n") : "No stale tasks."}

OUTPUT SCHEMA:
Return ONLY valid JSON exactly matching this structure, which is required by the frontend API:
{
  "headline": "A short overview sentence of the week's progress.",
  "completed": ["Insightful summary of completed work 1", "Insightful summary of completed work 2"],
  "started": ["Insightful summary of newly started work 1"],
  "risks": ["Describe verified risks (e.g. overdue/stale tasks) ONLY if provided in the data above"],
  "next_actions": ["Actionable next steps based ONLY on provided data"]
}

REQUIREMENTS:
- If there are no items for a category, return an empty array [].
- Do NOT invent or hallucinate tasks, risks, or next actions if none exist in the verified data.
- No Markdown fences. No text outside the JSON.
`;

  const chatCompletion = await getGroq().chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "openai/gpt-oss-120b",
    temperature: 0.1, 
    max_tokens: 600,
  });

  try {
    let rawContent = chatCompletion.choices[0]?.message?.content || "{}";
    
    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch (e) {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : "{}";
      parsed = JSON.parse(jsonString);
    }
    
    if (!parsed || typeof parsed !== 'object') throw new Error("Invalid output format");

    const summaryData = {
      headline: typeof parsed.headline === 'string' ? parsed.headline : "Weekly Progress Update",
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
${myCompletedTasks.length === 0 ? "No tasks explicitly assigned and completed yet." : myCompletedTasks.map(t => "- " + t.title + (t.description ? ": " + t.description : "")).join("\n")}

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
    temperature: 0.2,
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

The backend has determined the status of this project to be: ${projectData.determinedStatus}
Negative reasons identified by the backend (if any): ${projectData.negativeReasons?.join(", ") || "None"}

IMPORTANT STRICT RULES:
1. You MUST distinguish between a metric being exactly 0 vs being unavailable.
2. If data is unavailable, point out that the data is missing in "areasForImprovement" (e.g. "No task tracking data is available to evaluate progress"), but DO NOT treat it as a negative engineering failure. DO NOT use meta-terms like "evidence gap" or "tasks.available is false" in your final text. Just speak naturally to the student.
3. If a metric is literally 0 (e.g. 0 open bugs, 0 critical vulnerabilities), treat this as positive or neutral evidence, not missing data!
4. RECOMMENDATION SOURCING: ProjectForge ALREADY has built-in features for Tasks, Bugs, Releases, and Team Assignments. NEVER recommend external tools like Jira, Trello, Asana, or GitHub Issues. Instead, recommend using ProjectForge's own built-in task tracking.
5. RECOMMENDATION QUANTITY & QUALITY: Do not force a fixed number of recommendations. Only provide a recommendation if there is an actual problem or an evidence gap to close. 0, 1, or 2 strong recommendations are better than generic filler.
6. STUDENT-FRIENDLY TONE: You are advising students. Be simple, practical, and avoid enterprise/DevOps jargon (e.g. do not arbitrarily recommend Dependabot, Snyk, or enterprise code-governance).
7. If the backend determined status is "Needs Attention", you must explain why using the negative reasons provided.
8. Output ONLY a valid, parseable JSON object.

Project Evidence:
${JSON.stringify(projectData, null, 2)}

Output your assessment as a strict JSON object with this exact structure:
{
  "message": "A 2-3 sentence overall mentor evaluation linking the raw metrics to engineering health. Explain the determined status.",
  "strengths": ["One or two specific positive observations backed by data. Zero bugs/vulnerabilities are strengths."],
  "areasForImprovement": ["Actual negative observations (e.g. overdue tasks) AND point out missing tools. DO NOT use meta-programming terms like 'tasks.available is false' or 'evidence gap'."],
  "recommendedActions": ["Actionable, student-friendly steps derived strictly from evidence. Recommend using ProjectForge for tasks/bugs. Leave empty if no action is needed. DO NOT use meta-language like 'close the evidence gap'."]
}
`;

  const chatCompletion = await getGroq().chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "openai/gpt-oss-120b",
    temperature: 0.2,
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
