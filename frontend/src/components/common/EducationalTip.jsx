import React from 'react';
import './EducationalTip.css';

export default function EducationalTip({ title, content, variant = 'inline' }) {
  return (
    <div className={`educational-tip educational-tip--${variant}`}>
      {variant === 'inline' ? (
        <span className="educational-tip__inline">
          {title && <strong className="educational-tip__label">{title}: </strong>}
          {content}
        </span>
      ) : (
        <>
          {title && (
            <div className="educational-tip__box-header">
              <strong>{title}</strong>
            </div>
          )}
          <span>{content}</span>
        </>
      )}
    </div>
  );
}
