// Offline Mock Database & API Router Engine for ProjectForge

const MOCK_STORAGE_KEY = "projectforge_offline_db_v1";
const TOKEN_KEY = "token";
const USER_ID_KEY = "userId";

// Initial seed data for UI designers & full offline demo
const INITIAL_SEED_DATA = {
  currentUser: {
    _id: "user-1",
    name: "Alex Morgan",
    email: "alex.morgan@designforge.io",
    role: "Lead UI/UX Designer & Design Systems Specialist",
    bio: "Passionate about crafts, micro-interactions, dark mode UIs, and building scalable component libraries.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    skills: ["UI/UX Design", "Figma", "Design Systems", "Tailwind CSS", "React", "Prototyping", "User Research"],
    githubUrl: "https://github.com",
    portfolioUrl: "https://dribbble.com",
    location: "San Francisco, CA",
    endorsements: [
      { endorsedBy: { name: "Sophia Lin" }, skill: "Design Systems", comment: "Alex creates the cleanest token architectures!" },
      { endorsedBy: { name: "David Chen" }, skill: "Figma", comment: "Incredible attention to detail in high-fidelity mocks." }
    ]
  },
  users: [
    {
      _id: "user-1",
      name: "Alex Morgan",
      email: "alex.morgan@designforge.io",
      role: "Lead UI/UX Designer",
      bio: "Crafting modern, accessible web interfaces and design tokens.",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      skills: ["UI/UX Design", "Figma", "Design Systems", "React"],
      githubUrl: "https://github.com",
      portfolioUrl: "https://dribbble.com",
      location: "San Francisco, CA"
    },
    {
      _id: "user-2",
      name: "David Chen",
      email: "david.c@dev.io",
      role: "Senior Frontend Engineer",
      bio: "Turning complex Figma specs into smooth React & Tailwind code.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
      skills: ["React", "TypeScript", "Tailwind CSS", "Next.js"],
      githubUrl: "https://github.com",
      location: "Seattle, WA"
    },
    {
      _id: "user-3",
      name: "Sophia Lin",
      email: "sophia.l@design.io",
      role: "Product Designer & Researcher",
      bio: "Focusing on user flow optimizations, design tokens, and usability testing.",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
      skills: ["User Research", "Wireframing", "Figma", "Design Systems"],
      location: "Austin, TX"
    }
  ],
  projects: [
    {
      _id: "proj-1",
      title: "Aura Design System 2.0",
      description: "A state-of-the-art, accessible design system featuring dark mode primitives, fluid typography, and glassmorphic micro-components for modern web applications.",
      category: "Design System",
      tags: ["UI/UX", "Design Tokens", "React", "TailwindCSS", "Figma"],
      owner: {
        _id: "user-1",
        name: "Alex Morgan",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
      },
      status: "active",
      techStack: ["React", "Tailwind CSS", "Figma Tokens", "Storybook", "TypeScript"],
      teamMembers: [
        { user: { _id: "user-1", name: "Alex Morgan", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80" }, role: "Design Lead" },
        { user: { _id: "user-2", name: "David Chen", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80" }, role: "Frontend Developer" },
        { user: { _id: "user-3", name: "Sophia Lin", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80" }, role: "UX Researcher" }
      ],
      openRoles: ["Motion Designer", "Accessibility Specialist", "Documentation Writer"],
      githubRepo: "https://github.com/designforge/aura-ds",
      githubStats: { stars: 142, forks: 28, openIssues: 4 },
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
    },
    {
      _id: "proj-2",
      title: "Nexus AI Studio Interface",
      description: "An intuitive web studio interface for prompt engineering, canvas-based workflows, and real-time visual node editing.",
      category: "AI & ML",
      tags: ["AI Interface", "Canvas UI", "React", "Node Editor"],
      owner: {
        _id: "user-2",
        name: "David Chen",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"
      },
      status: "active",
      techStack: ["React", "HTML5 Canvas", "Tailwind CSS", "Framer Motion"],
      teamMembers: [
        { user: { _id: "user-2", name: "David Chen", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80" }, role: "Lead Engineer" },
        { user: { _id: "user-1", name: "Alex Morgan", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80" }, role: "UI Designer" }
      ],
      openRoles: ["UI/UX Designer", "Canvas Architect"],
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
      _id: "proj-3",
      title: "FlowMobile Fintech Mobile Suite",
      description: "Next-gen personal finance UI dashboard featuring micro-charts, card customization, biometrics UI, and real-time budget tracking.",
      category: "Mobile UI",
      tags: ["Mobile", "Fintech", "Micro-interactions", "Figma"],
      owner: {
        _id: "user-3",
        name: "Sophia Lin",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80"
      },
      status: "active",
      techStack: ["React Native", "Figma", "Tailwind CSS", "Lottie"],
      teamMembers: [
        { user: { _id: "user-3", name: "Sophia Lin", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80" }, role: "Product Designer" }
      ],
      openRoles: ["Lead UI Designer", "Mobile React Engineer"],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ],
  tasks: [
    {
      _id: "task-101",
      projectId: "proj-1",
      title: "Design Token Architecture & Color Primitives",
      description: "Define semantic tokens for primary accent gradients, neutral zinc shades, and accessible contrast ratios.",
      status: "done",
      assignedTo: { _id: "user-1", name: "Alex Morgan" },
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      priority: "high"
    },
    {
      _id: "task-102",
      projectId: "proj-1",
      title: "Interactive Component Specs: Modal & Tooltip",
      description: "Build interactive state specs for hover, focus-visible, and glassmorphic backdrop filters.",
      status: "in-progress",
      assignedTo: { _id: "user-1", name: "Alex Morgan" },
      dueDate: new Date(Date.now() + 86400000 * 4).toISOString(),
      priority: "high"
    },
    {
      _id: "task-103",
      projectId: "proj-1",
      title: "Figma-to-Tailwind Token Exporter Engine",
      description: "Export variables directly into tailwind config format for instant frontend developer sync.",
      status: "todo",
      assignedTo: { _id: "user-2", name: "David Chen" },
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      priority: "medium"
    },
    {
      _id: "task-104",
      projectId: "proj-1",
      title: "Accessibility Audit & Contrast Validation",
      description: "Run WCAG 2.1 AA audit on all typography and button active states.",
      status: "in-review",
      assignedTo: { _id: "user-3", name: "Sophia Lin" },
      dueDate: new Date(Date.now() + 86400000 * 1).toISOString(),
      priority: "medium"
    }
  ],
  applications: [
    {
      _id: "app-1",
      projectId: "proj-1",
      project: { _id: "proj-1", title: "Aura Design System 2.0" },
      applicant: { _id: "user-3", name: "Sophia Lin", email: "sophia.l@design.io", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80" },
      message: "Hey Alex! I love Aura's token system and would love to contribute user testing specs and accessibility audits.",
      status: "accepted",
      projectRole: "UX Researcher",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      _id: "app-2",
      projectId: "proj-2",
      project: { _id: "proj-2", title: "Nexus AI Studio Interface" },
      applicant: { _id: "user-1", name: "Alex Morgan", email: "alex.morgan@designforge.io", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80" },
      message: "Hi David! I'm interested in designing the dark-mode node editor canvas UI for Nexus.",
      status: "pending",
      projectRole: "UI/UX Designer",
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
    }
  ],
  messages: [
    {
      _id: "msg-1",
      projectId: "proj-1",
      sender: { _id: "user-1", name: "Alex Morgan", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80" },
      content: "Welcome to Aura Design System workspace! Feel free to check out the Kanban board for task updates.",
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      _id: "msg-2",
      projectId: "proj-1",
      sender: { _id: "user-2", name: "David Chen", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80" },
      content: "The design tokens look incredibly sleek! I am syncing them into our Tailwind CSS configuration now.",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ],
  conversations: [
    {
      _id: "conv-1",
      participants: [
        { _id: "user-1", name: "Alex Morgan", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80" },
        { _id: "user-2", name: "David Chen", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80" }
      ],
      lastMessage: "I finished reviewing the interactive modal specifications!",
      updatedAt: new Date().toISOString()
    }
  ],
  directMessages: [
    {
      _id: "dm-1",
      conversationId: "conv-1",
      sender: { _id: "user-2", name: "David Chen" },
      content: "I finished reviewing the interactive modal specifications!",
      createdAt: new Date().toISOString()
    }
  ],
  notifications: [
    {
      _id: "notif-1",
      recipient: "user-1",
      title: "New Team Member Joined",
      message: "Sophia Lin joined your project 'Aura Design System 2.0' as UX Researcher.",
      read: false,
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
    },
    {
      _id: "notif-2",
      recipient: "user-1",
      title: "Task Moved to In Progress",
      message: "Task 'Interactive Component Specs' updated by Alex Morgan.",
      read: true,
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
    }
  ],
  skills: [
    "UI/UX Design", "Figma", "Design Systems", "Tailwind CSS", "React",
    "Framer Motion", "Micro-interactions", "User Research", "TypeScript",
    "Next.js", "Prototyping", "Design Tokens", "Wireframing", "Storybook"
  ]
};

// Helper: Read Database from LocalStorage
export const getOfflineDb = () => {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(INITIAL_SEED_DATA));
      if (!localStorage.getItem(TOKEN_KEY)) {
        localStorage.setItem(TOKEN_KEY, "offline-designer-jwt-token");
        localStorage.setItem(USER_ID_KEY, INITIAL_SEED_DATA.currentUser._id);
      }
      return INITIAL_SEED_DATA;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Offline DB read error:", err);
    return INITIAL_SEED_DATA;
  }
};

// Helper: Save Database to LocalStorage
export const saveOfflineDb = (db) => {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.error("Offline DB save error:", err);
  }
};

// Reset Database to Seed State
export const resetOfflineDb = () => {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(INITIAL_SEED_DATA));
  localStorage.setItem(TOKEN_KEY, "offline-designer-jwt-token");
  localStorage.setItem(USER_ID_KEY, INITIAL_SEED_DATA.currentUser._id);
  window.dispatchEvent(new CustomEvent("offline-db-updated"));
};

// Switch active demo user role
export const switchDemoUser = (userId) => {
  const db = getOfflineDb();
  const found = db.users.find((u) => u._id === userId);
  if (found) {
    db.currentUser = found;
    saveOfflineDb(db);
    localStorage.setItem(USER_ID_KEY, found._id);
    window.dispatchEvent(new CustomEvent("offline-user-switched", { detail: found }));
  }
};

// Helper: Format Mock Axios Response
const mockRes = (data, status = 200) => Promise.resolve({ data: { success: true, data }, status });

// Router Interceptor for Mock Calls
export const handleOfflineRequest = (config) => {
  const db = getOfflineDb();
  const url = config.url || "";
  const method = (config.method || "get").toLowerCase();
  const data = config.data ? (typeof config.data === "string" ? (function(){ try { return JSON.parse(config.data); } catch { return {}; } })() : config.data) : {};
  const params = config.params || {};

  console.log(`[Offline Mode] ${method.toUpperCase()} ${url}`, { params, data });

  // --- AUTH ROUTES ---
  if (url.includes("/auth/me") || url.includes("/users/me")) {
    return mockRes(db.currentUser);
  }

  if (url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/google")) {
    const user = db.currentUser;
    localStorage.setItem(TOKEN_KEY, "offline-designer-jwt-token");
    localStorage.setItem(USER_ID_KEY, user._id);
    return mockRes({ token: "offline-designer-jwt-token", user });
  }

  if (url.includes("/auth/forgot-password") || url.includes("/auth/reset-password")) {
    return mockRes({ message: "Password reset link sent (Offline Mode)" });
  }

  // --- USERS ROUTES ---
  if (url.includes("/users/search")) {
    const query = (params.q || "").toLowerCase();
    const matches = db.users.filter(u => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query) || (u.role && u.role.toLowerCase().includes(query)));
    return mockRes(matches);
  }

  if (url.includes("/users/me") && (method === "put" || method === "patch")) {
    Object.assign(db.currentUser, data);
    const idx = db.users.findIndex(u => u._id === db.currentUser._id);
    if (idx !== -1) db.users[idx] = db.currentUser;
    saveOfflineDb(db);
    return mockRes(db.currentUser);
  }

  const userMatch = url.match(/\/users\/([a-zA-Z0-9_-]+)/);
  if (userMatch && method === "get") {
    const targetId = userMatch[1];
    const user = db.users.find(u => u._id === targetId) || db.currentUser;
    return mockRes(user);
  }

  if (url.includes("/endorse")) {
    const targetId = url.split("/")[2];
    const user = db.users.find(u => u._id === targetId);
    if (user) {
      user.endorsements = user.endorsements || [];
      user.endorsements.push({ endorsedBy: { name: db.currentUser.name }, skill: data.skill || "UI Design", comment: data.comment || "Great work!" });
      saveOfflineDb(db);
    }
    return mockRes({ message: "Endorsed successfully" });
  }

  // --- PROJECTS ROUTES ---
  if (url.endsWith("/projects/") || url.endsWith("/projects") || url.includes("/projects?")) {
    if (method === "get") {
      let filtered = [...db.projects];
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q)));
      }
      if (params.category && params.category !== "All") {
        filtered = filtered.filter(p => p.category?.toLowerCase() === params.category.toLowerCase());
      }
      return mockRes({ projects: filtered, total: filtered.length, page: 1, pages: 1 });
    }
    if (method === "post") {
      const newProj = {
        _id: `proj-${Date.now()}`,
        title: data.title || "New Design Project",
        description: data.description || "Project created in offline mode.",
        category: data.category || "UI/UX",
        tags: data.tags || ["UI/UX", "Figma"],
        techStack: data.techStack || ["React", "Tailwind CSS"],
        owner: { _id: db.currentUser._id, name: db.currentUser.name, avatar: db.currentUser.avatar },
        teamMembers: [{ user: { _id: db.currentUser._id, name: db.currentUser.name, avatar: db.currentUser.avatar }, role: "Project Lead" }],
        openRoles: data.openRoles || ["UI Designer", "Frontend Dev"],
        status: "active",
        createdAt: new Date().toISOString()
      };
      db.projects.unshift(newProj);
      saveOfflineDb(db);
      window.dispatchEvent(new CustomEvent("offline-project-created", { detail: newProj }));
      return mockRes(newProj);
    }
  }

  if (url.includes("/projects/my")) {
    const myProjs = db.projects.filter(p => p.owner?._id === db.currentUser._id);
    return mockRes(myProjs);
  }

  if (url.includes("/projects/joined")) {
    const joined = db.projects.filter(p => p.teamMembers?.some(m => m.user?._id === db.currentUser._id));
    return mockRes(joined);
  }

  if (url.includes("/projects/recommendations")) {
    return mockRes(db.projects.slice(0, 3));
  }

  if (url.includes("/projects/github-stats")) {
    return mockRes({ stars: 142, forks: 28, openIssues: 4, lastCommit: "Just now" });
  }

  // --- TASKS & WORKSPACE ROUTES ---
  if (url.includes("/tasks")) {
    if (url.includes("/projects/") && method === "get") {
      const projId = url.split("/projects/")[1].split("/")[0];
      const tasks = db.tasks.filter(t => t.projectId === projId);
      return mockRes(tasks);
    }

    if (url.includes("/projects/") && method === "post") {
      const projId = url.split("/projects/")[1].split("/")[0];
      const newTask = {
        _id: `task-${Date.now()}`,
        projectId: projId,
        title: data.title || "New Task",
        description: data.description || "",
        status: data.status || "todo",
        assignedTo: data.assignedTo ? db.users.find(u => u._id === data.assignedTo) || db.currentUser : db.currentUser,
        dueDate: data.dueDate || new Date().toISOString(),
        priority: data.priority || "medium"
      };
      db.tasks.push(newTask);
      saveOfflineDb(db);
      window.dispatchEvent(new CustomEvent("offline-task-updated", { detail: newTask }));
      return mockRes(newTask);
    }

    if (method === "patch" && url.includes("/status")) {
      const taskId = url.split("/tasks/")[1].split("/")[0];
      const task = db.tasks.find(t => t._id === taskId);
      if (task) {
        task.status = data.status;
        saveOfflineDb(db);
        window.dispatchEvent(new CustomEvent("offline-task-updated", { detail: task }));
      }
      return mockRes(task);
    }

    if (method === "put" || method === "patch") {
      const taskId = url.split("/tasks/")[1].split("/")[0];
      const task = db.tasks.find(t => t._id === taskId);
      if (task) {
        Object.assign(task, data);
        saveOfflineDb(db);
        window.dispatchEvent(new CustomEvent("offline-task-updated", { detail: task }));
      }
      return mockRes(task);
    }

    if (method === "delete") {
      const taskId = url.split("/tasks/")[1];
      db.tasks = db.tasks.filter(t => t._id !== taskId);
      saveOfflineDb(db);
      return mockRes({ message: "Task deleted" });
    }
  }

  // --- PROJECT SPECIFIC DETAILS ---
  const projMatch = url.match(/\/projects\/([a-zA-Z0-9_-]+)/);
  if (projMatch && !url.includes("/applications") && !url.includes("/releases")) {
    const projId = projMatch[1];
    const project = db.projects.find(p => p._id === projId) || db.projects[0];

    if (method === "get") {
      return mockRes(project);
    }
    if (method === "put") {
      Object.assign(project, data);
      saveOfflineDb(db);
      return mockRes(project);
    }
    if (method === "patch" && url.includes("/archive")) {
      project.status = "archived";
      saveOfflineDb(db);
      return mockRes(project);
    }
    if (method === "patch" && url.includes("/leave")) {
      project.teamMembers = project.teamMembers.filter(m => m.user?._id !== db.currentUser._id);
      saveOfflineDb(db);
      return mockRes(project);
    }
  }

  // --- APPLICATIONS ROUTES ---
  if (url.includes("/applications")) {
    if (url.includes("/sent")) {
      const sent = db.applications.filter(a => a.applicant?._id === db.currentUser._id);
      return mockRes(sent);
    }
    if (url.includes("/received/")) {
      const projId = url.split("/received/")[1];
      const rec = db.applications.filter(a => a.projectId === projId);
      return mockRes(rec);
    }
    if (method === "post" && !url.includes("/invite")) {
      const proj = db.projects.find(p => p._id === data.projectId) || db.projects[0];
      const newApp = {
        _id: `app-${Date.now()}`,
        projectId: data.projectId,
        project: { _id: proj._id, title: proj.title },
        applicant: { _id: db.currentUser._id, name: db.currentUser.name, email: db.currentUser.email, avatar: db.currentUser.avatar },
        message: data.message || "I'd love to join!",
        status: "pending",
        createdAt: new Date().toISOString()
      };
      db.applications.push(newApp);
      saveOfflineDb(db);
      return mockRes(newApp);
    }
    if (url.includes("/accept")) {
      const appId = url.split("/applications/")[1].split("/")[0];
      const app = db.applications.find(a => a._id === appId);
      if (app) {
        app.status = "accepted";
        const proj = db.projects.find(p => p._id === app.projectId);
        if (proj && !proj.teamMembers.some(m => m.user?._id === app.applicant._id)) {
          proj.teamMembers.push({ user: app.applicant, role: data.projectRole || "Team Member" });
        }
        saveOfflineDb(db);
      }
      return mockRes(app);
    }
    if (url.includes("/reject")) {
      const appId = url.split("/applications/")[1].split("/")[0];
      const app = db.applications.find(a => a._id === appId);
      if (app) app.status = "rejected";
      saveOfflineDb(db);
      return mockRes(app);
    }
  }

  // --- MESSAGES & CHAT ROUTES ---
  if (url.includes("/messages/projects/")) {
    const projId = url.split("/messages/projects/")[1];
    if (method === "get") {
      const msgs = db.messages.filter(m => m.projectId === projId);
      return mockRes(msgs);
    }
  }

  if (url.includes("/direct-messages/conversations")) {
    if (method === "get" && !url.includes("/conversations/")) {
      return mockRes(db.conversations);
    }
    if (url.includes("/message") && method === "post") {
      const convId = url.split("/conversations/")[1].split("/")[0];
      const newDm = {
        _id: `dm-${Date.now()}`,
        conversationId: convId,
        sender: { _id: db.currentUser._id, name: db.currentUser.name, avatar: db.currentUser.avatar },
        content: data.content || "",
        createdAt: new Date().toISOString()
      };
      db.directMessages.push(newDm);
      const conv = db.conversations.find(c => c._id === convId);
      if (conv) conv.lastMessage = data.content;
      saveOfflineDb(db);
      window.dispatchEvent(new CustomEvent("offline-dm-sent", { detail: newDm }));
      return mockRes(newDm);
    }
    if (method === "get") {
      const convId = url.split("/conversations/")[1];
      const dms = db.directMessages.filter(m => m.conversationId === convId);
      return mockRes(dms);
    }
  }

  // --- NOTIFICATIONS & ANALYTICS ROUTES ---
  if (url.includes("/notifications")) {
    if (url.includes("/unread-count")) {
      const count = db.notifications.filter(n => n.recipient === db.currentUser._id && !n.read).length;
      return mockRes({ count });
    }
    if (method === "get") {
      return mockRes(db.notifications);
    }
    if (url.includes("/read-all")) {
      db.notifications.forEach(n => n.read = true);
      saveOfflineDb(db);
      return mockRes({ success: true });
    }
  }

  if (url.includes("/analytics")) {
    return mockRes({
      totalTasks: db.tasks.length,
      completedTasks: db.tasks.filter(t => t.status === "done").length,
      activeMembers: db.users.length,
      progressPercentage: 75,
      activity: [
        { day: "Mon", commits: 4, tasks: 2 },
        { day: "Tue", commits: 8, tasks: 5 },
        { day: "Wed", commits: 6, tasks: 3 },
        { day: "Thu", commits: 12, tasks: 7 },
        { day: "Fri", commits: 9, tasks: 4 }
      ]
    });
  }

  // --- AI GENERATOR ---
  if (url.includes("/ai/generate")) {
    const type = data.type;
    let mockContent = "AI Generated Design Brief:\n\n- Primary Goal: Streamline component workflow\n- Target Audience: Product Designers & Developers\n- Recommended Color Tokens: #09090b, #6366f1, #10b981\n- Key Micro-interactions: Fluid spring animations on modal toggle.";
    if (type === "tasks") {
      mockContent = "1. Setup Figma Tokens in JSON format\n2. Create React button variants (Primary, Secondary, Ghost)\n3. Conduct WCAG Accessibility audit\n4. Publish Storybook documentation site";
    }
    return mockRes({ generatedText: mockContent, result: mockContent });
  }

  // --- SKILLS & UPLOADS ---
  if (url.includes("/skills")) {
    return mockRes(db.skills);
  }

  if (url.includes("/upload")) {
    return mockRes({ url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80" });
  }

  // Default fallback response for any unhandled routes
  return mockRes({});
};
