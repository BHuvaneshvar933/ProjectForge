import { useState } from "react";
import { toast } from "react-toastify";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import { updateArchiveData } from "../../api/projectApi";
import "./JourneyTab.css";

export default function JourneyTab({ project, isMember, onUpdate }) {
  const [modalType, setModalType] = useState(null); // 'timeline', 'challenge', 'lesson', 'deliverables'
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [lesson, setLesson] = useState("");
  const [deliverables, setDeliverables] = useState({
    sourceCodeUrl: project?.archiveData?.deliverables?.sourceCodeUrl || "",
    demoVideoUrl: project?.archiveData?.deliverables?.demoVideoUrl || "",
    reportUrl: project?.archiveData?.deliverables?.reportUrl || "",
    slidesUrl: project?.archiveData?.deliverables?.slidesUrl || "",
  });

  const archiveData = project?.archiveData || { timelineEvents: [], challenges: [], lessonsLearned: [], deliverables: {} };

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
      } else if (modalType === "lesson") {
        data = { type: "lesson", lesson };
      } else if (modalType === "deliverables") {
        data = { type: "deliverables", deliverables };
      }

      await updateArchiveData(project._id, data);
      toast.success("Archive updated successfully!");
      onUpdate();
      setModalType(null);
      
      // Reset forms
      setTitle(""); setDescription(""); setProblem(""); setSolution(""); setLesson("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update archive");
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
                  <div className="journey-card__label" style={{color: "#ff453a"}}>The Problem</div>
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

      {/* Lessons Learned Section */}
      <div className="journey-section">
        <div className="journey-section__header">
          <h3 className="journey-section__title">Lessons Learned</h3>
          {isMember && <Button variant="outline" size="sm" onClick={() => setModalType("lesson")}>+ Add Lesson</Button>}
        </div>
        {archiveData.lessonsLearned?.length > 0 ? (
          <div>
            {archiveData.lessonsLearned.map((l, idx) => (
              <div key={idx} className="journey-lesson">
                <div className="journey-lesson__icon">💡</div>
                <div className="journey-lesson__text">{l}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="journey-empty">No lessons learned documented yet.</div>
        )}
      </div>

      <Modal isOpen={!!modalType} onClose={() => setModalType(null)} title={`Add ${modalType}`}>
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

          {modalType === "lesson" && (
            <div className="input-group">
              <label className="input-label">Key Takeaway / Lesson Learned</label>
              <textarea className="workspace-modal__textarea" rows={3} value={lesson} onChange={(e) => setLesson(e.target.value)} required></textarea>
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
