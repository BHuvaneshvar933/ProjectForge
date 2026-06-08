import Project from "../models/project.model.js";
import Team from "../models/team.model.js";

export const startOfDayUtc = (d) => {
  const dt = new Date(d);
  dt.setUTCHours(0, 0, 0, 0);
  return dt;
};

export const addDaysUtc = (d, days) => {
  const dt = new Date(d);
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt;
};

export const parseDays = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(90, n));
};

export const dailySeries = async ({ model, from, to, extraMatch = {} }) => {
  const rows = await model
    .aggregate([
      {
        $match: {
          ...extraMatch,
          createdAt: { $gte: from, $lt: to },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])
    .exec();

  const map = new Map(rows.map((r) => [r._id, r.count]));
  const out = [];

  for (let cur = new Date(from); cur < to; cur = addDaysUtc(cur, 1)) {
    const key = cur.toISOString().slice(0, 10);
    out.push({ date: key, count: map.get(key) || 0 });
  }

  return out;
};

export const ensureProjectMemberOrOwner = async ({ projectId, requesterId }) => {
  const project = await Project.findOne({ _id: projectId, isDeleted: false })
    .select("owner")
    .lean();

  if (!project) {
    throw new Error("Project not found");
  }

  const isOwner = project.owner?.toString() === requesterId?.toString();
  if (isOwner) return { project, isOwner: true };

  const membership = await Team.findOne({
    projectId,
    userId: requesterId,
    status: "active",
    isDeleted: false,
  })
    .select("_id")
    .lean();

  if (!membership) {
    throw new Error("Not authorized");
  }

  return { project, isOwner: false };
};
