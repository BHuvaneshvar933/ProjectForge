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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "12px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>
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
          <div key={day} style={{ textAlign: "center", fontWeight: "600", fontSize: "14px", color: "rgba(255,255,255,0.5)", padding: "8px 0" }}>
            {day}
          </div>
        ))}
        
        {/* Calendar Cells */}
        {getDaysInMonth(currentMonthDate).map((dayObj, i) => {
          const dateStr = dayObj.date.toDateString();
          
          // Find items for this day
          const dayTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === dateStr);
          const isProjectStart = project?.startDate && new Date(project.startDate).toDateString() === dateStr;
          const isProjectEnd = project?.endDate && new Date(project.endDate).toDateString() === dateStr;
          const dayEvents = project?.archiveData?.timelineEvents?.filter(e => new Date(e.date).toDateString() === dateStr) || [];

          return (
            <div key={i} style={{ 
              minHeight: "100px", 
              background: dayObj.isCurrentMonth ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)", 
              borderRadius: "8px", 
              padding: "8px",
              opacity: dayObj.isCurrentMonth ? 1 : 0.5,
              display: "flex",
              flexDirection: "column",
              gap: "4px"
            }}>
              <div style={{ fontSize: "14px", fontWeight: "500", marginBottom: "4px", color: dayObj.date.toDateString() === new Date().toDateString() ? "#0a84ff" : "inherit" }}>
                {dayObj.date.getDate()}
              </div>
              
              {isProjectStart && (
                <div style={{ fontSize: "11px", padding: "2px 6px", background: "rgba(52,199,89,0.2)", color: "#34c759", borderRadius: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title="Project Start">
                  🚀 Project Start
                </div>
              )}

              {isProjectEnd && (
                <div style={{ fontSize: "11px", padding: "2px 6px", background: "rgba(255,69,58,0.2)", color: "#ff453a", borderRadius: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title="Project End">
                  🏁 Project End
                </div>
              )}

              {dayEvents.map((evt, idx) => (
                <div key={`evt-${idx}`} style={{ fontSize: "11px", padding: "2px 6px", background: "rgba(10,132,255,0.2)", color: "#0a84ff", borderRadius: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={evt.title}>
                  ⚡ {evt.title}
                </div>
              ))}

              {dayTasks.map(t => (
                <div 
                  key={t._id} 
                  onClick={onTaskClick}
                  style={{ 
                    fontSize: "11px", 
                    padding: "2px 6px", 
                    background: t.status === "done" ? "rgba(255,255,255,0.1)" : t.priority === "high" ? "rgba(255,69,58,0.2)" : t.priority === "medium" ? "rgba(255,159,10,0.2)" : "rgba(52,199,89,0.2)", 
                    color: t.status === "done" ? "rgba(255,255,255,0.5)" : t.priority === "high" ? "#ff453a" : t.priority === "medium" ? "#ff9f0a" : "#34c759", 
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
