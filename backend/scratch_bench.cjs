require('dotenv').config();
const mongoose = require('mongoose');

async function runBenchmarks() {
  console.log('Connecting to DB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB.\n');

  // Load models dynamically to avoid ES module require issues
  const ProjectSchema = new mongoose.Schema({}, { strict: false });
  const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
  
  console.log('--- 1. Database Benchmark ---');
  let dbTimes = [];
  for (let i = 0; i < 20; i++) {
    const start = performance.now();
    await Project.find({ isDeleted: false, visibility: "public" })
      .sort({ createdAt: -1 })
      .skip(0)
      .limit(10)
      .populate("owner", "name")
      .populate("requiredSkills", "name")
      .lean();
    const end = performance.now();
    dbTimes.push(end - start);
  }
  const avgDb = dbTimes.reduce((a, b) => a + b, 0) / dbTimes.length;
  const p95Db = [...dbTimes].sort((a, b) => a - b)[Math.floor(dbTimes.length * 0.95)];
  console.log(`DB Query Average: ${avgDb.toFixed(2)} ms`);
  console.log(`DB Query p95: ${p95Db.toFixed(2)} ms\n`);

  console.log('--- 2. AI Benchmark ---');
  let aiTimes = [];
  // Use groq directly to bypass importing ES module ai.service
  const Groq = require('groq-sdk');
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const dummyProject = {
    title: 'ProjectForge',
    description: 'A project management tool',
    skills: ['React', 'Node.js', 'MongoDB'],
    achievements: ['Built a REST API', 'Integrated AI'],
    challenges: ['Performance optimization'],
    status: 'in-progress',
    timeline: {}
  };
  const prompt = `You are an expert technical recruiter and resume writer. 
    Based on the following software engineering project details, generate a single, highly impressive, action-oriented resume bullet point (using the STAR method ideally). 
    It must sound extremely professional, quantify results where possible, and highlight the technical stack.

    Project Title: ${dummyProject.title}
    Description: ${dummyProject.description}
    Tech Stack: ${dummyProject.skills?.join(", ")}
    My Key Achievements: ${dummyProject.achievements?.join(", ")}
    Challenges Overcome: ${dummyProject.challenges?.join(", ")}

    Do NOT include any introductory or concluding text (like "Here is your bullet:"). Output ONLY the bullet point text starting with an action verb. Keep it to one powerful sentence or a two-sentence max.`;

  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 150,
    });
    const end = performance.now();
    aiTimes.push(end - start);
  }
  const avgAi = aiTimes.reduce((a, b) => a + b, 0) / aiTimes.length;
  const p95Ai = [...aiTimes].sort((a, b) => a - b)[Math.floor(aiTimes.length * 0.95)];
  console.log(`AI Resume Bullet Gen Average: ${avgAi.toFixed(2)} ms`);
  console.log(`AI Resume Bullet Gen p95: ${p95Ai.toFixed(2)} ms`);

  process.exit(0);
}

runBenchmarks().catch(console.error);
