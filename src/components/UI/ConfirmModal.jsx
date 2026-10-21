import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import './ConfirmModal.css';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'primary', // 'danger' | 'success' | 'primary'
  isLoading = false
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={isLoading ? undefined : onClose}>
      <div 
        className={`confirm-modal-card variant-${variant}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="confirm-modal-close" 
          onClick={onClose} 
          disabled={isLoading}
          aria-label="Cerrar modal"
        >
          <X size={18} />
        </button>

        <div className="confirm-modal-icon-wrapper">
          {variant === 'danger' ? (
            <div className="confirm-icon danger">
              <AlertTriangle size={26} />
            </div>
          ) : (
            <div className="confirm-icon success">
              <CheckCircle2 size={26} />
            </div>
          )}
        </div>

        <div className="confirm-modal-content">
          <h3 className="confirm-modal-title">{title}</h3>
          {message && <p className="confirm-modal-message">{message}</p>}
        </div>

        <div className="confirm-modal-actions">
          <button 
            type="button"
            className="btn-modal-cancel" 
            onClick={onClose} 
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button 
            type="button"
            className={`btn-modal-confirm ${variant}`} 
            onClick={onConfirm} 
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
