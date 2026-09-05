import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getConversations, getDirectMessages } from "../../api/messageApi";
import { getSocket } from "../../realtime/socketClient";
import { getMyProfile } from "../../api/userApi";
import { Link } from "react-router-dom";
import "./ChatWidget.css";

export default function ChatWidget() {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { userId, name, avatar, conversationId }
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  const isAuthRoute = 
    location.pathname === "/login" || 
    location.pathname === "/register" || 
    location.pathname === "/forgot-password" ||
    location.pathname.startsWith("/reset-password");

  const messagesEndRef = useRef(null);

  const token = localStorage.getItem("token") || localStorage.getItem("pf_token") || localStorage.getItem("projectforge_token");

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const { data } = await getMyProfile();
          if (data?.data?.user) {
            setUser(data.data.user);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    fetchUser();
  }, [token]);

  // Load conversations on open
  useEffect(() => {
    if (isOpen && !activeChat) {
      loadConversations();
    }
  }, [isOpen, activeChat]);

  // Handle incoming real-time DMs
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    
    // Make sure we join the global user room
    socket.emit("join-user");

    const handleNewMessage = (msg) => {
      // If we are currently chatting with this user (check conversationId)
      if (activeChat && activeChat.conversationId === msg.conversationId) {
        setMessages((prev) => {
          if (prev.find((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      } else if (activeChat && !activeChat.conversationId && (String(msg.senderId) === String(activeChat.userId) || String(msg.senderId?._id) === String(activeChat.userId))) {
        // Edge case: receiving a message from them while we just opened a new empty chat with them
        setMessages((prev) => {
          if (prev.find((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setActiveChat(prev => ({ ...prev, conversationId: msg.conversationId }));
      }
      
      // Also update conversations list to bump it to the top
      if (isOpen) {
        loadConversations();
      }
    };

    socket.on("new-direct-message", handleNewMessage);

    return () => {
      socket.off("new-direct-message", handleNewMessage);
    };
  }, [user, activeChat, isOpen]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Open Chat from outside (e.g. clicking "Message" on an applicant)
  useEffect(() => {
    const handleOpenChat = (e) => {
      const { userId, name, avatar, conversationId } = e.detail;
      setIsOpen(true);
      setActiveChat({ userId, name, avatar, conversationId });
      loadMessages(userId, conversationId);
    };
    window.addEventListener("open-dm", handleOpenChat);
    return () => window.removeEventListener("open-dm", handleOpenChat);
  }, []);


  const loadConversations = async () => {
    try {
      const { data } = await getConversations();
      setConversations(data.data || []);
    } catch (err) {
      console.error("Failed to load conversations", err);
    }
  };

  const loadMessages = async (otherUserId, conversationId = null) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await getDirectMessages(conversationId);
      setMessages(data.data?.messages || []);
      
      // Update active chat with the real conversationId if it exists
      if (data.data?.conversationId) {
        setActiveChat((prev) => ({ ...prev, conversationId: data.data.conversationId }));
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const content = inputText;
    setInputText("");

    try {
      const socket = getSocket();
      socket.emit("send-direct-message", { conversationId: activeChat.conversationId, text: content }, (res) => {
        if (!res.ok) {
           console.error("Failed to send message via socket", res.error);
        } else {
           const msg = res.data;
           setMessages((prev) => {
             if (prev.find((m) => m._id === msg._id)) return prev;
             return [...prev, msg];
           });
           if (!activeChat.conversationId) {
             setActiveChat(prev => ({ ...prev, conversationId: msg.conversationId }));
           }
        }
      });
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 48) {
      return "Yesterday";
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (!user || isAuthRoute) return null;

  return (
    <div className={`chat-widget ${isOpen ? "open" : "collapsed"}`}>
      {/* Header */}
      <div 
        className="chat-widget__header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="chat-widget__header-left">
          {activeChat && isOpen ? (
            <button 
              className="chat-widget__back"
              onClick={(e) => {
                e.stopPropagation();
                setActiveChat(null);
                setMessages([]);
                loadConversations();
              }}
              title="Back to messaging"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
          ) : null}
          <div className="chat-widget__header-user">
            {activeChat && isOpen ? (
              <>
                <div className="chat-widget__header-avatar-wrap">
                  <div className="chat-widget__header-avatar-placeholder">
                    {activeChat.name ? activeChat.name.charAt(0).toUpperCase() : "?"}
                  </div>
                </div>
                <div className="chat-widget__header-details">
                  <span className="chat-widget__title">{activeChat.name}</span>
                </div>
              </>
            ) : (
              <>
                <div className="chat-widget__header-details">
                  <span className="chat-widget__title">Messaging</span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="chat-widget__header-right">
          <button 
            className="chat-widget__toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            title={isOpen ? "Collapse messaging" : "Expand messaging"}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
            >
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
<<<<<<< HEAD
      {isOpen && (
        <div className="chat-widget__body">
          {!activeChat ? (
            // CONVERSATIONS LIST
            <div className="chat-widget__conversations-wrap">
              <div className="chat-widget__conversations">
                {conversations.length === 0 ? (
                  <div className="chat-widget__empty">
                    <span style={{ fontWeight: 600 }}>No conversations</span>
                    <small>Start conversations from member profiles or applications.</small>
                  </div>
                ) : (
                  // Deduplicate conversations list
                  Object.values(
                    conversations.reduce((acc, conv) => {
                      const ownerIdStr = String(conv.ownerId?._id || conv.ownerId);
                      const myIdStr = String(user._id);
                      const isOwner = ownerIdStr === myIdStr;
                      const otherUser = isOwner ? conv.applicantId : conv.ownerId;
                      const targetUserId = String(otherUser?._id || otherUser);

                      if (!targetUserId || targetUserId === "undefined") return acc;

                      if (!acc[targetUserId] || new Date(conv.updatedAt) > new Date(acc[targetUserId].updatedAt)) {
                        acc[targetUserId] = conv;
                      }
                      return acc;
                    }, {})
                  )
                  .map((conv) => {
                    const ownerIdStr = String(conv.ownerId?._id || conv.ownerId);
                    const myIdStr = String(user._id);
                    const isOwner = ownerIdStr === myIdStr;
                    const otherUser = isOwner ? conv.applicantId : conv.ownerId;
                    const lastMsgDate = conv.lastMessage?.createdAt || conv.updatedAt;
                    
                    return (
                      <div 
                        key={conv._id} 
                        className="chat-widget__conv-item"
                        onClick={() => {
                          setActiveChat({
                            userId: otherUser._id,
                            name: otherUser.name,
                            avatar: otherUser.avatar,
                            conversationId: conv._id
                          });
                          loadMessages(null, conv._id);
                        }}
                      >
                        <div className="chat-widget__conv-avatar-wrap">
                          <div className="chat-widget__conv-avatar-placeholder">
                            {otherUser?.name ? otherUser.name.charAt(0).toUpperCase() : "?"}
                          </div>
                        </div>
                        <div className="chat-widget__conv-info">
                          <div className="chat-widget__conv-top">
                            <span className="chat-widget__conv-name">{otherUser?.name || "User"}</span>
                            {lastMsgDate && (
                              <span className="chat-widget__conv-time">{formatTime(lastMsgDate)}</span>
                            )}
                          </div>
                          <div className="chat-widget__conv-last">
                            {conv.lastMessage?.senderId === user._id ? "You: " : ""}
                            {conv.lastMessage?.text || "No messages"}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {conversations.length > 0 && (
                  <div className="chat-widget__view-all" style={{ padding: "12px", textAlign: "center", borderTop: "1px solid var(--border-color, rgba(0,0,0,0.1))" }}>
                    <Link to="/messages" onClick={() => setIsOpen(false)} style={{ fontSize: "13px", color: "var(--color-text-dark)", textDecoration: "none", fontWeight: 600 }}>
                      View all messages
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // ACTIVE CHAT
            <div className="chat-widget__chat">
              <div className="chat-widget__messages">
                {loading ? (
                  <div className="chat-widget__loading">
                    <span className="chat-widget__spinner" />
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="chat-widget__empty">
                    <span style={{ fontWeight: 600 }}>Start conversation</span>
                    <small>Direct message with {activeChat.name}</small>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const senderStr = String(msg.senderId?._id || msg.senderId);
                    const myIdStr = String(user._id);
                    const isMe = senderStr === myIdStr;
                    const showTime = idx === messages.length - 1 || 
                      new Date(msg.createdAt) - new Date(messages[idx - 1]?.createdAt) > 5 * 60 * 1000;
                    
                    return (
                      <div key={msg._id || idx} className={`chat-widget__message-group ${isMe ? "me" : "them"}`}>
                        {showTime && msg.createdAt && (
                          <div className="chat-widget__time-divider">
                            {formatTime(msg.createdAt)}
                          </div>
                        )}
                        <div className={`chat-widget__message ${isMe ? "me" : "them"}`}>
                          <div className="chat-widget__message-content">
                            {msg.text}
                          </div>
                          <div className="chat-widget__message-meta">
                            {msg.createdAt && <span className="chat-widget__message-time">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                            {isMe && msg.seen && <span className="chat-widget__seen-badge">Seen</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-widget__composer" onSubmit={handleSend}>
                <input
                  type="text"
                  placeholder="Write a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button type="submit" disabled={!inputText.trim()} className="chat-widget__send-btn" title="Send message">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
