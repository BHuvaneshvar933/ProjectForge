import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const getGroq = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

async function test() {
  const prompt = `
    You are an expert Agile Project Manager and AI health assessor.
    Based on the following project context, calculate a realistic Project Health Score (0-100) and provide a status, reasoning, and actionable suggestion.

    Project Title: Test Project
    Status: recruiting
    Timeline: {}
    
    Total Team Members: 3
    Total Tasks: 10
    Completed Tasks: 5
    Overdue Tasks: 1
    In-Progress Tasks: 2
    
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
    model: "openai/gpt-oss-20b",
    temperature: 0.2,
    max_tokens: 500
  });

  const rawContent = chatCompletion.choices[0]?.message?.content || "{}";
  console.log("Raw Output:");
  console.log(rawContent);

  const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
  console.log("Extracted jsonMatch:", jsonMatch ? jsonMatch[0] : "null");
  
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    console.log("Parsed keys:", Object.keys(parsed));
  }
}

test();
