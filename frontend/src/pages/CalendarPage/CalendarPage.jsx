import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import CalendarView from '../../components/common/Calendar/CalendarView';
import './CalendarPage.css';

const CalendarPage = () => {
  return (
    <div className="calendar-page">
      <PageHeader title="Calendar" />
      <div className="calendar-page-content">
        <CalendarView />
      </div>
    </div>
  );
};

export default CalendarPage;
