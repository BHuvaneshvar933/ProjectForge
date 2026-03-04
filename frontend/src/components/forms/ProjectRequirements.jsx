import { useEffect, useMemo, useRef, useState } from 'react';
import Input from '../common/Input';
import Badge from '../common/Badge';
import { searchSkills } from '../../api/skillApi';
import './ProjectRequirements.css';

export default function ProjectRequirements({ data, updateData, errors }) {
  const [skillInput, setSkillInput] = useState('');
  const [roleInput, setRoleInput] = useState('');
  const [skillResults, setSkillResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchTimerRef = useRef(null);

  const selectedSkills = useMemo(() => {
    return Array.isArray(data.requiredSkills) ? data.requiredSkills : [];
  }, [data.requiredSkills]);

  const selectedSkillIds = useMemo(() => {
    return new Set(
      selectedSkills
        .map((s) => (typeof s === 'string' ? s : s?._id))
        .filter(Boolean)
    );
  }, [selectedSkills]);

  useEffect(() => {
    const q = skillInput.trim();
    if (!q) {
      return;
    }

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchSkills(q);
        const list = res.data?.data?.skills ?? [];
        setSkillResults(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error('Skill search failed', e);
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
    if (!id || !name) {
      setSkillInput('');
      setShowResults(false);
      return;
    }

    if (!selectedSkillIds.has(id)) {
      updateData({ requiredSkills: [...selectedSkills, { _id: id, name }] });
    }
    setSkillInput('');
    setShowResults(false);
  };

  const removeSkill = (skill) => {
    const removeId = typeof skill === 'string' ? skill : skill?._id;
    updateData({
      requiredSkills: selectedSkills.filter((s) => {
        const id = typeof s === 'string' ? s : s?._id;
        return id !== removeId;
      }),
    });
  };

  const addRole = () => {
    if (roleInput.trim() && !data.openRoles.includes(roleInput.trim())) {
      updateData({ openRoles: [...data.openRoles, roleInput.trim()] });
    }
    setRoleInput('');
  };

  const removeRole = (role) => {
    updateData({ openRoles: data.openRoles.filter(r => r !== role) });
  };

  return (
    <div className="project-req">
      {/* Skills Multi-select */}
      <div className="project-req__section">
        <label className="project-req__label">Required Skills</label>
        <div className="project-req__field">
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
            className="project-req__input"
          />
          {showResults && skillResults.length > 0 && (
            <div className="project-req__results">
              {skillResults.slice(0, 8).map((s) => (
                <button
                  key={s._id}
                  type="button"
                  className="project-req__result"
                  onClick={() => addSkill(s)}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              const exact = skillResults.find(
                (s) => (s?.name || '').toLowerCase() === skillInput.trim().toLowerCase()
              );
              if (exact) addSkill(exact);
            }}
            className="project-req__add"
          >
            Add
          </button>
        </div>
        
        {/* Selected Skills */}
        {selectedSkills.length > 0 && (
          <div className="project-req__tags">
            {selectedSkills.map((skill) => (
              <Badge
                key={typeof skill === 'string' ? skill : skill?._id}
                variant="skill"
                className="badge--clickable"
              >
                {typeof skill === 'string' ? skill : skill?.name}
                <button
                  onClick={() => removeSkill(skill)}
                  className="badge__remove"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
        {errors.requiredSkills && (
          <p className="project-req__error">{errors.requiredSkills}</p>
        )}
      </div>

      {/* Team Size */}
      <Input
        label="TEAM SIZE"
        type="number"
        min="2"
        value={data.teamSizeRequired}
        onChange={(e) => updateData({ teamSizeRequired: parseInt(e.target.value) })}
        error={errors.teamSizeRequired}
      />

      {/* Timeline */}
      <div className="project-req__section">
        <label className="project-req__label">Timeline</label>
        <div className="project-req__grid">
          <Input
            label=""
            type="date"
            value={data.timeline.startDate}
            onChange={(e) => updateData({ 
              timeline: { ...data.timeline, startDate: e.target.value } 
            })}
            placeholder="Start date"
          />
          <Input
            label=""
            type="date"
            value={data.timeline.endDate}
            onChange={(e) => updateData({ 
              timeline: { ...data.timeline, endDate: e.target.value } 
            })}
            placeholder="End date"
          />
        </div>
        {errors.timeline && (
          <p className="project-req__error">{errors.timeline}</p>
        )}
      </div>

      {/* Open Roles */}
      <div className="project-req__section">
        <label className="project-req__label">Open Roles</label>
        <div className="project-req__roles">
          <input
            type="text"
            value={roleInput}
            onChange={(e) => setRoleInput(e.target.value)}
            placeholder="e.g., Backend Developer"
            className="project-req__input"
          />
          <button
            type="button"
            onClick={addRole}
            className="project-req__add project-req__add--inline"
          >
            Add
          </button>
        </div>
        
        {data.openRoles.length > 0 && (
          <div className="project-req__tags">
            {data.openRoles.map(role => (
              <Badge key={role} variant="skill" className="badge--clickable">
                {role}
                <button
                  onClick={() => removeRole(role)}
                  className="badge__remove"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
        {errors.openRoles && (
          <p className="project-req__error">{errors.openRoles}</p>
        )}
      </div>

      {/* Owner Role */}
      <Input
        label="YOUR ROLE"
        value={data.ownerRole}
        onChange={(e) => updateData({ ownerRole: e.target.value })}
        placeholder="e.g., Project Lead, Frontend Developer"
      />
    </div>
  );
}
