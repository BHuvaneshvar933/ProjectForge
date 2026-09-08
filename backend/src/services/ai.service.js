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
    model: "openai/gpt-oss-20b",
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
    model: "openai/gpt-oss-20b",
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
    model: "openai/gpt-oss-20b",
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

export const generateHealthExplanation = async (project, metrics, tasks, team) => {
  if (metrics.status === "Insufficient Data") {
    return {
      assessment: "There is insufficient data to calculate a health score.",
      primaryConcern: { title: "Insufficient Data", description: "The project does not have enough active tasks or team members to generate a health score." },
      positiveSignal: null,
      recommendedAction: "Create tasks, assign team members, and set deadlines to begin tracking project health.",
      collaborationOpportunity: null,
      dimensionInterpretations: {
        progress: "No data available.",
        schedule: "No data available.",
        activity: "No data available.",
        engagement: "No data available."
      },
      main_risk: "Insufficient data to calculate a health score.",
      suggestion: "Create tasks, assign team members, and set deadlines to begin tracking project health."
    };
  }

  // Calculate workload and prepare team info for prompt
  const now = new Date();
  const openTasks = tasks.filter(t => t.status !== "done");
  const overdueTasksList = openTasks.filter(t => t.dueDate && new Date(t.dueDate) < now);

  const memberDetails = team.map(member => {
    if (!member.userId) return null;
    const activeTaskCount = openTasks.filter(t => {
      const assignedId = typeof t.assignedTo === 'object' && t.assignedTo !== null
        ? t.assignedTo._id?.toString()
        : t.assignedTo?.toString();
      return assignedId === member.userId._id.toString();
    }).length;

    const skills = member.userId.skills ? member.userId.skills.map(s => s.name).join(", ") : "Unknown";
    return `- ${member.userId.name}: ${activeTaskCount} active tasks, Skills: ${skills || "None recorded"}`;
  }).filter(Boolean).join("\n");

  const activeTasksList = openTasks.map(t => {
    const owner = typeof t.assignedTo === 'object' && t.assignedTo !== null ? t.assignedTo.name : "Unassigned";
    const isOverdue = t.dueDate && new Date(t.dueDate) < now;
    return `- "${t.title}" | Owner: ${owner} | Status: ${t.status}${isOverdue ? ' [OVERDUE]' : ''}`;
  }).join("\n");

  const prompt = `
You are ProjectForge's AI Project Health Analyst.
Your job is to evaluate the current health of a student project using the supplied project metrics and evidence.

CRITICAL RULES:
1. DIFFERENTIATE FROM WEEKLY SUMMARY: Do not answer "What happened this week?". Focus on: What is going well, what is wrong, why, and what should the team do.
2. DO NOT INVENT: Never invent skills, availability, workload, experience, task requirements, progress, completed work, blockers, or deadlines.
3. NO ASSUMPTIONS: Do not assume incomplete task = inactive member, overdue task = project failure, or no task completion = no activity. Do not claim a member is "free" unless actual workload data supports it (say "Alice currently has no active tasks").
4. BE SPECIFIC: Recommended actions must reference actual project data. Do NOT generate generic advice like "Improve communication", "Schedule a brief sync", or "Create a task ownership matrix".
5. NO AUTOMATIC REASSIGNMENT: AI Health is advisory. Never automatically change task ownership. Use words like "Consider assigning", "Could assist", "If available".
6. COLLABORATION OPPORTUNITY: Compare a person's workload/skills with actual task requirements. Only recommend collaboration when actual workload AND relevant technical evidence (skills) support it. If skill data is unavailable, explicitly state that skill information is insufficient.
7. SEPARATE FACT FROM INTERPRETATION: Distinguish between Evidence ("1 task is overdue") and Interpretation ("The project is experiencing schedule pressure").
8. TONE & PROGRESS: Do NOT be dramatic. Do NOT say "far behind", "far from meeting deliverable milestones", or "failing to deliver results". If there are 0 completed tasks, simply say "No tasks have been completed yet, so measurable project progress is currently limited."
9. RECOMMENDATION INTELLIGENCE: If an overdue task already has an owner, do NOT recommend assigning a new owner. Instead, say: "Prioritize completing the overdue task and review whether the owner needs assistance." If a member already has a high workload (e.g. 2+ active tasks), explicitly advise against assigning them more work until their bottleneck is resolved.
10. SKILL MATCHING: Do NOT say "Assign any new task that does not require X". Instead, explicitly reference their actual skills: "Assign a suitable [insert their skills] task if one exists." If their skills do not match a task, explicitly state that they should not take it.
11. ACTIVITY IS NOT ENGAGEMENT: Do NOT use the word "engagement" to describe the activity score. High activity only means there have been recent updates. Simply say "Activity score is high, indicating recent project activity."
12. AVOID INVENTING WORK: If a member has no active tasks but no suitable tasks exist for their skills, do NOT recommend inventing work just to balance the workload. Explicitly say to "leave them available rather than creating unnecessary work".

AUTHORITATIVE METRICS (DO NOT RECALCULATE):
Score: ${metrics.score}/100
Status: ${metrics.status}
Confidence: ${metrics.confidence}

DIMENSIONS:
- Progress: ${metrics.dimensions.progress.score}/${metrics.dimensions.progress.max}
- Schedule: ${metrics.dimensions.schedule.score}/${metrics.dimensions.schedule.max}
- Activity: ${metrics.dimensions.activity.score}/${metrics.dimensions.activity.max}
- Team Distribution: ${metrics.dimensions.teamDistribution?.score || 0}/${metrics.dimensions.teamDistribution?.max || 15}

FACTORS & RISKS IDENTIFIED BY SYSTEM:
${metrics.factors.map(f => `- ${f}`).join('\n')}
${metrics.risks.map(r => `- ${r}`).join('\n') || "- No specific risks identified"}

CURRENT PROJECT STATE (For Collaboration & Context):
Active Tasks:
${activeTasksList || "None"}

Team Workload & Skills (Active Task Counts & Skills):
${memberDetails || "No active members"}

YOUR TASK:
Output EXACTLY the following JSON structure. Do NOT include markdown formatting, code blocks, or comments in your response. Output ONLY valid, parsable JSON.

{
  "assessment": "",
  "whatsGoingWell": [
    {
      "title": "",
      "description": ""
    }
  ],
  "needsAttention": [
    {
      "title": "",
      "description": ""
    }
  ],
  "primaryConcern": {
    "title": "",
    "description": ""
  },
  "positiveSignal": {
    "title": "",
    "description": ""
  },
  "recommendedActions": [
    ""
  ],
  "workDistribution": {
    "summary": "",
    "recommendations": [
      {
        "member": "",
        "task": "",
        "reason": ""
      }
    ]
  },
  "collaborationOpportunity": null,
  "dimensionInterpretations": {
    "progress": "",
    "schedule": "",
    "activity": "",
    "teamDistribution": ""
  }
}

FIELD INSTRUCTIONS:
- "assessment": Synthesize relationships between data. What does the current project state actually mean?
- "whatsGoingWell": Array of things working well based on actual data.
- "needsAttention": Array of concrete problems supported by data.
- "primaryConcern": The underlying condition (e.g., Workload Imbalance) and why it matters.
- "positiveSignal": Copy the best 'whatsGoingWell' title and description.
- "recommendedActions": Concrete next steps. What should they actually do? Be specific about WHO and WHAT.
- "workDistribution.summary": Who currently has workload and who may have capacity.
- "workDistribution.recommendations": Specific task assignments matching skills and capacity.
- "collaborationOpportunity": Specific suggestion for assistance based on skills. Return null if no clear opportunity.
- "dimensionInterpretations": Short interpretation for each score dimension.
`;

  try {
    const chatCompletion = await getGroq().chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "openai/gpt-oss-20b",
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

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
      assessment: output.assessment || "Analysis unavailable.",
      primaryConcern: output.primaryConcern || null,
      positiveSignal: output.positiveSignal || null,
      whatsGoingWell: output.whatsGoingWell || [],
      needsAttention: output.needsAttention || [],
      recommendedActions: output.recommendedActions || ["Keep monitoring project activity."],
      workDistribution: output.workDistribution || null,
      collaborationOpportunity: output.collaborationOpportunity || null,
      dimensionInterpretations: output.dimensionInterpretations || {},
      main_risk: output.primaryConcern ? output.primaryConcern.description : "Unavailable",
      suggestion: (output.recommendedActions && output.recommendedActions.length > 0) ? output.recommendedActions[0] : "Unavailable"
    };
  } catch (error) {
    console.error("AI Explanation Error:", error);
    return {
      assessment: "Analysis failed.",
      primaryConcern: null,
      positiveSignal: null,
      recommendedAction: "Please try again later.",
      collaborationOpportunity: null,
      dimensionInterpretations: {},
      main_risk: "Analysis failed.",
      suggestion: "Please try again later."
    };
  }
};



export const generateWeeklyProjectSummary = async (projectId, projectData, tasks, team) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Data Window: Only last 7 days
  const newlyAdded = tasks.filter(t => t.createdAt && new Date(t.createdAt) > sevenDaysAgo);
  const completedThisWeek = tasks.filter(t => t.status === 'done' && t.updatedAt && new Date(t.updatedAt) > sevenDaysAgo);

  // Updated this week, but not newly added and not completed (to show progress)
  const updatedThisWeek = tasks.filter(t =>
    t.status !== 'done' &&
    t.updatedAt && new Date(t.updatedAt) > sevenDaysAgo &&
    !(t.createdAt && new Date(t.createdAt) > sevenDaysAgo)
  );

  // Unfinished carryover: Only tasks that were ACTIVE this week (created or updated) but remain incomplete.
  // We explicitly DO NOT dump old inactive tasks here to avoid becoming a health report.
  const unfinishedCarryover = tasks.filter(t =>
    t.status !== 'done' &&
    (
      (t.createdAt && new Date(t.createdAt) > sevenDaysAgo) ||
      (t.updatedAt && new Date(t.updatedAt) > sevenDaysAgo)
    )
  );

  const formatTask = t => `- ${t.title}${t.description ? ` (${t.description.substring(0, 80)})` : ''}`;

  const prompt = `
You are ProjectForge's AI Weekly Project Reporter.
Your job is to summarize meaningful project activity from the previous 7 days.

CRITICAL RULE: You are NOT the project's health evaluator.
Do not calculate or describe overall project health, execution status, risks, or overdue warnings.
Focus ONLY on what changed, what was completed, what was newly added, what progressed, and what remains unfinished.

STRICT FACTUALITY RULES:
1. Use ONLY the tasks provided in the input. Never invent completed work, started work, or progress.
2. If there is insufficient activity, clearly state that there was little or no significant activity.
3. Overdue tasks do not dominate the report. Treat them simply as newly added or unfinished carryover if they were active this week.
4. Do not use generic AI language like "The project needs attention" or "Execution status is at risk." Use activity language: completed, added, updated, progressed, carried over.
5. When describing unfinished carryover tasks, simply state "Task [Name] remains incomplete" rather than describing it as "active and unfinished."

VERIFIED BACKEND DATA (Last 7 Days Only):
Project Title: ${projectData.title}

Completed Tasks:
${completedThisWeek.length > 0 ? completedThisWeek.map(formatTask).join("\n") : "No tasks were recorded as completed during this week."}

Newly Added Work:
${newlyAdded.length > 0 ? newlyAdded.map(formatTask).join("\n") : "No new tasks were added this week."}

Progress & Updates (Active but not completed):
${updatedThisWeek.length > 0 ? updatedThisWeek.map(formatTask).join("\n") : "No significant task updates this week."}

Unfinished / Carryover Work:
${unfinishedCarryover.length > 0 ? unfinishedCarryover.map(formatTask).join("\n") : "No active work is carrying over."}

OUTPUT SCHEMA:
Return ONLY valid JSON exactly matching this structure:
{
  "overview": "A short 1-2 sentence overview of the week's overall activity.",
  "completed": ["Clear summary of completed work"],
  "new_work": ["Summary of newly added tasks"],
  "progress_changes": ["Summary of progress or changes made to existing work"],
  "unfinished_carryover": ["Summary of what active work remains unfinished"]
}

REQUIREMENTS:
- If there is no activity for a category, return an array with a graceful empty state (e.g. ["No tasks completed."]).
- Make it concise, factual, and easy for a student project team to understand.
- No Markdown fences. No text outside the JSON.
`;

  try {
    const chatCompletion = await getGroq().chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "openai/gpt-oss-20b",
      temperature: 0.1,
      max_tokens: 600,
      response_format: { type: "json_object" }
    });

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
      overview: typeof parsed.overview === 'string' ? parsed.overview : "Weekly Progress Update",
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      new_work: Array.isArray(parsed.new_work) ? parsed.new_work : [],
      progress_changes: Array.isArray(parsed.progress_changes) ? parsed.progress_changes : [],
      unfinished_carryover: Array.isArray(parsed.unfinished_carryover) ? parsed.unfinished_carryover : []
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
    model: "openai/gpt-oss-20b",
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
    model: "openai/gpt-oss-20b",
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
