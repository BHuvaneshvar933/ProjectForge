export const normalizeProjectRole = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 50) return null;
  return trimmed;
};

export const calculateMatchScore = (user, project) => {
  let matchScore = 0;

  if (user.skills && project.requiredSkills) {
    const userSet = new Set(
        user.skills.map(s => s.toString().trim().toLowerCase())
    );

    const projectSet = new Set(
        project.requiredSkills.map(s => s.toString().trim().toLowerCase())
    );

    const intersection = [...userSet].filter(
        skill => projectSet.has(skill)
    ).length;

    const denominator = projectSet.size;

    matchScore = denominator > 0 ? Math.round((intersection / denominator) * 100) : 0;
  }

  return matchScore;
};

export const pickAssignedRole = ({ preferredRole, invitedRole, project }) => {
  const normalizedPreferred = normalizeProjectRole(preferredRole);
  const normalizedInvited = normalizeProjectRole(invitedRole);
  const openRoles = Array.isArray(project.openRoles) ? [...project.openRoles] : [];

  let assignedRole = normalizedPreferred || normalizedInvited || null;

  if (assignedRole) {
    const idx = openRoles.findIndex((r) => String(r).trim().toLowerCase() === assignedRole.toLowerCase());
    if (idx >= 0) {
      assignedRole = normalizeProjectRole(openRoles[idx]) || assignedRole;
      openRoles.splice(idx, 1);
    }
  }

  if (!assignedRole && openRoles.length > 0) {
    assignedRole = normalizeProjectRole(openRoles.shift());
  }

  project.openRoles = openRoles;
  return assignedRole || "Member";
};
