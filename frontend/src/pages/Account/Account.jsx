import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Spinner from "../../components/common/Spinner";
import { searchSkills } from "../../api/skillApi";
import { getMyProfile, updateMyProfile } from "../../api/userApi";
import { displaySkillLabel } from "../../utils/display";
import "./Account.css";

const normalizeLinks = (links) => {
  const obj = links && typeof links === "object" ? links : {};
  return {
    github: typeof obj.github === "string" ? obj.github : "",
    linkedin: typeof obj.linkedin === "string" ? obj.linkedin : "",
    website: typeof obj.website === "string" ? obj.website : "",
  };
};

const formFingerprint = (form) => {
  const skills = Array.isArray(form?.skills) ? form.skills : [];
  const skillIds = skills
    .map((s) => (typeof s === "string" ? s : s?._id))
    .filter(Boolean)
    .map(String)
    .sort();

  const links = normalizeLinks(form?.portfolioLinks);

  return JSON.stringify({
    name: String(form?.name || ""),
    bio: String(form?.bio || ""),
    availabilityHoursPerWeek: Number(form?.availabilityHoursPerWeek || 0),
    portfolioLinks: {
      github: links.github,
      linkedin: links.linkedin,
      website: links.website,
    },
    skills: skillIds,
  });
};

export default function Account() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    name: "",
    bio: "",
    availabilityHoursPerWeek: 0,
    portfolioLinks: { github: "", linkedin: "", website: "" },
    skills: [],
  });

  // Skill picker
  const [skillInput, setSkillInput] = useState("");
  const [skillResults, setSkillResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchTimerRef = useRef(null);
  const baselineRef = useRef("");

  const selectedSkillIds = useMemo(() => {
    return new Set(
      (form.skills || [])
        .map((s) => (typeof s === "string" ? s : s?._id))
        .filter(Boolean)
        .map(String)
    );
  }, [form.skills]);

  const isDirty = useMemo(() => {
    return baselineRef.current !== "" && formFingerprint(form) !== baselineRef.current;
  }, [form]);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyProfile();
      const me = res.data?.data?.user ?? null;
      setUser(me);

      const nextForm = {
        name: me?.name || "",
        bio: me?.bio || "",
        availabilityHoursPerWeek: Number(me?.availabilityHoursPerWeek || 0),
        portfolioLinks: normalizeLinks(me?.portfolioLinks),
        skills: Array.isArray(me?.skills) ? me.skills : [],
      };

      setForm(nextForm);
      baselineRef.current = formFingerprint(nextForm);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load account");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Warn on reload/close if there are unsaved changes.
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e) => {
      e.preventDefault();
      // Most browsers ignore custom text but require returnValue to show a prompt.
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  useEffect(() => {
    const q = skillInput.trim();
    if (!q) {
      setSkillResults([]);
      return;
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchSkills(q);
        const list = res.data?.data?.skills ?? [];
        setSkillResults(Array.isArray(list) ? list : []);
      } catch {
        setSkillResults([]);
      }
    }, 200);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [skillInput]);

  const addSkill = (skill) => {
    const id = skill?._id;
    const name = skill?.name;
    if (!id || !name) return;
    if (selectedSkillIds.has(String(id))) return;

    setForm((prev) => ({
      ...prev,
      skills: [...(prev.skills || []), { _id: id, name }],
    }));

    setSkillInput("");
    setShowResults(false);
  };

  const removeSkill = (skill) => {
    const removeId = typeof skill === "string" ? skill : skill?._id;
    setForm((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((s) => {
        const id = typeof s === "string" ? s : s?._id;
        return String(id) !== String(removeId);
      }),
    }));
  };

  const onSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      const skillIds = (form.skills || [])
        .map((s) => (typeof s === "string" ? s : s?._id))
        .filter(Boolean);

      const payload = {
        name: form.name.trim(),
        bio: form.bio || "",
        availabilityHoursPerWeek: Number(form.availabilityHoursPerWeek || 0),
        portfolioLinks: normalizeLinks(form.portfolioLinks),
        skills: skillIds,
      };

      const res = await updateMyProfile(payload);
      const updated = res.data?.data?.user;
      setUser(updated || user);
      if (updated) {
        const nextForm = {
          name: updated?.name || "",
          bio: updated?.bio || "",
          availabilityHoursPerWeek: Number(updated?.availabilityHoursPerWeek || 0),
          portfolioLinks: normalizeLinks(updated?.portfolioLinks),
          skills: Array.isArray(updated?.skills) ? updated.skills : [],
        };
        setForm(nextForm);
        baselineRef.current = formFingerprint(nextForm);
      } else {
        baselineRef.current = formFingerprint(form);
      }
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="project-detail__loading">
        <Spinner size="lg" />
        <p className="project-detail__loading-text">Loading account...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="account">
        <div className="account__header">
          <div>
            <h1 className="account__title">Account</h1>
            <p className="account__subtitle">Unable to load your profile.</p>
          </div>
          <div className="account__actions">
            <Button variant="outline" onClick={fetchProfile}>Refresh</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="account">
      <div className="account__header">
        <div>
          <h1 className="account__title">Account</h1>
          <p className="account__subtitle">
            Update your profile details used for applications and team workspaces.
          </p>
        </div>
          <div className="account__actions">
            <Button
              variant="ghost"
              onClick={() => {
                if (isDirty && !window.confirm("You have unsaved changes. Discard them?")) return;
                fetchProfile();
              }}
              disabled={saving}
            >
              Reset
            </Button>
            <Button variant="primary" onClick={onSave} loading={saving}>
              Save Changes
            </Button>
          </div>
        </div>

      <div className="account__grid">
        <div className="account__card">
          <div className="account__card-title">Profile</div>

          <div className="account__section">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Your name"
            />
          </div>

          <div className="account__section">
            <div className="input__label">Bio</div>
            <textarea
              className="account__skill-input"
              style={{ minHeight: 110, resize: "vertical" }}
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="A short intro (what you like building, what you can contribute...)"
            />
          </div>

          <div className="account__section">
            <Input
              label="Availability (hours/week)"
              type="number"
              min="0"
              value={form.availabilityHoursPerWeek}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  availabilityHoursPerWeek: e.target.value,
                }))
              }
              placeholder="0"
            />
            <div className="account__muted">Used for matching and team planning.</div>
          </div>

          <div className="account__section">
            <div className="account__card-title" style={{ marginBottom: 10 }}>
              Skills
            </div>

            <div className="account__skill-search">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => {
                  const next = e.target.value;
                  setSkillInput(next);
                  if (!next.trim()) setSkillResults([]);
                }}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 120)}
                placeholder="Search skills..."
                className="account__skill-input"
              />
              <Button
                variant="outline"
                onClick={() => {
                  const exact = skillResults.find(
                    (s) => (s?.name || "").toLowerCase() === skillInput.trim().toLowerCase()
                  );
                  if (exact) addSkill(exact);
                }}
              >
                Add
              </Button>
            </div>

            {showResults && skillResults.length > 0 && (
              <div className="account__results">
                {skillResults.slice(0, 8).map((s) => (
                  <button
                    key={s._id}
                    type="button"
                    className="account__result"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addSkill(s);
                    }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}

            <div className="account__skills">
              {(form.skills || []).length === 0 ? (
                <span className="account__muted">No skills added yet.</span>
              ) : (
                (form.skills || []).map((s) => (
                  <Badge
                    key={typeof s === "string" ? s : s?._id}
                    variant="skill"
                    className="badge--clickable"
                  >
                    {displaySkillLabel(s)}
                    <button onClick={() => removeSkill(s)} className="badge__remove">
                      ×
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div className="account__section">
            <div className="account__card-title" style={{ marginBottom: 10 }}>
              Portfolio Links
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              <Input
                label="GitHub"
                value={form.portfolioLinks.github}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    portfolioLinks: { ...p.portfolioLinks, github: e.target.value },
                  }))
                }
                placeholder="https://github.com/username"
              />
              <Input
                label="LinkedIn"
                value={form.portfolioLinks.linkedin}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    portfolioLinks: { ...p.portfolioLinks, linkedin: e.target.value },
                  }))
                }
                placeholder="https://linkedin.com/in/username"
              />
              <Input
                label="Website"
                value={form.portfolioLinks.website}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    portfolioLinks: { ...p.portfolioLinks, website: e.target.value },
                  }))
                }
                placeholder="https://your-site.com"
              />
            </div>
          </div>
        </div>

        <div className="account__card">
          <div className="account__card-title">Account Details</div>

          <div className="account__section">
            <div className="account__muted">Email</div>
            <div style={{ marginTop: 6, fontWeight: 800, color: "rgba(255,255,255,0.9)" }}>
              {user.email || "-"}
            </div>
          </div>

          <div className="account__section">
            <div className="account__muted">Member Since</div>
            <div style={{ marginTop: 6, fontWeight: 800, color: "rgba(255,255,255,0.9)" }}>
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
            </div>
          </div>

          <div className="account__section">
            <div className="account__card-title" style={{ marginBottom: 10 }}>
              Stats
            </div>
            <div className="account__kv">
              <div className="account__kvi">
                <div className="account__kvi-label">Projects Active</div>
                <div className="account__kvi-value">{user?.stats?.projectsActive ?? 0}</div>
              </div>
              <div className="account__kvi">
                <div className="account__kvi-label">Projects Completed</div>
                <div className="account__kvi-value">{user?.stats?.projectsCompleted ?? 0}</div>
              </div>
              <div className="account__kvi">
                <div className="account__kvi-label">Tasks Completed</div>
                <div className="account__kvi-value">{user?.stats?.tasksCompleted ?? 0}</div>
              </div>
              <div className="account__kvi">
                <div className="account__kvi-label">Applications Sent</div>
                <div className="account__kvi-value">{user?.stats?.applicationsSent ?? 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
