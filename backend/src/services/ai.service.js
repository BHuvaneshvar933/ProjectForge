import Groq from "groq-sdk";

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
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 500,
  });

  return chatCompletion.choices[0]?.message?.content || "";
};
