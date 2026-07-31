import { useState, useRef, useEffect, useMemo } from "react";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import Badge from "../../../components/common/Badge";
import { searchSkills } from "../../../api/skillApi";
import { displaySkillLabel } from "../../../utils/display";
import EducationalTip from "../../../components/common/EducationalTip";

export default function AccountProfile({ form, setForm }) {
  const [skillInput, setSkillInput] = useState("");
  const [skillResults, setSkillResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchTimerRef = useRef(null);

  const selectedSkillIds = useMemo(() => {
    return new Set(
      (form.skills || [])
        .map((s) => (typeof s === "string" ? s : s?._id))
        .filter(Boolean)
        .map(String)
    );
  }, [form.skills]);

  useEffect(() => {
    const q = skillInput.trim();
    if (!q) {
      setTimeout(() => setSkillResults([]), 0);
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

  return (
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
        <EducationalTip content="Recruiters and potential teammates will check your GitHub and LinkedIn. Make sure your links are up to date." />
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
  );
}
