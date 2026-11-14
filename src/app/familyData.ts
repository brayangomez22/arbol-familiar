import familyJson from '@family-data';
import type { FamilyData } from '@/data/familySchema';
import { toDomainFamily } from '@/data/toDomainFamily';
import type { Family } from '@/domain/types';

// `@family-data` is the real family or the demo one (VITE_DATA=demo), chosen by tooling/familyData.ts.
// The build validates that file with zod and the integrity rules and refuses to finish if it is
// wrong, so production trusts it and leaves zod (a fifth of the code) out of the bundle. In
// development every edit is still validated here, with the same messages as the script.
const data: FamilyData = familyJson;

export const family: Family = import.meta.env.DEV
  ? (await import('@/data/loadFamily')).loadFamily(data)
  : toDomainFamily(data);
