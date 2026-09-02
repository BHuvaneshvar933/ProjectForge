import { useEffect } from 'react';
import './Modal.css';

export default function Modal({ isOpen, onClose, title, children, onConfirm, confirmText = "Confirm", hideDefaultActions = false, maxWidth }) {
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
      <div className="modal__card" style={maxWidth ? { '--modal-max-width': maxWidth } : {}}>
        <button onClick={onClose} className="modal__close" aria-label="Close modal">
          Close
        </button>

        {title && (
          <h3 className="modal__title">{title}</h3>
        )}

        <div className="modal__content">
          {children}
        </div>

        {!hideDefaultActions && (
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
        )}
      </div>
    </div>
  );
}