import React from 'react';
import Button from "../../../../components/common/Button";
import Input from "../../../../components/common/Input";

export default function AchievementsEditor({ form, setForm }) {
  const achievements = form.achievements || [];

  const addAchievement = () => {
    setForm(p => ({
      ...p,
      achievements: [...p.achievements, {
        title: '', organization: '', date: '', description: ''
      }]
    }));
  };

  const updateAchievement = (index, field, value) => {
    const newAch = [...achievements];
    newAch[index][field] = value;
    setForm(p => ({ ...p, achievements: newAch }));
  };

  const removeAchievement = (index) => {
    setForm(p => ({
      ...p,
      achievements: achievements.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="account__section">
      <div className="account__card-title" style={{ marginBottom: 16 }}>Achievements</div>
      {achievements.length === 0 ? (
        <p className="account__muted">No achievements added yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {achievements.map((ach, i) => (
            <div key={i} style={{ padding: 16, background: 'var(--color-paper)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <Input label="Title (e.g. Hackathon Winner)" value={ach.title} onChange={e => updateAchievement(i, 'title', e.target.value)} />
                <Input label="Organization" value={ach.organization} onChange={e => updateAchievement(i, 'organization', e.target.value)} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <Input label="Date" value={ach.date} onChange={e => updateAchievement(i, 'date', e.target.value)} placeholder="e.g. 2025" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <Input label="Short Description" value={ach.description} onChange={e => updateAchievement(i, 'description', e.target.value)} />
              </div>
              <Button variant="danger" size="sm" onClick={() => removeAchievement(i)}>Remove</Button>
            </div>
          ))}
        </div>
      )}
      <Button variant="outline" onClick={addAchievement} style={{ marginTop: 16 }}>+ Add Achievement</Button>
    </div>
  );
}
