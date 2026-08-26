import React, { useState, useEffect } from "react";
import Button from "../common/Button";
import Spinner from "../common/Spinner";
import { getProjectReleases, createProjectRelease } from "../../api/projectApi";
import { toast } from "react-toastify";
import Modal from "../common/Modal";
import Input from "../common/Input";

export default function WorkspaceReleases({ projectId }) {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ version: "", description: "", startDate: "", releaseDate: "" });

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

  const handleCreate = async () => {
    if (!form.version) {
      return toast.error("Version name is required");
    }
    setCreating(true);
    try {
      await createProjectRelease(projectId, form);
      toast.success("Release created");
      setModalOpen(false);
      const fetchReleases = async () => {
        try {
          const res = await getProjectReleases(projectId);
          setReleases(res.data?.data?.releases || []);
        } catch {
          toast.error("Failed to load releases");
        }
      };
      await fetchReleases();
    } catch {
      toast.error("Failed to create release");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="workspace-releases" style={{ width: "100%", color: "var(--color-text-dark)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", paddingBottom: "12px", borderBottom: "1px solid var(--border-color)" }}>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "var(--color-text-dark)" }}>Releases</h2>
        <Button onClick={() => setModalOpen(true)}>Create release</Button>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Release" onConfirm={handleCreate} confirmText={creating ? "Creating..." : "Create"}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input label="Version name" value={form.version} onChange={e => setForm({...form, version: e.target.value})} placeholder="e.g. v1.0.0" />
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
