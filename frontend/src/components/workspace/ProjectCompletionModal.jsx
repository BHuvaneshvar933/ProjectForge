import React from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";

export default function ProjectCompletionModal({ isOpen, onClose, project, onComplete }) {
  if (!project) return null;

  const handleSubmit = () => {
    onComplete("public"); // Default to public or private doesn't matter since showcase is gone
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Project" hideDefaultActions={true}>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <p style={{ color: "var(--color-text-dark)", marginBottom: "12px", fontSize: "14px" }}>
            Are you sure you want to mark this project as completed? Your team will be able to reflect on the journey and generate personalized career assets.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={handleSubmit}>Complete Project</Button>
        </div>
      </div>
    </Modal>
  );
}
