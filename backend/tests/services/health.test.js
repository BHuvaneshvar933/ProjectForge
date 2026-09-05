import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { calculateProjectHealth } from "../../src/services/projectHealth.service.js";

describe("Project Health Score Service", () => {
  const mockNow = new Date("2026-09-05T12:00:00Z").getTime();
  
  const setupMocks = () => {
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  };

  const teardownMocks = () => {
    vi.useRealTimers();
  };

  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    teardownMocks();
  });

  const createProject = (ageDays) => ({
    createdAt: new Date(mockNow - ageDays * 24 * 60 * 60 * 1000).toISOString()
  });

  const createTask = (status, daysSinceUpdate, daysUntilDue = null, assignedTo = "u1") => {
    const task = {
      status,
      updatedAt: new Date(mockNow - daysSinceUpdate * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(mockNow - daysSinceUpdate * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo
    };
    if (daysUntilDue !== null) {
      task.dueDate = new Date(mockNow + daysUntilDue * 24 * 60 * 60 * 1000).toISOString();
    }
    return task;
  };

  const createTeam = (count) => {
    return Array(count).fill(0).map((_, i) => ({ status: "active", userId: `u${i+1}` }));
  };

  // 1. Zero-task project
  it("should return Insufficient Data for zero tasks", () => {
    const result = calculateProjectHealth(createProject(10), [], createTeam(1));
    expect(result.status).toBe("Insufficient Data");
    expect(result.score).toBeNull();
    expect(result.confidence).toBe("low");
  });

  // 2. One healthy completed task
  it("should handle a tiny project with 1 completed task", () => {
    const tasks = [createTask("done", 1)];
    const result = calculateProjectHealth(createProject(10), tasks, createTeam(1));
    expect(result.dimensions.progress.score).toBe(35);
    expect(result.score).toBeGreaterThanOrEqual(70); 
    expect(result.confidence).toBe("low"); // Tiny project = low confidence
  });

  // 3. One overdue incomplete task (regression test)
  it("should handle a tiny project with 1 overdue task", () => {
    const tasks = [createTask("todo", 1, -2)]; // Overdue by 2 days
    const result = calculateProjectHealth(createProject(10), tasks, createTeam(1));
    expect(result.dimensions.progress.score).toBe(0);
    expect(result.dimensions.schedule.score).toBe(0);
    expect(result.score).toBeLessThan(50); 
    expect(result.confidence).toBe("low"); 
  });

  // 4. Multiple healthy tasks
  it("should return a high score for mature project with multiple healthy tasks", () => {
    const tasks = [
      createTask("done", 2, -5),
      createTask("done", 5, 2),
      createTask("in-progress", 1, 5),
      createTask("todo", 1, 10),
      createTask("done", 1, -1)
    ];
    // 3 done / 5 total = 60% completion -> 22 points
    // 0 overdue out of 5 -> 30 points
    // strong activity -> 20 points
    // active contributors = 1, team = 1 -> 15 points
    const result = calculateProjectHealth(createProject(30), tasks, createTeam(1));
    expect(result.score).toBe(87);
    expect(result.status).toBe("Excellent");
    expect(result.confidence).toBe("high");
  });

  // 5. Multiple overdue tasks
  it("should return a low score for mature project with multiple overdue tasks", () => {
    const tasks = [
      createTask("todo", 10, -5),
      createTask("in-progress", 10, -2),
      createTask("todo", 1, -1),
      createTask("done", 20, -10)
    ];
    // 1 done / 4 total = 25% -> 14 progress points
    // 3 overdue out of 4 -> 75% -> 0 schedule points
    // 1 recent task -> low activity -> 7 points
    // 1 active contributor -> 15 engagement points
    const result = calculateProjectHealth(createProject(30), tasks, createTeam(1));
    expect(result.score).toBe(49);
    expect(result.status).toBe("At Risk");
  });

  // 6. New project with little activity
  it("should mark new project as provisional", () => {
    const tasks = [createTask("todo", 1, 5)];
    const result = calculateProjectHealth(createProject(2), tasks, createTeam(1));
    expect(result.isProvisional).toBe(true);
    expect(result.confidence).toBe("low");
  });

  // 7. Mature inactive project
  it("should punish mature projects with no recent activity", () => {
    const tasks = [createTask("todo", 20, 5)];
    const result = calculateProjectHealth(createProject(60), tasks, createTeam(1));
    expect(result.dimensions.activity.score).toBe(0);
    expect(result.dimensions.engagement.score).toBe(0); // No recent tasks = no recent contributors
  });

  // 8. Strong team participation
  it("should reward strong team participation", () => {
    const tasks = [
      createTask("done", 1, 5, "u1"),
      createTask("done", 1, 5, "u2"),
      createTask("done", 1, 5, "u3")
    ];
    const team = createTeam(3);
    const result = calculateProjectHealth(createProject(30), tasks, team);
    expect(result.dimensions.engagement.score).toBe(15);
  });

  // 9. Weak team participation
  it("should punish weak team participation", () => {
    const tasks = [
      createTask("done", 1, 5, "u1"),
      createTask("done", 1, 5, "u1"),
      createTask("done", 1, 5, "u1")
    ];
    const team = createTeam(4);
    const result = calculateProjectHealth(createProject(30), tasks, team);
    // 1 out of 4 active -> 25%
    expect(result.dimensions.engagement.score).toBe(4);
  });

  // 10. No deadlines
  it("should handle projects with no deadlines gracefully but with lower confidence", () => {
    const tasks = [
      createTask("done", 1, null),
      createTask("todo", 1, null),
      createTask("todo", 1, null),
      createTask("todo", 1, null),
      createTask("todo", 1, null)
    ];
    const result = calculateProjectHealth(createProject(30), tasks, createTeam(1));
    expect(result.dimensions.schedule.score).toBe(15); // Neutral
    expect(result.confidence).toBe("low"); // Missing critical schedule data
  });
});
