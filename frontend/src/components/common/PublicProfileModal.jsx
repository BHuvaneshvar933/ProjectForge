import React, { useEffect, useState } from 'react';
import Modal from "./Modal";
import Button from "./Button";
import Badge from "./Badge";
import Spinner from "./Spinner";
import { getPublicUserProfile } from "../../api/userApi";
import { displaySkillLabel } from "../../utils/display";

export default function PublicProfileModal({ isOpen, onClose, userId, onInvite, onMessage }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      setError("");
      getPublicUserProfile(userId)
        .then(res => setProfile(res.data?.data?.user))
        .catch(err => setError(err?.response?.data?.message || "Failed to load profile"))
        .finally(() => setLoading(false));
    } else {
      setProfile(null);
    }
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
      maxWidth="700px"
      hideDefaultActions={true}
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}><Spinner /></div>
      ) : error ? (
        <p style={{ color: 'var(--color-danger)' }}>{error}</p>
      ) : profile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', color: 'var(--color-text-dark)' }}>
          
          {/* 1. Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 32, fontWeight: 700 }}>
                {profile.avatar ? <img src={profile.avatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : profile.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: 24 }}>{profile.name}</h2>
                {profile.headline && <div style={{ fontSize: 15, color: 'var(--color-text-muted)', marginTop: 4 }}>{profile.headline}</div>}
                
                {primaryEd && (
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 8 }}>
                    {primaryEd.degree} {primaryEd.program && `in ${primaryEd.program}`} <br />
                    {primaryEd.university}
                  </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-primary)' }}></span>
                    Available
                    {profile.structuredAvailability?.timeCommitment ? ` · ${profile.structuredAvailability.timeCommitment}` : profile.availabilityHoursPerWeek ? ` · ${profile.availabilityHoursPerWeek} hrs/week` : ''}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {onInvite && <Button variant="primary" onClick={onInvite}>Invite to Project</Button>}
              {onMessage && <Button variant="outline" onClick={onMessage}>Message</Button>}
              
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
                {profile.portfolioLinks?.github && <a href={profile.portfolioLinks.github} target="_blank" rel="noreferrer" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>GitHub</a>}
                {profile.portfolioLinks?.linkedin && <a href={profile.portfolioLinks.linkedin} target="_blank" rel="noreferrer" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>LinkedIn</a>}
                {profile.portfolioLinks?.website && <a href={profile.portfolioLinks.website} target="_blank" rel="noreferrer" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>Portfolio</a>}
              </div>
            </div>
          </div>

          <hr style={{ borderColor: 'var(--border-color)', opacity: 0.5, margin: 0 }} />

          {/* 2. About Me */}
          <div>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>About Me</h3>
            {profile.bio ? (
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-text-muted)', margin: 0 }}>{profile.bio}</p>
            ) : (
              <p style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--color-text-muted)', margin: 0 }}>No introduction added yet.</p>
            )}
          </div>

          {/* 3. Education */}
          <div>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>Education</h3>
            {profile.education?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {profile.education.map((ed, i) => (
                  <div key={i}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{ed.degree} {ed.program && `in ${ed.program}`}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{ed.university}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                      {ed.startYear} – {ed.graduationYear || 'Present'} {ed.currentYear && `· ${ed.currentYear}`} {ed.cgpa && `· CGPA: ${ed.cgpa}`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--color-text-muted)', margin: 0 }}>No education added yet.</p>
            )}
          </div>

          {/* 4. Skills */}
          <div>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>Skills</h3>
            {profile.skills?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {profile.skills.map((s) => (
                  <Badge key={s?._id || s?.name} variant="skill">{displaySkillLabel(s)}</Badge>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--color-text-muted)', margin: 0 }}>No skills added yet.</p>
            )}
          </div>

          {/* 5. Featured Projects */}
          <div>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>Featured Projects</h3>
            {profile.featuredProjects?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {profile.featuredProjects.map((fp, i) => (
                  <div key={i} style={{ padding: 16, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--color-paper)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{fp.project?.title}</div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {fp.project?.githubUrl && <a href={fp.project.githubUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--color-primary)', textDecoration: 'none' }}>GitHub →</a>}
                        {fp.project?.liveUrl && <a href={fp.project.liveUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--color-primary)', textDecoration: 'none' }}>Live Demo →</a>}
                        <a href={`/projects/${fp.project?._id}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--color-primary)', textDecoration: 'none', padding: '4px 10px', border: '1px solid var(--border-color)', borderRadius: 12, background: 'var(--color-background)' }}>View Project</a>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 8, marginBottom: 12, lineHeight: 1.5 }}>
                      {fp.project?.description}
                    </p>
                    {fp.project?.skills?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        {fp.project.skills.slice(0, 5).map(s => (
                          <span key={s._id} style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4, color: 'var(--color-text-muted)' }}>{s.name}</span>
                        ))}
                      </div>
                    )}
                    {fp.project?.deliverables && (fp.project.deliverables.reportUrl || fp.project.deliverables.slidesUrl) && (
                      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                        {fp.project.deliverables.reportUrl && <a href={fp.project.deliverables.reportUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--color-text-muted)', textDecoration: 'underline' }}>Project Report</a>}
                        {fp.project.deliverables.slidesUrl && <a href={fp.project.deliverables.slidesUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--color-text-muted)', textDecoration: 'underline' }}>Presentation Slides</a>}
                      </div>
                    )}
                    {(fp.teamRole || fp.contributions?.length > 0) && (
                      <div style={{ marginTop: 12, borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: 4 }}>My Role</div>
                        {fp.teamRole && <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 4 }}>{fp.teamRole}</div>}
                        {fp.contributions?.length > 0 && (
                          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>
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
              <p style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--color-text-muted)', margin: 0 }}>No featured projects yet.</p>
            )}
          </div>

          {/* 6. Experience */}
          <div>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>Experience</h3>
            {profile.experience?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {profile.experience.map((exp, i) => (
                  <div key={i}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{exp.role}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-dark)' }}>{exp.organization}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{exp.startDate} – {exp.endDate || 'Present'}</div>
                    {exp.description && (
                      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 8, whiteSpace: 'pre-line', margin: '8px 0 0 0', lineHeight: 1.5 }}>
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--color-text-muted)', margin: 0 }}>No experience added yet.</p>
            )}
          </div>

          {/* 7. Availability */}
          {profile.structuredAvailability && Object.values(profile.structuredAvailability).some(Boolean) && (
            <div>
              <h3 style={{ fontSize: 16, marginBottom: 12 }}>Availability</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: 'var(--color-paper)', padding: 16, borderRadius: 8, border: '1px solid var(--border-color)' }}>
                {profile.structuredAvailability.timeCommitment && (
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Time commitment</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{profile.structuredAvailability.timeCommitment}</div>
                  </div>
                )}
                {profile.structuredAvailability.preferredSchedule && (
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Preferred schedule</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{profile.structuredAvailability.preferredSchedule}</div>
                  </div>
                )}
                {profile.structuredAvailability.projectDuration && (
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Project duration</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{profile.structuredAvailability.projectDuration}</div>
                  </div>
                )}
                {profile.structuredAvailability.canStart && (
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Can start</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{profile.structuredAvailability.canStart}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 8. ProjectForge Activity */}
          <div>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>ProjectForge Activity</h3>
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{profile.stats?.projectsCompleted || 0}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Projects Completed</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{profile.stats?.tasksCompleted || 0}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Tasks Completed</div>
              </div>
            </div>
          </div>

          {/* 9. Achievements */}
          <div>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>Achievements</h3>
            {profile.achievements?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {profile.achievements.map((ach, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>🏆 {ach.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {ach.organization} {ach.date && `· ${ach.date}`}
                    </div>
                    {ach.description && <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>{ach.description}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--color-text-muted)', margin: 0 }}>No achievements added yet.</p>
            )}
          </div>

        </div>
      ) : null}
    </Modal>
  );
}
