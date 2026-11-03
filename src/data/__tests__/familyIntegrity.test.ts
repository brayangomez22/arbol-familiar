import { describe, expect, it } from 'vitest';
import rawFamily from '../family.json';
import type { FamilyData } from '../familySchema';
import { loadFamily, validateFamilyData } from '../loadFamily';

function sample(): FamilyData {
  return structuredClone(rawFamily);
}

function findUnion(data: FamilyData, id: string) {
  const union = data.unions.find((u) => u.id === id);
  if (!union) throw new Error(`Missing union ${id} in sample`);
  return union;
}

function findPerson(data: FamilyData, id: string) {
  const person = data.people.find((p) => p.id === id);
  if (!person) throw new Error(`Missing person ${id} in sample`);
  return person;
}

function errorRules(data: unknown): number[] {
  return validateFamilyData(data)
    .issues.filter((issue) => issue.level === 'error')
    .map((issue) => issue.rule);
}

describe('family.json', () => {
  it('is valid and loads into the domain model', () => {
    const result = validateFamilyData(rawFamily);
    expect(result.issues).toEqual([]);
    expect(loadFamily(rawFamily).people.size).toBe(rawFamily.people.length);
  });
});

describe('integrity rules', () => {
  it('reports schema problems with the path and person id', () => {
    const data = sample();
    findPerson(data, 'ana-alvarez').birth = { date: '2003-02-30' };
    const [issue] = validateFamilyData(data).issues;
    expect(issue?.rule).toBe(0);
    expect(issue?.message).toContain('people[14] (ana-alvarez).birth.date');
  });

  it('1: rejects duplicated and non kebab-case ids', () => {
    const data = sample();
    findPerson(data, 'ana-alvarez').id = 'diego-alvarez';
    expect(errorRules(data)).toContain(1);

    const accented = sample();
    findPerson(accented, 'mateo-gomez').id = 'Mateo-Gómez';
    expect(validateFamilyData(accented).issues[0]?.message).toContain('kebab-case');
  });

  it('2: rejects broken references', () => {
    const data = sample();
    findUnion(data, 'u-lucia-pedro').children.push('nadie-existe');
    expect(errorRules(data)).toContain(2);

    const badRoot = sample();
    badRoot.meta.rootUnionId = 'u-no-existe';
    expect(errorRules(badRoot)).toContain(2);
  });

  it('3: rejects a person who is a child of two unions', () => {
    const data = sample();
    findUnion(data, 'u-jorge-patricia').children.push('mateo-gomez');
    expect(errorRules(data)).toContain(3);
  });

  it('4: rejects cycles', () => {
    const data = sample();
    findUnion(data, 'u-andres-laura').children.push('carlos-gomez');
    findUnion(data, 'u-jose-rosa').children.splice(0, 1);
    const cycle = validateFamilyData(data).issues.find((issue) => issue.rule === 4);
    expect(cycle?.message).toContain('propio ancestro');
  });

  it('5: rejects people not connected to the root union', () => {
    const data = sample();
    data.people.push({ id: 'suelto-perez', firstName: 'Suelto', lastName: 'Pérez' });
    expect(errorRules(data)).toEqual([5]);
  });

  it('6: rejects deaths before births and children older than their parents', () => {
    const data = sample();
    findPerson(data, 'jose-gomez').death = { date: '1930' };
    findPerson(data, 'tomas-gomez').birth = { date: '1985' };
    const messages = validateFamilyData(data).issues.filter((issue) => issue.rule === 6);
    expect(messages.length).toBeGreaterThanOrEqual(2);
  });

  it('7: checks media files only when a checker is given', () => {
    const data = sample();
    findPerson(data, 'jose-gomez').photos = [{ src: 'jose-gomez/retrato.webp' }];
    expect(validateFamilyData(data).ok).toBe(true);
    const result = validateFamilyData(data, { mediaExists: () => false });
    expect(result.issues.map((issue) => issue.rule)).toEqual([7]);
  });

  it('8: only warns when children are out of birth order', () => {
    const data = sample();
    findUnion(data, 'u-jose-rosa').children.reverse();
    const result = validateFamilyData(data);
    expect(result.ok).toBe(true);
    expect(result.issues.every((issue) => issue.level === 'warning' && issue.rule === 8)).toBe(
      true,
    );
  });
});
