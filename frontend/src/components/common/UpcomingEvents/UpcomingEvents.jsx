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

  const renderEvent = (evt) => {
    let icon = '';
    if (evt.type === 'task') icon = '🔴';
    else if (evt.type === 'meeting') icon = '🔵';
    else if (evt.type === 'milestone') icon = '🟢';
    else if (evt.type === 'project_deadline') icon = '🚀';

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
        <span className="upcoming-event-icon">{icon}</span>
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
