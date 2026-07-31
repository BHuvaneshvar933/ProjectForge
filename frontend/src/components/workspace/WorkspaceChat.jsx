import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import Spinner from "../common/Spinner";
import { getSocket } from "../../realtime/socketClient";
import { getProjectMessages } from "../../api/messageApi";
import { uploadFile } from "../../api/uploadApi";
import { Paperclip, X } from "lucide-react";

export default function WorkspaceChat({ projectId, isMember, me, isCompleted }) {
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const listRef = useRef(null);
  const chatInputRef = useRef(null);
  const typingTimer = useRef(null);
  const stopTypingTimer = useRef(null);

  // Initial Fetch
  useEffect(() => {
    if (!isMember) return;
    let mounted = true;
    
    const fetchMessages = async () => {
      setChatLoading(true);
      try {
        const res = await getProjectMessages(projectId, { page: 1, limit: 50 });
        if (mounted) {
          const list = res.data?.data?.messages ?? [];
          setMessages(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        if (mounted) {
          toast.error(e?.response?.data?.message || "Failed to load chat history");
          setMessages([]);
        }
      } finally {
        if (mounted) setChatLoading(false);
      }
    };

    fetchMessages();
    return () => { mounted = false; };
  }, [projectId, isMember]);

  // Socket logic
  useEffect(() => {
    if (!isMember) return;

    const socket = getSocket();

    const onNewMessage = (msg) => {
      if (String(msg?.projectId) !== String(projectId)) return;
      setMessages((prev) => [...prev, msg]);
    };

    const onTyping = ({ userId, name }) => {
      if (!userId) return;
      setTypingUsers((prev) => {
        if (prev.some((u) => String(u.userId) === String(userId))) return prev;
        return [...prev, { userId, name: name || "Someone" }];
      });
    };

    const onStopTyping = ({ userId }) => {
      if (!userId) return;
      setTypingUsers((prev) => prev.filter((u) => String(u.userId) !== String(userId)));
    };

    const onMessageEdited = (editedMsg) => {
      setMessages((prev) => prev.map((m) => (m._id === editedMsg._id ? { ...m, ...editedMsg } : m)));
    };

    const onMessageDeleted = (deletedMsg) => {
      setMessages((prev) => prev.map((m) => (m._id === deletedMsg._id ? { ...m, isDeleted: true } : m)));
    };

    socket.on("new-message", onNewMessage);
    socket.on("message-edited", onMessageEdited);
    socket.on("message-deleted", onMessageDeleted);
    socket.on("user-typing", onTyping);
    socket.on("user-stop-typing", onStopTyping);

    socket.emit("join-project", projectId, (res) => {
      if (!res?.ok) {
        toast.error(res?.error || "Failed to join chat");
      }
    });

    return () => {
      socket.off("new-message", onNewMessage);
      socket.off("message-edited", onMessageEdited);
      socket.off("message-deleted", onMessageDeleted);
      socket.off("user-typing", onTyping);
      socket.off("user-stop-typing", onStopTyping);
    };
  }, [isMember, projectId]);

  // Auto scroll
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, typingUsers]);

  const emitTyping = () => {
    if (!isMember) return;
    const socket = getSocket();

    if (typingTimer.current) return;
    typingTimer.current = setTimeout(() => {
      typingTimer.current = null;
    }, 400);

    socket.emit("typing", { projectId });

    if (stopTypingTimer.current) clearTimeout(stopTypingTimer.current);
    stopTypingTimer.current = setTimeout(() => {
      socket.emit("stop-typing", { projectId });
    }, 900);
  };

  const onSend = async () => {
    const content = chatInput.trim();
    if (!content && attachments.length === 0) return;
    if (!isMember) return;

    const socket = getSocket();
    
    if (editingMessageId) {
      // Handle Edit
      socket.emit("edit-message", { projectId, messageId: editingMessageId, content }, (res) => {
        if (!res?.ok) toast.error(res?.error || "Failed to edit message");
      });
      setEditingMessageId(null);
      setChatInput("");
      return;
    }

    // Handle Send
    socket.emit("send-message", { projectId, content, attachments }, (res) => {
      if (!res?.ok) {
        toast.error(res?.error || "Failed to send message");
      }
    });

    setChatInput("");
    setAttachments([]);
    if (chatInputRef.current) {
      chatInputRef.current.style.height = "";
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await uploadFile(file);
      if (res.data?.success) {
        setAttachments(prev => [...prev, res.data.data]);
      } else {
        toast.error("Upload failed");
      }
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = null; // Reset input
    }
  };

  const handleEditClick = (msg) => {
    setEditingMessageId(msg._id);
    setChatInput(msg.content);
    if (chatInputRef.current) chatInputRef.current.focus();
  };

  const handleDeleteMessage = (msgId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    const socket = getSocket();
    socket.emit("delete-message", { projectId, messageId: msgId }, (res) => {
      if (!res?.ok) toast.error(res?.error || "Failed to delete message");
    });
  };

  const getSenderName = (m) => m?.sender?.name || m?.senderId?.name || "User";
  const getSenderId = (m) => m?.sender?._id || m?.senderId?._id || m?.senderId || m?.sender;
  const isMineMessage = (m) => {
    if (!me?._id) return false;
    const sid = getSenderId(m);
    if (!sid) return false;
    return String(sid) === String(me._id);
  };

  return (
    <div className="workspace__card">
      <div className="workspace-chat">
        <div ref={listRef} className="workspace-chat__list">
          {chatLoading ? (
            <div className="project-detail__loading">
              <Spinner size="lg" />
              <p className="project-detail__loading-text">Loading messages...</p>
            </div>
          ) : (
            <>
              {messages.map((m) => {
                const mine = isMineMessage(m);
                const senderName = getSenderName(m);
                const isTombstone = m.isDeleted;

                return (
                  <div
                    key={m._id || `${m.createdAt}-${m.content}`}
                    className={`workspace-chat__row ${mine ? "is-mine" : "is-theirs"}`.trim()}
                  >
                    {!mine && (
                      <div className="workspace-chat__avatar" aria-hidden="true">
                        {(senderName || "U")[0]}
                      </div>
                    )}
                    <div className={`workspace-chat__bubble ${mine ? "is-mine" : "is-theirs"}`.trim()} style={{ position: "relative" }}>
                      {!mine && <div className="workspace-chat__sender">{senderName}</div>}
                      
                      {isTombstone ? (
                        <div className="workspace-chat__text" style={{ fontStyle: "italic", opacity: 0.6 }}>
                          This message was deleted.
                        </div>
                      ) : (
                        <>
                          {m.attachments && m.attachments.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: m.content ? "8px" : "0" }}>
                              {m.attachments.map(att => (
                                <a key={att.url} href={att.url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px", background: "rgba(0,0,0,0.05)", borderRadius: "6px", textDecoration: "none", color: mine ? "#000" : "inherit", fontSize: "12px", border: "1px solid rgba(128,128,128,0.2)" }}>
                                  <Paperclip size={14} />
                                  <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "200px" }}>{att.originalName || att.filename || "Attachment"}</span>
                                </a>
                              ))}
                            </div>
                          )}
                          {m.content && (
                            <div className="workspace-chat__text">
                              {m.content}
                            </div>
                          )}
                        </>
                      )}
                      
                      <div className="workspace-chat__time">
                        {m?.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ""}
                        {!isTombstone && m.isEdited && <span style={{ marginLeft: "4px", fontSize: "10px", opacity: 0.7 }}>(edited)</span>}
                      </div>

                      {mine && !isTombstone && (
                        <div style={{ position: "absolute", top: "50%", right: "100%", transform: "translateY(-50%)", paddingRight: "8px" }} className="workspace-chat__menu-wrapper">
                          <button className="workspace-chat__menu-btn">•••</button>
                          <div className="workspace-chat__menu">
                            <div className="workspace-chat__menu-item" onClick={() => handleEditClick(m)}>Edit</div>
                            <div className="workspace-chat__menu-item" style={{ color: "#ff453a" }} onClick={() => handleDeleteMessage(m._id)}>Delete</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {typingUsers.length > 0 && (
                <div className="workspace-chat__typing-row" aria-live="polite">
                  <div className="workspace-chat__typing-dot" aria-hidden="true" />
                  <div className="workspace-chat__typing">
                    {typingUsers.slice(0, 2).map((u) => u.name).join(", ")}
                    {typingUsers.length > 2 ? " and others" : ""} typing...
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {isCompleted ? (
          <div style={{ padding: "16px", textAlign: "center", color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            Chat is locked for completed projects.
          </div>
        ) : (
          <div className="workspace-chat__composer-wrapper" style={{ position: "relative" }}>
            
            <div className="workspace-chat__composer" style={{ display: "flex", flexDirection: "column", background: "rgba(255, 255, 255, 0.05)", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "4px" }}>
              {attachments.length > 0 && (
                <div style={{ display: "flex", gap: "8px", padding: "8px", flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {attachments.map((att, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(0,0,0,0.2)", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>
                      <Paperclip size={12} />
                      <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.originalName || att.filename}</span>
                      <button type="button" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", display: "flex", padding: "2px" }}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", padding: "12px", cursor: "pointer", display: "flex" }}
              >
                {uploading ? <Spinner size="sm" /> : <Paperclip size={18} />}
              </button>
              <textarea
                ref={chatInputRef}
                className="workspace-chat__input"
                value={chatInput}
                onChange={(e) => {
                  const next = e.target.value;
                  setChatInput(next);
                  emitTyping();

                  // Auto-grow up to max height for a chat-app feel.
                  const el = chatInputRef.current;
                  if (el) {
                    el.style.height = "auto";
                    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
                  }
                }}
                placeholder={editingMessageId ? "Edit message..." : "Write a message..."}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                  if (e.key === "Escape" && editingMessageId) {
                    setEditingMessageId(null);
                    setChatInput("");
                  }
                }}
              />

              <button
                type="button"
                className="workspace-chat__send"
                onClick={onSend}
                disabled={chatInput.trim().length === 0 && attachments.length === 0}
                aria-label="Send message"
                title={(chatInput.trim().length > 0 || attachments.length > 0) ? "Send" : "Type a message to send"}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 2L11 13" />
                  <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
