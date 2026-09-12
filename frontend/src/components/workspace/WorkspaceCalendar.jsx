import React from 'react';
import CalendarView from '../common/Calendar/CalendarView';

export default function WorkspaceCalendar({ project }) {
  if (!project) return null;
  
  return (
    <div className="workspace__calendar-layout">
      <CalendarView projectId={project._id} />
    </div>
  );
}
