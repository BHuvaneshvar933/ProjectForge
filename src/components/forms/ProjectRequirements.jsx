import { useState } from 'react';
import Input from '../common/Input';
import Badge from '../common/Badge';
import './ProjectRequirements.css';

const SKILLS = [
  'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java', 'C++',
  'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes',
  'UI/UX', 'Product Management', 'Marketing', 'Mobile Dev'
];

export default function ProjectRequirements({ data, updateData, errors }) {
  const [skillInput, setSkillInput] = useState('');
  const [roleInput, setRoleInput] = useState('');

  const addSkill = (skill) => {
    if (!data.requiredSkills.includes(skill)) {
      updateData({ requiredSkills: [...data.requiredSkills, skill] });
    }
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    updateData({ 
      requiredSkills: data.requiredSkills.filter(s => s !== skill) 
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
            onChange={(e) => setSkillInput(e.target.value)}
            placeholder="Search skills..."
            className="project-req__input"
            list="skills"
          />
          <datalist id="skills">
            {SKILLS.map(skill => (
              <option key={skill} value={skill} />
            ))}
          </datalist>
          <button
            type="button"
            onClick={() => skillInput && addSkill(skillInput)}
            className="project-req__add"
          >
            Add
          </button>
        </div>
        
        {/* Selected Skills */}
        {data.requiredSkills.length > 0 && (
          <div className="project-req__tags">
            {data.requiredSkills.map(skill => (
              <Badge key={skill} variant="skill" className="badge--clickable">
                {skill}
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
            className="project-req__add"
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