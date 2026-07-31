import ProjectFile from "../models/projectFile.model.js";
import Message from "../models/message.model.js";
import Task from "../models/task.model.js";
import Project from "../models/project.model.js";

export const getProjectFiles = async (projectId, userId) => {
  // Ensure project exists and user has access
  const project = await Project.findById(projectId);
  if (!project) {
    const err = new Error("Project not found");
    err.statusCode = 404;
    throw err;
  }
  
  // Scrape manual uploads
  const manualFiles = await ProjectFile.find({ projectId }).populate("uploaderId", "name avatar");
  
  // Scrape chat attachments
  const messagesWithAttachments = await Message.find({ 
    projectId, 
    "attachments.0": { $exists: true } 
  }).populate("senderId", "name avatar");
  
  // Scrape task attachments
  const tasksWithAttachments = await Task.find({ 
    projectId, 
    attachmentUrl: { $ne: "" },
    attachmentUrl: { $exists: true }
  }).populate("assignedTo", "name avatar");
  
  // Format them into a unified list
  const files = [];
  
  manualFiles.forEach(f => {
    files.push({
      _id: f._id,
      url: f.url,
      filename: f.originalName,
      mimetype: f.mimetype,
      size: f.size,
      source: "manual",
      uploadedBy: f.uploaderId,
      createdAt: f.createdAt,
    });
  });
  
  messagesWithAttachments.forEach(m => {
    m.attachments.forEach(a => {
      files.push({
        _id: `${m._id}-${a.filename}`,
        url: a.url,
        filename: a.filename,
        mimetype: a.mimetype,
        size: a.size,
        source: "chat",
        uploadedBy: m.senderId,
        createdAt: m.createdAt,
        relatedId: m._id
      });
    });
  });
  
  tasksWithAttachments.forEach(t => {
    files.push({
      _id: `task-${t._id}`,
      url: t.attachmentUrl,
      filename: t.attachmentName || "Attached File",
      mimetype: "unknown",
      size: 0,
      source: "task",
      uploadedBy: t.assignedTo,
      createdAt: t.updatedAt,
      relatedId: t._id,
      taskKey: t.taskNumber // Optional: include task number for reference
    });
  });
  
  // Sort descending by creation date
  files.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return files;
};

export const addProjectFile = async (projectId, userId, fileData) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const err = new Error("Project not found");
    err.statusCode = 404;
    throw err;
  }
  
  const newFile = await ProjectFile.create({
    projectId,
    uploaderId: userId,
    url: fileData.url,
    originalName: fileData.filename,
    mimetype: fileData.mimetype,
    size: fileData.size
  });
  
  return newFile;
};
