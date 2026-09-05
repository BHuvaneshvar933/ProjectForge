import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import api from "../../api/client";
import { uploadFile } from "../../api/uploadApi";
import Spinner from "../common/Spinner";
import { File, Image as ImageIcon, Link, Search, Upload, MessageSquare, CheckSquare, Paperclip, X } from "lucide-react";

export default function WorkspaceFiles({ projectId, isMember }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/projects/${projectId}/files`);
      if (res.data?.success) {
        setFiles(res.data.data.files || []);
      }
    } catch {
      toast.error("Failed to load project files");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // 1. Upload to Cloudinary
      const uploadRes = await uploadFile(file);
      if (!uploadRes.data?.success) throw new Error("Upload failed");
      
      const fileData = uploadRes.data.data;
      
      // 2. Save to Project Files
      const saveRes = await api.post(`/projects/${projectId}/files`, fileData);
      if (saveRes.data?.success) {
        toast.success("File uploaded to project clipboard");
        fetchFiles();
      }
    } catch {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      e.target.value = null; // Reset input
    }
  };

  const getFileIcon = (mimetype) => {
    if (mimetype?.startsWith("image/")) return <ImageIcon size={32} style={{ color: "var(--color-text-muted)" }} />;
    return <File size={32} style={{ color: "var(--color-text-muted)" }} />;
  };

  const getSourceBadge = (source, taskKey) => {
    if (source === "chat") {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", background: "var(--color-paper)", border: "1px solid var(--border-color)", padding: "2px 8px", borderRadius: "999px", color: "var(--color-text-dark)", fontWeight: "600" }}>
          <MessageSquare size={10} /> Chat
        </div>
      );
    }
    if (source === "task") {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", background: "var(--color-paper)", border: "1px solid var(--border-color)", padding: "2px 8px", borderRadius: "999px", color: "var(--color-text-dark)", fontWeight: "600" }}>
          <CheckSquare size={10} /> {taskKey ? `Task-${taskKey}` : "Task"}
        </div>
      );
    }
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", background: "var(--color-paper)", border: "1px solid var(--border-color)", padding: "2px 8px", borderRadius: "999px", color: "var(--color-text-dark)", fontWeight: "600" }}>
        <Paperclip size={10} /> Manual
      </div>
    );
  };

  const filteredFiles = files.filter(f => 
    (f.originalName || f.filename)?.toLowerCase().includes(search.toLowerCase())
  );

  const images = filteredFiles.filter(f => f.mimetype?.startsWith("image/"));
  const links = filteredFiles.filter(f => f.mimetype === "url" || f.mimetype === "link");
  const documents = filteredFiles.filter(f => !f.mimetype?.startsWith("image/") && f.mimetype !== "url" && f.mimetype !== "link");

  const renderFileGrid = (fileList, title) => {
    if (!fileList.length) return null;
    return (
      <div style={{ marginBottom: "24px" }}>
        <h4 style={{ margin: "0 0 16px 0", fontSize: "13px", color: "var(--color-text-dark)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
          {fileList.map(file => (
            <a 
              key={file._id} 
              href={file.url} 
              target="_blank" 
              rel="noreferrer"
              style={{
                display: "flex",
                flexDirection: "column",
                background: "var(--color-paper)",
                border: "1px solid var(--border-color)",
                borderRadius: "10px",
                padding: "16px",
                textDecoration: "none",
                color: "inherit",
                transition: "all 0.2s",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--color-text-dark)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
            >
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px", marginBottom: "12px" }}>
                {file.mimetype?.startsWith("image/") ? (
                  <img src={file.url} alt={file.originalName || file.filename} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
                ) : (
                  getFileIcon(file.mimetype)
                )}
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ fontWeight: "700", fontSize: "13px", color: "var(--color-text-dark)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={file.originalName || file.filename}>
                  {file.originalName || file.filename}
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: "500" }}>
                    {file.size ? `${(file.size / 1024).toFixed(1)} KB` : (file.mimetype === "url" || file.mimetype === "link" ? "Link" : "Document")}
                  </div>
                  {getSourceBadge(file.source, file.taskKey)}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="workspace__card" style={{ display: "flex", flexDirection: "column", height: "70vh", background: "#ffffff", border: "1px solid var(--border-color)", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
      {/* Header & Controls */}
      <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        
        <div style={{ position: "relative", flex: 1, minWidth: "200px", maxWidth: "400px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input 
            type="text" 
            placeholder="Search project files..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 12px 10px 36px", background: "var(--color-paper)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--color-text-dark)", outline: "none", fontSize: "14px" }}
          />
        </div>

        {isMember && (
          <div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--color-text-dark)", color: "#ffffff", padding: "8px 18px", borderRadius: "999px", border: "none", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}
            >
              {uploading ? <Spinner size="sm" color="#fff" /> : <Upload size={16} />}
              Upload File
            </button>
          </div>
        )}
      </div>

      {/* Grid View */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <Spinner size="lg" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-muted)", textAlign: "center" }}>
            <Paperclip size={48} style={{ opacity: 0.3, marginBottom: "16px" }} />
            <p style={{ fontSize: "16px", fontWeight: "700", marginBottom: "4px", color: "var(--color-text-dark)" }}>No files found</p>
            <p style={{ fontSize: "14px" }}>Upload a file or share one in the chat to see it here.</p>
          </div>
        ) : (
          <div>
            {renderFileGrid(images, "Images")}
            {renderFileGrid(documents, "Documents")}
            {renderFileGrid(links, "Links")}
          </div>
        )}
      </div>
    </div>
  );
}
