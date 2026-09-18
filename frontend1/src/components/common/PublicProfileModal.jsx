import React, { useEffect, useState } from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import Modal from "./Modal";
import Button from "./Button";
import Badge from "./Badge";
import Spinner from "./Spinner";
import { getPublicUserProfile } from "../../api/userApi";
import { displaySkillLabel } from "../../utils/display";
import "./PublicProfileModal.css";

const GitHubColoredIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const LinkedInColoredIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#0A66C2">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

export default function PublicProfileModal({ isOpen, onClose, userId, onInvite, onMessage }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    if (isOpen && userId) {
      Promise.resolve().then(() => {
        if (!ignore) {
          setLoading(true);
          setError("");
        }
      });
      getPublicUserProfile(userId)
        .then(res => {
          if (!ignore) setProfile(res.data?.data?.user);
        })
        .catch(err => {
          if (!ignore) setError(err?.response?.data?.message || "Failed to load profile");
        })
        .finally(() => {
          if (!ignore) setLoading(false);
        });
    } else {
      Promise.resolve().then(() => {
        if (!ignore) {
          setProfile(null);
        }
      });
    }
    return () => {
      ignore = true;
    };
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const getPrimaryEducation = () => {
    if (!profile?.education?.length) return null;
    const current = profile.education.find(e => e.currentYear);
    if (current) return current;
    return profile.education[0];
  };

  const primaryEd = getPrimaryEducation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student Portfolio"
      maxWidth="720px"
      hideDefaultActions={true}
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}><Spinner /></div>
      ) : error ? (
        <p style={{ color: 'var(--color-danger, #ef4444)', padding: '16px 0' }}>{error}</p>
      ) : profile ? (
        <div className="profile-modal">
          
          {/* 1. Header */}
          <div className="profile-modal__header">
            <div className="profile-modal__hero">
              <div className="profile-modal__avatar-wrap">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="avatar" className="profile-modal__avatar-img" />
                ) : (
                  <div className="profile-modal__avatar-fallback">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
              <div className="profile-modal__identity">
                <div className="profile-modal__name-row">
                  <h2 className="profile-modal__name">{profile.name}</h2>
                  {profile.reliability && (
                    <span className={`profile-modal__reliability ${profile.reliability.status === "RELIABLE" ? 'profile-modal__reliability--reliable' : 'profile-modal__reliability--standard'}`}>
                      {profile.reliability.label}
                    </span>
                  )}
                </div>
                {profile.headline && <div className="profile-modal__headline">{profile.headline}</div>}
                
                {primaryEd && (
                  <div className="profile-modal__primary-ed">
                    {primaryEd.degree} {primaryEd.program && `in ${primaryEd.program}`} · {primaryEd.university}
                  </div>
                )}
              </div>
            </div>

            <div className="profile-modal__actions-bar">
              <div className="profile-modal__btn-group">
                {onInvite && <Button variant="primary" onClick={onInvite}>Invite to Project</Button>}
                {onMessage && <Button variant="outline" onClick={onMessage}>Message</Button>}
              </div>
              
              <div className="profile-modal__links">
                {profile.portfolioLinks?.github && (
                  <a href={profile.portfolioLinks.github} target="_blank" rel="noreferrer" className="profile-modal__social-link" style={{ color: "var(--color-text-dark)" }}>
                    <GitHubColoredIcon size={15} />
                    <span>GitHub</span>
                  </a>
                )}
                {profile.portfolioLinks?.linkedin && (
                  <a href={profile.portfolioLinks.linkedin} target="_blank" rel="noreferrer" className="profile-modal__social-link" style={{ color: "#0A66C2" }}>
                    <LinkedInColoredIcon size={15} />
                    <span style={{ color: "var(--color-text-dark)" }}>LinkedIn</span>
                  </a>
                )}
                {profile.portfolioLinks?.website && (
                  <a href={profile.portfolioLinks.website} target="_blank" rel="noreferrer" className="profile-modal__social-link">
                    <Globe size={14} color="#2563eb" />
                    <span>Portfolio</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <hr className="profile-modal__divider" />

          {/* 2. About Me Box */}
          <fieldset className="profile-modal__box">
            <legend className="profile-modal__legend">About</legend>
            <div className="profile-modal__box-body">
              {profile.bio ? (
                <p className="profile-modal__bio">{profile.bio}</p>
              ) : (
                <p className="profile-modal__empty">No introduction added yet.</p>
              )}
            </div>
          </fieldset>

          {/* 3. Education Box */}
          <fieldset className="profile-modal__box">
            <legend className="profile-modal__legend">Education</legend>
            <div className="profile-modal__box-body">
              {profile.education?.length > 0 ? (
                <div className="profile-modal__items-list">
                  {profile.education.map((ed, i) => (
                    <div key={i} className="profile-modal__item-entry">
                      <div className="profile-modal__item-title">{ed.degree} {ed.program && `in ${ed.program}`}</div>
                      <div className="profile-modal__item-subtitle">{ed.university}</div>
                      <div className="profile-modal__item-meta">
                        {ed.startYear} – {ed.graduationYear || 'Present'} {ed.currentYear && `· ${ed.currentYear}`} {ed.cgpa && `· CGPA: ${ed.cgpa}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="profile-modal__empty">No education added yet.</p>
              )}
            </div>
          </fieldset>

          {/* 4. Skills Box */}
          <fieldset className="profile-modal__box">
            <legend className="profile-modal__legend">Skills</legend>
            <div className="profile-modal__box-body">
              {profile.skills?.length > 0 ? (
                <div className="profile-modal__skills-wrap">
                  {profile.skills.map((s) => (
                    <Badge key={s?._id || s?.name} variant="skill">{displaySkillLabel(s)}</Badge>
                  ))}
                </div>
              ) : (
                <p className="profile-modal__empty">No skills added yet.</p>
              )}
            </div>
          </fieldset>

          {/* 5. Featured Projects Box */}
          <fieldset className="profile-modal__box">
            <legend className="profile-modal__legend">Featured Projects</legend>
            <div className="profile-modal__box-body">
              {profile.featuredProjects?.length > 0 ? (
                <div className="profile-modal__items-list">
                  {profile.featuredProjects.map((fp, i) => (
                    <div key={i} className="profile-modal__project-entry">
                      <div className="profile-modal__project-header">
                        <div className="profile-modal__project-title">{fp.project?.title}</div>
                        <div className="profile-modal__project-links">
                          {fp.project?.githubUrl && (
                            <a href={fp.project.githubUrl} target="_blank" rel="noreferrer" className="profile-modal__project-btn">
                              <GitHubColoredIcon size={13} />
                              <span>GitHub</span>
                            </a>
                          )}
                          {fp.project?.liveUrl && (
                            <a href={fp.project.liveUrl} target="_blank" rel="noreferrer" className="profile-modal__project-btn">
                              <Globe size={13} color="#2563eb" />
                              <span>Live Demo</span>
                            </a>
                          )}
                          <a href={`/projects/${fp.project?._id}`} target="_blank" rel="noreferrer" className="profile-modal__project-btn">
                            <span>View Project</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </div>
                      <p className="profile-modal__project-desc">
                        {fp.project?.description}
                      </p>
                      {fp.project?.skills?.length > 0 && (
                        <div className="profile-modal__project-skills">
                          {fp.project.skills.slice(0, 5).map(s => (
                            <span key={s._id} className="profile-modal__project-skill-tag">{s.name}</span>
                          ))}
                        </div>
                      )}
                      {fp.project?.deliverables && (fp.project.deliverables.reportUrl || fp.project.deliverables.slidesUrl) && (
                        <div className="profile-modal__project-deliverables">
                          {fp.project.deliverables.reportUrl && <a href={fp.project.deliverables.reportUrl} target="_blank" rel="noreferrer" className="profile-modal__deliverable-link">Project Report</a>}
                          {fp.project.deliverables.slidesUrl && <a href={fp.project.deliverables.slidesUrl} target="_blank" rel="noreferrer" className="profile-modal__deliverable-link">Presentation Slides</a>}
                        </div>
                      )}
                      {(fp.teamRole || fp.contributions?.length > 0) && (
                        <div className="profile-modal__role-box">
                          <div className="profile-modal__role-label">My Role</div>
                          {fp.teamRole && <div className="profile-modal__role-value">{fp.teamRole}</div>}
                          {fp.contributions?.length > 0 && (
                            <ul className="profile-modal__contributions">
                              {fp.contributions.slice(0, 3).map((c, idx) => (
                                <li key={idx}>{c.contribution}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="profile-modal__empty">No featured projects yet.</p>
              )}
            </div>
          </fieldset>

          {/* 6. Experience Box */}
          <fieldset className="profile-modal__box">
            <legend className="profile-modal__legend">Experience</legend>
            <div className="profile-modal__box-body">
              {profile.experience?.length > 0 ? (
                <div className="profile-modal__items-list">
                  {profile.experience.map((exp, i) => (
                    <div key={i} className="profile-modal__item-entry">
                      <div className="profile-modal__item-title">{exp.role}</div>
                      <div className="profile-modal__item-subtitle">{exp.organization}</div>
                      <div className="profile-modal__item-meta">{exp.startDate} – {exp.endDate || 'Present'}</div>
                      {exp.description && (
                        <p className="profile-modal__bio" style={{ marginTop: '8px', whiteSpace: 'pre-line', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="profile-modal__empty">No experience added yet.</p>
              )}
            </div>
          </fieldset>

          {/* 7. ProjectForge Activity Box */}
          <fieldset className="profile-modal__box">
            <legend className="profile-modal__legend">ProjectForge Activity</legend>
            <div className="profile-modal__box-body">
              <div className="profile-modal__stats">
                <div className="profile-modal__stat-col">
                  <div className="profile-modal__stat-value">{profile.stats?.projectsCompleted || 0}</div>
                  <div className="profile-modal__stat-label">Projects Completed</div>
                </div>
                <div className="profile-modal__stat-col">
                  <div className="profile-modal__stat-value">{profile.stats?.tasksCompleted || 0}</div>
                  <div className="profile-modal__stat-label">Tasks Completed</div>
                </div>
              </div>
            </div>
          </fieldset>

        </div>
      ) : null}
    </Modal>
  );
}
