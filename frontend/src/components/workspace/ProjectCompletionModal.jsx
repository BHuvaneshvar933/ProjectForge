import React, { useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";

export default function ProjectCompletionModal({ isOpen, onClose, project, onComplete }) {
  const [visibility, setVisibility] = useState("public"); // 'public' | 'private'
  
  if (!project) return null;

  const archiveData = project.archiveData || {};
  const hasAchievements = archiveData.achievements?.length > 0;
  const hasTakeaway = !!archiveData.takeaway;
  const hasDeliverables = archiveData.deliverables && (
    archiveData.deliverables.sourceCodeUrl || 
    archiveData.deliverables.demoVideoUrl || 
    archiveData.deliverables.reportUrl || 
    archiveData.deliverables.slidesUrl
  );

  const missingSections = [];
  if (!hasAchievements) missingSections.push("Key Achievements");
  if (!hasTakeaway) missingSections.push("Biggest Takeaway");
  if (!hasDeliverables) missingSections.push("Final Deliverables");

  const isComplete = missingSections.length === 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete & Archive Project" hideDefaultActions={true}>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        <div>
          <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: "12px" }}>
            You are about to mark this project as completed. It will be archived and become part of your knowledge base.
          </p>

          {!isComplete && (
            <div style={{ background: "rgba(255,165,0,0.1)", border: "1px solid rgba(255,165,0,0.3)", borderRadius: "8px", padding: "12px", color: "orange", fontSize: "14px", marginBottom: "16px" }}>
              <strong>Tip:</strong> Your Journey tab is missing some information. For a stronger portfolio piece, consider adding:
              <ul style={{ marginLeft: "20px", marginTop: "8px" }}>
                {missingSections.map(s => <li key={s}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div>
          <h4 style={{ color: "#fff", marginBottom: "8px", fontSize: "15px" }}>Archive Visibility</h4>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "12px" }}>
            Who should be able to see this completed project?
          </p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", background: "rgba(255,255,255,0.05)", padding: "12px", borderRadius: "8px", border: visibility === "public" ? "1px solid #0a84ff" : "1px solid transparent" }}>
              <input type="radio" name="visibility" value="public" checked={visibility === "public"} onChange={() => setVisibility("public")} />
              <div>
                <strong style={{ color: "#fff", display: "block" }}>Public Portfolio (Recommended)</strong>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>Anyone can view this project and its journey. Great for sharing with employers.</span>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", background: "rgba(255,255,255,0.05)", padding: "12px", borderRadius: "8px", border: visibility === "private" ? "1px solid #0a84ff" : "1px solid transparent" }}>
              <input type="radio" name="visibility" value="private" checked={visibility === "private"} onChange={() => setVisibility("private")} />
              <div>
                <strong style={{ color: "#fff", display: "block" }}>Team Only (Private)</strong>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>Only project members can access this archive.</span>
              </div>
            </label>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
          <Button variant="outline" type="button" onClick={onClose}>Wait, go back</Button>
          <Button type="button" onClick={() => onComplete(visibility)}>Complete & Archive</Button>
        </div>
      </div>
    </Modal>
  );
}
