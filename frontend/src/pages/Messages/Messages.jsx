import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getConversations, getDirectMessages } from "../../api/messageApi";
import { getMyProfile } from "../../api/userApi";
import { getSocket } from "../../realtime/socketClient";
import Spinner from "../../components/common/Spinner";
import "./Messages.css";

export default function Messages() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [activeTab, setActiveTab] = useState("owned"); // "owned" or "applied"
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const messagesEndRef = useRef(null);

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c._id === activeConvId);
  }, [conversations, activeConvId]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await getMyProfile();
        if (data?.data?.user) {
          setUser(data.data.user);
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const loadConvs = async () => {
      try {
        const { data } = await getConversations();
        const convs = data.data || [];
        setConversations(convs);
        
        const qId = searchParams.get("conversation");
        if (qId && convs.find(c => c._id === qId)) {
          setActiveConvId(qId);
        } else if (convs.length > 0 && !activeConvId && !qId) {
          // Do not auto select on mobile to show list first, but on desktop we could. 
          // For simplicity, we just leave it null initially until user selects.
        }
      } catch (err) {
        console.error("Failed to load conversations", err);
      } finally {
        setLoadingConvs(false);
      }
    };
    if (user) loadConvs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, searchParams]); // Intentionally not including activeConvId to avoid loop

  useEffect(() => {
    if (activeConvId) {
      const loadMsgs = async () => {
        setLoadingMessages(true);
        try {
          const { data } = await getDirectMessages(activeConvId);
          setMessages(data.data?.messages || []);
        } catch (err) {
          console.error("Failed to load messages", err);
        } finally {
          setLoadingMessages(false);
        }
      };
      loadMsgs();
      
      // Update URL silently
      if (searchParams.get("conversation") !== activeConvId) {
        setSearchParams({ conversation: activeConvId }, { replace: true });
      }
    } else {
      setMessages([]);
      searchParams.delete("conversation");
      setSearchParams(searchParams, { replace: true });
    }
  }, [activeConvId, searchParams, setSearchParams]);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    socket.emit("join-user");

    const handleNewMessage = (msg) => {
      if (activeConvId === msg.conversationId) {
        setMessages((prev) => {
          if (prev.find((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
      
      // Update lastMessage in conversations list
      setConversations((prev) => 
        prev.map(c => {
          if (c._id === msg.conversationId) {
            return { ...c, lastMessage: msg, lastMessageAt: msg.createdAt };
          }
          return c;
        }).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      );
    };

    socket.on("new-direct-message", handleNewMessage);
    return () => socket.off("new-direct-message", handleNewMessage);
  }, [user, activeConvId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId) return;

    const content = inputText;
    setInputText("");

    try {
      const socket = getSocket();
      socket.emit("send-direct-message", { conversationId: activeConvId, text: content }, (res) => {
        if (!res.ok) {
           console.error("Failed to send message via socket", res.error);
        } else {
           const msg = res.data;
           setMessages((prev) => {
             if (prev.find((m) => m._id === msg._id)) return prev;
             return [...prev, msg];
           });
           
           setConversations((prev) => 
            prev.map(c => {
              if (c._id === activeConvId) {
                return { ...c, lastMessage: msg, lastMessageAt: msg.createdAt };
              }
              return c;
            }).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
          );
        }
      });
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const getOtherUser = (conv) => {
    const ownerIdStr = String(conv.ownerId?._id || conv.ownerId);
    const myIdStr = String(user?._id);
    return ownerIdStr === myIdStr ? conv.applicantId : conv.ownerId;
  };

  const isOwnerMode = (conv) => {
    const ownerIdStr = String(conv.ownerId?._id || conv.ownerId);
    const myIdStr = String(user?._id);
    return ownerIdStr === myIdStr;
  };

  // Filter conversations
  const filteredConvs = conversations.filter(c => {
    if (!searchQuery) return true;
    const other = getOtherUser(c);
    const proj = c.projectId?.title || "";
    const msg = c.lastMessage?.text || "";
    const q = searchQuery.toLowerCase();
    return (
      (other?.name || "").toLowerCase().includes(q) ||
      proj.toLowerCase().includes(q) ||
      msg.toLowerCase().includes(q)
    );
  });

  // Group conversations by project for Owners, and separate for Applicants
  const ownedProjects = {};
  const appliedConvs = [];

  filteredConvs.forEach(c => {
    const pTitle = c.projectId?.title || "Unknown Project";
    if (isOwnerMode(c)) {
      if (!ownedProjects[pTitle]) ownedProjects[pTitle] = [];
      ownedProjects[pTitle].push(c);
    } else {
      appliedConvs.push(c);
    }
  });

  if (!user) {
    return (
      <div className="messages-layout">
        <div style={{ margin: "auto" }}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="messages-layout">
      {/* Sidebar */}
      <aside className={`messages-sidebar ${activeConvId ? 'hide-on-mobile' : ''}`}>
        <div className="messages-sidebar-header">
          <h2>Messages</h2>
          
          <div className="messages-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button 
              className={`messages-tab-btn ${activeTab === 'owned' ? 'active' : ''}`}
              onClick={() => setActiveTab('owned')}
            >
              Projects You Own
            </button>
            <button 
              className={`messages-tab-btn ${activeTab === 'applied' ? 'active' : ''}`}
              onClick={() => setActiveTab('applied')}
            >
              Projects Applied
            </button>
          </div>

          <div className="messages-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Search messages..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="messages-sidebar-list">
          {loadingConvs ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><Spinner /></div>
          ) : conversations.length === 0 ? (
            <div className="messages-empty-state">
              <p className="title">No conversations yet</p>
              <p className="subtitle">
                Project owners will appear here when they message you about an application.
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'owned' && (
                Object.keys(ownedProjects).length > 0 ? (
                  <div className="messages-section">
                    {Object.keys(ownedProjects).map(projectTitle => (
                    <div key={`own-${projectTitle}`} className="messages-group">
                      <div className="messages-group-title" style={{ padding: "8px 24px 4px", fontSize: "13px", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: "4px" }}>{projectTitle}</div>
                      {ownedProjects[projectTitle].map(conv => {
                        const otherUser = getOtherUser(conv);
                        const isUnread = conv.lastMessage && conv.lastMessage.senderId !== user._id && !conv.lastMessage.seen;
                        return (
                          <div 
                            key={conv._id} 
                            className={`messages-item ${activeConvId === conv._id ? 'active' : ''} ${isUnread ? 'unread' : ''}`}
                            onClick={() => setActiveConvId(conv._id)}
                          >
                            <div className="messages-avatar">
                              {otherUser?.avatar ? (
                                <img src={otherUser.avatar} alt="avatar" />
                              ) : (
                                <div className="messages-avatar-placeholder">
                                  {otherUser?.name?.charAt(0).toUpperCase() || "?"}
                                </div>
                              )}
                            </div>
                            <div className="messages-item-content">
                              <div className="messages-item-header">
                                <span className="name">{otherUser?.name || "Applicant"}</span>
                                <span className="time">
                                  {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ""}
                                </span>
                              </div>
                              <div className="messages-item-preview">
                                {conv.lastMessage?.senderId === user._id ? "You: " : ""}
                                {conv.lastMessage?.text || "Started a conversation"}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                  </div>
                ) : (
                  <div className="messages-empty-state">
                    <p className="title">No conversations yet</p>
                    <p className="subtitle">You have no messages for projects you own.</p>
                  </div>
                )
              )}

              {activeTab === 'applied' && (
                appliedConvs.length > 0 ? (
                  <div className="messages-section">
                    <div className="messages-group">
                      {appliedConvs.map(conv => {
                        const otherUser = getOtherUser(conv);
                        const isUnread = conv.lastMessage && conv.lastMessage.senderId !== user._id && !conv.lastMessage.seen;
                        return (
                          <div 
                            key={conv._id} 
                            className={`messages-item ${activeConvId === conv._id ? 'active' : ''} ${isUnread ? 'unread' : ''}`}
                            onClick={() => setActiveConvId(conv._id)}
                          >
                            <div className="messages-avatar">
                              {otherUser?.avatar ? (
                                <img src={otherUser.avatar} alt="avatar" />
                              ) : (
                                <div className="messages-avatar-placeholder">
                                  {otherUser?.name?.charAt(0).toUpperCase() || "?"}
                                </div>
                              )}
                            </div>
                            <div className="messages-item-content">
                              <div className="messages-item-header">
                                <span className="name">{otherUser?.name || "Owner"}</span>
                                <span className="time">
                                  {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ""}
                                </span>
                              </div>
                              <div className="messages-item-project" style={{ fontSize: "11px", color: "var(--color-primary)", marginBottom: "2px" }}>
                                {conv.projectId?.title || "Unknown Project"}
                              </div>
                              <div className="messages-item-preview">
                                {conv.lastMessage?.senderId === user._id ? "You: " : ""}
                                {conv.lastMessage?.text || "Started a conversation"}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="messages-empty-state">
                    <p className="title">No conversations yet</p>
                    <p className="subtitle">You have no messages for projects you applied to.</p>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </aside>

      {/* Main Area */}
      <main className={`messages-main ${!activeConvId ? 'hide-on-mobile' : ''}`}>
        {!activeConvId || !activeConversation ? (
          <div className="messages-no-selection">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <h2>Your Messages</h2>
            <p>Select a conversation to read or send messages.</p>
          </div>
        ) : (
          <>
            <div className="messages-header">
              <button className="messages-back-btn" onClick={() => setActiveConvId(null)}>
                ← Back
              </button>
              <div className="messages-header-info">
                <h2>{getOtherUser(activeConversation)?.name}</h2>
                <span>
                  {isOwnerMode(activeConversation) ? "Applicant" : "Project Owner"}
                  {" · "}
                  {activeConversation.projectId?.title}
                </span>
              </div>
            </div>

            <div className="messages-context-card">
              <div className="context-info">
                <h3>{activeConversation.projectId?.title}</h3>
                <p>
                  {isOwnerMode(activeConversation) 
                    ? "Application submitted " 
                    : "You applied to this project "}
                  {activeConversation.applicationId?.createdAt 
                    ? new Date(activeConversation.applicationId.createdAt).toLocaleDateString()
                    : ""}
                </p>
              </div>
              <Link 
                to={`/projects/${activeConversation.projectId?._id}${isOwnerMode(activeConversation) ? "/applications" : ""}`} 
                className="context-link"
              >
                {isOwnerMode(activeConversation) ? "View Application →" : "View Project →"}
              </Link>
            </div>

            <div className="messages-chat-area">
              {loadingMessages ? (
                <div style={{ textAlign: 'center', padding: '40px' }}><Spinner /></div>
              ) : (
                messages.map(msg => {
                  const senderStr = String(msg.senderId?._id || msg.senderId);
                  const isMe = senderStr === String(user._id);
                  return (
                    <div key={msg._id} className={`message-bubble-wrapper ${isMe ? 'me' : 'them'}`}>
                      <div className="message-bubble">
                        {msg.text}
                      </div>
                      <div className="message-meta">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMe && msg.seen && " · Seen"}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="messages-composer" onSubmit={handleSend}>
              <input
                type="text"
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button type="submit" disabled={!inputText.trim()}>Send</button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
