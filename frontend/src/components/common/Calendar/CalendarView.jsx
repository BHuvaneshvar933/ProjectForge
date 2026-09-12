import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchEvents();
  }, [projectId]);

  const fetchEvents = async () => {
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
  };

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
              if (evt.type === 'task') icon = '🔴';
              else if (evt.type === 'meeting') icon = '🔵';
              else if (evt.type === 'milestone') icon = '🟢';
              else if (evt.type === 'project_deadline') icon = '🚀';

              return (
                <div 
                  key={evt.id + idx} 
                  className="calendar-event-item"
                  onClick={() => setSelectedEvent(evt)}
                >
                  <span className="event-icon">{icon}</span>
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
            <button className="close-btn" onClick={() => setSelectedEvent(null)}>&times;</button>
            <h3 style={{textTransform: 'uppercase'}}>{selectedEvent.title}</h3>
            
            <div className="event-meta">
               {selectedEvent.type === 'task' && <p>🔴 Task</p>}
               {selectedEvent.type === 'meeting' && <p>🔵 Meeting</p>}
               {selectedEvent.type === 'milestone' && <p>🟢 Milestone</p>}
               {selectedEvent.type === 'project_deadline' && <p>🚀 Project Deadline</p>}
               
               <p>{selectedEvent.projectName}</p>
               
               {selectedEvent.type === 'task' && <p>Assigned to you</p>}
               
               <div style={{marginTop: '16px'}}>
                 <strong>Date</strong>
                 <p>{new Date(selectedEvent.date || selectedEvent.startDate).toLocaleString()}</p>
               </div>
               
               {selectedEvent.status && (
                 <div style={{marginTop: '16px'}}>
                   <strong>Status</strong>
                   <p>{selectedEvent.status}</p>
                 </div>
               )}
            </div>

            <div className="event-actions" style={{marginTop: '24px'}}>
              {selectedEvent.type === 'task' || selectedEvent.linkedTask ? (
                <button className="btn btn-primary" onClick={() => navigate(`/workspace/${selectedEvent.projectId}?task=${selectedEvent.linkedTask || selectedEvent.id}`)}>
                  Open Task &rarr;
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => navigate(`/workspace/${selectedEvent.projectId}`)}>
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
