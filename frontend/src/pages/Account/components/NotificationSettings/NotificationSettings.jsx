import React, { useState, useEffect } from 'react';
import api from '../../../../api/client';
import './NotificationSettings.css';

const NotificationSettings = () => {
  // Default structure in case user model is older
  const defaultPrefs = {
    taskDeadlines: {
      threeDaysBefore: true,
      oneDayBefore: true,
      oneHourBefore: true,
      overdue: true
    },
    projectEvents: {
      milestones: true,
      meetings: true,
      projectDeadlines: true
    }
  };

  const [prefs, setPrefs] = useState(defaultPrefs);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/users/me');
        if (response.data.success && response.data.data.user.notificationPreferences) {
          setPrefs(response.data.data.user.notificationPreferences);
        }
      } catch (err) {
        console.error('Failed to load user preferences', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleToggle = async (category, field) => {
    const newValue = !prefs[category][field];
    
    const newPrefs = {
      ...prefs,
      [category]: {
        ...prefs[category],
        [field]: newValue
      }
    };
    
    setPrefs(newPrefs);
    
    // Save to backend
    setSaving(true);
    try {
      await api.put('/users/me', {
        notificationPreferences: newPrefs
      });
    } catch (error) {
      console.error('Failed to save preferences', error);
      // Revert on failure
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  };

  const renderToggle = (label, category, field) => (
    <div className="notification-setting-item">
      <span>{label}</span>
      <button 
        className={`toggle-btn ${prefs[category]?.[field] ? 'active' : ''}`}
        onClick={() => handleToggle(category, field)}
        disabled={saving}
      >
        {prefs[category]?.[field] ? 'ON' : 'OFF'}
      </button>
    </div>
  );

  return (
    <div className="notification-settings-container">
      <h2 className="notification-settings-title">Notification Settings</h2>
      
      <div className="notification-settings-section">
        <h3>TASK DEADLINES</h3>
        {renderToggle('3 days before', 'taskDeadlines', 'threeDaysBefore')}
        {renderToggle('1 day before', 'taskDeadlines', 'oneDayBefore')}
        {renderToggle('1 hour before', 'taskDeadlines', 'oneHourBefore')}
        {renderToggle('When task becomes overdue', 'taskDeadlines', 'overdue')}
      </div>

      <div className="notification-settings-section">
        <h3>PROJECT EVENTS</h3>
        {renderToggle('Project milestones', 'projectEvents', 'milestones')}
        {renderToggle('Project deadlines', 'projectEvents', 'projectDeadlines')}
        {renderToggle('Project meetings', 'projectEvents', 'meetings')}
      </div>
    </div>
  );
};

export default NotificationSettings;
