import { useEffect } from 'react';
import './Modal.css';

export default function Modal({ isOpen, onClose, title, children, onConfirm, confirmText = "Confirm" }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__card">
        <button onClick={onClose} className="modal__close">
          <svg className="modal__close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {title && (
          <h3 className="modal__title">{title}</h3>
        )}

        <div className="modal__content">
          {children}
        </div>

        <div className="modal__actions">
          <button onClick={onClose} className="modal__button modal__button--ghost">
            Cancel
          </button>

          {onConfirm && (
            <button onClick={onConfirm} className="modal__button modal__button--primary">
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}