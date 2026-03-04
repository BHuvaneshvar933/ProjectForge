import Input from '../common/Input';
import './ProjectBasicInfo.css';

export default function ProjectBasicInfo({ data, updateData, errors }) {
  return (
    <div className="project-basic">
      {/* Title Input */}
      <Input
        label="Project Title"
        value={data.title}
        onChange={(e) => updateData({ title: e.target.value })}
        placeholder="e.g., AI-Powered Task Manager"
        error={errors.title}
      />
      
      {/* Description Textarea */}
      <div className="project-basic__group">
        <label className="project-basic__label">Description</label>
        <textarea
          value={data.description}
          onChange={(e) => updateData({ description: e.target.value })}
          placeholder="Describe your project idea, goals, and what you're looking for in team members..."
          rows={6}
          className={`project-basic__textarea ${errors.description ? 'is-error' : ''}`.trim()}
        />
        {errors.description && (
          <p className="project-basic__error">
            {errors.description}
          </p>
        )}
      </div>

      {/* Project Type Select */}
      <div className="project-basic__group">
        <label className="project-basic__label">Project Type</label>
        <select
          value={data.projectType}
          onChange={(e) => updateData({ projectType: e.target.value })}
          className={`project-basic__select ${errors.projectType ? 'is-error' : ''}`.trim()}
        >
          <option value="">Select type</option>
          <option value="personal">Personal Project</option>
          <option value="startup">Startup</option>
          <option value="open-source">Open Source</option>
          <option value="academic">Academic</option>
        </select>
        {errors.projectType && (
          <p className="project-basic__error">
            {errors.projectType}
          </p>
        )}
      </div>
    </div>
  );
}