import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../api/client';
import './UpcomingEvents.css';

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/calendar/events');
      if (response.data.success) {
        // Filter out past events
        const now = new Date();
        const upcoming = response.data.data.events.filter(e => {
          const date = new Date(e.date || e.startDate);
          return date >= new Date(now.setHours(0,0,0,0));
        });
        
        // Sort chronologically
        upcoming.sort((a, b) => new Date(a.date || a.startDate) - new Date(b.date || b.startDate));
        
        setEvents(upcoming.slice(0, 10)); // Top 10
      }
    } catch (error) {
      console.error('Error fetching upcoming events', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="upcoming-events-container">Loading upcoming events...</div>;
  }

  // Group by Today, Tomorrow, and Others
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const groups = {
    today: [],
    tomorrow: [],
    upcoming: {}
  };

  events.forEach(e => {
    const d = new Date(e.date || e.startDate);
    const dStart = new Date(d);
    dStart.setHours(0,0,0,0);

    if (dStart.getTime() === today.getTime()) {
      groups.today.push(e);
    } else if (dStart.getTime() === tomorrow.getTime()) {
      groups.tomorrow.push(e);
    } else {
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
      if (!groups.upcoming[dateStr]) groups.upcoming[dateStr] = [];
      groups.upcoming[dateStr].push(e);
    }
  });

  const renderEventIcon = (type) => {
    if (type === 'meeting') {
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    }
    if (type === 'milestone') {
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      );
    }
    if (type === 'project_deadline') {
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    }
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    );
  };

  const renderEvent = (evt) => {
    const eventTypeClass = evt.type === 'project_deadline' ? 'deadline' : (evt.type || 'task');

    return (
      <div 
        key={evt.id} 
        className="upcoming-event-item"
        onClick={() => {
          if (evt.type === 'task' || evt.linkedTask) {
            navigate(`/workspace/${evt.projectId}?task=${evt.linkedTask || evt.id}`);
          } else {
            navigate(`/workspace/${evt.projectId}`);
          }
        }}
      >
        <span className={`upcoming-event-icon upcoming-event-icon--${eventTypeClass}`}>
          {renderEventIcon(evt.type)}
        </span>
        <div className="upcoming-event-details">
          <span className="upcoming-event-title">{evt.title}</span>
          <span className="upcoming-event-meta">{evt.projectName}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="upcoming-events-container">
      <div className="upcoming-header">
        <h3>UPCOMING</h3>
      </div>
      
      <div className="upcoming-body">
        {events.length === 0 && <p className="upcoming-empty">No upcoming events</p>}
        
        {groups.today.length > 0 && (
          <div className="upcoming-group">
            <h4 className="upcoming-group-title">TODAY</h4>
            {groups.today.map(renderEvent)}
          </div>
        )}
        
        {groups.tomorrow.length > 0 && (
          <div className="upcoming-group">
            <h4 className="upcoming-group-title">TOMORROW</h4>
            {groups.tomorrow.map(renderEvent)}
          </div>
        )}
        
        {Object.entries(groups.upcoming).map(([dateStr, items]) => (
          <div className="upcoming-group" key={dateStr}>
            <h4 className="upcoming-group-title">{dateStr}</h4>
            {items.map(renderEvent)}
          </div>
        ))}
      </div>

      <div className="upcoming-footer">
        <Link to="/calendar" className="view-calendar-link">View Calendar &rarr;</Link>
      </div>
    </div>
  );
};

export default UpcomingEvents;
