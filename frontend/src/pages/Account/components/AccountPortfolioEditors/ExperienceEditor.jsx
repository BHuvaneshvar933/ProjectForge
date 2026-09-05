import React from 'react';
import Button from "../../../../components/common/Button";
import Input from "../../../../components/common/Input";

export default function ExperienceEditor({ form, setForm }) {
  const experience = form.experience || [];

  const addExperience = () => {
    setForm(p => ({
      ...p,
      experience: [...p.experience, {
        role: '', organization: '', startDate: '', endDate: '', description: ''
      }]
    }));
  };

  const updateExperience = (index, field, value) => {
    const newExp = [...experience];
    newExp[index][field] = value;
    setForm(p => ({ ...p, experience: newExp }));
  };

  const removeExperience = (index) => {
    setForm(p => ({
      ...p,
      experience: experience.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="account__section">
      <div className="account__card-title" style={{ marginBottom: 16 }}>Experience</div>
      {experience.length === 0 ? (
        <p className="account__muted">No experience added yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {experience.map((exp, i) => (
            <div key={i} style={{ padding: 16, background: 'var(--color-paper)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <Input label="Role/Title" value={exp.role} onChange={e => updateExperience(i, 'role', e.target.value)} />
                <Input label="Organization" value={exp.organization} onChange={e => updateExperience(i, 'organization', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <Input label="Start Date" value={exp.startDate} onChange={e => updateExperience(i, 'startDate', e.target.value)} placeholder="e.g. Jan 2026" />
                <Input label="End Date" value={exp.endDate} onChange={e => updateExperience(i, 'endDate', e.target.value)} placeholder="e.g. Present" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div className="input__label">Description & Contributions</div>
                <textarea
                  className="account__skill-input"
                  style={{ minHeight: 80, resize: "vertical", width: "100%" }}
                  value={exp.description}
                  onChange={e => updateExperience(i, 'description', e.target.value)}
                  placeholder="Describe what you did..."
                />
              </div>
              <Button variant="danger" size="sm" onClick={() => removeExperience(i)}>Remove</Button>
            </div>
          ))}
        </div>
      )}
      <Button variant="outline" onClick={addExperience} style={{ marginTop: 16 }}>+ Add Experience</Button>
    </div>
  );
}
