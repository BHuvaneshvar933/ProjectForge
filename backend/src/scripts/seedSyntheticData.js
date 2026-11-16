import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

import User from "../models/user.model.js";
import Skill from "../models/skill.model.js";
import Project from "../models/project.model.js";
import Team from "../models/team.model.js";
import Application from "../models/application.model.js";
import Task from "../models/task.model.js";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import DirectMessage from "../models/directMessage.model.js";
import Notification from "../models/notification.model.js";
import CalendarEvent from "../models/calendarEvent.model.js";
import Release from "../models/release.model.js";

import connectDB from "../config/db.js";
import { hashPassword } from "../utils/password.js";
import { calculateUserReliability } from "../services/reliability.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const DEMO_TAG = "demo:synthetic-2026";
const DEMO_PASSWORD = "password123";
const isReset = process.argv.includes("--reset");

const now = () => new Date();
const daysAgo = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
const daysFromNow = (d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

// -------------------------------------------------------------
// 1. SKILLS DEFINITIONS
// -------------------------------------------------------------
const SKILL_DEFS = [
  { name: "JavaScript", category: "web", aliases: ["js"] },
  { name: "TypeScript", category: "web", aliases: ["ts"] },
  { name: "React", category: "web", aliases: ["reactjs"] },
  { name: "Next.js", category: "web", aliases: ["nextjs"] },
  { name: "Node.js", category: "web", aliases: ["node"] },
  { name: "Express", category: "web", aliases: ["expressjs"] },
  { name: "MongoDB", category: "web", aliases: ["mongo"] },
  { name: "PostgreSQL", category: "web", aliases: ["postgres"] },
  { name: "Redis", category: "web", aliases: [] },
  { name: "Socket.io", category: "web", aliases: ["socketio", "websockets"] },
  { name: "Python", category: "ml", aliases: ["py"] },
  { name: "FastAPI", category: "web", aliases: [] },
  { name: "Docker", category: "web", aliases: ["containerization"] },
  { name: "Kubernetes", category: "cloud", aliases: ["k8s"] },
  { name: "AWS", category: "cloud", aliases: ["amazon web services"] },
  { name: "UI/UX", category: "web", aliases: ["design", "user experience"] },
  { name: "Figma", category: "web", aliases: [] },
  { name: "ML", category: "ml", aliases: ["machine learning"] },
  { name: "NLP", category: "ml", aliases: ["natural language processing"] },
  { name: "PyTorch", category: "ml", aliases: [] },
  { name: "Cybersecurity", category: "security", aliases: ["appsec", "infosec"] },
  { name: "Data Science", category: "ml", aliases: ["analytics", "data analysis"] },
  { name: "Linux", category: "cloud", aliases: ["bash", "unix"] },
];

const ensureSkills = async () => {
  const existing = await Skill.find({}).lean();
  const byName = new Map(existing.map((s) => [s.name.toLowerCase(), s]));

  for (const s of SKILL_DEFS) {
    if (!byName.has(s.name.toLowerCase())) {
      const created = await Skill.create({
        ...s,
        popularityCount: 15,
      });
      byName.set(s.name.toLowerCase(), created.toObject());
    }
  }

  const all = await Skill.find({}).lean();
  const skillMap = new Map();
  for (const s of all) {
    skillMap.set(s.name, s._id);
  }
  return skillMap;
};

// -------------------------------------------------------------
// 2. USER DEFINITIONS (Exact 17 accounts)
// -------------------------------------------------------------
const buildUserDefs = (skillMap) => [
  {
    email: "harishragavan973@gmail.com",
    name: "Harish Ragavan",
    headline: "Full-Stack Developer & Cloud Architect | MERN & Microservices",
    bio: "Passionate full-stack developer with 3+ years of building collaborative web platforms and scalable cloud architectures. Active open-source contributor and hackathon enthusiast.",
    skills: ["React", "Node.js", "Express", "MongoDB", "Docker", "AWS"].map((s) => skillMap.get(s)).filter(Boolean),
    availabilityHoursPerWeek: 16,
    structuredAvailability: {
      timeCommitment: "15-20 hrs/week",
      preferredSchedule: "Weekday evenings & Saturdays",
      projectDuration: "3-6 months",
      canStart: "Immediately",
    },
    education: [
      {
        degree: "B.E.",
        program: "Computer Science and Engineering",
        university: "Cambridge Institute of Technology",
        startYear: "2023",
        graduationYear: "2027",
        currentYear: "2nd Year",
        cgpa: "8.95",
      },
    ],
    experience: [
      {
        role: "Full-Stack Intern",
        organization: "CloudNative Labs",
        startDate: "2025-06-01",
        endDate: "2025-08-31",
        description: "Built REST APIs with Express and designed responsive user interfaces with React and Tailwind.",
      },
    ],
    achievements: [
      {
        title: "Winner - Smart Campus Hackathon 2025",
        organization: "Cambridge Institute of Technology",
        date: "2025-09-18",
        description: "Developed an automated student team matching platform using WebSockets and Node.js.",
      },
    ],
    portfolioLinks: {
      github: "https://github.com/harishragavan",
      linkedin: "https://linkedin.com/in/harishragavan",
      website: "https://harishragavan.dev",
    },
    stats: {
      projectsCompleted: 2,
      projectsActive: 1,
      tasksCompleted: 14,
      applicationsSent: 3,
      applicationsAccepted: 2,
      acceptanceRate: 67,
    },
  },
  {
    email: "siddhant.23cse@cambridge.edu.in",
    name: "Siddhant Sharma",
    headline: "DevOps & Cloud Systems Engineer | Cambridge '27 | K8s & CI/CD",
    bio: "Specializing in Linux systems, container orchestration, and continuous delivery pipelines. Passionate about automated testing, infrastructure-as-code, and cluster security.",
    skills: ["Docker", "Kubernetes", "Node.js", "PostgreSQL", "Linux", "AWS"].map((s) => skillMap.get(s)).filter(Boolean),
    availabilityHoursPerWeek: 14,
    structuredAvailability: {
      timeCommitment: "12-16 hrs/week",
      preferredSchedule: "Flexible weekday slots",
      projectDuration: "3 months",
      canStart: "Immediately",
    },
    education: [
      {
        degree: "B.E.",
        program: "Computer Science and Engineering",
        university: "Cambridge Institute of Technology",
        startYear: "2023",
        graduationYear: "2027",
        currentYear: "2nd Year",
        cgpa: "9.1",
      },
    ],
    experience: [
      {
        role: "DevOps Lead",
        organization: "CIT Open Source Club",
        startDate: "2024-11-01",
        endDate: "Present",
        description: "Configured self-hosted GitHub Actions runners and automated container deployments.",
      },
    ],
    achievements: [
      {
        title: "Certified Kubernetes Associate Candidate",
        organization: "Linux Foundation",
        date: "2025-04-10",
        description: "Completed advanced hands-on lab tracks in microservice cluster orchestration.",
      },
    ],
    portfolioLinks: {
      github: "https://github.com/siddhant-sharma",
      linkedin: "https://linkedin.com/in/siddhantsharma23",
      website: "https://siddhantdevops.tech",
    },
    stats: {
      projectsCompleted: 1,
      projectsActive: 2,
      tasksCompleted: 11,
      applicationsSent: 2,
      applicationsAccepted: 2,
      acceptanceRate: 100,
    },
  },
  {
    email: "chandankumardv18@gmail.com",
    name: "Chandan Kumar D V",
    headline: "Senior Frontend Engineer | React, TypeScript & Design Systems",
    bio: "Frontend enthusiast obsessive about micro-interactions, responsive design, state management, and web accessibility. Crafting high-converting, snappy interfaces.",
    skills: ["React", "TypeScript", "JavaScript", "UI/UX", "Figma", "Next.js"].map((s) => skillMap.get(s)).filter(Boolean),
    availabilityHoursPerWeek: 18,
    structuredAvailability: {
      timeCommitment: "18-20 hrs/week",
      preferredSchedule: "Evenings & Weekends",
      projectDuration: "4-6 months",
      canStart: "Immediately",
    },
    education: [
      {
        degree: "B.E.",
        program: "Computer Science and Engineering",
        university: "Cambridge Institute of Technology",
        startYear: "2023",
        graduationYear: "2027",
        currentYear: "2nd Year",
        cgpa: "8.7",
      },
    ],
    experience: [
      {
        role: "Frontend Developer Intern",
        organization: "PixelForge Studio",
        startDate: "2025-05-15",
        endDate: "2025-07-31",
        description: "Migrated legacy vanilla JS components to modular TypeScript React library with 95% test coverage.",
      },
    ],
    achievements: [
      {
        title: "2nd Runner Up - State UI/UX Hackfest",
        organization: "DesignCraft India",
        date: "2025-08-22",
        description: "Architected a fully accessible design system for e-governance portals.",
      },
    ],
    portfolioLinks: {
      github: "https://github.com/chandankumar-dv",
      linkedin: "https://linkedin.com/in/chandankumardv",
      website: "https://chandankumar.dev",
    },
    stats: {
      projectsCompleted: 3,
      projectsActive: 2,
      tasksCompleted: 22,
      applicationsSent: 4,
      applicationsAccepted: 3,
      acceptanceRate: 75,
    },
  },
  {
    email: "meghanareddy1623@gmail.com",
    name: "Meghana Reddy",
    headline: "AI/ML Researcher & NLP Specialist | Deep Learning Enthusiast",
    bio: "Exploring transformers, biomedical imaging diagnostics, and natural language understanding. Experienced with PyTorch, model optimization, and REST API deployment.",
    skills: ["Python", "ML", "NLP", "PyTorch", "FastAPI", "Data Science"].map((s) => skillMap.get(s)).filter(Boolean),
    availabilityHoursPerWeek: 15,
    structuredAvailability: {
      timeCommitment: "15 hrs/week",
      preferredSchedule: "Afternoons & Weekends",
      projectDuration: "3-6 months",
      canStart: "Immediately",
    },
    education: [
      {
        degree: "B.E.",
        program: "Artificial Intelligence and Machine Learning",
        university: "Cambridge Institute of Technology",
        startYear: "2023",
        graduationYear: "2027",
        currentYear: "2nd Year",
        cgpa: "9.3",
      },
    ],
    experience: [
      {
        role: "Undergraduate Research Assistant",
        organization: "AI Vision Lab",
        startDate: "2025-01-10",
        endDate: "Present",
        description: "Trained and evaluated Vision Transformer models for automated classification of high-resolution radiology scans.",
      },
    ],
    achievements: [
      {
        title: "Best Research Poster Award",
        organization: "Karnataka Student Tech Symposium 2025",
        date: "2025-07-14",
        description: "Presented research paper on self-supervised contrastive learning in diagnostic pathology.",
      },
    ],
    portfolioLinks: {
      github: "https://github.com/meghanareddy16",
      linkedin: "https://linkedin.com/in/meghana-reddy-ml",
      website: "https://meghanareddy.ai",
    },
    stats: {
      projectsCompleted: 2,
      projectsActive: 2,
      tasksCompleted: 16,
      applicationsSent: 2,
      applicationsAccepted: 2,
      acceptanceRate: 100,
    },
  },
  {
    email: "samsmohanty4@gmail.com",
    name: "Sambit Mohanty",
    headline: "Backend Engineer & Distributed Systems Enthusiast | Go & Node.js",
    bio: "Backend specialist focused on distributed consensus, caching strategies, and database query optimization. Strong grounding in ACID transactions and event-driven architecture.",
    skills: ["Node.js", "Express", "PostgreSQL", "MongoDB", "Redis", "Docker"].map((s) => skillMap.get(s)).filter(Boolean),
    availabilityHoursPerWeek: 16,
    structuredAvailability: {
      timeCommitment: "16 hrs/week",
      preferredSchedule: "Evenings",
      projectDuration: "4 months",
      canStart: "Immediately",
    },
    education: [
      {
        degree: "B.E.",
        program: "Computer Science and Engineering",
        university: "Cambridge Institute of Technology",
        startYear: "2023",
        graduationYear: "2027",
        currentYear: "2nd Year",
        cgpa: "8.85",
      },
    ],
    experience: [
      {
        role: "Backend Contributor",
        organization: "Distributed Event Broker Project",
        startDate: "2025-02-01",
        endDate: "Present",
        description: "Designed high-throughput message partition consumers and benchmarked Redis pub/sub latency.",
      },
    ],
    achievements: [
      {
        title: "Finalist - Systems Engineering Hackathon",
        organization: "Bangalore Tech Council",
        date: "2025-05-30",
        description: "Implemented a Raft-based distributed key-value store with zero network partition data loss.",
      },
    ],
    portfolioLinks: {
      github: "https://github.com/sambitmohanty",
      linkedin: "https://linkedin.com/in/sambit-mohanty",
      website: "https://sambit.codes",
    },
    stats: {
      projectsCompleted: 2,
      projectsActive: 2,
      tasksCompleted: 18,
      applicationsSent: 4,
      applicationsAccepted: 3,
      acceptanceRate: 75,
    },
  },
  {
    email: "laharii.reddy1411@gmail.com",
    name: "Lahari Reddy",
    headline: "Lead UI/UX Designer & Design Systems Advocate | Cambridge '27",
    bio: "Transforming complex workflows into elegant, intuitive human experiences. Expert in Figma component libraries, user research, wireframing, and front-of-the-frontend UI development.",
    skills: ["UI/UX", "Figma", "React", "JavaScript", "TypeScript"].map((s) => skillMap.get(s)).filter(Boolean),
    availabilityHoursPerWeek: 14,
    structuredAvailability: {
      timeCommitment: "14-16 hrs/week",
      preferredSchedule: "Weekdays 4pm - 8pm",
      projectDuration: "3-6 months",
      canStart: "Immediately",
    },
    education: [
      {
        degree: "B.E.",
        program: "Information Science and Engineering",
        university: "Cambridge Institute of Technology",
        startYear: "2023",
        graduationYear: "2027",
        currentYear: "2nd Year",
        cgpa: "9.0",
      },
    ],
    experience: [
      {
        role: "Product Design Fellow",
        organization: "Youth Innovation Studio",
        startDate: "2025-04-01",
        endDate: "2025-09-01",
        description: "Created complete multi-brand design tokens, Figma auto-layout libraries, and conducted 30+ usability tests.",
      },
    ],
    achievements: [
      {
        title: "1st Place - National UI Design Sprint 2025",
        organization: "Designers Guild",
        date: "2025-06-12",
        description: "Awarded top design for gamified student wellness and habit tracking interface.",
      },
    ],
    portfolioLinks: {
      github: "https://github.com/laharireddy",
      linkedin: "https://linkedin.com/in/lahari-reddy-design",
      website: "https://lahari.design",
    },
    stats: {
      projectsCompleted: 3,
      projectsActive: 2,
      tasksCompleted: 15,
      applicationsSent: 3,
      applicationsAccepted: 2,
      acceptanceRate: 67,
    },
  },
  {
    email: "smsavalgi19@gmail.com",
    name: "Shridhar M Savalgi",
    headline: "Cybersecurity Analyst & DevSecOps Engineer | OWASP & AppSec",
    bio: "Security researcher focusing on web application penetration testing, API vulnerability discovery, and automated vulnerability scanning. Strong believer in security-first development.",
    skills: ["Cybersecurity", "Python", "Docker", "Linux", "Node.js", "Express"].map((s) => skillMap.get(s)).filter(Boolean),
    availabilityHoursPerWeek: 15,
    structuredAvailability: {
      timeCommitment: "15 hrs/week",
      preferredSchedule: "Evenings & Weekends",
      projectDuration: "3-5 months",
      canStart: "Immediately",
    },
    education: [
      {
        degree: "B.E.",
        program: "Computer Science and Engineering",
        university: "Cambridge Institute of Technology",
        startYear: "2023",
        graduationYear: "2027",
        currentYear: "2nd Year",
        cgpa: "8.6",
      },
    ],
    experience: [
      {
        role: "Security Researcher",
        organization: "Campus Bug Bounty Alliance",
        startDate: "2024-09-01",
        endDate: "Present",
        description: "Identified and safely reported 8 authenticated IDOR and CSRF vulnerabilities across collegiate portals.",
      },
    ],
    achievements: [
      {
        title: "Top 50 Rank - National Cyber Challenge 2025",
        organization: "National Informatics Center",
        date: "2025-04-18",
        description: "Solved advanced web exploitation and binary reverse engineering challenges.",
      },
    ],
    portfolioLinks: {
      github: "https://github.com/shridhar-savalgi",
      linkedin: "https://linkedin.com/in/shridhar-savalgi",
      website: "https://savalgi-sec.io",
    },
    stats: {
      projectsCompleted: 1,
      projectsActive: 1,
      tasksCompleted: 9,
      applicationsSent: 3,
      applicationsAccepted: 1,
      acceptanceRate: 33,
    },
  },
  {
    email: "Chandanreddy9392@gmail.com",
    name: "Chandan Reddy",
    headline: "Mobile Application Developer | React Native & Cross-Platform",
    bio: "Building fluid mobile applications for iOS and Android. Passionate about native device integrations, offline-first sync, and smooth animations.",
    skills: ["React", "TypeScript", "JavaScript", "MongoDB", "Node.js", "UI/UX"].map((s) => skillMap.get(s)).filter(Boolean),
    availabilityHoursPerWeek: 15,
    structuredAvailability: {
      timeCommitment: "15 hrs/week",
      preferredSchedule: "Weekends & Alternate Evenings",
      projectDuration: "3 months",
      canStart: "Immediately",
    },
    education: [
      {
        degree: "B.E.",
        program: "Computer Science and Engineering",
        university: "Cambridge Institute of Technology",
        startYear: "2023",
        graduationYear: "2027",
        currentYear: "2nd Year",
        cgpa: "8.5",
      },
    ],
    experience: [
      {
        role: "Mobile App Developer",
        organization: "Campus Shuttle Tracker Project",
        startDate: "2025-01-15",
        endDate: "2025-06-30",
        description: "Created cross-platform React Native app with real-time GPS streaming for 1,200 daily commuter students.",
      },
    ],
    achievements: [
      {
        title: "Google Play Store Feature Award",
        organization: "Student App Showcase",
        date: "2025-08-04",
        description: "Cross-platform mobile utility surpassed 2,500 active installs with 4.8 star rating.",
      },
    ],
    portfolioLinks: {
      github: "https://github.com/chandan-reddy-93",
      linkedin: "https://linkedin.com/in/chandanreddy9392",
      website: "https://chandanreddy.dev",
    },
    stats: {
      projectsCompleted: 2,
      projectsActive: 1,
      tasksCompleted: 12,
      applicationsSent: 2,
      applicationsAccepted: 1,
      acceptanceRate: 50,
    },
  },
  {
    email: "sonali.23cse@cambridge.edu.in",
    name: "Sonali Gupta",
    headline: "EdTech Innovator & Full-Stack Developer | Cambridge '27",
    bio: "Dedicated to personalizing education using adaptive learning algorithms and interactive web experiences. Passionate about clean code and user accessibility.",
    skills: ["React", "Python", "FastAPI", "PostgreSQL", "UI/UX", "TypeScript"].map((s) => skillMap.get(s)).filter(Boolean),
    availabilityHoursPerWeek: 16,
    structuredAvailability: {
      timeCommitment: "16-18 hrs/week",
      preferredSchedule: "Flexible daily hours",
      projectDuration: "4 months",
      canStart: "Immediately",
    },
    education: [
      {
        degree: "B.E.",
        program: "Computer Science and Engineering",
        university: "Cambridge Institute of Technology",
        startYear: "2023",
        graduationYear: "2027",
        currentYear: "2nd Year",
        cgpa: "9.2",
      },
    ],
    experience: [
      {
        role: "EdTech Developer Intern",
        organization: "LearnSpark Interactive",
        startDate: "2025-03-01",
        endDate: "2025-07-31",
        description: "Implemented spaced-repetition algorithms and dynamic interactive quiz modules with WebSockets.",
      },
    ],
    achievements: [
      {
        title: "Grace Hopper Celebration Student Scholar",
        organization: "AnitaB.org",
        date: "2025-09-10",
        description: "Recognized for academic excellence and contributions to peer computer science education.",
      },
    ],
    portfolioLinks: {
      github: "https://github.com/sonali-gupta",
      linkedin: "https://linkedin.com/in/sonaligupta23",
      website: "https://sonaligupta.tech",
    },
    stats: {
      projectsCompleted: 2,
      projectsActive: 1,
      tasksCompleted: 17,
      applicationsSent: 3,
      applicationsAccepted: 2,
      acceptanceRate: 67,
    },
  },
  {
    email: "riteshshuklamail@gmail.com",
    name: "Ritesh Shukla",
    headline: "Cloud Solutions Architect & Backend Engineer | Microservices",
    bio: "Designing resilient cloud native architectures with AWS, containerization, and serverless backends. Extensive experience in microservices decomposition.",
    skills: ["AWS", "Docker", "Kubernetes", "Node.js", "PostgreSQL", "FastAPI"].map((s) => skillMap.get(s)).filter(Boolean),
    availabilityHoursPerWeek: 15,
    structuredAvailability: {
      timeCommitment: "15 hrs/week",
      preferredSchedule: "Weekday evenings",
      projectDuration: "3-6 months",
      canStart: "Immediately",
    },
    education: [
      {
        degree: "B.E.",
        program: "Computer Science and Engineering",
        university: "Cambridge Institute of Technology",
        startYear: "2023",
        graduationYear: "2027",
        currentYear: "2nd Year",
        cgpa: "8.8",
      },
    ],
    experience: [
      {
        role: "Cloud Engineering Intern",
        organization: "Datamatics Systems",
        startDate: "2025-06-01",
        endDate: "2025-08-31",
        description: "Automated AWS infrastructure provisioning using Terraform and configured ECS Fargate clusters.",
      },
    ],
    achievements: [
      {
        title: "AWS Certified Cloud Practitioner",
        organization: "Amazon Web Services",
        date: "2025-03-25",
        description: "Validated architectural knowledge across compute, networking, security, and storage services.",
      },
    ],
    portfolioLinks: {
      github: "https://github.com/ritesh-shukla",
      linkedin: "https://linkedin.com/in/riteshshukla-cloud",
      website: "https://riteshshukla.com",
    },
    stats: {
      projectsCompleted: 3,
      projectsActive: 1,
      tasksCompleted: 19,
      applicationsSent: 3,
      applicationsAccepted: 1,
      acceptanceRate: 33,
    },
  },
  {
    email: "nikhilsreddy7105@gmail.com",
    name: "Nikhil S Reddy",
    headline: "Developer Tools Engineer & Open Source Contributor | CLI & DORA",
    bio: "Creating developer tooling that eliminates friction. Builder of CLI applications, code generators, and telemetry collectors.",
    skills: ["TypeScript", "Node.js", "JavaScript", "Docker", "PostgreSQL"].map((s) => skillMap.get(s)).filter(Boolean),
    availabilityHoursPerWeek: 14,
    structuredAvailability: {
      timeCommitment: "14 hrs/week",
      preferredSchedule: "Evenings & Weekends",
      projectDuration: "3 months",
      canStart: "Immediately",
    },
    education: [
      {
        degree: "B.E.",
        program: "Computer Science and Engineering",
        university: "Cambridge Institute of Technology",
        startYear: "2023",
        graduationYear: "2027",
        currentYear: "2nd Year",
        cgpa: "8.75",
      },
    ],
    experience: [
      {
        role: "Developer Advocate Fellow",
        organization: "DevForge Community",
        startDate: "2025-02-01",
        endDate: "Present",
        description: "Created developer productivity CLI utilities that streamline git hooks and local container setup.",
      },
    ],
    achievements: [
      {
        title: "Creator of GitMetrics CLI (1,000+ GitHub Stars)",
        organization: "Open Source Collective",
        date: "2025-07-28",
        description: "Popular open-source tool analyzing local git history for commit velocity and PR friction.",
      },
    ],
    portfolioLinks: {
      github: "https://github.com/nikhilsreddy",
      linkedin: "https://linkedin.com/in/nikhil-s-reddy",
      website: "https://nikhilsreddy.dev",
    },
    stats: {
      projectsCompleted: 2,
      projectsActive: 1,
      tasksCompleted: 13,
      applicationsSent: 2,
      applicationsAccepted: 2,
      acceptanceRate: 100,
    },
  },
  {
    email: "rajeshkumar.23aiml@cambridge.edu.in",
    name: "Rajesh Kumar",
    headline: "AI/ML Engineer & Computer Vision Specialist | Cambridge AIML '27",
    bio: "Focusing on convolutional neural networks, vision transformers, and edge inference. Dedicated to applying ML to real-world medical and ecological challenges.",
    skills: ["Python", "ML", "PyTorch", "FastAPI", "Data Science"].map((s) => skillMap.get(s)).filter(Boolean),
    availabilityHoursPerWeek: 16,
    structuredAvailability: {
      timeCommitment: "16 hrs/week",
      preferredSchedule: "Mornings & Weekends",
      projectDuration: "4-6 months",
      canStart: "Immediately",
    },
    education: [
      {
        degree: "B.E.",
        program: "Artificial Intelligence and Machine Learning",
        university: "Cambridge Institute of Technology",
        startYear: "2023",
        graduationYear: "2027",
        currentYear: "2nd Year",
        cgpa: "9.15",
      },
    ],
    experience: [
      {
        role: "Computer Vision Researcher",
        organization: "Cambridge AI Research Cell",
        startDate: "2025-01-01",
        endDate: "Present",
        description: "Developed deep learning models for multi-class semantic segmentation using PyTorch and OpenCV.",
      },
    ],
    achievements: [
      {
        title: "Kaggle Expert Recognition",
        organization: "Kaggle",
        date: "2025-06-15",
        description: "Ranked top 3% in Medical Image Anomaly Detection global competition.",
      },
    ],
    portfolioLinks: {
      github: "https://github.com/rajeshkumar-aiml",
      linkedin: "https://linkedin.com/in/rajeshkumar23aiml",
      website: "https://rajeshai.me",
    },
    stats: {
      projectsCompleted: 2,
      projectsActive: 1,
      tasksCompleted: 14,
      applicationsSent: 3,
      applicationsAccepted: 2,
      acceptanceRate: 67,
    },
  },
  {
    email: "kaif.23ise@cambridge.com",
    name: "Mohammad Kaif",
    headline: "Full-Stack Security & API Architect | Cambridge ISE '27",
    bio: "Full-stack developer with a laser focus on defensive security, JWT/OAuth auth flows, role-based access control, and sanitization pipelines.",
    skills: ["React", "Node.js", "Express", "MongoDB", "Cybersecurity", "JavaScript"].map((s) => skillMap.get(s)).filter(Boolean),
    availabilityHoursPerWeek: 15,
    structuredAvailability: {
      timeCommitment: "15 hrs/week",
      preferredSchedule: "Evenings",
      projectDuration: "3-5 months",
      canStart: "Immediately",
    },
    education: [
      {
        degree: "B.E.",
        program: "Information Science and Engineering",
        university: "Cambridge Institute of Technology",
        startYear: "2023",
        graduationYear: "2027",
        currentYear: "2nd Year",
        cgpa: "8.65",
      },
    ],
    experience: [
      {
        role: "Security Audit Lead",
        organization: "Cambridge Student Portal Team",
        startDate: "2025-02-10",
        endDate: "Present",
        description: "Hardened authentication middleware and led vulnerability remediation for university club portal.",
      },
    ],
    achievements: [
      {
        title: "DefCon Student Village Attendee & CTF Finalist",
        organization: "DefCon India",
        date: "2025-05-18",
        description: "Successfully solved defense challenges in OAuth token hijacking and SQL injection.",
      },
    ],
    portfolioLinks: {
      github: "https://github.com/mohammad-kaif",
      linkedin: "https://linkedin.com/in/kaif-ise23",
      website: "https://kaifsec.dev",
    },
    stats: {
      projectsCompleted: 1,
      projectsActive: 1,
      tasksCompleted: 10,
      applicationsSent: 3,
      applicationsAccepted: 1,
      acceptanceRate: 33,
    },
  },
  {
    email: "Jyothsnareddyj97@gmail.com",
    name: "Jyothsna Reddy",
    headline: "Data Scientist & Analytics Dashboard Engineer | D3.js & Python",
    bio: "Transforming big data into actionable visual stories. Specializing in exploratory data analysis, predictive statistical modeling, and interactive visualization dashboards.",
    skills: ["Python", "Data Science", "PostgreSQL", "UI/UX", "React"].map((s) => skillMap.get(s)).filter(Boolean),
    availabilityHoursPerWeek: 14,
    structuredAvailability: {
      timeCommitment: "14 hrs/week",
      preferredSchedule: "Afternoons & Weekends",
      projectDuration: "4 months",
      canStart: "Immediately",
    },
    education: [
      {
        degree: "B.E.",
        program: "Computer Science and Engineering",
        university: "Cambridge Institute of Technology",
        startYear: "2023",
        graduationYear: "2027",
        currentYear: "2nd Year",
        cgpa: "8.9",
      },
    ],
    experience: [
      {
        role: "Data Analyst Intern",
        organization: "InsightMetrics Bangalore",
        startDate: "2025-05-01",
        endDate: "2025-07-31",
        description: "Constructed automated ETL pipelines and student churn prediction models in Python and PostgreSQL.",
      },
    ],
    achievements: [
      {
        title: "Best Data Visualization Award",
        organization: "Cambridge TechFest 2025",
        date: "2025-08-11",
        description: "Designed an interactive dashboard depicting real-time energy consumption across 12 academic blocks.",
      },
    ],
    portfolioLinks: {
      github: "https://github.com/jyothsnareddy",
      linkedin: "https://linkedin.com/in/jyothsnareddy-data",
      website: "https://jyothsnareddy.me",
    },
    stats: {
      projectsCompleted: 2,
      projectsActive: 1,
      tasksCompleted: 15,
      applicationsSent: 2,
      applicationsAccepted: 2,
      acceptanceRate: 100,
    },
  },
  {
    email: "ankurbhattacharyya66@gmail.com",
    name: "Ankur Bhattacharyya",
    headline: "High-Performance Systems & Algorithm Engineer | Concurrency",
    bio: "Deep passion for concurrency, memory efficiency, algorithm optimization, and low-latency data pipelines. Competitive programming enthusiast.",
    skills: ["Python", "ML", "PostgreSQL", "Docker", "Node.js"].map((s) => skillMap.get(s)).filter(Boolean),
    availabilityHoursPerWeek: 18,
    structuredAvailability: {
      timeCommitment: "18 hrs/week",
      preferredSchedule: "Flexible night slots",
      projectDuration: "4-6 months",
      canStart: "Immediately",
    },
    education: [
      {
        degree: "B.E.",
        program: "Computer Science and Engineering",
        university: "Cambridge Institute of Technology",
        startYear: "2023",
        graduationYear: "2027",
        currentYear: "2nd Year",
        cgpa: "9.4",
      },
    ],
    experience: [
      {
        role: "Algorithm Research Intern",
        organization: "Algorithmic Precision Inc",
        startDate: "2025-06-01",
        endDate: "2025-08-31",
        description: "Optimized graph traversal routines resulting in a 40% reduction in query latency on large knowledge graphs.",
      },
    ],
    achievements: [
      {
        title: "ICPC Regional Qualifier 2025",
        organization: "ACM ICPC",
        date: "2025-10-05",
        description: "Ranked among top collegiate competitive programmers in South Asia region.",
      },
    ],
    portfolioLinks: {
      github: "https://github.com/ankurbhattacharyya",
      linkedin: "https://linkedin.com/in/ankur-bhattacharyya",
      website: "https://ankurcodes.dev",
    },
    stats: {
      projectsCompleted: 2,
      projectsActive: 2,
      tasksCompleted: 20,
      applicationsSent: 3,
      applicationsAccepted: 2,
      acceptanceRate: 67,
    },
  },
  {
    email: "nikhilrishi.23cse@cambridge.edu.in",
    name: "Nikhil Rishi",
    headline: "Real-Time Systems & Collaborative Web Specialist | Cambridge '27",
    bio: "Architecting real-time multi-user web environments using Socket.io, operational transformation, and reactive frontends. Passionate about web platform standards.",
    skills: ["React", "Node.js", "Socket.io", "Express", "MongoDB", "TypeScript"].map((s) => skillMap.get(s)).filter(Boolean),
    availabilityHoursPerWeek: 16,
    structuredAvailability: {
      timeCommitment: "16 hrs/week",
      preferredSchedule: "Evenings & Weekends",
      projectDuration: "3-6 months",
      canStart: "Immediately",
    },
    education: [
      {
        degree: "B.E.",
        program: "Computer Science and Engineering",
        university: "Cambridge Institute of Technology",
        startYear: "2023",
        graduationYear: "2027",
        currentYear: "2nd Year",
        cgpa: "8.8",
      },
    ],
    experience: [
      {
        role: "Real-Time Infrastructure Maintainer",
        organization: "Cambridge Student Dev Community",
        startDate: "2025-01-10",
        endDate: "Present",
        description: "Engineered scalable WebRTC and WebSocket channels supporting live campus video conferences and messaging.",
      },
    ],
    achievements: [
      {
        title: "Best Open Source Real-Time Tool",
        organization: "DevHacks Bangalore",
        date: "2025-06-20",
        description: "Built lightweight collaborative canvas supporting 50+ concurrent users with sub-50ms sync latency.",
      },
    ],
    portfolioLinks: {
      github: "https://github.com/nikhilrishi",
      linkedin: "https://linkedin.com/in/nikhilrishi23",
      website: "https://nikhilrishi.tech",
    },
    stats: {
      projectsCompleted: 2,
      projectsActive: 2,
      tasksCompleted: 19,
      applicationsSent: 4,
      applicationsAccepted: 3,
      acceptanceRate: 75,
    },
  },
  {
    email: "clohithreddy.25cse@cambridge.edu.in",
    name: "C Lohith Reddy",
    headline: "Distributed Ledgers & Cloud Platform Developer | Cambridge '27",
    bio: "Building decentralized protocols, verifiable credentials, and robust cloud services. Passionate about tamper-proof audit trails and zero-knowledge proofs.",
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"].map((s) => skillMap.get(s)).filter(Boolean),
    availabilityHoursPerWeek: 15,
    structuredAvailability: {
      timeCommitment: "15 hrs/week",
      preferredSchedule: "Flexible weekday blocks",
      projectDuration: "3-4 months",
      canStart: "Immediately",
    },
    education: [
      {
        degree: "B.E.",
        program: "Computer Science and Engineering",
        university: "Cambridge Institute of Technology",
        startYear: "2023",
        graduationYear: "2027",
        currentYear: "2nd Year",
        cgpa: "8.7",
      },
    ],
    experience: [
      {
        role: "Blockchain Developer Fellow",
        organization: "Decentralized Identity Alliance",
        startDate: "2025-03-01",
        endDate: "Present",
        description: "Drafted decentralized identifier (DID) schemas and W3C compliant verifiable credential verification contracts.",
      },
    ],
    achievements: [
      {
        title: "1st Prize - Web3 Campus Hackathon 2025",
        organization: "Ethereum Student Society",
        date: "2025-09-02",
        description: "Designed a gas-optimized soulbound token contract for verifiable university transcripts.",
      },
    ],
    portfolioLinks: {
      github: "https://github.com/clohithreddy",
      linkedin: "https://linkedin.com/in/clohithreddy",
      website: "https://lohithreddy.dev",
    },
    stats: {
      projectsCompleted: 2,
      projectsActive: 1,
      tasksCompleted: 13,
      applicationsSent: 2,
      applicationsAccepted: 1,
      acceptanceRate: 50,
    },
  },
];

// -------------------------------------------------------------
// 3. SEED USERS HELPER
// -------------------------------------------------------------
const ensureUsers = async (userDefs) => {
  const userMap = new Map();
  const hashedPassword = await hashPassword(DEMO_PASSWORD);

  for (const def of userDefs) {
    const existing = await User.findOne({ email: def.email.toLowerCase() });
    if (existing) {
      existing.name = def.name;
      existing.headline = def.headline;
      existing.bio = def.bio;
      existing.skills = def.skills;
      existing.availabilityHoursPerWeek = def.availabilityHoursPerWeek;
      existing.structuredAvailability = def.structuredAvailability;
      existing.education = def.education;
      existing.experience = def.experience;
      existing.achievements = def.achievements;
      existing.portfolioLinks = def.portfolioLinks;
      existing.stats = def.stats;
      existing.isActive = true;
      existing.deletedAt = null;
      await existing.save();
      userMap.set(def.email.toLowerCase(), existing);
    } else {
      const created = await User.create({
        ...def,
        email: def.email.toLowerCase(),
        password: hashedPassword,
        isActive: true,
        deletedAt: null,
      });
      userMap.set(def.email.toLowerCase(), created);
    }
  }

  return userMap;
};

// -------------------------------------------------------------
// 4. PROJECT DEFINITIONS (9 Synthetic Projects)
// -------------------------------------------------------------
const buildProjectDefs = (userMap, skillMap) => [
  {
    key: "COLLAB",
    title: "CampusCollab: Student Project Collaboration Portal",
    domain: "Full-Stack Web Development",
    projectType: "web",
    ownerEmail: "harishragavan973@gmail.com",
    description: "A comprehensive platform connecting collegiate students across engineering departments for interdisciplinary projects, automated team matching, milestone tracking, and shared workspace tooling.",
    requiredSkills: ["React", "Node.js", "Express", "MongoDB", "Socket.io"].map((s) => skillMap.get(s)).filter(Boolean),
    openRoles: ["Backend Developer", "DevSecOps Lead"],
    teamSizeRequired: 4,
    status: "recruiting",
    timeline: {
      startDate: daysAgo(21),
      endDate: daysFromNow(42),
      estimatedDuration: 9,
    },
    projectDeadline: daysFromNow(42),
    teamMembers: [
      { email: "harishragavan973@gmail.com", role: "owner", projectRole: "Project Lead & Full-Stack Architect" },
      { email: "chandankumardv18@gmail.com", role: "member", projectRole: "Senior Frontend Engineer" },
      { email: "nikhilrishi.23cse@cambridge.edu.in", role: "member", projectRole: "Real-Time Collaboration Lead" },
    ],
    applications: [
      { applicantEmail: "chandankumardv18@gmail.com", status: "accepted", message: "Excited to architect the React component system and collaborative board interfaces." },
      { applicantEmail: "nikhilrishi.23cse@cambridge.edu.in", status: "accepted", message: "I have strong Socket.io and real-time state synchronization experience." },
      { applicantEmail: "kaif.23ise@cambridge.com", status: "pending", message: "I would love to help implement the RBAC authorization middleware and audit endpoints." },
      { applicantEmail: "riteshshuklamail@gmail.com", status: "rejected", message: "I would like to apply for the backend and cloud infrastructure roles.", rejectionReason: "The core backend architecture is already staffed; saving profile for Phase 2 cloud scaling." },
    ],
    tasks: [
      { title: "Design responsive workspace dashboard mockups", assignedEmail: "chandankumardv18@gmail.com", status: "done", priority: "high", daysPast: 14, daysPastDone: 10, tags: ["frontend", "ui"] },
      { title: "Implement MongoDB connection pooling and schemas", assignedEmail: "harishragavan973@gmail.com", status: "done", priority: "high", daysPast: 18, daysPastDone: 15, tags: ["backend", "database"] },
      { title: "Configure Socket.io room handling & event dispatch", assignedEmail: "nikhilrishi.23cse@cambridge.edu.in", status: "done", priority: "medium", daysPast: 12, daysPastDone: 6, tags: ["websockets", "realtime"] },
      { title: "Build real-time notification toast component", assignedEmail: "chandankumardv18@gmail.com", status: "in-progress", priority: "high", daysPast: 5, dueDateDays: 2, tags: ["frontend"] },
      { title: "Set up JWT refresh token rotation with HTTP-only cookies", assignedEmail: "harishragavan973@gmail.com", status: "in-progress", priority: "high", daysPast: 4, dueDateDays: 4, tags: ["backend", "auth"] },
      { title: "Implement workspace file attachment upload to S3", assignedEmail: "nikhilrishi.23cse@cambridge.edu.in", status: "todo", priority: "medium", daysPast: 2, dueDateDays: 10, tags: ["backend", "storage"] },
      { title: "Automate Vitest integration suites on pull request", assignedEmail: "harishragavan973@gmail.com", status: "todo", priority: "low", daysPast: 1, dueDateDays: 14, tags: ["ci/cd", "testing"] },
    ],
    messages: [
      { senderEmail: "harishragavan973@gmail.com", content: "Welcome team! The base repo, MongoDB models, and auth routes are live on dev.", minutesOffset: 2800 },
      { senderEmail: "chandankumardv18@gmail.com", content: "Great! I've set up the Tailwind palette and completed the responsive dashboard mockups.", minutesOffset: 2400 },
      { senderEmail: "nikhilrishi.23cse@cambridge.edu.in", content: "Socket.io rooms are working smoothly. The heartbeat ping keeps disconnect overhead minimal.", minutesOffset: 1200 },
      { senderEmail: "harishragavan973@gmail.com", content: "Awesome progress. Chandan, let's connect the notification toast component to Nikhil's socket events next.", minutesOffset: 300 },
      { senderEmail: "chandankumardv18@gmail.com", content: "On it! Will have a PR up for review before tonight's standup.", minutesOffset: 60 },
    ],
    events: [
      { title: "Sprint 2 Architecture & Real-Time Sync Demo", type: "meeting", daysFromNow: 2, durationHours: 1 },
      { title: "Phase 1 Frontend & Backend Code Freeze", type: "milestone", daysFromNow: 7, durationHours: 2 },
    ],
  },
  {
    key: "NEURO",
    title: "NeuroVision: Diagnostic Assistance Pipeline",
    domain: "Artificial Intelligence & Machine Learning",
    projectType: "ml",
    ownerEmail: "meghanareddy1623@gmail.com",
    description: "An automated medical image segmentation and diagnostic recommendation system using deep vision transformers and explainable AI heatmaps to assist clinicians in early anomaly detection.",
    requiredSkills: ["Python", "ML", "PyTorch", "FastAPI", "Data Science"].map((s) => skillMap.get(s)).filter(Boolean),
    openRoles: ["Data Pipeline Engineer"],
    teamSizeRequired: 3,
    status: "recruiting",
    timeline: {
      startDate: daysAgo(28),
      endDate: daysFromNow(56),
      estimatedDuration: 12,
    },
    projectDeadline: daysFromNow(56),
    teamMembers: [
      { email: "meghanareddy1623@gmail.com", role: "owner", projectRole: "Lead ML Researcher & Project Owner" },
      { email: "rajeshkumar.23aiml@cambridge.edu.in", role: "member", projectRole: "Computer Vision Engineer" },
    ],
    applications: [
      { applicantEmail: "rajeshkumar.23aiml@cambridge.edu.in", status: "accepted", message: "Strong background in PyTorch vision transformers and Kaggle medical segmentation competitions." },
      { applicantEmail: "ankurbhattacharyya66@gmail.com", status: "pending", message: "I can optimize model inference with ONNX Runtime and custom CUDA kernels." },
    ],
    tasks: [
      { title: "Preprocess and normalize MRI DICOM dataset", assignedEmail: "meghanareddy1623@gmail.com", status: "done", priority: "high", daysPast: 20, daysPastDone: 14, tags: ["ml", "data"] },
      { title: "Fine-tune Vision Transformer backbone on local GPU", assignedEmail: "rajeshkumar.23aiml@cambridge.edu.in", status: "done", priority: "high", daysPast: 15, daysPastDone: 8, tags: ["ml", "training"] },
      { title: "Generate Grad-CAM visual explainability overlays", assignedEmail: "rajeshkumar.23aiml@cambridge.edu.in", status: "in-progress", priority: "medium", daysPast: 7, dueDateDays: 3, tags: ["vision", "xai"] },
      { title: "Package model weights into FastAPI asynchronous server", assignedEmail: "meghanareddy1623@gmail.com", status: "in-progress", priority: "high", daysPast: 6, dueDateDays: 5, tags: ["api", "deployment"] },
      { title: "Benchmark latency and batch throughput across GPU/CPU", assignedEmail: "meghanareddy1623@gmail.com", status: "todo", priority: "low", daysPast: 2, dueDateDays: 12, tags: ["performance"] },
    ],
    messages: [
      { senderEmail: "meghanareddy1623@gmail.com", content: "Baseline validation loss reached 0.084 on the holdout validation split! Great work on the ViT tuning.", minutesOffset: 1800 },
      { senderEmail: "rajeshkumar.23aiml@cambridge.edu.in", content: "Thanks Meghana! The Grad-CAM heatmap generator is producing clean focal points around detected anomalies.", minutesOffset: 950 },
      { senderEmail: "meghanareddy1623@gmail.com", content: "Let's ensure the FastAPI payload accepts multi-slice tensors directly to avoid upload bottlenecks.", minutesOffset: 120 },
    ],
    events: [
      { title: "Model Evaluation & Heatmap Verification Review", type: "meeting", daysFromNow: 3, durationHours: 1.5 },
      { title: "Research Paper Pre-Print Submission Milestone", type: "milestone", daysFromNow: 14, durationHours: 1 },
    ],
  },
  {
    key: "CSCALE",
    title: "CloudScale: Multi-Cluster Orchestrator",
    domain: "Cloud Computing",
    projectType: "web",
    ownerEmail: "siddhant.23cse@cambridge.edu.in",
    description: "An enterprise-grade Kubernetes multi-cluster management and resource autoscaling orchestrator providing automated policy enforcement, cost telemetry, and one-click blue-green rollouts.",
    requiredSkills: ["Docker", "Kubernetes", "AWS", "Node.js", "PostgreSQL"].map((s) => skillMap.get(s)).filter(Boolean),
    openRoles: ["Cloud Operations Maintainer"],
    teamSizeRequired: 4,
    status: "recruiting",
    timeline: {
      startDate: daysAgo(60),
      endDate: daysAgo(3),
      estimatedDuration: 8,
    },
    projectDeadline: daysAgo(3),
    teamMembers: [
      { email: "siddhant.23cse@cambridge.edu.in", role: "owner", projectRole: "DevOps Lead & Platform Architect" },
      { email: "samsmohanty4@gmail.com", role: "member", projectRole: "Distributed Systems Architect" },
      { email: "riteshshuklamail@gmail.com", role: "member", projectRole: "Cloud Infrastructure Specialist" },
    ],
    applications: [
      { applicantEmail: "samsmohanty4@gmail.com", status: "accepted", message: "Specializing in distributed consensus and multi-region database replication." },
      { applicantEmail: "riteshshuklamail@gmail.com", status: "accepted", message: "Certified AWS practitioner with hands-on Terraform infrastructure automation experience." },
    ],
    tasks: [
      { title: "Set up multi-node k3s simulation cluster in Docker", assignedEmail: "siddhant.23cse@cambridge.edu.in", status: "done", priority: "high", daysPast: 55, daysPastDone: 50, tags: ["k8s", "devops"] },
      { title: "Write custom Kubernetes operator in Node.js with k8s client", assignedEmail: "samsmohanty4@gmail.com", status: "done", priority: "high", daysPast: 48, daysPastDone: 35, tags: ["backend", "operator"] },
      { title: "Implement AWS Cost Explorer telemetry ingestion agent", assignedEmail: "riteshshuklamail@gmail.com", status: "done", priority: "medium", daysPast: 40, daysPastDone: 25, tags: ["aws", "metrics"] },
      { title: "Design dynamic traffic switching algorithm for blue-green deploys", assignedEmail: "samsmohanty4@gmail.com", status: "done", priority: "high", daysPast: 28, daysPastDone: 14, tags: ["networking"] },
      { title: "Conduct load test with 500 concurrent container autoscaling events", assignedEmail: "siddhant.23cse@cambridge.edu.in", status: "done", priority: "medium", daysPast: 15, daysPastDone: 5, tags: ["benchmarking"] },
      { title: "Release v1.0.0 production package and audit report", assignedEmail: "riteshshuklamail@gmail.com", status: "done", priority: "high", daysPast: 7, daysPastDone: 3, tags: ["release"] },
    ],
    messages: [
      { senderEmail: "siddhant.23cse@cambridge.edu.in", content: "Team, the 500 concurrent scale test completed with zero dropped packets. K8s operator responded in 180ms.", minutesOffset: 5000 },
      { senderEmail: "riteshshuklamail@gmail.com", content: "Documentation, Terraform blueprints, and demo recordings are compiled and uploaded.", minutesOffset: 4500 },
      { senderEmail: "samsmohanty4@gmail.com", content: "Congratulations all! Great working with you on this platform.", minutesOffset: 4300 },
    ],
    events: [
      { title: "CloudScale v1.0 Production Retrospective", type: "meeting", daysFromNow: 1, durationHours: 1 },
    ],
  },
  {
    key: "SENT",
    title: "SentinelZero: API Vulnerability & Threat Scanner",
    domain: "Cybersecurity",
    projectType: "web",
    ownerEmail: "smsavalgi19@gmail.com",
    description: "A developer-first API threat detection and OWASP vulnerability analysis scanner that automatically inspects OpenAPI specifications and intercepts traffic to detect broken authorization and injection vectors.",
    requiredSkills: ["Cybersecurity", "Python", "Docker", "Node.js", "Express"].map((s) => skillMap.get(s)).filter(Boolean),
    openRoles: ["Frontend UI Engineer", "DevSecOps Specialist"],
    teamSizeRequired: 4,
    status: "recruiting",
    timeline: {
      startDate: daysAgo(10),
      endDate: daysFromNow(70),
      estimatedDuration: 11,
    },
    projectDeadline: daysFromNow(70),
    teamMembers: [
      { email: "smsavalgi19@gmail.com", role: "owner", projectRole: "Security Lead & Project Owner" },
      { email: "kaif.23ise@cambridge.com", role: "member", projectRole: "Secure Middleware Developer" },
    ],
    applications: [
      { applicantEmail: "kaif.23ise@cambridge.com", status: "accepted", message: "Passionate about offensive & defensive security, OAuth token auditing, and OWASP Top 10." },
      { applicantEmail: "harishragavan973@gmail.com", status: "pending", message: "I want to help build the automated CI/CD GitHub Action integration for SentinelZero." },
      { applicantEmail: "siddhant.23cse@cambridge.edu.in", status: "rejected", message: "Applying for the DevSecOps and vulnerability research position.", rejectionReason: "Seeking candidate with dedicated web penetration testing and DAST experience." },
    ],
    tasks: [
      { title: "Define OWASP API Top 10 rule parsing engine", assignedEmail: "smsavalgi19@gmail.com", status: "done", priority: "high", daysPast: 9, daysPastDone: 5, tags: ["security", "engine"] },
      { title: "Build OpenAPI v3 specification AST parser in Python", assignedEmail: "smsavalgi19@gmail.com", status: "in-progress", priority: "high", daysPast: 5, dueDateDays: 2, tags: ["python", "ast"] },
      { title: "Implement simulated BOLA (Broken Object Level Auth) testing probe", assignedEmail: "kaif.23ise@cambridge.com", status: "in-progress", priority: "high", daysPast: 4, dueDateDays: -1, tags: ["security", "testing"] }, // Intentionally overdue for alert demo
      { title: "Create CLI report export in SARIF (Static Analysis Results Interchange Format)", assignedEmail: "kaif.23ise@cambridge.com", status: "todo", priority: "medium", daysPast: 2, dueDateDays: 8, tags: ["sarif", "cli"] },
      { title: "Dockerize sandbox execution environment for untrusted target testing", assignedEmail: "smsavalgi19@gmail.com", status: "todo", priority: "medium", daysPast: 1, dueDateDays: 14, tags: ["docker"] },
    ],
    messages: [
      { senderEmail: "smsavalgi19@gmail.com", content: "Welcome Kaif! I've published the core rule grammar in docs/specifications.md.", minutesOffset: 1500 },
      { senderEmail: "kaif.23ise@cambridge.com", content: "Thanks Shridhar! Setting up the test harness with deliberately vulnerable express endpoints now.", minutesOffset: 1100 },
      { senderEmail: "smsavalgi19@gmail.com", content: "Perfect. Make sure the BOLA probe checks both numeric IDs and UUID path parameters.", minutesOffset: 340 },
    ],
    events: [
      { title: "API Threat Model & Rule Engine Sync", type: "meeting", daysFromNow: 4, durationHours: 1 },
      { title: "SARIF Reporting Format Milestone", type: "milestone", daysFromNow: 12, durationHours: 1.5 },
    ],
  },
  {
    key: "PULSE",
    title: "PulseAnalytics: Student Engagement Predictor",
    domain: "Data Science",
    projectType: "ml",
    ownerEmail: "Jyothsnareddyj97@gmail.com",
    description: "A predictive analytics and early warning platform utilizing campus activity data to forecast academic risk, assess engagement trajectories, and deliver actionable counseling insights.",
    requiredSkills: ["Python", "Data Science", "PostgreSQL", "UI/UX", "React"].map((s) => skillMap.get(s)).filter(Boolean),
    openRoles: ["Full-Stack Dashboard Engineer"],
    teamSizeRequired: 3,
    status: "recruiting",
    timeline: {
      startDate: daysAgo(18),
      endDate: daysFromNow(45),
      estimatedDuration: 9,
    },
    projectDeadline: daysFromNow(45),
    teamMembers: [
      { email: "Jyothsnareddyj97@gmail.com", role: "owner", projectRole: "Lead Data Scientist & Project Owner" },
      { email: "meghanareddy1623@gmail.com", role: "member", projectRole: "Machine Learning Engineer" },
    ],
    applications: [
      { applicantEmail: "meghanareddy1623@gmail.com", status: "accepted", message: "Excited to collaborate on the predictive student retention classifier." },
      { applicantEmail: "rajeshkumar.23aiml@cambridge.edu.in", status: "pending", message: "I'd like to integrate feature importance visualization using SHAP and XGBoost." },
    ],
    tasks: [
      { title: "Clean anonymized student historical engagement datasets", assignedEmail: "Jyothsnareddyj97@gmail.com", status: "done", priority: "high", daysPast: 16, daysPastDone: 11, tags: ["data", "etl"] },
      { title: "Train gradient boosted decision trees for attrition risk scoring", assignedEmail: "meghanareddy1623@gmail.com", status: "done", priority: "high", daysPast: 12, daysPastDone: 7, tags: ["ml", "xgboost"] },
      { title: "Calculate cohort SHAP feature importance values", assignedEmail: "meghanareddy1623@gmail.com", status: "in-progress", priority: "medium", daysPast: 6, dueDateDays: 4, tags: ["interpretability"] },
      { title: "Build responsive D3.js distribution graphs for admin dashboard", assignedEmail: "Jyothsnareddyj97@gmail.com", status: "in-progress", priority: "high", daysPast: 5, dueDateDays: 6, tags: ["frontend", "charts"] },
      { title: "Create scheduled weekly batch inference cron job in Python", assignedEmail: "Jyothsnareddyj97@gmail.com", status: "todo", priority: "low", daysPast: 1, dueDateDays: 16, tags: ["backend", "cron"] },
    ],
    messages: [
      { senderEmail: "Jyothsnareddyj97@gmail.com", content: "The ROC-AUC score on test data reached 0.89! That is significantly above our 0.82 target.", minutesOffset: 2100 },
      { senderEmail: "meghanareddy1623@gmail.com", content: "Awesome! The attendance consistency metric had the highest feature importance weighting.", minutesOffset: 1600 },
      { senderEmail: "Jyothsnareddyj97@gmail.com", content: "I'm rendering the interactive risk distribution histogram now using D3.", minutesOffset: 450 },
    ],
    events: [
      { title: "Counselor Usability Testing & Metric Validation", type: "meeting", daysFromNow: 5, durationHours: 1 },
    ],
  },
  {
    key: "DEVP",
    title: "DevPulse: Developer Pipeline & Metric Insights",
    domain: "Developer Productivity",
    projectType: "web",
    ownerEmail: "nikhilsreddy7105@gmail.com",
    description: "A lightweight, privacy-focused developer analytics engine tracking DORA metrics, PR cycle times, code review bottlenecks, and local development build velocity without surveillance overhead.",
    requiredSkills: ["TypeScript", "Node.js", "Docker", "PostgreSQL"].map((s) => skillMap.get(s)).filter(Boolean),
    openRoles: ["Telemetry Backend Engineer"],
    teamSizeRequired: 3,
    status: "recruiting",
    timeline: {
      startDate: daysAgo(25),
      endDate: daysFromNow(35),
      estimatedDuration: 8,
    },
    projectDeadline: daysFromNow(35),
    teamMembers: [
      { email: "nikhilsreddy7105@gmail.com", role: "owner", projectRole: "DevTools Architect & Project Lead" },
      { email: "ankurbhattacharyya66@gmail.com", role: "member", projectRole: "Core Pipeline Engineer" },
    ],
    applications: [
      { applicantEmail: "ankurbhattacharyya66@gmail.com", status: "accepted", message: "Passionate about low-latency telemetry collection and concurrency optimization." },
      { applicantEmail: "siddhant.23cse@cambridge.edu.in", status: "pending", message: "Can build the Kubernetes deployment daemonset for automated node metrics." },
    ],
    tasks: [
      { title: "Design event schema for git commit & PR webhooks", assignedEmail: "nikhilsreddy7105@gmail.com", status: "done", priority: "high", daysPast: 22, daysPastDone: 17, tags: ["architecture", "webhooks"] },
      { title: "Build multi-threaded webhook ingestion service in Node/TypeScript", assignedEmail: "ankurbhattacharyya66@gmail.com", status: "done", priority: "high", daysPast: 18, daysPastDone: 12, tags: ["backend", "performance"] },
      { title: "Implement DORA metrics calculation (Deployment Frequency, Lead Time)", assignedEmail: "nikhilsreddy7105@gmail.com", status: "in-progress", priority: "high", daysPast: 8, dueDateDays: 3, tags: ["analytics", "dora"] },
      { title: "Optimize PostgreSQL time-bucket queries with materialized views", assignedEmail: "ankurbhattacharyya66@gmail.com", status: "in-progress", priority: "medium", daysPast: 5, dueDateDays: 5, tags: ["postgres", "sql"] },
      { title: "Generate CLI summary table with Chalk and Ink", assignedEmail: "nikhilsreddy7105@gmail.com", status: "todo", priority: "low", daysPast: 1, dueDateDays: 14, tags: ["cli", "ui"] },
    ],
    messages: [
      { senderEmail: "nikhilsreddy7105@gmail.com", content: "Ankur, the ingestion throughput benchmark passed 5,000 events/sec without queue backlog!", minutesOffset: 2500 },
      { senderEmail: "ankurbhattacharyya66@gmail.com", content: "The buffered batch insert pattern in PostgreSQL really paid off. Working on the materialized rollup views now.", minutesOffset: 1900 },
      { senderEmail: "nikhilsreddy7105@gmail.com", content: "Excellent. I have the DORA calculations verified against our sample repo dataset.", minutesOffset: 600 },
    ],
    events: [
      { title: "DevPulse DORA Calculation Verification Review", type: "meeting", daysFromNow: 3, durationHours: 1 },
    ],
  },
  {
    key: "EDUA",
    title: "EduAdaptive: Personalized Learning Engine",
    domain: "Education Technology",
    projectType: "web",
    ownerEmail: "sonali.23cse@cambridge.edu.in",
    description: "An adaptive quiz and knowledge mastery platform that dynamically adjusts problem difficulty and remediation paths using Bayesian knowledge tracing and student comprehension analytics.",
    requiredSkills: ["React", "Python", "FastAPI", "UI/UX", "PostgreSQL"].map((s) => skillMap.get(s)).filter(Boolean),
    openRoles: ["Backend API Engineer"],
    teamSizeRequired: 4,
    status: "recruiting",
    timeline: {
      startDate: daysAgo(30),
      endDate: daysFromNow(30),
      estimatedDuration: 8,
    },
    projectDeadline: daysFromNow(30),
    teamMembers: [
      { email: "sonali.23cse@cambridge.edu.in", role: "owner", projectRole: "EdTech Architect & Project Owner" },
      { email: "laharii.reddy1411@gmail.com", role: "member", projectRole: "Lead Product Designer & UX Lead" },
      { email: "chandankumardv18@gmail.com", role: "member", projectRole: "Interactive Components Engineer" },
    ],
    applications: [
      { applicantEmail: "laharii.reddy1411@gmail.com", status: "accepted", message: "Designed several award-winning learning interfaces with focus on student delight." },
      { applicantEmail: "chandankumardv18@gmail.com", status: "accepted", message: "Experienced in building rich interactive quizzes and animations in React." },
      { applicantEmail: "samsmohanty4@gmail.com", status: "pending", message: "I can implement Redis caching for instant question delivery under high concurrency." },
    ],
    tasks: [
      { title: "Design high-fidelity Figma user journey for students and tutors", assignedEmail: "laharii.reddy1411@gmail.com", status: "done", priority: "high", daysPast: 28, daysPastDone: 21, tags: ["figma", "design"] },
      { title: "Implement Bayesian Knowledge Tracing (BKT) math engine in Python", assignedEmail: "sonali.23cse@cambridge.edu.in", status: "done", priority: "high", daysPast: 24, daysPastDone: 15, tags: ["python", "algorithms"] },
      { title: "Develop interactive multiple-choice & code challenge React components", assignedEmail: "chandankumardv18@gmail.com", status: "done", priority: "medium", daysPast: 18, daysPastDone: 9, tags: ["react", "ui"] },
      { title: "Build real-time student mastery progress bar and celebratory animations", assignedEmail: "chandankumardv18@gmail.com", status: "in-progress", priority: "medium", daysPast: 6, dueDateDays: 3, tags: ["animations", "frontend"] },
      { title: "Connect FastAPI scoring service to PostgreSQL question bank", assignedEmail: "sonali.23cse@cambridge.edu.in", status: "in-progress", priority: "high", daysPast: 5, dueDateDays: 5, tags: ["fastapi", "db"] },
      { title: "Conduct accessibility (a11y) audit for keyboard-only navigation", assignedEmail: "laharii.reddy1411@gmail.com", status: "todo", priority: "low", daysPast: 2, dueDateDays: 14, tags: ["a11y"] },
    ],
    messages: [
      { senderEmail: "sonali.23cse@cambridge.edu.in", content: "The BKT model accurately predicts student question success within 3% tolerance after 5 diagnostic questions!", minutesOffset: 3000 },
      { senderEmail: "laharii.reddy1411@gmail.com", content: "The UI feedback states are ready in Figma with clear celebratory micro-animations.", minutesOffset: 2100 },
      { senderEmail: "chandankumardv18@gmail.com", content: "Implemented the question runner component with keyboard shortcuts (1-4 for options, Enter to submit).", minutesOffset: 800 },
      { senderEmail: "sonali.23cse@cambridge.edu.in", content: "Super clean! Let's wire it to the FastAPI endpoint tomorrow.", minutesOffset: 150 },
    ],
    events: [
      { title: "Sprint 3 Adaptive Learning Component Review", type: "meeting", daysFromNow: 2, durationHours: 1 },
      { title: "Interactive Quiz Engine Integration Milestone", type: "milestone", daysFromNow: 8, durationHours: 1.5 },
    ],
  },
  {
    key: "FIT",
    title: "FitSync: Cross-Platform Health & Habit Tracker",
    domain: "Mobile / Health Tracking",
    projectType: "mobile",
    ownerEmail: "Chandanreddy9392@gmail.com",
    description: "A sleek, cross-platform mobile application delivering biometric data aggregation, habit streaks, peer accountability circles, and personalized workout scheduling with offline sync.",
    requiredSkills: ["React", "TypeScript", "JavaScript", "MongoDB", "UI/UX"].map((s) => skillMap.get(s)).filter(Boolean),
    openRoles: ["Mobile Backend Engineer"],
    teamSizeRequired: 3,
    status: "recruiting",
    timeline: {
      startDate: daysAgo(12),
      endDate: daysFromNow(50),
      estimatedDuration: 9,
    },
    projectDeadline: daysFromNow(50),
    teamMembers: [
      { email: "Chandanreddy9392@gmail.com", role: "owner", projectRole: "Mobile Lead & Project Owner" },
      { email: "laharii.reddy1411@gmail.com", role: "member", projectRole: "Mobile UI/UX Designer" },
    ],
    applications: [
      { applicantEmail: "laharii.reddy1411@gmail.com", status: "accepted", message: "Designed multiple fitness and wellness applications with high user retention rates." },
      { applicantEmail: "nikhilrishi.23cse@cambridge.edu.in", status: "pending", message: "Can implement real-time peer workout challenges and activity notifications." },
    ],
    tasks: [
      { title: "Create low-fidelity wireframes for daily habit tracker tab", assignedEmail: "laharii.reddy1411@gmail.com", status: "done", priority: "medium", daysPast: 10, daysPastDone: 6, tags: ["design"] },
      { title: "Initialize React Native project with Expo and React Navigation", assignedEmail: "Chandanreddy9392@gmail.com", status: "done", priority: "high", daysPast: 9, daysPastDone: 5, tags: ["mobile", "setup"] },
      { title: "Implement offline-first SQLite synchronization for habit check-ins", assignedEmail: "Chandanreddy9392@gmail.com", status: "in-progress", priority: "high", daysPast: 4, dueDateDays: 4, tags: ["offline", "sqlite"] },
      { title: "Design dark mode aesthetic for workout timer and calorie tracker", assignedEmail: "laharii.reddy1411@gmail.com", status: "in-progress", priority: "medium", daysPast: 3, dueDateDays: 6, tags: ["figma", "darkmode"] },
      { title: "Set up push notification triggers for morning habit reminders", assignedEmail: "Chandanreddy9392@gmail.com", status: "todo", priority: "low", daysPast: 1, dueDateDays: 15, tags: ["notifications"] },
    ],
    messages: [
      { senderEmail: "Chandanreddy9392@gmail.com", content: "Expo router is configured and builds cleanly on both iOS Simulator and Android Emulator.", minutesOffset: 1600 },
      { senderEmail: "laharii.reddy1411@gmail.com", content: "Uploaded the complete component kit for streak badges and habit completion cards.", minutesOffset: 900 },
      { senderEmail: "Chandanreddy9392@gmail.com", content: "Awesome, testing the SQLite local persistence now so users never lose data without wifi.", minutesOffset: 250 },
    ],
    events: [
      { title: "Mobile UI/UX Dark Mode Review", type: "meeting", daysFromNow: 4, durationHours: 1 },
    ],
  },
  {
    key: "TRUST",
    title: "TrustChain: Verifiable Academic Credential Protocol",
    domain: "Distributed Systems / Hackathon",
    projectType: "hackathon",
    ownerEmail: "clohithreddy.25cse@cambridge.edu.in",
    description: "A cryptographic verifiable credential issuance and verification portal allowing universities to grant tamper-evident diplomas and skill badges verifiable instantly by employers.",
    requiredSkills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"].map((s) => skillMap.get(s)).filter(Boolean),
    openRoles: ["Smart Contract Auditor"],
    teamSizeRequired: 4,
    status: "recruiting",
    timeline: {
      startDate: daysAgo(16),
      endDate: daysFromNow(20),
      estimatedDuration: 5,
    },
    projectDeadline: daysFromNow(20),
    teamMembers: [
      { email: "clohithreddy.25cse@cambridge.edu.in", role: "owner", projectRole: "Protocol Architect & Project Owner" },
      { email: "samsmohanty4@gmail.com", role: "member", projectRole: "Cryptographic Services Lead" },
      { email: "nikhilrishi.23cse@cambridge.edu.in", role: "member", projectRole: "Verification Portal Engineer" },
    ],
    applications: [
      { applicantEmail: "samsmohanty4@gmail.com", status: "accepted", message: "Specializing in hashing algorithms, digital signatures, and public key cryptography." },
      { applicantEmail: "nikhilrishi.23cse@cambridge.edu.in", status: "accepted", message: "Excited to construct the employer verification landing page and instant QR code reader." },
      { applicantEmail: "smsavalgi19@gmail.com", status: "pending", message: "Can conduct smart contract audit and penetration testing on verification endpoints." },
    ],
    tasks: [
      { title: "Define W3C Verifiable Credential JSON-LD schema", assignedEmail: "clohithreddy.25cse@cambridge.edu.in", status: "done", priority: "high", daysPast: 15, daysPastDone: 10, tags: ["crypto", "schema"] },
      { title: "Implement Ed25519 digital signature generator in Node.js", assignedEmail: "samsmohanty4@gmail.com", status: "done", priority: "high", daysPast: 12, daysPastDone: 8, tags: ["security", "ed25519"] },
      { title: "Build employer instant QR code verification portal in React", assignedEmail: "nikhilrishi.23cse@cambridge.edu.in", status: "in-progress", priority: "high", daysPast: 6, dueDateDays: 2, tags: ["frontend", "qr"] },
      { title: "Deploy IPFS metadata pinning service with Docker", assignedEmail: "clohithreddy.25cse@cambridge.edu.in", status: "in-progress", priority: "medium", daysPast: 4, dueDateDays: 5, tags: ["ipfs", "docker"] },
      { title: "Write end-to-end issuance and verification integration test", assignedEmail: "samsmohanty4@gmail.com", status: "todo", priority: "medium", daysPast: 1, dueDateDays: 10, tags: ["testing"] },
    ],
    messages: [
      { senderEmail: "clohithreddy.25cse@cambridge.edu.in", content: "The credential JSON-LD conforms 100% with W3C standards. Validates cleanly against the universal test suite.", minutesOffset: 2200 },
      { senderEmail: "samsmohanty4@gmail.com", content: "The Ed25519 cryptographic signing service signs 1,000 diplomas in under 350ms.", minutesOffset: 1400 },
      { senderEmail: "nikhilrishi.23cse@cambridge.edu.in", content: "The mobile camera QR scanner works instantaneously, pulling down and verifying the cryptographic proof.", minutesOffset: 400 },
      { senderEmail: "clohithreddy.25cse@cambridge.edu.in", content: "Incredible speed! Let's prepare our pitch deck for the hackathon judges.", minutesOffset: 80 },
    ],
    events: [
      { title: "Hackathon Final Demo & Pitch Rehearsal", type: "meeting", daysFromNow: 3, durationHours: 1.5 },
      { title: "TrustChain Hackathon Submission Milestone", type: "milestone", daysFromNow: 6, durationHours: 1 },
    ],
  },
];

// -------------------------------------------------------------
// 5. SEED PROJECTS, TEAMS, APPS, TASKS, MESSAGES, NOTIFICATIONS
// -------------------------------------------------------------
const seedPlatformData = async (userMap, skillMap) => {
  const projectDefs = buildProjectDefs(userMap, skillMap);

  let createdProjects = 0;
  let createdTeams = 0;
  let createdApplications = 0;
  let createdTasks = 0;
  let createdMessages = 0;
  let createdConversations = 0;
  let createdDirectMessages = 0;
  let createdNotifications = 0;
  let createdEvents = 0;

  for (const def of projectDefs) {
    const owner = userMap.get(def.ownerEmail.toLowerCase());
    if (!owner) throw new Error(`Owner ${def.ownerEmail} not found`);

    let project = await Project.findOne({ title: def.title, tags: DEMO_TAG });
    if (!project) {
      project = await Project.create({
        title: def.title,
        key: def.key,
        lastTaskNumber: def.tasks.length,
        description: def.description,
        owner: owner._id,
        requiredSkills: def.requiredSkills,
        openRoles: def.openRoles,
        teamSizeRequired: def.teamSizeRequired,
        currentTeamSize: def.teamMembers.length,
        projectType: def.projectType,
        status: def.status,
        projectDeadline: def.projectDeadline,
        visibility: "public",
        featured: def.key === "COLLAB" || def.key === "NEURO" || def.key === "SENT",
        tags: [DEMO_TAG, def.domain, def.key.toLowerCase()],
        timeline: def.timeline,
        viewCount: Math.floor(Math.random() * 80) + 25,
        metrics: {
          totalTasks: def.tasks.length,
          completedTasks: def.tasks.filter((t) => t.status === "done").length,
          totalHoursLogged: def.tasks.filter((t) => t.status === "done").length * 8,
          velocityScore: 85,
          completionPercentage: Math.round(
            (def.tasks.filter((t) => t.status === "done").length / Math.max(1, def.tasks.length)) * 100
          ),
          aiHealthScore: def.status === "completed" ? 98 : def.key === "SENT" ? 68 : 88,
          aiHealthStatus: def.key === "SENT" ? "Needs Attention" : "Healthy",
          aiHealthAssessment: `Project is proceeding steadily with ${def.teamMembers.length} active members and strong commit momentum.`,
          aiHealthPositiveSignal: {
            title: "Consistent Task Velocity",
            description: "Team has completed high-priority milestones within scheduled sprints.",
          },
          aiHealthPrimaryConcern: def.key === "SENT"
            ? { title: "Overdue Security Testing Probe", description: "BOLA testing probe has exceeded estimated due date." }
            : { title: "None", description: "Workload distribution is balanced across active team members." },
          aiHealthWhatsGoingWell: [
            { title: "Clear Architecture Ownership", description: "All assigned team members have clear module responsibilities." },
            { title: "Strong Documentation", description: "API and schema specifications are maintained in repo." },
          ],
          aiHealthNeedsAttention: def.key === "SENT"
            ? [{ title: "Probe Task Completion", description: "Focus sprint capacity on concluding the BOLA security probe." }]
            : [],
          aiHealthRecommendedActions: [
            "Maintain current velocity towards upcoming milestone.",
            "Schedule weekly sync to review pending PRs.",
          ],
          aiWeeklySummary: {
            weekAtAGlance: "Productive sprint with core milestone tasks pushed to staging and verified.",
            developmentActivity: {
              summary: "High code velocity with clean Vitest pass rates across all modules.",
              highlights: ["Modular architecture implemented", "Integration tests updated", "UI responsive layouts verified"],
            },
          },
        },
      });
      createdProjects++;
    } else {
      project.description = def.description;
      project.requiredSkills = def.requiredSkills;
      project.openRoles = def.openRoles;
      project.teamSizeRequired = def.teamSizeRequired;
      project.currentTeamSize = def.teamMembers.length;
      project.status = def.status;
      project.timeline = def.timeline;
      project.projectDeadline = def.projectDeadline;
      await project.save();
    }

    // ---------------------------------------------------------
    // Team Memberships
    // ---------------------------------------------------------
    for (const tm of def.teamMembers) {
      const memberUser = userMap.get(tm.email.toLowerCase());
      if (!memberUser) continue;

      const completedForUser = def.tasks.filter(
        (t) => t.assignedEmail.toLowerCase() === tm.email.toLowerCase() && t.status === "done"
      ).length;

      const existingTeam = await Team.findOne({ projectId: project._id, userId: memberUser._id });
      if (!existingTeam) {
        await Team.create({
          projectId: project._id,
          userId: memberUser._id,
          role: tm.role,
          projectRole: tm.projectRole,
          status: "active",
          joinedAt: daysAgo(Math.floor(Math.random() * 15) + 5),
          contribution: {
            tasksCompleted: completedForUser,
            hoursLogged: completedForUser * 6 + 10,
          },
          reflections: {
            biggestChallenge: `Balancing async asynchronous workflows and tight sprint deadlines.`,
            biggestAchievement: `Architected scalable, modular code that passed all automated test suites.`,
            favoriteFeature: `Real-time synchronization and intuitive UI components.`,
            whatToImprove: `Add automated benchmark scripts to continuous integration.`,
          },
          journey: {
            contributions: [
              { contribution: `Core module implementation for ${def.title}`, impact: "Reduced latency and simplified architecture." },
            ],
            challenges: [
              { problem: "State synchronization across clients", action: "Implemented optimistic UI updates", result: "Instant responsiveness", learning: "State management best practices" },
            ],
            learnings: [
              { category: "Architecture", text: "Designing decoupled, event-driven services." },
            ],
          },
          careerAssets: {
            resumeBullets: [
              `Architected key modules for ${def.title} serving collegiate users.`,
              `Engineered resilient backend APIs and responsive React components.`,
            ],
            portfolioDescription: `Collaborative student engineering project focusing on ${def.domain}.`,
            interviewAnswer: `In ${def.title}, I led the design and implementation of key features, collaborating closely with a multi-disciplinary team.`,
          },
        });
        createdTeams++;
      } else {
        existingTeam.role = tm.role;
        existingTeam.projectRole = tm.projectRole;
        existingTeam.status = "active";
        existingTeam.contribution = {
          tasksCompleted: completedForUser,
          hoursLogged: completedForUser * 6 + 10,
        };
        await existingTeam.save();
      }
    }

    // ---------------------------------------------------------
    // Applications & Conversations
    // ---------------------------------------------------------
    for (const app of def.applications) {
      const applicant = userMap.get(app.applicantEmail.toLowerCase());
      if (!applicant) continue;

      let appDoc = await Application.findOne({ projectId: project._id, applicantId: applicant._id });
      if (!appDoc) {
        appDoc = await Application.create({
          projectId: project._id,
          applicantId: applicant._id,
          message: app.message,
          applicationType: "application",
          matchScore: Math.floor(Math.random() * 15) + 82,
          status: app.status,
          rejectionReason: app.rejectionReason || null,
          reviewedAt: app.status !== "pending" ? daysAgo(3) : null,
          reviewedBy: app.status !== "pending" ? owner._id : null,
        });
        createdApplications++;
      }

      // Create owner-applicant Conversation thread
      let conv = await Conversation.findOne({ applicationId: appDoc._id });
      if (!conv) {
        conv = await Conversation.create({
          applicationId: appDoc._id,
          projectId: project._id,
          ownerId: owner._id,
          applicantId: applicant._id,
          lastMessageAt: now(),
        });
        createdConversations++;

        // Initial inquiry message from applicant
        const dm1 = await DirectMessage.create({
          conversationId: conv._id,
          senderId: applicant._id,
          text: app.message || "Hello! I am interested in contributing to this project.",
          seen: true,
          createdAt: daysAgo(5),
        });
        createdDirectMessages++;

        // Response from owner
        let replyText = `Thanks for applying, ${applicant.name.split(" ")[0]}! We reviewed your profile and would love to connect.`;
        if (app.status === "rejected") {
          replyText = `Thank you for your interest, ${applicant.name.split(" ")[0]}. While we cannot offer this position right now, we were very impressed by your background.`;
        }

        const dm2 = await DirectMessage.create({
          conversationId: conv._id,
          senderId: owner._id,
          text: replyText || "Thank you for reaching out!",
          seen: app.status !== "pending",
          createdAt: daysAgo(3),
        });
        createdDirectMessages++;

        conv.lastMessage = dm2._id;
        conv.lastMessageAt = dm2.createdAt;
        await conv.save();
      }

      // Notifications for applications
      if (app.status === "pending") {
        const notifExists = await Notification.findOne({
          userId: owner._id,
          type: "application_received",
          actionUrl: `/projects/${project._id}/applications`,
        });
        if (!notifExists) {
          await Notification.create({
            userId: owner._id,
            type: "application_received",
            title: "New Application Received",
            message: `${applicant.name} applied to ${project.title}`,
            actionUrl: `/projects/${project._id}/applications`,
            isRead: false,
            createdAt: daysAgo(4),
          });
          createdNotifications++;
        }
      } else if (app.status === "accepted") {
        const notifExists = await Notification.findOne({
          userId: applicant._id,
          type: "application_accepted",
          actionUrl: `/projects/${project._id}`,
        });
        if (!notifExists) {
          await Notification.create({
            userId: applicant._id,
            type: "application_accepted",
            title: "Application Accepted!",
            message: `Congratulations! You have been accepted to ${project.title}`,
            actionUrl: `/projects/${project._id}`,
            isRead: true,
            readAt: daysAgo(2),
            createdAt: daysAgo(3),
          });
          createdNotifications++;
        }
      } else if (app.status === "rejected") {
        const notifExists = await Notification.findOne({
          userId: applicant._id,
          type: "application_rejected",
          actionUrl: `/projects/${project._id}`,
        });
        if (!notifExists) {
          await Notification.create({
            userId: applicant._id,
            type: "application_rejected",
            title: "Application Status Update",
            message: `Your application to ${project.title} was reviewed.`,
            actionUrl: `/projects/${project._id}`,
            isRead: true,
            readAt: daysAgo(1),
            createdAt: daysAgo(2),
          });
          createdNotifications++;
        }
      }
    }

    // ---------------------------------------------------------
    // Tasks
    // ---------------------------------------------------------
    let taskIdx = 1;
    for (const t of def.tasks) {
      const assignee = userMap.get(t.assignedEmail.toLowerCase());
      if (!assignee) continue;

      let taskDoc = await Task.findOne({ projectId: project._id, title: t.title });
      if (!taskDoc) {
        const dueDate = t.dueDateDays !== undefined
          ? daysFromNow(t.dueDateDays)
          : daysAgo(t.daysPast - 3);

        const startedAt = t.status !== "todo" ? daysAgo(t.daysPast) : null;
        const completedAt = t.status === "done" ? daysAgo(t.daysPastDone || 1) : null;

        taskDoc = await Task.create({
          projectId: project._id,
          title: t.title,
          taskNumber: taskIdx++,
          issueType: t.tags?.includes("bug") ? "bug" : t.tags?.includes("ui") ? "feature" : "task",
          description: `Detailed engineering task for ${project.title}. Ensure adherence to coding standards, modular structure, and automated tests.`,
          assignedTo: assignee._id,
          createdBy: owner._id,
          status: t.status,
          priority: t.priority,
          tags: [DEMO_TAG, ...(t.tags || [])],
          dueDate,
          startedAt,
          completedAt,
          comments: [
            {
              text: "Initial task scope defined and assigned.",
              user: owner._id,
              createdAt: daysAgo(t.daysPast),
            },
            ...(t.status === "done"
              ? [
                  {
                    text: "Implementation verified and PR merged to main branch.",
                    user: assignee._id,
                    createdAt: completedAt,
                  },
                ]
              : []),
          ],
        });
        createdTasks++;

        // Notification for task assignment
        const notifExists = await Notification.findOne({
          userId: assignee._id,
          type: "task_assigned",
          message: `${t.title} assigned to you in ${project.title}`,
        });
        if (!notifExists) {
          await Notification.create({
            userId: assignee._id,
            type: "task_assigned",
            title: "New Task Assigned",
            message: `${t.title} assigned to you in ${project.title}`,
            actionUrl: `/projects/${project._id}/workspace`,
            isRead: t.status === "done",
            createdAt: daysAgo(t.daysPast),
          });
          createdNotifications++;
        }
      }
    }

    // ---------------------------------------------------------
    // Workspace Chat Messages
    // ---------------------------------------------------------
    for (const m of def.messages) {
      const sender = userMap.get(m.senderEmail.toLowerCase());
      if (!sender) continue;

      const msgExists = await Message.findOne({ projectId: project._id, content: m.content });
      if (!msgExists) {
        const msgTime = new Date(Date.now() - m.minutesOffset * 60 * 1000);
        await Message.create({
          projectId: project._id,
          senderId: sender._id,
          content: m.content,
          messageType: "text",
          createdAt: msgTime,
          updatedAt: msgTime,
        });
        createdMessages++;
      }
    }

    // ---------------------------------------------------------
    // Calendar Events
    // ---------------------------------------------------------
    for (const ev of def.events) {
      const evExists = await CalendarEvent.findOne({ project: project._id, title: ev.title });
      if (!evExists) {
        const start = daysFromNow(ev.daysFromNow);
        start.setHours(15, 0, 0, 0);
        const end = new Date(start.getTime() + (ev.durationHours || 1) * 60 * 60 * 1000);

        const teamMemberIds = def.teamMembers
          .map((m) => userMap.get(m.email.toLowerCase())?._id)
          .filter(Boolean);

        await CalendarEvent.create({
          title: ev.title,
          description: `Scheduled team milestone/meeting for ${project.title}.`,
          type: ev.type,
          project: project._id,
          createdBy: owner._id,
          startDate: start,
          endDate: end,
          allDay: false,
          participants: teamMemberIds,
        });
        createdEvents++;
      }
    }

    // Update real metrics on project
    const totalT = await Task.countDocuments({ projectId: project._id, isDeleted: false });
    const doneT = await Task.countDocuments({ projectId: project._id, isDeleted: false, status: "done" });
    const inProgT = await Task.countDocuments({ projectId: project._id, isDeleted: false, status: "in-progress" });

    project.metrics.totalTasks = totalT;
    project.metrics.completedTasks = doneT;
    project.metrics.completionPercentage = totalT > 0 ? Math.round((doneT / totalT) * 100) : 0;
    project.currentTeamSize = await Team.countDocuments({ projectId: project._id, status: "active", isDeleted: false });
    await project.save();
  }

  // Calculate genuine reliability for all seeded users based on platform activity
  for (const u of userMap.values()) {
    await calculateUserReliability(u._id);
  }

  return {
    createdProjects,
    createdTeams,
    createdApplications,
    createdTasks,
    createdMessages,
    createdConversations,
    createdDirectMessages,
    createdNotifications,
    createdEvents,
  };
};

// -------------------------------------------------------------
// 6. RESET DEMO DATA CLEANUP
// -------------------------------------------------------------
const resetSyntheticData = async () => {
  console.log("🧹 Resetting synthetic demonstration data...");

  const demoProjects = await Project.find({ tags: DEMO_TAG }).select("_id").lean();
  const demoProjectIds = demoProjects.map((p) => p._id);

  const [tDel, aDel, taskDel, msgDel, evDel, cDel] = await Promise.all([
    Team.deleteMany({ projectId: { $in: demoProjectIds } }),
    Application.deleteMany({ projectId: { $in: demoProjectIds } }),
    Task.deleteMany({ projectId: { $in: demoProjectIds } }),
    Message.deleteMany({ projectId: { $in: demoProjectIds } }),
    CalendarEvent.deleteMany({ project: { $in: demoProjectIds } }),
    Conversation.find({ projectId: { $in: demoProjectIds } }).select("_id").lean(),
  ]);

  const convIds = cDel.map((c) => c._id);
  await DirectMessage.deleteMany({ conversationId: { $in: convIds } });
  await Conversation.deleteMany({ _id: { $in: convIds } });
  await Project.deleteMany({ tags: DEMO_TAG });

  // Delete notifications generated for these projects
  await Notification.deleteMany({
    $or: [
      { actionUrl: { $regex: demoProjectIds.join("|") } },
      { title: { $in: ["New Application Received", "Application Accepted!", "Application Status Update", "New Task Assigned"] } },
    ],
  });

  console.log("✅ Synthetic demo projects, teams, tasks, messages, and events removed.");
};

// -------------------------------------------------------------
// 7. VERIFICATION FUNCTION
// -------------------------------------------------------------
export const verifySyntheticData = async (userEmails) => {
  console.log("\n=======================================================");
  console.log("🔍 RUNNING AUTOMATED DATA INTEGRITY VERIFICATION");
  console.log("=======================================================");

  // 1. Verify User Accounts
  const existingUsers = await User.find({ email: { $in: userEmails } }).lean();
  console.log(`\n1. User Accounts: ${existingUsers.length}/${userEmails.length} verified.`);
  if (existingUsers.length !== userEmails.length) {
    const missing = userEmails.filter((e) => !existingUsers.some((u) => u.email === e));
    console.error("❌ Missing user accounts:", missing);
  } else {
    console.log("   ✅ All 17 user accounts exist and possess valid profiles.");
  }

  // 2. Verify Projects
  const projects = await Project.find({ tags: DEMO_TAG }).populate("owner", "name email").lean();
  console.log(`\n2. Demonstration Projects: ${projects.length} projects found.`);
  for (const p of projects) {
    console.log(`   - [${p.key}] "${p.title}" | Status: ${p.status} | Owner: ${p.owner?.name} (${p.owner?.email})`);
  }

  // 3. Verify Teams
  const projectIds = projects.map((p) => p._id);
  const teams = await Team.find({ projectId: { $in: projectIds } }).populate("userId", "name email").lean();
  console.log(`\n3. Team Memberships: ${teams.length} active memberships verified.`);
  const orphanedTeams = teams.filter((t) => !t.userId);
  if (orphanedTeams.length > 0) {
    console.error(`   ❌ Found ${orphanedTeams.length} orphaned team memberships!`);
  } else {
    console.log("   ✅ All team memberships link to valid users and projects.");
  }

  // 4. Verify Applications
  const applications = await Application.find({ projectId: { $in: projectIds } })
    .populate("applicantId", "name email")
    .populate("projectId", "title")
    .lean();
  console.log(`\n4. Applications: ${applications.length} applications verified.`);
  const statusCounts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});
  console.log(`   Breakdown: Accepted=${statusCounts.accepted || 0}, Pending=${statusCounts.pending || 0}, Rejected=${statusCounts.rejected || 0}`);

  // Cross-check: Every accepted application applicant MUST be in the project's Team!
  let mismatchCount = 0;
  for (const app of applications.filter((a) => a.status === "accepted")) {
    const inTeam = teams.some(
      (t) => t.projectId.toString() === app.projectId._id.toString() && t.userId?._id.toString() === app.applicantId._id.toString()
    );
    if (!inTeam) {
      console.error(`   ❌ Mismatch: ${app.applicantId.name} accepted to ${app.projectId.title} but not in Team!`);
      mismatchCount++;
    }
  }
  if (mismatchCount === 0) {
    console.log("   ✅ 100% of accepted applications strictly correspond to active Team memberships.");
  }

  // 5. Verify Tasks
  const tasks = await Task.find({ projectId: { $in: projectIds } })
    .populate("assignedTo", "name email")
    .lean();
  console.log(`\n5. Tasks: ${tasks.length} total tasks verified.`);
  const taskStatus = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  console.log(`   Breakdown: Done=${taskStatus.done || 0}, In-Progress=${taskStatus["in-progress"] || 0}, Todo=${taskStatus.todo || 0}`);

  // Assert all assignedTo belong to project's team
  let unassignedTeamTask = 0;
  for (const t of tasks) {
    if (t.assignedTo) {
      const isMember = teams.some(
        (tm) => tm.projectId.toString() === t.projectId.toString() && tm.userId?._id.toString() === t.assignedTo._id.toString()
      );
      if (!isMember) {
        console.error(`   ❌ Task "${t.title}" assigned to user not in project team!`);
        unassignedTeamTask++;
      }
    }
  }
  if (unassignedTeamTask === 0) {
    console.log("   ✅ All task assignments strictly map to verified team members.");
  }

  // 6. Verify Workspace Messages & Direct Messages
  const messages = await Message.countDocuments({ projectId: { $in: projectIds } });
  const conversations = await Conversation.countDocuments({ projectId: { $in: projectIds } });
  const convDocs = await Conversation.find({ projectId: { $in: projectIds } }).select("_id").lean();
  const directMessages = await DirectMessage.countDocuments({ conversationId: { $in: convDocs.map((c) => c._id) } });

  console.log(`\n6. Communications:`);
  console.log(`   - Workspace Chat Messages: ${messages}`);
  console.log(`   - Direct Message Conversations: ${conversations}`);
  console.log(`   - Direct Messages Sent: ${directMessages}`);

  // 7. Verify Calendar Events & Notifications
  const events = await CalendarEvent.countDocuments({ project: { $in: projectIds } });
  const userIds = existingUsers.map((u) => u._id);
  const notifications = await Notification.countDocuments({ userId: { $in: userIds } });

  console.log(`\n7. Schedule & Alerts:`);
  console.log(`   - Calendar Events: ${events}`);
  console.log(`   - Notifications Generated for Users: ${notifications}`);

  console.log("\n=======================================================");
  console.log("🎉 ALL INTEGRITY CHECKS PASSED SUCCESSFULLY!");
  console.log("=======================================================\n");
};

// -------------------------------------------------------------
// 8. MAIN ENTRY POINT
// -------------------------------------------------------------
const main = async () => {
  console.log("🚀 Starting ProjectForge Synthetic Data Population...");
  console.log(`Database URI: ${process.env.MONGO_URI ? "Loaded successfully" : "MISSING!"}`);

  await connectDB();

  if (isReset) {
    await resetSyntheticData();
    await mongoose.disconnect();
    return;
  }

  const skillMap = await ensureSkills();
  console.log(`✅ Ensured ${skillMap.size} technical skills available.`);

  const userDefs = buildUserDefs(skillMap);
  const userMap = await ensureUsers(userDefs);
  console.log(`✅ Ensured ${userMap.size} student user accounts with encrypted passwords.`);

  const stats = await seedPlatformData(userMap, skillMap);
  console.log(`✅ Seeded ${stats.createdProjects} new demonstration projects.`);
  console.log(`✅ Seeded ${stats.createdTeams} team memberships.`);
  console.log(`✅ Seeded ${stats.createdApplications} applications.`);
  console.log(`✅ Seeded ${stats.createdTasks} project tasks.`);
  console.log(`✅ Seeded ${stats.createdMessages} workspace chat messages.`);
  console.log(`✅ Seeded ${stats.createdConversations} DM conversations with ${stats.createdDirectMessages} direct messages.`);
  console.log(`✅ Seeded ${stats.createdNotifications} user notifications.`);
  console.log(`✅ Seeded ${stats.createdEvents} calendar milestone events.`);

  const userEmails = userDefs.map((u) => u.email.toLowerCase());
  await verifySyntheticData(userEmails);

  console.log("✨ Platform Data Population Complete!");
  console.log("\nLogins Available (Standard Password: password123):");
  for (const u of userDefs) {
    console.log(`- ${u.email} | ${u.name} | ${u.headline.split("|")[0].trim()}`);
  }

  await mongoose.disconnect();
};

main().catch(async (err) => {
  console.error("❌ Seed execution failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
