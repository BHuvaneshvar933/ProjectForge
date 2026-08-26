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
  const [form, setForm] = useState({ version: "", description: "", startDate: "", releaseDate: "", status: "UNRELEASED" });

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
      const res = await getProjectReleases(projectId);
      setReleases(res.data?.data?.releases || []);
    } catch {
      toast.error("Failed to save release");
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
    });
    setEditingId(release._id);
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setForm({ version: "", description: "", startDate: "", releaseDate: "", status: "UNRELEASED" });
    setEditingId(null);
    setModalOpen(true);
  };

  if (loading) return <Spinner />;

  return (
    <div className="workspace-releases">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>Releases</h2>
        <Button onClick={openCreateModal}>Create release</Button>
      </div>

      {releases.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: "60px", marginBottom: "24px" }}>🚢</div>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>Track your releases</h3>
          <p style={{ color: "rgba(255,255,255,0.5)", margin: "0 0 24px 0", maxWidth: "400px" }}>
            Releases help you track project milestones and software versions. Group tasks into releases to see progress and ensure you're ready to ship.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "#fff", fontSize: "14px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <th style={{ padding: "12px 16px", fontWeight: "600", color: "rgba(255,255,255,0.6)" }}>Release</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", color: "rgba(255,255,255,0.6)" }}>Status</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", color: "rgba(255,255,255,0.6)" }}>Progress</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", color: "rgba(255,255,255,0.6)" }}>Start date</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", color: "rgba(255,255,255,0.6)" }}>Release date</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", color: "rgba(255,255,255,0.6)" }}>Description</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", color: "rgba(255,255,255,0.6)" }}></th>
              </tr>
            </thead>
            <tbody>
              {releases.map(r => (
                <tr key={r._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "12px 16px", color: "#0a84ff", fontWeight: "500" }}>{r.version}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "12px", background: "rgba(255,255,255,0.1)", textTransform: "uppercase" }}>{r.status}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <div style={{ width: "100px", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
                         <div style={{ width: `${r.progress}%`, height: "100%", background: "#32d74b" }}></div>
                      </div>
                      <span>{r.progress}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>{r.startDate ? new Date(r.startDate).toLocaleDateString() : "-"}</td>
                  <td style={{ padding: "12px 16px" }}>{r.releaseDate ? new Date(r.releaseDate).toLocaleDateString() : "-"}</td>
                  <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.5)" }}>{r.description || "-"}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button onClick={() => openEditModal(r)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Release" : "Create Release"} onConfirm={handleSave} confirmText={saving ? "Saving..." : "Save"}>
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
