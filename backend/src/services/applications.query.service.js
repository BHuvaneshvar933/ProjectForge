import Application from "../models/application.model.js";
import Project from "../models/project.model.js";

export const getMyApplications = async (userId, query) => {
  const { page = 1, limit = 10, status } = query;

  const skip = (page - 1) * limit;

  const filter = {
    applicantId: userId,
    isDeleted: false
  };
  
  if (status && status !== 'all') {
    filter.status = status;
  }

  const applications = await Application.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate({
      path: "projectId",
      select: "title status",
      populate: {
        path: "owner",
        select: "name"
      }
    })
    .populate("invitedBy", "name");

  const total = await Application.countDocuments(filter);

  return {
    applications,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getProjectApplications = async (userId, projectId, query) => {
  const { page = 1, limit = 10, status } = query;

  const project = await Project.findById(projectId);

  if (!project || project.isDeleted) {
    throw new Error("Project not found");
  }

  if (project.owner.toString() !== userId.toString()) {
    throw new Error("Not authorized");
  }

  const skip = (page - 1) * limit;

  const filter = {
    projectId,
    isDeleted: false
  };
  
  if (status && status !== 'all') {
    filter.status = status;
  }

  const applications = await Application.find(filter)
    .sort({ matchScore: -1, createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
      .populate({
        path: "applicantId",
        select: "name email bio skills stats availabilityHoursPerWeek portfolioLinks createdAt reliability",
        populate: {
          path: "skills",
          select: "name"
        }
      });

  const total = await Application.countDocuments(filter);

  // Sanitize reliability
  const sanitizedApplications = applications.map(app => {
    const appObj = app.toObject();
    if (appObj.applicantId && appObj.applicantId.reliability) {
      if (appObj.applicantId.reliability.status === "RELIABLE") {
        appObj.applicantId.reliability = {
          status: "RELIABLE",
          label: "Reliable Collaborator"
        };
      } else {
        appObj.applicantId.reliability = {
          status: "DEVELOPING",
          label: "Reliability history developing"
        };
      }
    }
    return appObj;
  });

  return {
    applications: sanitizedApplications,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};
