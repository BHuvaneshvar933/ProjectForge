import React from 'react';
import './EducationalTip.css';

export default function EducationalTip({ title, content, variant = 'inline' }) {
  // variant can be 'inline' or 'box'
  return (
    <div className={`educational-tip educational-tip--${variant}`}>
      {variant === 'inline' ? (
        <span>💡 <strong>{title ? `${title}: ` : 'Pro Tip: '}</strong>{content}</span>
      ) : (
        <>
          <strong>{title || 'Why this works:'}</strong>
          <span>{content}</span>
        </>
      )}
    </div>
  );
}
