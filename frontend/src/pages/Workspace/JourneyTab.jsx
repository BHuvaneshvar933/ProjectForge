import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Button from "../../components/common/Button";
import { updateArchiveData } from "../../api/projectApi";
import { getAllSkills } from "../../api/skillApi";
import EducationalTip from "../../components/common/EducationalTip";
import "./JourneyTab.css";

export default function JourneyTab({ project, isMember, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const archiveData = project?.archiveData || {};

  // Form states
  const [newAchievement, setNewAchievement] = useState("");
  const [newChallenge, setNewChallenge] = useState({ problem: "", solution: "" });
  const [takeaway, setTakeaway] = useState(archiveData.takeaway || "");
  const [deliverables, setDeliverables] = useState({
    sourceCodeUrl: archiveData.deliverables?.sourceCodeUrl || "",
    demoVideoUrl: archiveData.deliverables?.demoVideoUrl || "",
    reportUrl: archiveData.deliverables?.reportUrl || "",
    slidesUrl: archiveData.deliverables?.slidesUrl || "",
  });

  // Skills
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState(archiveData.skillsGained || []);

  useEffect(() => {
    // Fetch all skills for dropdown
    getAllSkills()
      .then(res => {
        setAvailableSkills(res.data.data.skills || []);
      })
      .catch(() => console.error("Could not fetch skills"));
  }, []);

  const handleAddAchievement = async (e) => {
    e.preventDefault();
    if (!newAchievement.trim()) return;
    setLoading(true);
    try {
      await updateArchiveData(project._id, { type: "achievement", achievement: newAchievement });
      setNewAchievement("");
      onUpdate();
      toast.success("Achievement added!");
    } catch {
      toast.error("Failed to add achievement");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAchievement = async (index) => {
    setLoading(true);
    try {
      await updateArchiveData(project._id, { type: "delete_achievement", index });
      onUpdate();
      toast.success("Achievement removed!");
    } catch {
      toast.error("Failed to remove achievement");
    } finally {
      setLoading(false);
    }
  };

  const handleAddChallenge = async (e) => {
    e.preventDefault();
    if (!newChallenge.problem.trim() || !newChallenge.solution.trim()) return;
    setLoading(true);
    try {
      await updateArchiveData(project._id, { type: "challenge", challenge: newChallenge });
      setNewChallenge({ problem: "", solution: "" });
      onUpdate();
      toast.success("Challenge added!");
    } catch {
      toast.error("Failed to add challenge");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChallenge = async (index) => {
    setLoading(true);
    try {
      await updateArchiveData(project._id, { type: "delete_challenge", index });
      onUpdate();
      toast.success("Challenge removed!");
    } catch {
      toast.error("Failed to remove challenge");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTakeaway = async () => {
    setLoading(true);
    try {
      await updateArchiveData(project._id, { type: "takeaway", takeaway });
      onUpdate();
      toast.success("Takeaway saved!");
    } catch {
      toast.error("Failed to save takeaway");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDeliverables = async () => {
    setLoading(true);
    try {
      await updateArchiveData(project._id, { type: "deliverables", deliverables });
      onUpdate();
      toast.success("Deliverables saved!");
    } catch {
      toast.error("Failed to save deliverables");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async (skillId) => {
    if (!skillId) return;
    if (selectedSkills.find(s => s._id === skillId)) return;
    
    const newSkillsList = [...selectedSkills.map(s => s._id), skillId];
    setLoading(true);
    try {
      await updateArchiveData(project._id, { type: "skills", skills: newSkillsList });
      onUpdate();
      toast.success("Skill added!");
      // update local state to reflect UI changes immediately
      const addedSkill = availableSkills.find(s => s._id === skillId);
      setSelectedSkills([...selectedSkills, addedSkill]);
    } catch {
      toast.error("Failed to add skill");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSkill = async (skillId) => {
    const newSkillsList = selectedSkills.filter(s => s._id !== skillId).map(s => s._id);
    setLoading(true);
    try {
      await updateArchiveData(project._id, { type: "skills", skills: newSkillsList });
      onUpdate();
      toast.success("Skill removed!");
      setSelectedSkills(selectedSkills.filter(s => s._id !== skillId));
    } catch {
      toast.error("Failed to remove skill");
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
        <h2>Developer Journey</h2>
        <p>Document your milestones, skills gained, and challenges to build a powerful portfolio story.</p>
      </div>

      <EducationalTip content="Logging your journey items consistently helps you 'build in public' and gives you a perfect record to reference during job interviews." />
      <div className="journey-tab__grid">
        {/* Left Column */}
        <div className="journey-tab__column">
          
          {/* Project Timeline Feed */}
          <div className="journey-card">
            <h3>Project Timeline</h3>
            <p className="journey-card__desc">Automatic feed of project events.</p>
            
            {archiveData.timelineEvents?.length > 0 ? (
              <div className="journey-timeline">
                {archiveData.timelineEvents.map((evt, idx) => (
                  <div key={idx} className="journey-timeline__item">
                    <div className="journey-timeline__dot"></div>
                    <div className="journey-timeline__content">
                      <div className="journey-timeline__date">{new Date(evt.date).toLocaleDateString()}</div>
                      <strong>{evt.title}</strong>
                      {evt.description && <p>{evt.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="journey-tab__empty" style={{ padding: "20px 0" }}>No timeline events yet.</div>
            )}
          </div>

          {/* Key Milestones */}
          <div className="journey-card">
            <h3>Key Milestones</h3>
            <p className="journey-card__desc">What major milestones did you hit?</p>
            
            <ul className="journey-list">
              {(archiveData.achievements || []).map((ach, idx) => (
                <li key={idx}>
                  <span>{ach}</span>
                  <button onClick={() => handleDeleteAchievement(idx)} disabled={loading}>&times;</button>
                </li>
              ))}
            </ul>

            <form onSubmit={handleAddAchievement} className="journey-form-inline">
              <input 
                type="text" 
                placeholder="E.g. Migrated database to PostgreSQL..." 
                value={newAchievement}
                onChange={(e) => setNewAchievement(e.target.value)}
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !newAchievement.trim()}>Add</Button>
            </form>
          </div>

          {/* Challenges & Solutions */}
          <div className="journey-card">
            <h3>Challenges & Solutions</h3>
            <p className="journey-card__desc">What roadblocks did you overcome?</p>

            <div className="journey-challenges">
              {(archiveData.challenges || []).map((c, idx) => (
                <div key={idx} className="journey-challenge-item">
                  <button className="journey-challenge-delete" onClick={() => handleDeleteChallenge(idx)} disabled={loading}>&times;</button>
                  <div className="journey-challenge-row">
                    <strong>Problem:</strong>
                    <span>{c.problem}</span>
                  </div>
                  <div className="journey-challenge-row">
                    <strong>Solution:</strong>
                    <span>{c.solution}</span>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddChallenge} className="journey-form-block">
              <input 
                type="text" 
                placeholder="The problem..." 
                value={newChallenge.problem}
                onChange={(e) => setNewChallenge({...newChallenge, problem: e.target.value})}
                disabled={loading}
              />
              <textarea 
                placeholder="How you solved it..." 
                value={newChallenge.solution}
                onChange={(e) => setNewChallenge({...newChallenge, solution: e.target.value})}
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !newChallenge.problem.trim() || !newChallenge.solution.trim()}>Add Challenge</Button>
            </form>
          </div>

        </div>

        {/* Right Column */}
        <div className="journey-tab__column">
          
          {/* Skills Gained */}
          <div className="journey-card">
            <h3>Skills Gained</h3>
            <p className="journey-card__desc">What technologies did you learn or use?</p>

            <div className="journey-skills">
              {selectedSkills.map(skill => (
                <div key={skill._id} className="journey-skill-chip">
                  {skill.name}
                  <button onClick={() => handleRemoveSkill(skill._id)} disabled={loading}>&times;</button>
                </div>
              ))}
            </div>

            <div className="journey-skill-select">
              <select onChange={(e) => handleAddSkill(e.target.value)} value="" disabled={loading}>
                <option value="" disabled>+ Add a skill</option>
                {availableSkills.filter(s => !selectedSkills.find(ss => ss._id === s._id)).map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Biggest Takeaway */}
          <div className="journey-card">
            <h3>Biggest Takeaway</h3>
            <p className="journey-card__desc">If you did this project again, what would you do differently?</p>

            <div className="journey-form-block">
              <textarea 
                rows={4}
                placeholder="My biggest takeaway was..." 
                value={takeaway}
                onChange={(e) => setTakeaway(e.target.value)}
                disabled={loading}
              />
              <Button onClick={handleSaveTakeaway} disabled={loading || takeaway === archiveData.takeaway}>Save Takeaway</Button>
            </div>
          </div>

          {/* Final Deliverables */}
          <div className="journey-card">
            <h3>Final Deliverables</h3>
            <p className="journey-card__desc">Link your final outputs so they show up in your portfolio.</p>

            <div className="journey-form-block">
              <label>Source Code URL</label>
              <input 
                type="url" 
                placeholder="https://github.com/..." 
                value={deliverables.sourceCodeUrl}
                onChange={(e) => setDeliverables({...deliverables, sourceCodeUrl: e.target.value})}
                disabled={loading}
              />
              
              <label>Demo Video URL</label>
              <input 
                type="url" 
                placeholder="https://youtube.com/..." 
                value={deliverables.demoVideoUrl}
                onChange={(e) => setDeliverables({...deliverables, demoVideoUrl: e.target.value})}
                disabled={loading}
              />

              <label>Project Report URL</label>
              <input 
                type="url" 
                placeholder="https://docs.google.com/..." 
                value={deliverables.reportUrl}
                onChange={(e) => setDeliverables({...deliverables, reportUrl: e.target.value})}
                disabled={loading}
              />

              <label>Presentation Slides URL</label>
              <input 
                type="url" 
                placeholder="https://pitch.com/..." 
                value={deliverables.slidesUrl}
                onChange={(e) => setDeliverables({...deliverables, slidesUrl: e.target.value})}
                disabled={loading}
              />

              <Button onClick={handleSaveDeliverables} disabled={loading}>Save Deliverables</Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
