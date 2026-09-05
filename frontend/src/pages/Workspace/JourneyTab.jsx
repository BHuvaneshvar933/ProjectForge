import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Button from "../../components/common/Button";
import { updateArchiveData, updatePersonalJourney } from "../../api/projectApi";
import { generateAIContent } from "../../api/aiApi";
import { getAllSkills } from "../../api/skillApi";
import EducationalTip from "../../components/common/EducationalTip";
import Spinner from "../../components/common/Spinner";
import "./JourneyTab.css";

export default function JourneyTab({ project, teamRecord, tasks = [], isMember, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [conflictError, setConflictError] = useState(false);
  const [activeTab, setActiveTab] = useState("personal"); // "personal" | "team"
  const archiveData = project?.archiveData || {};
  const personalJourney = teamRecord?.journey || { contributions: [], challenges: [], skills: [], learnings: [], evidence: [] };

  // Personal Journey States
  const [newContribution, setNewContribution] = useState({ contribution: "", impact: "" });
  const [newChallenge, setNewChallenge] = useState({ problem: "", action: "", result: "", learning: "" });
  const [newLearning, setNewLearning] = useState({ category: "Technical", text: "" });
  const [newEvidence, setNewEvidence] = useState({ title: "", url: "", description: "" });
  
  // Skills
  const [newSkill, setNewSkill] = useState({ skill: "", before: "Beginner", usedFor: "", after: "Intermediate" });
  const [availableSkills, setAvailableSkills] = useState([]);
  // Form Visibility States
  const [showAddContribution, setShowAddContribution] = useState(false);
  const [showAddChallenge, setShowAddChallenge] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showAddLearning, setShowAddLearning] = useState(false);
  const [showAddEvidence, setShowAddEvidence] = useState(false);

  // Team Journey States
  const [deliverables, setDeliverables] = useState({
    sourceCodeUrl: archiveData.deliverables?.sourceCodeUrl || "",
    demoVideoUrl: archiveData.deliverables?.demoVideoUrl || "",
    reportUrl: archiveData.deliverables?.reportUrl || "",
    slidesUrl: archiveData.deliverables?.slidesUrl || "",
  });

  useEffect(() => {
    getAllSkills()
      .then(res => setAvailableSkills(res.data.data.skills || []))
      .catch(() => console.error("Could not fetch skills"));
  }, []);

  const handlePersonalUpdate = async (data, successMessage) => {
    setLoading(true);
    try {
      await updatePersonalJourney(project._id, data);
      onUpdate();
      toast.success(successMessage);
    } catch {
      toast.error("Failed to update personal journey");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestContribution = async () => {
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const res = await generateAIContent("contribution-suggestion", null, project._id);
      setAiSuggestion(res.data.data.result);
    } catch {
      toast.error("Failed to generate suggestion");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddContribution = (e) => {
    e.preventDefault();
    if (!newContribution.contribution.trim()) return;
    handlePersonalUpdate({ type: "add_contribution", contribution: newContribution }, "Contribution added!");
    setNewContribution({ contribution: "", impact: "" });
    setShowAddContribution(false);
  };

  const handleDeleteContribution = (index) => handlePersonalUpdate({ type: "delete_contribution", index }, "Contribution removed!");

  const handleAddChallenge = (e) => {
    e.preventDefault();
    if (!newChallenge.problem.trim() || !newChallenge.action.trim()) return;
    handlePersonalUpdate({ type: "add_challenge", challenge: newChallenge }, "Challenge added!");
    setNewChallenge({ problem: "", action: "", result: "", learning: "" });
    setShowAddChallenge(false);
  };

  const handleDeleteChallenge = (index) => handlePersonalUpdate({ type: "delete_challenge", index }, "Challenge removed!");

  const handleAddLearning = (e) => {
    e.preventDefault();
    if (!newLearning.text.trim()) return;
    handlePersonalUpdate({ type: "add_learning", learning: newLearning }, "Learning added!");
    setNewLearning({ category: "Technical", text: "" });
    setShowAddLearning(false);
  };

  const handleDeleteLearning = (index) => handlePersonalUpdate({ type: "delete_learning", index }, "Learning removed!");

  const handleAddEvidence = (e) => {
    e.preventDefault();
    if (!newEvidence.title.trim() || !newEvidence.url.trim()) return;
    handlePersonalUpdate({ type: "add_evidence", evidence: newEvidence }, "Evidence added!");
    setNewEvidence({ title: "", url: "", description: "" });
    setShowAddEvidence(false);
  };

  const handleDeleteEvidence = (index) => handlePersonalUpdate({ type: "delete_evidence", index }, "Evidence removed!");

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill.skill) return;
    handlePersonalUpdate({ type: "add_skill", skill: newSkill }, "Skill added!");
    setNewSkill({ skill: "", before: "Beginner", usedFor: "", after: "Intermediate" });
    setShowAddSkill(false);
  };

  const handleDeleteSkill = (index) => handlePersonalUpdate({ type: "delete_skill", index }, "Skill removed!");

  const handleSaveDeliverables = async (e) => {
    e.preventDefault();
    setLoading(true);
    setConflictError(false);
    try {
      await updateArchiveData(project._id, { type: "deliverables", deliverables, __v: project.__v });
      onUpdate();
      toast.success("Team deliverables saved!");
    } catch (err) {
      if (err.response?.status === 409) {
        setConflictError(true);
      } else {
        toast.error("Failed to save deliverables");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isMember) {
    return (
      <div className="journey-tab__empty">
        You must be a team member to edit the project journey.
      </div>
    );
  }

  return (
    <div className="journey-tab">
      <div className="journey-tab__header">
        <h2>Journey</h2>
        <div className="journey-nav">
          <button 
            className={`journey-nav-btn ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            My Journey
          </button>
          <button 
            className={`journey-nav-btn ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            Project Story (Team)
          </button>
        </div>
      </div>

      <EducationalTip content="Documenting your contributions and learnings gives you a structured engineering story for interviews!" />

      {activeTab === "personal" && (
        <div className="journey-personal-container">
          {/* MY PROGRESS (Auto-calculated - Full Width Anchor) */}
          <div className="journey-progress-dashboard">
            <div className="progress-header">
              <h3>MY PROGRESS</h3>
              <p>Your contribution to this project</p>
            </div>
            <div className="progress-stats">
              <div className="progress-stat-item">
                <div className="stat-value">
                  {tasks.filter(t => {
                    const aId = typeof t.assignedTo === 'object' && t.assignedTo !== null ? t.assignedTo._id : t.assignedTo;
                    const uId = typeof teamRecord.userId === 'object' && teamRecord.userId !== null ? teamRecord.userId._id : teamRecord.userId;
                    return aId === uId && t.status === 'done';
                  }).length}
                </div>
                <div className="stat-label">Tasks Completed</div>
              </div>
              <div className="progress-stat-item">
                <div className="stat-value">{personalJourney.contributions?.length || 0}</div>
                <div className="stat-label">Contributions</div>
              </div>
              <div className="progress-stat-item">
                <div className="stat-value">{personalJourney.challenges?.length || 0}</div>
                <div className="stat-label">Challenges</div>
              </div>
              <div className="progress-stat-item">
                <div className="stat-value">{personalJourney.skills?.length || 0}</div>
                <div className="stat-label">Skills</div>
              </div>
            </div>
          </div>

          <div className="journey-layout">
            {/* CONTRIBUTIONS (Full Width) */}
            <div className="journey-card full-width">
              <div className="journey-card-header">
                <div>
                  <h3>Contributions & Achievements</h3>
                  <p className="journey-card__desc">Your actual work and impact</p>
                </div>
                <div className="journey-card-actions">
                  <Button variant="outline" size="sm" onClick={handleSuggestContribution} disabled={aiLoading}>
                    {aiLoading ? <Spinner size="sm" /> : "✨ Suggest from my activity"}
                  </Button>
                  {!showAddContribution && (
                    <Button variant="primary" size="sm" onClick={() => setShowAddContribution(true)}>
                      + Add
                    </Button>
                  )}
                </div>
              </div>
              
              {aiSuggestion && (
                <div className="ai-suggestion-box">
                  <h4 className="ai-suggestion-title">✨ We found something worth documenting</h4>
                  <div className="ai-suggestion-content">
                    <div><strong>Suggested contribution:</strong> {aiSuggestion.summary}</div>
                    {aiSuggestion.potentialAchievements?.length > 0 && (
                      <div style={{ marginTop: "4px" }}><strong>Impact:</strong> {aiSuggestion.potentialAchievements[0]}</div>
                    )}
                  </div>
                  <div className="ai-suggestion-actions">
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => {
                        setNewContribution({
                          contribution: aiSuggestion.summary,
                          impact: aiSuggestion.potentialAchievements?.[0] || ""
                        });
                        setShowAddContribution(true);
                        setAiSuggestion(null);
                      }}
                    >
                      Edit & Add
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setAiSuggestion(null)}>Dismiss</Button>
                  </div>
                </div>
              )}

              {showAddContribution && (
                <form onSubmit={handleAddContribution} className="journey-form-box">
                  <div className="form-box-header">Add Contribution</div>
                  <input type="text" placeholder="Contribution (e.g., Designed auth architecture)" value={newContribution.contribution} onChange={e => setNewContribution({...newContribution, contribution: e.target.value})} required />
                  <input type="text" placeholder="Impact (e.g., Decreased login latency by 20%)" value={newContribution.impact} onChange={e => setNewContribution({...newContribution, impact: e.target.value})} />
                  <div className="form-box-actions">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowAddContribution(false)}>Cancel</Button>
                    <Button type="submit" variant="primary" size="sm" disabled={loading}>Save</Button>
                  </div>
                </form>
              )}

              {!showAddContribution && (!personalJourney.contributions || personalJourney.contributions.length === 0) ? (
                <div className="journey-empty-state">No contributions documented yet.</div>
              ) : (
                <div className="journey-list-wrapper">
                  {personalJourney.contributions?.map((c, i) => (
                    <div key={i} className="journey-list-item">
                      <div className="journey-list-content">
                        <strong>{c.contribution}</strong>
                        {c.impact && <div className="impact-text">Impact: {c.impact}</div>}
                      </div>
                      <button onClick={() => handleDeleteContribution(i)} className="journey-delete-btn">&times;</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="journey-split-row">
              {/* CHALLENGES (Half Width) */}
              <div className="journey-card half-width">
                <div className="journey-card-header">
                  <div>
                    <h3>Challenges</h3>
                    <p className="journey-card__desc">What you solved</p>
                  </div>
                  {!showAddChallenge && (
                    <Button variant="primary" size="sm" onClick={() => setShowAddChallenge(true)}>
                      + Add
                    </Button>
                  )}
                </div>

                {showAddChallenge && (
                  <form onSubmit={handleAddChallenge} className="journey-form-box">
                    <div className="form-box-header">Add Challenge</div>
                    <textarea placeholder="Problem (e.g., Socket connections failing...)" value={newChallenge.problem} onChange={e => setNewChallenge({...newChallenge, problem: e.target.value})} required rows="2" />
                    <textarea placeholder="What I Tried" value={newChallenge.action} onChange={e => setNewChallenge({...newChallenge, action: e.target.value})} required rows="2" />
                    <textarea placeholder="Solution" value={newChallenge.result} onChange={e => setNewChallenge({...newChallenge, result: e.target.value})} rows="2" />
                    <textarea placeholder="What I Learned" value={newChallenge.learning} onChange={e => setNewChallenge({...newChallenge, learning: e.target.value})} rows="2" />
                    <div className="form-box-actions">
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowAddChallenge(false)}>Cancel</Button>
                      <Button type="submit" variant="primary" size="sm" disabled={loading}>Save</Button>
                    </div>
                  </form>
                )}

                {!showAddChallenge && (!personalJourney.challenges || personalJourney.challenges.length === 0) ? (
                  <div className="journey-empty-state">No challenges documented yet.</div>
                ) : (
                  <div className="journey-list-wrapper">
                    {personalJourney.challenges?.map((c, i) => (
                      <div key={i} className="journey-list-item challenge-item">
                        <div className="journey-list-content">
                          <div><strong>Problem:</strong> {c.problem}</div>
                          <div><strong>Solution:</strong> {c.result}</div>
                        </div>
                        <button onClick={() => handleDeleteChallenge(i)} className="journey-delete-btn">&times;</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SKILLS (Half Width) */}
              <div className="journey-card half-width">
                <div className="journey-card-header">
                  <div>
                    <h3>Skills & Technologies</h3>
                    <p className="journey-card__desc">How you grew</p>
                  </div>
                  {!showAddSkill && (
                    <Button variant="primary" size="sm" onClick={() => setShowAddSkill(true)}>
                      + Add
                    </Button>
                  )}
                </div>

                {showAddSkill && (
                  <form onSubmit={handleAddSkill} className="journey-form-box">
                    <div className="form-box-header">Add Skill</div>
                    <select value={newSkill.skill} onChange={e => setNewSkill({...newSkill, skill: e.target.value})} required>
                      <option value="">Select a skill...</option>
                      {availableSkills.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                    <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                      <select value={newSkill.before} onChange={e => setNewSkill({...newSkill, before: e.target.value})} style={{ flex: 1 }}>
                        <option value="" disabled>Before...</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                      <select value={newSkill.after} onChange={e => setNewSkill({...newSkill, after: e.target.value})} style={{ flex: 1 }}>
                        <option value="" disabled>After...</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>
                    <input type="text" placeholder="Used for (e.g., Kanban UI)" value={newSkill.usedFor} onChange={e => setNewSkill({...newSkill, usedFor: e.target.value})} />
                    <div className="form-box-actions">
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowAddSkill(false)}>Cancel</Button>
                      <Button type="submit" variant="primary" size="sm" disabled={loading}>Save</Button>
                    </div>
                  </form>
                )}

                {!showAddSkill && (!personalJourney.skills || personalJourney.skills.length === 0) ? (
                  <div className="journey-empty-state">No skills documented yet.</div>
                ) : (
                  <div className="journey-list-wrapper">
                    {personalJourney.skills?.map((s, i) => {
                      const skillObj = availableSkills.find(sk => sk._id === s.skill) || s.skill;
                      return (
                        <div key={i} className="journey-list-item">
                          <div className="journey-list-content">
                            <strong>{skillObj.name || "Skill"}</strong>
                            <div className="skill-journey-meta">
                              <span>Before: {s.before}</span> &rarr; <span>After: {s.after}</span>
                            </div>
                            {s.usedFor && <div className="skill-journey-used">Used for: {s.usedFor}</div>}
                          </div>
                          <button onClick={() => handleDeleteSkill(i)} className="journey-delete-btn">&times;</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* LEARNINGS (Full Width) */}
            <div className="journey-card full-width">
              <div className="journey-card-header">
                <div>
                  <h3>What I Learned</h3>
                  <p className="journey-card__desc">My personal engineering journal</p>
                </div>
                {!showAddLearning && (
                  <Button variant="primary" size="sm" onClick={() => setShowAddLearning(true)}>
                    + Add
                  </Button>
                )}
              </div>

              {showAddLearning && (
                <form onSubmit={handleAddLearning} className="journey-form-box">
                  <div className="form-box-header">Add Learning</div>
                  <select value={newLearning.category} onChange={e => setNewLearning({...newLearning, category: e.target.value})}>
                    <option value="Technical">Technical Learning</option>
                    <option value="Architecture">Architecture Learning</option>
                    <option value="Engineering">Engineering Practice</option>
                    <option value="Reflection">General Reflection</option>
                  </select>
                  <textarea placeholder="e.g., Separating controllers from services made it easier to test..." value={newLearning.text} onChange={e => setNewLearning({...newLearning, text: e.target.value})} required rows="3" />
                  <div className="form-box-actions">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowAddLearning(false)}>Cancel</Button>
                    <Button type="submit" variant="primary" size="sm" disabled={loading}>Save</Button>
                  </div>
                </form>
              )}

              {!showAddLearning && (!personalJourney.learnings || personalJourney.learnings.length === 0) ? (
                <div className="journey-empty-state">No learnings documented yet.</div>
              ) : (
                <div className="journey-list-wrapper">
                  {personalJourney.learnings?.map((l, i) => (
                    <div key={i} className="journey-list-item">
                      <div className="journey-list-content">
                        <span className="learning-badge">{l.category}</span>
                        <p style={{ margin: "4px 0 0 0" }}>{l.text}</p>
                      </div>
                      <button onClick={() => handleDeleteLearning(i)} className="journey-delete-btn">&times;</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* EVIDENCE (Full Width) */}
            <div className="journey-card full-width">
              <div className="journey-card-header">
                <div>
                  <h3>My Evidence</h3>
                  <p className="journey-card__desc">Link your specific PRs, commits, or demo timestamps</p>
                </div>
                {!showAddEvidence && (
                  <Button variant="primary" size="sm" onClick={() => setShowAddEvidence(true)}>
                    + Add
                  </Button>
                )}
              </div>

              {showAddEvidence && (
                <form onSubmit={handleAddEvidence} className="journey-form-box">
                  <div className="form-box-header">Add Evidence</div>
                  <input type="text" placeholder="Title (e.g. Auth PR #42)" value={newEvidence.title} onChange={e => setNewEvidence({...newEvidence, title: e.target.value})} required />
                  <input type="url" placeholder="URL" value={newEvidence.url} onChange={e => setNewEvidence({...newEvidence, url: e.target.value})} required />
                  <input type="text" placeholder="Description (optional)" value={newEvidence.description} onChange={e => setNewEvidence({...newEvidence, description: e.target.value})} />
                  <div className="form-box-actions">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowAddEvidence(false)}>Cancel</Button>
                    <Button type="submit" variant="primary" size="sm" disabled={loading}>Save</Button>
                  </div>
                </form>
              )}

              {!showAddEvidence && (!personalJourney.evidence || personalJourney.evidence.length === 0) ? (
                <div className="journey-empty-state">No evidence linked yet.</div>
              ) : (
                <div className="journey-list-wrapper">
                  {personalJourney.evidence?.map((e, i) => (
                    <div key={i} className="journey-list-item">
                      <div className="journey-list-content">
                        <strong>{e.title}</strong>
                        <a href={e.url} target="_blank" rel="noreferrer" className="evidence-link" style={{ display: "block", fontSize: "13px" }}>{e.url}</a>
                        {e.description && <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0 0" }}>{e.description}</p>}
                      </div>
                      <button onClick={() => handleDeleteEvidence(i)} className="journey-delete-btn">&times;</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "team" && (
        <div className="journey-tab__grid">
          <div className="journey-card">
            <h3>Project Timeline</h3>
            <p className="journey-card__desc">Shared with your team. Automatic feed of project events.</p>
            <div className="journey-timeline">
              {archiveData.timelineEvents?.length > 0 ? (
                archiveData.timelineEvents.map((evt, idx) => (
                  <div key={idx} className="journey-timeline__item">
                    <div className="journey-timeline__dot"></div>
                    <div className="journey-timeline__content">
                      <div className="journey-timeline__date">{new Date(evt.date).toLocaleDateString()}</div>
                      <div className="journey-timeline__title">{evt.title}</div>
                      <div className="journey-timeline__desc">{evt.description}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="journey-tab__empty" style={{ padding: "20px 0" }}>No timeline events yet.</div>
              )}
            </div>
          </div>

          <div className="journey-card">
            <h3>Project Deliverables</h3>
            <p className="journey-card__desc">Shared final outputs for the team.</p>
            
            {conflictError && (
              <div style={{ background: "rgba(255, 69, 58, 0.15)", border: "1px solid #ff453a", color: "#ff453a", padding: "16px", borderRadius: "8px", marginBottom: "16px" }}>
                <p style={{ fontWeight: 600, margin: "0 0 8px 0", fontSize: "14px" }}>⚠️ This project was updated by another team member.</p>
                <p style={{ margin: "0 0 16px 0", fontSize: "13px", opacity: 0.9 }}>Your changes have <strong>not</strong> been saved. Your unsaved changes are still here.</p>
                <Button variant="danger" onClick={() => {
                  setConflictError(false);
                  onUpdate(); // reload latest project
                }} style={{ fontSize: "12px", padding: "6px 12px" }}>Reload Latest</Button>
              </div>
            )}
            
            <form onSubmit={handleSaveDeliverables} className="journey-block-form">
              <div className="form-group">
                <label>Source Code URL</label>
                <input type="url" placeholder="https://github.com/..." value={deliverables.sourceCodeUrl} onChange={(e) => setDeliverables({ ...deliverables, sourceCodeUrl: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Demo Video URL</label>
                <input type="url" placeholder="https://youtube.com/..." value={deliverables.demoVideoUrl} onChange={(e) => setDeliverables({ ...deliverables, demoVideoUrl: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Report / Article URL</label>
                <input type="url" placeholder="https://medium.com/..." value={deliverables.reportUrl} onChange={(e) => setDeliverables({ ...deliverables, reportUrl: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Slides URL</label>
                <input type="url" placeholder="https://docs.google.com/presentation/..." value={deliverables.slidesUrl} onChange={(e) => setDeliverables({ ...deliverables, slidesUrl: e.target.value })} />
              </div>
              <Button type="submit" variant="primary" disabled={loading} style={{ marginTop: "1rem" }}>
                {loading ? "Saving..." : "Save Deliverables"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
