import React from 'react';
import Input from "../../../../components/common/Input";

export default function AvailabilityEditor({ form, setForm }) {
  const avail = form.structuredAvailability || {
    timeCommitment: '', preferredSchedule: '', projectDuration: '', canStart: ''
  };

  const updateAvail = (field, value) => {
    setForm(p => ({
      ...p,
      structuredAvailability: {
        ...p.structuredAvailability,
        [field]: value
      }
    }));
  };

  return (
    <div className="account__section">
      <div className="account__card-title" style={{ marginBottom: 16 }}>Detailed Availability</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Input 
          label="Time Commitment" 
          value={avail.timeCommitment} 
          onChange={e => updateAvail('timeCommitment', e.target.value)} 
          placeholder="e.g. 8–10 hrs/week" 
        />
        <Input 
          label="Preferred Schedule" 
          value={avail.preferredSchedule} 
          onChange={e => updateAvail('preferredSchedule', e.target.value)} 
          placeholder="e.g. Evenings & weekends" 
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input 
          label="Project Duration" 
          value={avail.projectDuration} 
          onChange={e => updateAvail('projectDuration', e.target.value)} 
          placeholder="e.g. 1–3 months" 
        />
        <Input 
          label="Can Start" 
          value={avail.canStart} 
          onChange={e => updateAvail('canStart', e.target.value)} 
          placeholder="e.g. Immediately" 
        />
      </div>
    </div>
  );
}
