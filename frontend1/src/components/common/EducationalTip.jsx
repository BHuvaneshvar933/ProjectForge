import React from 'react';
import './EducationalTip.css';

export default function EducationalTip({ title, content, variant = 'inline' }) {
  // variant can be 'inline' or 'box'
  return (
    <div className={`educational-tip educational-tip--${variant}`}>
      {variant === 'inline' ? (
        <span className="educational-tip__inline">
          <svg className="educational-tip__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <strong>{title ? `${title}: ` : 'Pro Tip: '}</strong>
          {content}
        </span>
      ) : (
        <>
          <div className="educational-tip__box-header">
            <svg className="educational-tip__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <strong>{title || 'Why this works:'}</strong>
          </div>
          <span>{content}</span>
        </>
      )}
    </div>
  );
}
