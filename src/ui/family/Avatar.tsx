import type { CSSProperties } from 'react';
import type { Person } from '@/domain/types';
import styles from './Avatar.module.css';
import { LazyImage } from './LazyImage';
import { mediaUrl } from './mediaUrl';
import { initials } from './personText';

interface AvatarProps {
  readonly person: Person;
  /** The color of their fruit, so the avatar reads as the same person as in the tree. */
  readonly color: string;
  readonly size: 'large' | 'small';
}

/** The portrait (the first photo) or, without one, the initials on a little lantern of their color. */
export function Avatar({ person, color, size }: AvatarProps) {
  const portrait = person.photos[0];
  return (
    <span
      className={`${styles.avatar} ${styles[size]}`}
      style={{ '--fruit': color } as CSSProperties}
      aria-hidden="true"
    >
      {portrait ? (
        <LazyImage src={mediaUrl(portrait.src)} alt="" />
      ) : (
        <span className={styles.initials}>{initials(person)}</span>
      )}
    </span>
  );
}
