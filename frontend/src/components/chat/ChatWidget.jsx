import { useState, useEffect, useRef } from "react";
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

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("pf_token") || localStorage.getItem("projectforge_token");
        if (token) {
          const { data } = await getMyProfile();
          if (data?.data?.user) {
            setUser(data.data.user);
          }
        }
      } catch (e) {
        // Not authenticated
      }
    };
    fetchUser();
  }, []);

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
      } else if (activeChat && !activeChat.conversationId && (msg.senderId === activeChat.userId || msg.senderId?._id === activeChat.userId)) {
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
      const { userId, name, avatar } = e.detail;
      setIsOpen(true);
      setActiveChat({ userId, name, avatar, conversationId: null });
      loadMessages(userId);
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
    setLoading(true);
    try {
      const params = conversationId ? { conversationId } : { otherUserId };
      const { data } = await getDirectMessages(params);
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
      socket.emit("send-direct-message", { receiverId: activeChat.userId, content }, (res) => {
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

  if (!user) return null;

  return (
    <div className={`chat-widget ${isOpen ? "open" : ""}`}>
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
            >
              ←
            </button>
          ) : null}
          <div className="chat-widget__title">
            {activeChat && isOpen ? activeChat.name : "Messages"}
          </div>
        </div>
        <div className="chat-widget__header-right">
          {isOpen ? "▼" : "▲"}
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="chat-widget__body">
          {!activeChat ? (
            // CONVERSATIONS LIST
            <div className="chat-widget__conversations">
              {conversations.length === 0 ? (
                <div className="chat-widget__empty">No messages yet.</div>
              ) : (
                conversations.map((conv) => {
                  const otherUser = conv.participants.find((p) => p._id !== user._id) || conv.participants[0];
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
                            {otherUser.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="chat-widget__conv-info">
                        <div className="chat-widget__conv-name">{otherUser.name}</div>
                        <div className="chat-widget__conv-last">
                          {conv.lastMessage?.senderId === user._id ? "You: " : ""}
                          {conv.lastMessage?.content || "No messages"}
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
                  <div className="chat-widget__empty">Say hi!</div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user._id || msg.senderId?._id === user._id;
                    return (
                      <div key={msg._id} className={`chat-widget__message ${isMe ? "me" : "them"}`}>
                        <div className="chat-widget__message-content">
                          {msg.content}
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
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button type="submit" disabled={!inputText.trim()}>
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
