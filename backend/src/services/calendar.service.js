import CalendarEvent from "../models/calendarEvent.model.js";
import Task from "../models/task.model.js";
import Project from "../models/project.model.js";
import Team from "../models/team.model.js";

export const getUserCalendarEvents = async (userId, projectIdFilter = null) => {
  const query = { userId, status: "active" };
  if (projectIdFilter) {
    query.projectId = projectIdFilter;
  }
  const teams = await Team.find(query);
  const projectIds = teams.map((t) => t.projectId);

  // Tasks assigned to the user in these projects
  const tasks = await Task.find({
    projectId: { $in: projectIds },
    assignedTo: userId,
    dueDate: { $ne: null },
    isDeleted: false,
  }).populate("projectId", "title");

  // Project deadlines and timeline dates for these projects
  const projects = await Project.find({
    _id: { $in: projectIds },
  });

  // Calendar events for these projects
  const events = await CalendarEvent.find({
    project: { $in: projectIds },
  }).populate("project", "title");

  const unifiedEvents = [];

  tasks.forEach((task) => {
    unifiedEvents.push({
      id: task._id,
      source: "task",
      type: "task",
      title: task.title,
      date: task.dueDate,
      projectId: task.projectId._id,
      projectName: task.projectId.title,
      status: task.status,
    });
  });

  projects.forEach((project) => {
    if (project.projectDeadline) {
      unifiedEvents.push({
        id: `${project._id}-deadline`,
        source: "project",
        type: "project_deadline",
        title: `${project.title} Deadline`,
        date: project.projectDeadline,
        projectId: project._id,
        projectName: project.title,
      });
    }
    
    if (project.timeline && project.timeline.startDate) {
      unifiedEvents.push({
        id: `${project._id}-start`,
        source: "project",
        type: "project_start",
        title: `${project.title} Start`,
        date: project.timeline.startDate,
        projectId: project._id,
        projectName: project.title,
      });
    }

    if (project.timeline && project.timeline.endDate) {
      unifiedEvents.push({
        id: `${project._id}-end`,
        source: "project",
        type: "project_end",
        title: `${project.title} End`,
        date: project.timeline.endDate,
        projectId: project._id,
        projectName: project.title,
      });
    }
  });

  events.forEach((event) => {
    unifiedEvents.push({
      id: event._id,
      source: "calendar_event",
      type: event.type,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      allDay: event.allDay,
      projectId: event.project._id,
      projectName: event.project.title,
      linkedTask: event.linkedTask,
    });
  });

  return unifiedEvents;
};

export const createEvent = async (userId, eventData) => {
  // Add some basic validation. Is user in project?
  const team = await Team.findOne({ userId, projectId: eventData.project, status: "active" });
  if (!team) throw new Error("Not authorized for this project");

  const event = new CalendarEvent({
    ...eventData,
    createdBy: userId,
  });

  await event.save();
  return event;
};

export const updateEvent = async (userId, eventId, updateData) => {
  const event = await CalendarEvent.findById(eventId);
  if (!event) throw new Error("Event not found");

  const team = await Team.findOne({ userId, projectId: event.project, status: "active" });
  if (!team) throw new Error("Not authorized to update this event");

  Object.assign(event, updateData);
  await event.save();
  return event;
};

export const deleteEvent = async (userId, eventId) => {
  const event = await CalendarEvent.findById(eventId);
  if (!event) throw new Error("Event not found");

  const team = await Team.findOne({ userId, projectId: event.project, status: "active" });
  if (!team) throw new Error("Not authorized to delete this event");

  await event.deleteOne();
  return { success: true };
};
