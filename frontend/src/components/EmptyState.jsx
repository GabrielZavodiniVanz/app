import React from 'react';
import styles from './EmptyState.module.css';
import { FaGhost } from 'react-icons/fa'; // Um ícone divertido

function EmptyState({ message }) {
  return (
    <div className={styles.emptyContainer}>
      <FaGhost className={styles.icon} />
      <h3 className={styles.title}>¡Oh, no!</h3>
      <p className={styles.message}>{message}</p>
    </div>
  );
}

export default EmptyState;