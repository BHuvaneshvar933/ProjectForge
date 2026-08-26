import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../../api/projectApi';
import ProjectBasicInfo from '../../components/forms/ProjectBasicInfo';
import ProjectRequirements from '../../components/forms/ProjectRequirements';
import ProjectReview from '../../components/forms/ProjectReview';
import { toast } from 'react-toastify';
import './CreateProject.css';

const steps = ['Basic Info', 'Requirements', 'Review'];

export default function CreateProject() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectType: '',
    requiredSkills: [],
    teamSizeRequired: 2,
    timeline: {
      startDate: '',
      endDate: ''
    },
    openRoles: [],
    ownerRole: ''
  });
  const [errors, setErrors] = useState({});

  const updateFormData = (newData) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  const validateStep = () => {
    const newErrors = {};
    
    if (currentStep === 0) {
      if (!formData.title?.trim()) newErrors.title = 'Title is required';
      if (!formData.description?.trim()) newErrors.description = 'Description is required';
      if (!formData.projectType) newErrors.projectType = 'Project type is required';
    }
    
    if (currentStep === 1) {
      if (!formData.requiredSkills || formData.requiredSkills.length === 0) {
        newErrors.requiredSkills = 'At least one skill is required';
      }
      if (formData.teamSizeRequired < 2) {
        newErrors.teamSizeRequired = 'Team size must be at least 2';
      }
      if (formData.timeline?.startDate && formData.timeline?.endDate) {
        if (new Date(formData.timeline.endDate) <= new Date(formData.timeline.startDate)) {
          newErrors.timeline = 'End date must be after start date';
        }
      }
      if (formData.openRoles && formData.openRoles.length > formData.teamSizeRequired - 1) {
        newErrors.openRoles = 'Open roles cannot exceed team capacity';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
      setErrors({});
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    try {
      const requiredSkills = (formData.requiredSkills || [])
        .map((s) => (typeof s === 'string' ? s : s?._id))
        .filter(Boolean);

      const projectData = {
        ...formData,
        requiredSkills,
        teamSizeRequired: Number(formData.teamSizeRequired),
        timeline: {
          startDate: formData.timeline.startDate || null,
          endDate: formData.timeline.endDate || null
        },
        openRoles: Array.isArray(formData.openRoles) ? formData.openRoles : [],
        ownerProjectRole: formData.ownerRole || undefined,
      };
      
      await createProject(projectData);
      toast.success('Project created successfully!');
      navigate('/my-projects');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <ProjectBasicInfo
            data={formData}
            updateData={updateFormData}
            errors={errors}
          />
        );
      case 1:
        return (
          <ProjectRequirements
            data={formData}
            updateData={updateFormData}
            errors={errors}
          />
        );
      case 2:
        return (
          <ProjectReview
            data={formData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="create-project">
      <div className="create-project__header">
        <h1 className="create-project__title">Create Project</h1>
        <p className="create-project__subtitle">Fill in the details to start your journey</p>
      </div>
      
      <div className="create-project__stepper">
        <div className="create-project__stepper-line" />
        <div
          className="create-project__stepper-progress"
          style={{ width: `${(currentStep / (steps.length - 1)) * (100 - 13.7)}%` }}
        />
        <div className="create-project__stepper-steps">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div key={step} className="create-project__step">
                <div
                  className={`create-project__step-circle ${isCompleted ? 'is-completed' : isCurrent ? 'is-current' : 'is-upcoming'}`.trim()}
                >
                  {index + 1}
                </div>
                <span
                  className={`create-project__step-label ${isCompleted ? 'is-completed' : isCurrent ? 'is-current' : 'is-upcoming'}`.trim()}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="create-project__card">
        {renderStep()}
      </div>

      <div className="create-project__actions">
        <button
          onClick={handleBack}
          disabled={currentStep === 0 || loading}
          className={`create-project__button create-project__button--secondary ${currentStep === 0 || loading ? 'is-disabled' : ''}`.trim()}
        >
          Back
        </button>
        
        {currentStep < steps.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={loading}
            className={`create-project__button create-project__button--primary ${loading ? 'is-disabled' : ''}`.trim()}
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`create-project__button create-project__button--success ${loading ? 'is-disabled' : ''}`.trim()}
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        )}
      </div>
    </div>
  );
}
