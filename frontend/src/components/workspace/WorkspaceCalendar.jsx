import { useState } from "react";
import Button from "../common/Button";

const getDaysInMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
  
  const days = [];
  
  // Padding for previous month
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isCurrentMonth: false
    });
  }
  
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }
  
  // Padding for next month to fill complete weeks (42 days total for 6 rows)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }
  
  return days;
};

export default function WorkspaceCalendar({ project, tasks, onTaskClick }) {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  return (
    <div className="workspace__calendar-layout" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Calendar Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", border: "1px solid var(--border-color)", padding: "18px 24px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "var(--color-text-dark)" }}>
          {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button variant="outline" onClick={() => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1))}>Previous</Button>
          <Button variant="outline" onClick={() => setCurrentMonthDate(new Date())}>Today</Button>
          <Button variant="outline" onClick={() => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1))}>Next</Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} style={{ textAlign: "center", fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-dark)", padding: "8px 0" }}>
            {day}
          </div>
        ))}
        
        {/* Calendar Cells */}
        {getDaysInMonth(currentMonthDate).map((dayObj, i) => {
          const dateStr = dayObj.date.toDateString();
          
          // Find items for this day
          const dayTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === dateStr);
          const isProjectStart = project?.timeline?.startDate && new Date(project.timeline.startDate).toDateString() === dateStr;
          const isProjectEnd = project?.timeline?.endDate && new Date(project.timeline.endDate).toDateString() === dateStr;
          const dayEvents = project?.archiveData?.timelineEvents?.filter(e => new Date(e.date).toDateString() === dateStr) || [];

          const isToday = dayObj.date.toDateString() === new Date().toDateString();

          return (
            <div key={i} style={{ 
              minHeight: "100px", 
              background: dayObj.isCurrentMonth ? "#ffffff" : "var(--color-paper)", 
              border: isToday ? "2px solid var(--color-text-dark)" : "1px solid var(--border-color)", 
              borderRadius: "8px", 
              padding: "8px",
              opacity: dayObj.isCurrentMonth ? 1 : 0.6,
              display: "flex",
              flexDirection: "column",
              gap: "4px"
            }}>
              <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "4px", color: "var(--color-text-dark)" }}>
                {dayObj.date.getDate()}
              </div>
              
              {isProjectStart && (
                <div style={{ fontSize: "11px", fontWeight: "700", padding: "2px 6px", background: "var(--color-paper)", border: "1px solid var(--border-color)", color: "var(--color-text-dark)", borderRadius: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title="Project Start">
                  Project Start
                </div>
              )}

              {isProjectEnd && (
                <div style={{ fontSize: "11px", fontWeight: "700", padding: "2px 6px", background: "var(--color-paper)", border: "1px solid var(--border-color)", color: "var(--color-text-dark)", borderRadius: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title="Project End">
                  Project End
                </div>
              )}

              {dayEvents.map((evt, idx) => (
                <div key={`evt-${idx}`} style={{ fontSize: "11px", fontWeight: "600", padding: "2px 6px", background: "var(--color-paper)", border: "1px solid var(--border-color)", color: "var(--color-text-dark)", borderRadius: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={evt.title}>
                  {evt.title}
                </div>
              ))}

              {dayTasks.map(t => (
                <div 
                  key={t._id} 
                  onClick={onTaskClick}
                  style={{ 
                    fontSize: "11px", 
                    fontWeight: "600",
                    padding: "2px 6px", 
                    background: "var(--color-paper)",
                    border: "1px solid var(--border-color)",
                    color: t.status === "done" ? "var(--color-text-muted)" : "var(--color-text-dark)", 
                    borderRadius: "4px", 
                    cursor: "pointer",
                    whiteSpace: "nowrap", 
                    overflow: "hidden", 
                    textOverflow: "ellipsis",
                    textDecoration: t.status === "done" ? "line-through" : "none"
                  }} 
                  title={`${project?.key}-${t.taskNumber || "X"}: ${t.title}`}
                >
                  {project?.key}-{t.taskNumber || "X"}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
