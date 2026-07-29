import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectById, updateProject, archiveProject } from '../../api/projectApi';
import ProjectBasicInfo from '../../components/forms/ProjectBasicInfo';
import ProjectRequirements from '../../components/forms/ProjectRequirements';
import ProjectReview from '../../components/forms/ProjectReview';
import Modal from '../../components/common/Modal';
import { toast } from 'react-toastify';
import './EditProject.css';

const steps = ['Basic Info', 'Requirements', 'Review'];

export default function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
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

  const fetchProject = useCallback(async () => {
    try {
      setFetchLoading(true);
      const { data } = await getProjectById(id);

      const project = data?.data?.project;
      if (!project) {
        throw new Error('Project not found');
      }
      
      // Format dates for input fields
      const formattedData = {
        ...project,
        timeline: {
          startDate: project.timeline?.startDate ? project.timeline.startDate.split('T')[0] : '',
          endDate: project.timeline?.endDate ? project.timeline.endDate.split('T')[0] : ''
        }
      };
      
      setFormData(formattedData);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load project');
      navigate('/my-projects');
    } finally {
      setFetchLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

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
      };

      // Backend expects ownerProjectRole only during creation; keep ownerRole UI-only for now
      delete projectData.ownerRole;
      
      await updateProject(id, projectData);
      toast.success('Project updated successfully!');
      navigate(`/projects/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    setLoading(true);
    try {
      await archiveProject(id);
      toast.success('Project archived successfully');
      navigate('/my-projects');
    } catch (err) {
      console.error(err);
      toast.error('Failed to archive project');
    } finally {
      setLoading(false);
      setShowArchiveModal(false);
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

  if (fetchLoading) {
    return (
      <div className="edit-project__loading">
        <div className="edit-project__loading-spinner" />
        <p className="edit-project__loading-text">Loading project...</p>
      </div>
    );
  }

  return (
    <div className="edit-project">
      <div className="edit-project__header">
        <div>
          <h1 className="edit-project__title">Edit Project</h1>
          <p className="edit-project__subtitle">Update your project details</p>
        </div>
        <button
          onClick={() => setShowArchiveModal(true)}
          disabled={loading}
          className={`edit-project__archive ${loading ? 'is-disabled' : ''}`.trim()}
        >
          Archive Project
        </button>
      </div>
      
      <div className="edit-project__stepper">
        <div className="edit-project__stepper-line" />
        <div
          className="edit-project__stepper-progress"
          style={{ width: `${(currentStep / (steps.length - 1)) * (100 - 13.7)}%` }}
        />
        <div className="edit-project__stepper-steps">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div key={step} className="edit-project__step">
                <div
                  className={`edit-project__step-circle ${isCompleted ? 'is-completed' : isCurrent ? 'is-current' : 'is-upcoming'}`.trim()}
                >
                  {isCompleted ? (
                    <svg className="edit-project__step-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`edit-project__step-label ${isCompleted ? 'is-completed' : isCurrent ? 'is-current' : 'is-upcoming'}`.trim()}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="edit-project__card">
        {renderStep()}
      </div>

      <div className="edit-project__actions">
        <button
          onClick={handleBack}
          disabled={currentStep === 0 || loading}
          className={`edit-project__button edit-project__button--secondary ${currentStep === 0 || loading ? 'is-disabled' : ''}`.trim()}
        >
          <span className="edit-project__button-content">
            <svg className="edit-project__button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </span>
        </button>
        
        {currentStep < steps.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={loading}
            className={`edit-project__button edit-project__button--primary ${loading ? 'is-disabled' : ''}`.trim()}
          >
            <span className="edit-project__button-content">
              Continue
              <svg className="edit-project__button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`edit-project__button edit-project__button--primary ${loading ? 'is-disabled' : ''}`.trim()}
          >
            {loading ? (
              <span className="edit-project__button-content">
                <svg className="edit-project__spinner" viewBox="0 0 24 24">
                  <circle className="edit-project__spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path className="edit-project__spinner-fill" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Updating...
              </span>
            ) : (
              <span className="edit-project__button-content">
                Update Project
                <svg className="edit-project__button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </button>
        )}
      </div>

      <Modal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        title="Archive Project"
        onConfirm={handleArchive}
        confirmText="Archive"
      >
        <p className="edit-project__modal-text">
          Are you sure you want to archive this project? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
