import { lazy, Suspense, useState } from 'react';
import type { Person } from '@/domain/types';
import { useFamily } from '../family/familyDirectory';
import { fullName } from '../family/personText';
import { Polaroid } from './Polaroid';
import styles from './Polaroids.module.css';
import sectionStyles from './Section.module.css';

// Only needed once a photo is tapped.
const PhotoViewer = lazy(() =>
  import('./PhotoViewer').then((module) => ({ default: module.PhotoViewer })),
);

interface PolaroidsProps {
  readonly person: Person;
}

/** The person's photos as a little pile of polaroids; tapping one opens it large. */
export function Polaroids({ person }: PolaroidsProps) {
  const { fruitColorOf } = useFamily();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const name = fullName(person);
  const color = fruitColorOf(person.id);

  return (
    <section>
      <h3 className={sectionStyles.title}>Fotos</h3>
      <ul className={styles.pile}>
        {person.photos.map((photo, photoIndex) => (
          <li key={photo.src} className={styles.item}>
            <Polaroid
              photo={photo}
              color={color}
              alt={photo.caption ?? `Foto de ${name}`}
              onOpen={() => {
                setOpenIndex(photoIndex);
              }}
            />
          </li>
        ))}
      </ul>
      {openIndex !== null && (
        <Suspense fallback={null}>
          <PhotoViewer
            photos={person.photos}
            index={openIndex}
            name={name}
            onIndexChange={setOpenIndex}
            onClose={() => {
              setOpenIndex(null);
            }}
          />
        </Suspense>
      )}
    </section>
  );
}
