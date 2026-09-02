import React from 'react';
import Button from "../../../../components/common/Button";
import Input from "../../../../components/common/Input";

export default function EducationEditor({ form, setForm }) {
  const education = form.education || [];

  const addEducation = () => {
    setForm(p => ({
      ...p,
      education: [...p.education, {
        degree: '', program: '', university: '', startYear: '', graduationYear: '', currentYear: '', cgpa: ''
      }]
    }));
  };

  const updateEducation = (index, field, value) => {
    const newEd = [...education];
    newEd[index][field] = value;
    setForm(p => ({ ...p, education: newEd }));
  };

  const removeEducation = (index) => {
    setForm(p => ({
      ...p,
      education: education.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="account__section">
      <div className="account__card-title" style={{ marginBottom: 16 }}>Education</div>
      {education.length === 0 ? (
        <p className="account__muted">No education added yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {education.map((ed, i) => (
            <div key={i} style={{ padding: 16, background: 'var(--color-paper)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <Input label="Degree (e.g. B.Tech)" value={ed.degree} onChange={e => updateEducation(i, 'degree', e.target.value)} />
                <Input label="Program (e.g. Computer Science)" value={ed.program} onChange={e => updateEducation(i, 'program', e.target.value)} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <Input label="University/College" value={ed.university} onChange={e => updateEducation(i, 'university', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <Input label="Start Year" value={ed.startYear} onChange={e => updateEducation(i, 'startYear', e.target.value)} />
                <Input label="Grad Year" value={ed.graduationYear} onChange={e => updateEducation(i, 'graduationYear', e.target.value)} />
                <Input label="Current Year" value={ed.currentYear} onChange={e => updateEducation(i, 'currentYear', e.target.value)} />
                <Input label="CGPA (Optional)" value={ed.cgpa} onChange={e => updateEducation(i, 'cgpa', e.target.value)} />
              </div>
              <Button variant="danger" size="sm" onClick={() => removeEducation(i)}>Remove</Button>
            </div>
          ))}
        </div>
      )}
      <Button variant="outline" onClick={addEducation} style={{ marginTop: 16 }}>+ Add Education</Button>
    </div>
  );
}
