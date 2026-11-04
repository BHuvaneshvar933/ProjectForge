import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/client';
import './CalendarView.css';

const CalendarView = ({ projectId = null }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Filters
  const [filters, setFilters] = useState({
    task: true,
    meeting: true,
    milestone: true,
    project_deadline: true,
  });
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || 'all');
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  const navigate = useNavigate();

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = projectId ? `/calendar/events?projectId=${projectId}` : '/calendar/events';
      const response = await api.get(endpoint);
      if (response.data.success) {
        setEvents(response.data.data.events);
      }
    } catch (error) {
      console.error('Error fetching calendar events', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    // 0 = Sunday, 1 = Monday, etc. Adjusting to make Monday = 0
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  // Filter events
  const filteredEvents = events.filter(e => {
    if (!filters[e.type]) return false;
    if (selectedProjectId !== 'all' && e.projectId !== selectedProjectId) return false;
    return true;
  });

  const renderGrid = () => {
    const days = [];
    
    // Empty cells before start of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      const currentCellDate = new Date(year, month, d);
      const isToday = new Date().toDateString() === currentCellDate.toDateString();
      
      const dayEvents = filteredEvents.filter(e => {
        const eventDate = new Date(e.date || e.startDate);
        return eventDate.toDateString() === currentCellDate.toDateString();
      });

      days.push(
        <div key={`day-${d}`} className={`calendar-day ${isToday ? 'today' : ''}`}>
          <div className="day-number">{d}</div>
          <div className="day-events">
            {dayEvents.map((evt, idx) => {
              let icon = '';
              const isTask = evt.type === 'task';
              if (isTask) icon = '•';
              else if (evt.type === 'meeting') icon = '🔵';
              else if (evt.type === 'milestone') icon = '🟢';
              else if (evt.type === 'project_deadline') icon = '🚀';

              return (
                <div 
                  key={evt.id + idx} 
                  className={`calendar-event-item ${isTask ? 'calendar-event-item--task' : ''}`}
                  onClick={() => setSelectedEvent(evt)}
                >
                  <span className={`event-icon ${isTask ? 'event-icon--bullet' : ''}`}>{icon}</span>
                  <span className="event-title">{evt.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return days;
  };

  const handleToggleFilter = (type) => {
    setFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700", color: "var(--color-text-dark)" }}>
          {monthNames[month]} {year}
        </h2>
        
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <div className="calendar-filters">
            <label>
              <input type="checkbox" checked={filters.task} onChange={() => handleToggleFilter('task')} /> Tasks
            </label>
            <label>
              <input type="checkbox" checked={filters.meeting} onChange={() => handleToggleFilter('meeting')} /> Meetings
            </label>
            <label>
              <input type="checkbox" checked={filters.milestone} onChange={() => handleToggleFilter('milestone')} /> Milestones
            </label>
            <label>
              <input type="checkbox" checked={filters.project_deadline} onChange={() => handleToggleFilter('project_deadline')} /> Deadlines
            </label>
            {!projectId && (
               <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
                  <option value="all">All Projects</option>
                  {Array.from(new Set(events.map(e => JSON.stringify({id: e.projectId, name: e.projectName})))).map(pStr => {
                    const p = JSON.parse(pStr);
                    return <option key={p.id} value={p.id}>{p.name}</option>
                  })}
               </select>
            )}
          </div>
          
          <div className="calendar-nav">
            <button onClick={prevMonth}>Previous</button>
            <button onClick={() => setCurrentDate(new Date())}>Today</button>
            <button onClick={nextMonth}>Next</button>
          </div>
        </div>
      </div>

      <div className="calendar-grid">
        <div className="weekday-header">MON</div>
        <div className="weekday-header">TUE</div>
        <div className="weekday-header">WED</div>
        <div className="weekday-header">THU</div>
        <div className="weekday-header">FRI</div>
        <div className="weekday-header">SAT</div>
        <div className="weekday-header">SUN</div>
        
        {loading ? <div className="calendar-loading">Loading events...</div> : renderGrid()}
      </div>

      {selectedEvent && (
        <div className="event-modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="event-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedEvent(null)} aria-label="Close modal">&times;</button>
            
            <div className="event-modal__header">
              <span className={`event-modal__badge event-modal__badge--${selectedEvent.type}`}>
                {selectedEvent.type === 'task' && '• Task'}
                {selectedEvent.type === 'meeting' && '🔵 Meeting'}
                {selectedEvent.type === 'milestone' && '🟢 Milestone'}
                {selectedEvent.type === 'project_deadline' && '🚀 Project Deadline'}
              </span>
              {selectedEvent.type === 'task' && (
                <span className="event-modal__tag">Assigned to you</span>
              )}
            </div>

            <h3 className="event-modal__title">{selectedEvent.title}</h3>
            {selectedEvent.projectName && (
              <p className="event-modal__project">{selectedEvent.projectName}</p>
            )}
            
            <div className="event-modal__grid">
              <div className="event-modal__field">
                <span className="event-modal__field-label">Date</span>
                <span className="event-modal__field-value">
                  {new Date(selectedEvent.date || selectedEvent.startDate).toLocaleString()}
                </span>
              </div>
              
              {selectedEvent.status && (
                <div className="event-modal__field">
                  <span className="event-modal__field-label">Status</span>
                  <span className="event-modal__status-pill">
                    {selectedEvent.status}
                  </span>
                </div>
              )}
            </div>

            <div className="event-modal__actions">
              {selectedEvent.type === 'task' || selectedEvent.linkedTask ? (
                <button 
                  className="event-modal__btn" 
                  onClick={() => navigate(`/workspace/${selectedEvent.projectId}?task=${selectedEvent.linkedTask || selectedEvent.id}`)}
                >
                  Open Task &rarr;
                </button>
              ) : (
                <button 
                  className="event-modal__btn" 
                  onClick={() => navigate(`/workspace/${selectedEvent.projectId}`)}
                >
                  Open Project &rarr;
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
