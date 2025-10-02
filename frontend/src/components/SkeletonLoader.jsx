import React from 'react';
import styles from './SkeletonLoader.module.css';

function SkeletonLoader({ type = 'card', count = 6 }) {
  const renderCardSkeleton = () => (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonImage}></div>
      <div className={styles.skeletonContent}>
        <div className={styles.skeletonTitle}></div>
        <div className={styles.skeletonText}></div>
        <div className={styles.skeletonText} style={{ width: '70%' }}></div>
        <div className={styles.skeletonButton}></div>
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className={styles.skeletonListItem}>
      <div className={styles.skeletonAvatar}></div>
      <div className={styles.skeletonListContent}>
        <div className={styles.skeletonTitle}></div>
        <div className={styles.skeletonText} style={{ width: '60%' }}></div>
      </div>
      <div className={styles.skeletonActions}>
        <div className={styles.skeletonButton} style={{ width: '80px' }}></div>
        <div className={styles.skeletonButton} style={{ width: '80px' }}></div>
      </div>
    </div>
  );

  return (
    <div className={styles.skeletonContainer}>
      {type === 'card' && (
        <div className={styles.skeletonGrid}>
          {Array.from({ length: count }, (_, i) => (
            <div key={i}>{renderCardSkeleton()}</div>
          ))}
        </div>
      )}
      
      {type === 'list' && (
        <div className={styles.skeletonList}>
          {Array.from({ length: count }, (_, i) => (
            <div key={i}>{renderListSkeleton()}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SkeletonLoader;
