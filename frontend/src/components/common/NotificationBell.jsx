import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyNotifications, getMyUnreadCount, markNotificationRead, markAllNotificationsRead } from '../../api/notificationApi';
import Spinner from './Spinner';
import { getSocket } from '../../realtime/socketClient';
import './NotificationBell.css';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    try {
      const res = await getMyUnreadCount();
      setUnreadCount(res.data?.data?.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await getMyNotifications({ limit: 10 });
      setNotifications(res.data?.data?.notifications || []);
      setUnreadCount(res.data?.data?.unreadCount || 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll for notifications every 60 seconds
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    
    const handleNewNotification = (notification) => {
      setUnreadCount((prev) => prev + 1);
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
    };

    socket.on("new-notification", handleNewNotification);
    return () => {
      socket.off("new-notification", handleNewNotification);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!open) {
      fetchNotifications();
    }
    setOpen(!open);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification._id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
      } catch {
        // ignore
      }
    }
    
    if (notification.actionUrl) {
      setOpen(false);
      navigate(notification.actionUrl);
    }
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button className="notification-bell__button" onClick={handleToggle} aria-label="Notifications">
        <svg className="notification-bell__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-bell__badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown__header">
            <h3 className="notification-dropdown__title">Notifications</h3>
            {unreadCount > 0 && (
              <button className="notification-dropdown__mark-all" onClick={handleMarkAllRead}>
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="notification-dropdown__body">
            {loading ? (
              <div className="notification-dropdown__empty">
                <Spinner size="sm" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-dropdown__empty">
                You have no notifications.
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n._id} 
                  className={`notification-item ${n.isRead ? 'is-read' : 'is-unread'}`.trim()}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="notification-item__icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {n.type?.includes('accepted') ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : n.type?.includes('rejected') ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                  </div>
                  <div className="notification-item__content">
                    <div className="notification-item__title">{n.title}</div>
                    <div className="notification-item__message">{n.message}</div>
                    <div className="notification-item__time">
                      {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
