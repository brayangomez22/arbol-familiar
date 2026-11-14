import { useEffect } from 'react';
import { useAppStore } from '@/state/store';
import { FamilyContext, type FamilyDirectory } from '../family/familyDirectory';
import { dismissBootLoader } from '../Loader/bootLoader';
import { AccessibleList } from './AccessibleList';
import styles from './AccessibleList.module.css';

export type ListPageReason = 'no-webgl' | 'error';

const LEADS: Record<ListPageReason, string> = {
  'no-webgl':
    'Este navegador no puede dibujar el árbol en 3D, así que aquí está la familia en una lista. Desde un celular o computador más reciente podrás verlo crecer.',
  error:
    'Algo falló al dibujar el árbol, así que aquí está la familia en una lista. Recargar la página suele arreglarlo.',
};

interface ListPageProps {
  readonly family: FamilyDirectory;
  readonly reason: ListPageReason;
}

/** The whole site when the tree cannot be drawn: the list, with a kind word about why. */
export function ListPage({ family, reason }: ListPageProps) {
  useEffect(() => {
    // Nothing will fade in behind the loading screen: it simply goes.
    dismissBootLoader(false);
    // No scene, no intro to wait for: a link to a person (#ana-alvarez) opens their card at once.
    useAppStore.getState().setIntroPhase('done');
  }, []);
  return (
    <FamilyContext value={family}>
      <main className={styles.page}>
        <AccessibleList lead={LEADS[reason]} />
      </main>
    </FamilyContext>
  );
}
