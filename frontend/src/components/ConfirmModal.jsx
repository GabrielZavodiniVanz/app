import React from 'react';
import { FaTrashAlt, FaExclamationTriangle } from 'react-icons/fa';
import styles from './ConfirmModal.module.css';

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "OK", cancelText = "Cancelar", type = "delete" }) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'delete':
        return <FaTrashAlt className={styles.icon} />;
      case 'warning':
        return <FaExclamationTriangle className={styles.icon} />;
      default:
        return <FaExclamationTriangle className={styles.icon} />;
    }
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.topBorder}></div>
        <div className={styles.header}>
          {getIcon()}
          <h3>{title}</h3>
        </div>
        <div className={styles.body}>
          <p>{message}</p>
        </div>
        <div className={styles.footer}>
          <button 
            className={styles.cancelButton} 
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className={styles.confirmButton} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
