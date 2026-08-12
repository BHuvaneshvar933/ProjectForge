import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import mongoose from 'mongoose';
import Project from './backend/src/models/project.model.js';
import User from './backend/src/models/user.model.js';
import Task from './backend/src/models/task.model.js';
import { generateResumeBullet, generateWeeklyProjectSummary } from './backend/src/services/ai.service.js';

async function runBenchmarks() {
  console.log('Connecting to DB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB.\n');

  console.log('--- 1. Database Benchmark ---');
  let dbTimes = [];
  for (let i = 0; i < 20; i++) {
    const start = performance.now();
    await Project.find().limit(5).populate('owner').populate('members.user');
    const end = performance.now();
    dbTimes.push(end - start);
  }
  const avgDb = dbTimes.reduce((a, b) => a + b, 0) / dbTimes.length;
  const p95Db = [...dbTimes].sort((a, b) => a - b)[Math.floor(dbTimes.length * 0.95)];
  console.log(`DB Query Average: ${avgDb.toFixed(2)} ms`);
  console.log(`DB Query p95: ${p95Db.toFixed(2)} ms\n`);

  console.log('--- 2. AI Benchmark ---');
  let aiTimes = [];
  const dummyProject = {
    title: 'ProjectForge',
    description: 'A project management tool',
    skills: ['React', 'Node.js', 'MongoDB'],
    achievements: ['Built a REST API', 'Integrated AI'],
    challenges: ['Performance optimization'],
    status: 'in-progress',
    timeline: {}
  };
  
  // Just run it 3 times to avoid rate limits / high costs on free Groq tier
  for (let i = 0; i < 3; i++) {
    const start = performance.now();
    await generateResumeBullet(dummyProject);
    const end = performance.now();
    aiTimes.push(end - start);
  }
  const avgAi = aiTimes.reduce((a, b) => a + b, 0) / aiTimes.length;
  console.log(`AI Resume Bullet Gen Average: ${avgAi.toFixed(2)} ms`);

  process.exit(0);
}

runBenchmarks().catch(console.error);
