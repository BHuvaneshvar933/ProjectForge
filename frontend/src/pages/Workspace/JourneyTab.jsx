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
  const [activeTab, setActiveTab] = useState("personal"); // "personal" | "team"
  const archiveData = project?.archiveData || {};
  const personalJourney = teamRecord?.journey || { contributions: [], challenges: [], skills: [], learnings: [], evidence: [] };

  // Personal Journey States
  const [newContribution, setNewContribution] = useState({ contribution: "", impact: "" });
  const [newChallenge, setNewChallenge] = useState({ problem: "", action: "", result: "", learning: "" });
  const [newLearning, setNewLearning] = useState({ category: "Technical", text: "" });
  const [newEvidence, setNewEvidence] = useState({ title: "", url: "", description: "" });
  
  // Skills
  const [availableSkills, setAvailableSkills] = useState([]);
  const [newSkill, setNewSkill] = useState({ skill: "", before: "Beginner", usedFor: "", after: "Intermediate" });

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
  };

  const handleDeleteContribution = (index) => handlePersonalUpdate({ type: "delete_contribution", index }, "Contribution removed!");

  const handleAddChallenge = (e) => {
    e.preventDefault();
    if (!newChallenge.problem.trim() || !newChallenge.action.trim()) return;
    handlePersonalUpdate({ type: "add_challenge", challenge: newChallenge }, "Challenge added!");
    setNewChallenge({ problem: "", action: "", result: "", learning: "" });
  };

  const handleDeleteChallenge = (index) => handlePersonalUpdate({ type: "delete_challenge", index }, "Challenge removed!");

  const handleAddLearning = (e) => {
    e.preventDefault();
    if (!newLearning.text.trim()) return;
    handlePersonalUpdate({ type: "add_learning", learning: newLearning }, "Learning added!");
    setNewLearning({ category: "Technical", text: "" });
  };

  const handleDeleteLearning = (index) => handlePersonalUpdate({ type: "delete_learning", index }, "Learning removed!");

  const handleAddEvidence = (e) => {
    e.preventDefault();
    if (!newEvidence.title.trim() || !newEvidence.url.trim()) return;
    handlePersonalUpdate({ type: "add_evidence", evidence: newEvidence }, "Evidence added!");
    setNewEvidence({ title: "", url: "", description: "" });
  };

  const handleDeleteEvidence = (index) => handlePersonalUpdate({ type: "delete_evidence", index }, "Evidence removed!");

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill.skill) return;
    handlePersonalUpdate({ type: "add_skill", skill: newSkill }, "Skill added!");
    setNewSkill({ skill: "", before: "Beginner", usedFor: "", after: "Intermediate" });
  };

  const handleDeleteSkill = (index) => handlePersonalUpdate({ type: "delete_skill", index }, "Skill removed!");

  const handleSaveDeliverables = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateArchiveData(project._id, { type: "deliverables", deliverables });
      onUpdate();
      toast.success("Team deliverables saved!");
    } catch {
      toast.error("Failed to save deliverables");
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
        <div className="journey-tab__grid">
          {/* MY PROGRESS (Auto-calculated) */}
          <div className="journey-card full-width" style={{ background: "rgba(10, 132, 255, 0.05)", border: "1px solid rgba(10, 132, 255, 0.2)" }}>
            <h3 style={{ color: "#0a84ff" }}>My Progress</h3>
            <div style={{ display: "flex", gap: "24px", marginTop: "12px" }}>
              <div>
                <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                  {tasks.filter(t => {
                    const aId = typeof t.assignedTo === 'object' && t.assignedTo !== null ? t.assignedTo._id : t.assignedTo;
                    const uId = typeof teamRecord.userId === 'object' && teamRecord.userId !== null ? teamRecord.userId._id : teamRecord.userId;
                    return aId === uId && t.status === 'done';
                  }).length}
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>Tasks Completed</div>
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: "bold" }}>{personalJourney.contributions?.length || 0}</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>Contributions</div>
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: "bold" }}>{personalJourney.challenges?.length || 0}</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>Challenges Documented</div>
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: "bold" }}>{personalJourney.skills?.length || 0}</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>Skills Added</div>
              </div>
            </div>
          </div>

          {/* CONTRIBUTIONS */}
          <div className="journey-card full-width">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>My Contributions & Achievements</h3>
              <Button variant="outline" size="small" onClick={handleSuggestContribution} disabled={aiLoading}>
                {aiLoading ? <Spinner size="sm" /> : "✨ Suggest from my activity"}
              </Button>
            </div>
            <p className="journey-card__desc">What did I actually build? Link to impact where possible.</p>
            
            {aiSuggestion && (
              <div style={{ background: "rgba(191, 90, 242, 0.1)", border: "1px solid rgba(191, 90, 242, 0.3)", padding: "16px", borderRadius: "8px", marginBottom: "16px" }}>
                <h4 style={{ color: "#bf5af2", margin: "0 0 12px 0", fontSize: "14px" }}>✨ AI Suggestion</h4>
                <div style={{ marginBottom: "12px" }}><strong>Contribution:</strong> {aiSuggestion.summary}</div>
                {aiSuggestion.potentialAchievements?.length > 0 && (
                  <div style={{ marginBottom: "12px" }}><strong>Potential Achievement:</strong> {aiSuggestion.potentialAchievements[0]}</div>
                )}
                {aiSuggestion.skills?.length > 0 && (
                  <div style={{ marginBottom: "12px" }}><strong>Skills Detected:</strong> {aiSuggestion.skills.join(", ")}</div>
                )}
                <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                  <Button 
                    variant="primary" 
                    size="small"
                    onClick={() => {
                      setNewContribution({
                        contribution: aiSuggestion.summary,
                        impact: aiSuggestion.potentialAchievements?.[0] || ""
                      });
                      setAiSuggestion(null);
                    }}
                  >
                    Edit & Add to Journey
                  </Button>
                  <Button variant="outline" size="small" onClick={() => setAiSuggestion(null)}>Dismiss</Button>
                </div>
              </div>
            )}
            <div className="journey-list-wrapper">
              {personalJourney.contributions?.map((c, i) => (
                <div key={i} className="journey-list-item">
                  <div className="journey-list-content">
                    <strong>Contribution:</strong> {c.contribution}
                    {c.impact && <div><strong>Impact:</strong> {c.impact}</div>}
                  </div>
                  <button onClick={() => handleDeleteContribution(i)} className="journey-delete-btn">&times;</button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddContribution} className="journey-inline-form wrap-form">
              <input type="text" placeholder="Contribution (e.g., Designed auth architecture)" value={newContribution.contribution} onChange={e => setNewContribution({...newContribution, contribution: e.target.value})} required />
              <input type="text" placeholder="Impact (e.g., Decreased login latency by 20%)" value={newContribution.impact} onChange={e => setNewContribution({...newContribution, impact: e.target.value})} />
              <Button type="submit" variant="primary" size="small" disabled={loading}>Add</Button>
            </form>
          </div>

          {/* CHALLENGES */}
          <div className="journey-card full-width">
            <h3>Challenges I Overcame</h3>
            <p className="journey-card__desc">What roadblocks did you face, and how did you solve them?</p>
            <div className="journey-list-wrapper">
              {personalJourney.challenges?.map((c, i) => (
                <div key={i} className="journey-list-item challenge-item">
                  <div className="journey-list-content">
                    <div><strong>Problem:</strong> {c.problem}</div>
                    <div><strong>What I Tried:</strong> {c.action}</div>
                    <div><strong>Solution:</strong> {c.result}</div>
                    {c.learning && <div><strong>Learning:</strong> {c.learning}</div>}
                  </div>
                  <button onClick={() => handleDeleteChallenge(i)} className="journey-delete-btn">&times;</button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddChallenge} className="journey-block-form">
              <textarea placeholder="Problem (e.g., Socket connections failing...)" value={newChallenge.problem} onChange={e => setNewChallenge({...newChallenge, problem: e.target.value})} required rows="2" />
              <textarea placeholder="What I Tried" value={newChallenge.action} onChange={e => setNewChallenge({...newChallenge, action: e.target.value})} required rows="2" />
              <textarea placeholder="Solution" value={newChallenge.result} onChange={e => setNewChallenge({...newChallenge, result: e.target.value})} rows="2" />
              <textarea placeholder="What I Learned" value={newChallenge.learning} onChange={e => setNewChallenge({...newChallenge, learning: e.target.value})} rows="2" />
              <Button type="submit" variant="primary" disabled={loading}>Add Challenge</Button>
            </form>
          </div>

          {/* SKILLS */}
          <div className="journey-card">
            <h3>Skills & Technologies</h3>
            <p className="journey-card__desc">What did this project teach me?</p>
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
            <form onSubmit={handleAddSkill} className="journey-block-form">
              <select value={newSkill.skill} onChange={e => setNewSkill({...newSkill, skill: e.target.value})} required>
                <option value="">Select a skill...</option>
                {availableSkills.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                <input type="text" placeholder="Before (e.g. Familiar)" value={newSkill.before} onChange={e => setNewSkill({...newSkill, before: e.target.value})} style={{ flex: 1 }} />
                <input type="text" placeholder="After (e.g. Confident)" value={newSkill.after} onChange={e => setNewSkill({...newSkill, after: e.target.value})} style={{ flex: 1 }} />
              </div>
              <input type="text" placeholder="Used for (e.g., Kanban UI)" value={newSkill.usedFor} onChange={e => setNewSkill({...newSkill, usedFor: e.target.value})} />
              <Button type="submit" variant="primary" disabled={loading}>Add Skill Journey</Button>
            </form>
          </div>

          {/* LEARNINGS */}
          <div className="journey-card">
            <h3>What I Learned</h3>
            <p className="journey-card__desc">My personal engineering journal.</p>
            <div className="journey-list-wrapper">
              {personalJourney.learnings?.map((l, i) => (
                <div key={i} className="journey-list-item">
                  <div className="journey-list-content">
                    <span className="learning-badge">{l.category}</span>
                    <p>{l.text}</p>
                  </div>
                  <button onClick={() => handleDeleteLearning(i)} className="journey-delete-btn">&times;</button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddLearning} className="journey-block-form">
              <select value={newLearning.category} onChange={e => setNewLearning({...newLearning, category: e.target.value})}>
                <option value="Technical">Technical Learning</option>
                <option value="Architecture">Architecture Learning</option>
                <option value="Engineering">Engineering Practice</option>
                <option value="Reflection">General Reflection</option>
              </select>
              <textarea placeholder="e.g., Separating controllers from services made it easier to test..." value={newLearning.text} onChange={e => setNewLearning({...newLearning, text: e.target.value})} required rows="3" />
              <Button type="submit" variant="primary" disabled={loading}>Add Learning</Button>
            </form>
          </div>

          {/* EVIDENCE */}
          <div className="journey-card full-width">
            <h3>My Evidence</h3>
            <p className="journey-card__desc">Link your specific PRs, commits, or demo timestamps to prove your claims.</p>
            <div className="journey-list-wrapper">
              {personalJourney.evidence?.map((e, i) => (
                <div key={i} className="journey-list-item">
                  <div className="journey-list-content">
                    <strong>{e.title}</strong>
                    <a href={e.url} target="_blank" rel="noreferrer" className="evidence-link">{e.url}</a>
                    {e.description && <p>{e.description}</p>}
                  </div>
                  <button onClick={() => handleDeleteEvidence(i)} className="journey-delete-btn">&times;</button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddEvidence} className="journey-inline-form wrap-form">
              <input type="text" placeholder="Title (e.g. Auth PR #42)" value={newEvidence.title} onChange={e => setNewEvidence({...newEvidence, title: e.target.value})} required />
              <input type="url" placeholder="URL" value={newEvidence.url} onChange={e => setNewEvidence({...newEvidence, url: e.target.value})} required />
              <input type="text" placeholder="Description (optional)" value={newEvidence.description} onChange={e => setNewEvidence({...newEvidence, description: e.target.value})} />
              <Button type="submit" variant="primary" disabled={loading}>Add Evidence</Button>
            </form>
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
