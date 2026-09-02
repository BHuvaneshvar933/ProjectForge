import React, { useState, useEffect } from "react";
import Button from "../common/Button";
import Spinner from "../common/Spinner";
import { getProjectReleases, createProjectRelease, updateProjectRelease } from "../../api/projectApi";
import { toast } from "react-toastify";
import Modal from "../common/Modal";
import Input from "../common/Input";

export default function WorkspaceReleases({ projectId }) {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [conflictError, setConflictError] = useState(false);
  const [form, setForm] = useState({ version: "", description: "", startDate: "", releaseDate: "", status: "UNRELEASED", __v: undefined });

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        const res = await getProjectReleases(projectId);
        setReleases(res.data?.data?.releases || []);
      } catch {
        toast.error("Failed to load releases");
      } finally {
        setLoading(false);
      }
    };
    fetchReleases();
  }, [projectId]);

  const handleSave = async () => {
    if (!form.version) {
      return toast.error("Version name is required");
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateProjectRelease(projectId, editingId, form);
        toast.success("Release updated");
      } else {
        await createProjectRelease(projectId, form);
        toast.success("Release created");
      }
      setModalOpen(false);
      setEditingId(null);
      setConflictError(false);
      const res = await getProjectReleases(projectId);
      setReleases(res.data?.data?.releases || []);
    } catch (err) {
      if (err.response?.status === 409) {
        setConflictError(true);
      } else {
        toast.error("Failed to save release");
      }
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (release) => {
    setForm({
      version: release.version || "",
      description: release.description || "",
      startDate: release.startDate ? release.startDate.split("T")[0] : "",
      releaseDate: release.releaseDate ? release.releaseDate.split("T")[0] : "",
      status: release.status || "UNRELEASED",
      __v: release.__v,
    });
    setEditingId(release._id);
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setForm({ version: "", description: "", startDate: "", releaseDate: "", status: "UNRELEASED", __v: undefined });
    setEditingId(null);
    setModalOpen(true);
  };

  if (loading) return <Spinner />;

  return (
    <div className="workspace-releases" style={{ width: "100%", color: "var(--color-text-dark)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", paddingBottom: "12px", borderBottom: "1px solid var(--border-color)" }}>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "var(--color-text-dark)" }}>Releases</h2>
        <Button onClick={openCreateModal}>Create release</Button>
      </div>

      {releases.length === 0 ? (
        <div style={{ padding: "60px 24px", textAlign: "center", background: "#ffffff", border: "1px solid var(--border-color)", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "700", color: "var(--color-text-dark)" }}>Track your releases</h3>
          <p style={{ color: "var(--color-text-muted)", margin: "0 0 24px 0", maxWidth: "440px", fontSize: "14px" }}>
            Releases help you track project milestones and software versions. Group tasks into releases to see progress and ensure you're ready to ship.
          </p>
          <Button onClick={() => setModalOpen(true)}>Create Release</Button>
        </div>
      ) : (
        <div style={{ overflowX: "auto", background: "#ffffff", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--color-text-dark)", fontSize: "14px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "14px 18px", fontWeight: "700", color: "var(--color-text-dark)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Release</th>
                <th style={{ padding: "14px 18px", fontWeight: "700", color: "var(--color-text-dark)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                <th style={{ padding: "14px 18px", fontWeight: "700", color: "var(--color-text-dark)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Progress</th>
                <th style={{ padding: "14px 18px", fontWeight: "700", color: "var(--color-text-dark)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Start date</th>
                <th style={{ padding: "14px 18px", fontWeight: "700", color: "var(--color-text-dark)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Release date</th>
                <th style={{ padding: "14px 18px", fontWeight: "700", color: "var(--color-text-dark)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Description</th>
                <th style={{ padding: "14px 18px", fontWeight: "700", color: "var(--color-text-dark)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}></th>
              </tr>
            </thead>
            <tbody>
              {releases.map(r => (
                <tr key={r._id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "14px 18px", color: "var(--color-text-dark)", fontWeight: "700" }}>{r.version}</td>
                  <td style={{ padding: "14px 18px" }}>
                    <span style={{ padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "700", background: "var(--color-paper)", border: "1px solid var(--border-color)", color: "var(--color-text-dark)", textTransform: "uppercase" }}>{r.status}</span>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <div style={{ width: "100px", height: "6px", background: "var(--color-paper)", border: "1px solid var(--border-color)", borderRadius: "999px", overflow: "hidden" }}>
                         <div style={{ width: `${r.progress}%`, height: "100%", background: "var(--color-text-dark)" }}></div>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--color-text-dark)" }}>{r.progress}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 18px", color: "var(--color-text-dark)" }}>{r.startDate ? new Date(r.startDate).toLocaleDateString() : "-"}</td>
                  <td style={{ padding: "14px 18px", color: "var(--color-text-dark)" }}>{r.releaseDate ? new Date(r.releaseDate).toLocaleDateString() : "-"}</td>
                  <td style={{ padding: "14px 18px", color: "var(--color-text-muted)" }}>{r.description || "-"}</td>
                  <td style={{ padding: "14px 18px", textAlign: "right" }}>
                    <button onClick={() => openEditModal(r)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setConflictError(false); }} title={editingId ? "Edit Release" : "Create Release"} onConfirm={handleSave} confirmText={saving ? "Saving..." : "Save"}>
        {conflictError && (
          <div style={{ background: "rgba(255, 69, 58, 0.15)", border: "1px solid #ff453a", color: "#ff453a", padding: "16px", borderRadius: "8px", marginBottom: "16px" }}>
            <p style={{ fontWeight: 600, margin: "0 0 8px 0", fontSize: "14px" }}>⚠️ This release was updated by another team member.</p>
            <p style={{ margin: "0 0 16px 0", fontSize: "13px", opacity: 0.9 }}>Your changes have <strong>not</strong> been saved. Your unsaved changes are still here.</p>
            <Button variant="danger" onClick={async () => {
              setConflictError(false);
              const res = await getProjectReleases(projectId);
              setReleases(res.data?.data?.releases || []);
              const updatedRelease = res.data?.data?.releases?.find(r => r._id === editingId);
              if (updatedRelease) openEditModal(updatedRelease);
            }} style={{ fontSize: "12px", padding: "6px 12px" }}>Reload Latest</Button>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input label="Version name" value={form.version} onChange={e => setForm({...form, version: e.target.value})} placeholder="e.g. v1.0.0" />
          {editingId && (
            <div>
              <label className="input__label">Status</label>
              <select className="workspace-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", padding: "8px", color: "#fff", marginTop: "4px" }}>
                <option value="UNRELEASED">UNRELEASED</option>
                <option value="RELEASED">RELEASED</option>
              </select>
            </div>
          )}
          <Input label="Start Date" type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
          <Input label="Release Date" type="date" value={form.releaseDate} onChange={e => setForm({...form, releaseDate: e.target.value})} />
          <div>
            <label className="input__label">Description</label>
            <textarea className="workspace-modal__textarea" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
