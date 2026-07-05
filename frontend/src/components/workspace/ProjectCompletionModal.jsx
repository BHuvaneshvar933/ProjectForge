import React, { useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";

export default function ProjectCompletionModal({ isOpen, onClose, project, onComplete }) {
  const [visibility, setVisibility] = useState("public");

  if (!project) return null;

  const handleSubmit = () => {
    onComplete(visibility);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete & Archive Project" hideDefaultActions={true}>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        <div>
          <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: "12px" }}>
            You are about to mark this project as completed. Once completed, your entire team will be able to reflect on the journey and generate personalized career assets!
          </p>
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

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={handleSubmit}>Complete Project</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
