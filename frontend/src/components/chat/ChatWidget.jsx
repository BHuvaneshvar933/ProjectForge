import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getConversations, getDirectMessages } from "../../api/messageApi";
import { getSocket } from "../../realtime/socketClient";
import { getMyProfile } from "../../api/userApi";
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

  if (!user || isAuthRoute) return null;

  if (!isOpen) {
    return (
      <button 
        className="chat-widget__trigger"
        onClick={() => setIsOpen(true)}
        title="Open Messages"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
    );
  }

  return (
    <div className="chat-widget open">
      {/* Header */}
      <div className="chat-widget__header">
        <div className="chat-widget__header-left">
          {activeChat ? (
            <button 
              className="chat-widget__back"
              onClick={(e) => {
                e.stopPropagation();
                setActiveChat(null);
                setMessages([]);
                loadConversations();
              }}
            >
              Back
            </button>
          ) : null}
          <div className="chat-widget__title">
            {activeChat ? activeChat.name : "Messages"}
          </div>
        </div>
        <button 
          className="chat-widget__close-btn"
          onClick={() => setIsOpen(false)}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="chat-widget__body">
        {!activeChat ? (
          // CONVERSATIONS LIST
          <div className="chat-widget__conversations">
            {conversations.length === 0 ? (
              <div className="chat-widget__empty">No messages yet.</div>
            ) : (
              conversations.map((conv) => {
                const ownerIdStr = String(conv.ownerId?._id || conv.ownerId);
                const myIdStr = String(user._id);
                const isOwner = ownerIdStr === myIdStr;
                const otherUser = isOwner ? conv.applicantId : conv.ownerId;
                
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
                    <div className="chat-widget__conv-avatar">
                      {otherUser.avatar ? (
                        <img src={otherUser.avatar} alt="avatar" />
                      ) : (
                        <div className="chat-widget__conv-avatar-placeholder">
                          {otherUser.name ? otherUser.name.charAt(0).toUpperCase() : "?"}
                        </div>
                      )}
                    </div>
                    <div className="chat-widget__conv-info">
                      <div className="chat-widget__conv-name">{otherUser.name || "User"}</div>
                      <div className="chat-widget__conv-last">
                        {conv.lastMessage?.senderId === user._id ? "You: " : ""}
                        {conv.lastMessage?.text || "No messages"}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          // ACTIVE CHAT
          <div className="chat-widget__chat">
            <div className="chat-widget__messages">
              {loading ? (
                <div className="chat-widget__loading">Loading...</div>
              ) : messages.length === 0 ? (
                <div className="chat-widget__empty">Start a conversation.</div>
              ) : (
                messages.map((msg) => {
                  const senderStr = String(msg.senderId?._id || msg.senderId);
                  const myIdStr = String(user._id);
                  const isMe = senderStr === myIdStr;
                  
                  return (
                    <div key={msg._id} className={`chat-widget__message ${isMe ? "me" : "them"}`}>
                      <div className="chat-widget__message-content">
                        {msg.text}
                      </div>
                      {isMe && msg.seen && <div style={{ fontSize: "10px", textAlign: "right", marginTop: "2px", opacity: 0.6 }}>Seen</div>}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-widget__composer" onSubmit={handleSend}>
              <input
                type="text"
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button type="submit" disabled={!inputText.trim()}>
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
