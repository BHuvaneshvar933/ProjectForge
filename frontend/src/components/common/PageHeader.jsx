import React from 'react';
import './PageHeader.css';

export default function PageHeader({ title, badges, actions, className = '' }) {
  return (
    <header className={`page-header page-header-stepped ${className}`.trim()}>
      <div className="page-header__content-row">
        <div className="page-header__left">
          <h1 className="page-header__title">{title}</h1>
          {badges && <div className="page-header__badges">{badges}</div>}
        </div>

        {actions && (
          <div className="page-header__actions">
            {actions}
          </div>
        )}
      </div>

      <div className="page-header__underline" />
    </header>
  );
}
