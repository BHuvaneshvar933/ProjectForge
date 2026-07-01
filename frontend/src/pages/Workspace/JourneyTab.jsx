import { useState } from "react";
import { toast } from "react-toastify";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import { updateArchiveData } from "../../api/projectApi";
import { getAllSkills } from "../../api/skillApi";
import { useEffect } from "react";
import "./JourneyTab.css";

export default function JourneyTab({ project, isMember, onUpdate }) {
  const [modalType, setModalType] = useState(null); // 'timeline', 'challenge', 'achievement', 'takeaway', 'skills', 'deliverables'
  const [loading, setLoading] = useState(false);
  const [allSkills, setAllSkills] = useState([]);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [achievement, setAchievement] = useState("");
  const [takeaway, setTakeaway] = useState(project?.archiveData?.takeaway || "");
  const [selectedSkills, setSelectedSkills] = useState([]);
  
  const [deliverables, setDeliverables] = useState({
    sourceCodeUrl: project?.archiveData?.deliverables?.sourceCodeUrl || "",
    demoVideoUrl: project?.archiveData?.deliverables?.demoVideoUrl || "",
    reportUrl: project?.archiveData?.deliverables?.reportUrl || "",
    slidesUrl: project?.archiveData?.deliverables?.slidesUrl || "",
  });

  const archiveData = project?.archiveData || { timelineEvents: [], challenges: [], achievements: [], skillsGained: [], takeaway: "", deliverables: {} };

  useEffect(() => {
    getAllSkills().then(res => setAllSkills(res.data?.data?.skills || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isMember) return;
    setLoading(true);
    try {
      let data = {};
      if (modalType === "timeline") {
        data = { type: "timeline", event: { title, description } };
      } else if (modalType === "challenge") {
        data = { type: "challenge", challenge: { problem, solution } };
      } else if (modalType === "achievement") {
        data = { type: "achievement", achievement };
      } else if (modalType === "takeaway") {
        data = { type: "takeaway", takeaway };
      } else if (modalType === "skills") {
        data = { type: "skills", skills: selectedSkills };
      } else if (modalType === "deliverables") {
        data = { type: "deliverables", deliverables };
      }

      await updateArchiveData(project._id, data);
      toast.success("Archive updated successfully!");
      onUpdate();
      setModalType(null);
      
      // Reset forms
      setTitle(""); setDescription(""); setProblem(""); setSolution(""); setAchievement("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update archive");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type, index) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    setLoading(true);
    try {
      await updateArchiveData(project._id, { type: `delete_${type}`, index });
      toast.success(`${type} deleted successfully!`);
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to delete ${type}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="journey-tab">
      
      {/* Deliverables Section */}
      <div className="journey-section">
        <div className="journey-section__header">
          <h3 className="journey-section__title">Final Deliverables</h3>
          {isMember && <Button variant="outline" size="sm" onClick={() => setModalType("deliverables")}>Edit Links</Button>}
        </div>
        <div className="journey-deliverables">
          {archiveData.deliverables?.sourceCodeUrl && (
            <a href={archiveData.deliverables.sourceCodeUrl} target="_blank" rel="noreferrer" className="journey-deliverable-btn">
              🔗 Source Code
            </a>
          )}
          {archiveData.deliverables?.demoVideoUrl && (
            <a href={archiveData.deliverables.demoVideoUrl} target="_blank" rel="noreferrer" className="journey-deliverable-btn">
              ▶️ Demo Video
            </a>
          )}
          {archiveData.deliverables?.reportUrl && (
            <a href={archiveData.deliverables.reportUrl} target="_blank" rel="noreferrer" className="journey-deliverable-btn">
              📄 Project Report
            </a>
          )}
          {archiveData.deliverables?.slidesUrl && (
            <a href={archiveData.deliverables.slidesUrl} target="_blank" rel="noreferrer" className="journey-deliverable-btn">
              📊 Presentation Slides
            </a>
          )}
          {!archiveData.deliverables?.sourceCodeUrl && !archiveData.deliverables?.demoVideoUrl && !archiveData.deliverables?.reportUrl && !archiveData.deliverables?.slidesUrl && (
            <div className="journey-empty">No deliverables have been added yet.</div>
          )}
        </div>
      </div>

      {/* Timeline Section */}
      <div className="journey-section">
        <div className="journey-section__header">
          <h3 className="journey-section__title">Project Timeline</h3>
          {isMember && <Button variant="outline" size="sm" onClick={() => setModalType("timeline")}>+ Add Milestone</Button>}
        </div>
        {archiveData.timelineEvents?.length > 0 ? (
          <div className="journey-timeline">
            {archiveData.timelineEvents.map((evt, idx) => (
              <div key={idx} className="journey-timeline__item">
                <div className="journey-timeline__dot"></div>
                <div className="journey-timeline__date">{new Date(evt.date).toLocaleDateString()}</div>
                <div className="journey-timeline__content">
                  <div className="journey-timeline__title">{evt.title}</div>
                  <div className="journey-timeline__desc">{evt.description}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="journey-empty">Timeline is currently empty. Complete tasks or manually add milestones!</div>
        )}
      </div>

      {/* Challenges Section */}
      <div className="journey-section">
        <div className="journey-section__header">
          <h3 className="journey-section__title">Challenges & Solutions</h3>
          {isMember && <Button variant="outline" size="sm" onClick={() => setModalType("challenge")}>+ Add Challenge</Button>}
        </div>
        {archiveData.challenges?.length > 0 ? (
          <div className="journey-grid">
            {archiveData.challenges.map((c, idx) => (
              <div key={idx} className="journey-card">
                <div className="journey-card__problem">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="journey-card__label" style={{color: "#ff453a"}}>The Problem</div>
                    {isMember && <button className="journey-delete-btn" onClick={() => handleDelete("challenge", idx)}>🗑️</button>}
                  </div>
                  <div className="journey-card__text">{c.problem}</div>
                </div>
                <div className="journey-card__solution">
                  <div className="journey-card__label" style={{color: "#32d74b"}}>The Solution</div>
                  <div className="journey-card__text">{c.solution}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="journey-empty">No challenges documented yet.</div>
        )}
      </div>

      {/* Achievements Section */}
      <div className="journey-section">
        <div className="journey-section__header">
          <h3 className="journey-section__title">Key Achievements</h3>
          {isMember && <Button variant="outline" size="sm" onClick={() => setModalType("achievement")}>+ Add Achievement</Button>}
        </div>
        {archiveData.achievements?.length > 0 ? (
          <ul className="journey-achievements-list" style={{ paddingLeft: "20px", color: "rgba(255,255,255,0.8)" }}>
            {archiveData.achievements.map((ach, idx) => (
              <li key={idx} style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{ach}</span>
                  {isMember && <button className="journey-delete-btn" onClick={() => handleDelete("achievement", idx)}>🗑️</button>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="journey-empty">No achievements documented yet.</div>
        )}
      </div>

      {/* Skills Gained Section */}
      <div className="journey-section">
        <div className="journey-section__header">
          <h3 className="journey-section__title">Skills Gained</h3>
          {isMember && <Button variant="outline" size="sm" onClick={() => setModalType("skills")}>Edit Skills</Button>}
        </div>
        {archiveData.skillsGained?.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {archiveData.skillsGained.map((skill, idx) => (
              <div key={idx} style={{ background: "rgba(10,132,255,0.2)", color: "#0a84ff", padding: "4px 12px", borderRadius: "16px", fontSize: "14px" }}>
                ✓ {skill.name}
              </div>
            ))}
          </div>
        ) : (
          <div className="journey-empty">No skills tagged yet.</div>
        )}
      </div>

      {/* Biggest Takeaway Section */}
      <div className="journey-section">
        <div className="journey-section__header">
          <h3 className="journey-section__title">Biggest Takeaway</h3>
          {isMember && <Button variant="outline" size="sm" onClick={() => setModalType("takeaway")}>Edit Takeaway</Button>}
        </div>
        {archiveData.takeaway ? (
          <div className="journey-lesson">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
              <div className="journey-lesson__icon">💡</div>
              <div className="journey-lesson__text" style={{ flex: 1 }}>
                <em>"If I started this project again tomorrow, what would I do differently?"</em><br/><br/>
                {archiveData.takeaway}
              </div>
            </div>
          </div>
        ) : (
          <div className="journey-empty">No takeaway documented yet.</div>
        )}
      </div>

      <Modal isOpen={!!modalType} onClose={() => setModalType(null)} title={`Add ${modalType}`} hideDefaultActions={true}>
        <form onSubmit={handleSubmit} className="journey-modal-form">
          {modalType === "timeline" && (
            <>
              <Input label="Milestone Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea className="workspace-modal__textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
              </div>
            </>
          )}

          {modalType === "challenge" && (
            <>
              <div className="input-group">
                <label className="input-label">What went wrong / The Problem</label>
                <textarea className="workspace-modal__textarea" rows={3} value={problem} onChange={(e) => setProblem(e.target.value)} required></textarea>
              </div>
              <div className="input-group">
                <label className="input-label">How we fixed it / The Solution</label>
                <textarea className="workspace-modal__textarea" rows={3} value={solution} onChange={(e) => setSolution(e.target.value)} required></textarea>
              </div>
            </>
          )}

          {modalType === "achievement" && (
            <div className="input-group">
              <label className="input-label">Key Achievement</label>
              <Input placeholder="e.g. Built real-time chat" value={achievement} onChange={(e) => setAchievement(e.target.value)} required />
            </div>
          )}

          {modalType === "takeaway" && (
            <div className="input-group">
              <label className="input-label">If you started this project again tomorrow, what would you do differently?</label>
              <textarea className="workspace-modal__textarea" rows={4} value={takeaway} onChange={(e) => setTakeaway(e.target.value)} required></textarea>
            </div>
          )}

          {modalType === "skills" && (
            <div className="input-group">
              <label className="input-label">Select Skills Gained (Hold Ctrl/Cmd to select multiple)</label>
              <select 
                multiple 
                className="workspace-modal__textarea" 
                style={{ height: "150px" }}
                value={selectedSkills}
                onChange={(e) => {
                  const options = [...e.target.selectedOptions];
                  const values = options.map(opt => opt.value);
                  setSelectedSkills(values);
                }}
              >
                {allSkills.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {modalType === "deliverables" && (
            <>
              <Input label="Source Code URL (GitHub, GitLab)" value={deliverables.sourceCodeUrl} onChange={(e) => setDeliverables({...deliverables, sourceCodeUrl: e.target.value})} />
              <Input label="Demo Video URL (YouTube, Vimeo)" value={deliverables.demoVideoUrl} onChange={(e) => setDeliverables({...deliverables, demoVideoUrl: e.target.value})} />
              <Input label="Project Report URL (Google Docs, PDF)" value={deliverables.reportUrl} onChange={(e) => setDeliverables({...deliverables, reportUrl: e.target.value})} />
              <Input label="Presentation Slides URL" value={deliverables.slidesUrl} onChange={(e) => setDeliverables({...deliverables, slidesUrl: e.target.value})} />
            </>
          )}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
            <Button variant="outline" type="button" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit" disabled={loading}>Save</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
