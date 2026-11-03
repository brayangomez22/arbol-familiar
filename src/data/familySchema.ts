import { z } from 'zod';
import { parsePartialDate } from '@/domain/dates';

z.config(z.locales.es());

const BIO_MAX_LENGTH = 600;

const partialDate = z.string().refine((text) => parsePartialDate(text) !== null, {
  message: 'Fecha inválida: usa "AAAA", "AAAA-MM" o "AAAA-MM-DD" con una fecha real del calendario',
});

const fullDate = partialDate.refine((text) => /^\d{4}-\d{2}-\d{2}$/.test(text), {
  message: 'Debe ser una fecha completa "AAAA-MM-DD"',
});

const lifeEvent = z.strictObject({
  date: partialDate.optional(),
  placeId: z.string().optional(),
});

const mediaPath = (extension: string) =>
  z.string().regex(new RegExp(`^[^/]+/[^/]+\\.${extension}$`), {
    message: `Debe ser "<id-persona>/<archivo>.${extension}", relativo a public/media/people/`,
  });

const photo = z.strictObject({
  src: mediaPath('webp'),
  caption: z.string().optional(),
  year: z.number().int().optional(),
});

const audio = z.strictObject({
  src: mediaPath('mp3'),
  caption: z.string().optional(),
});

const place = z.strictObject({
  name: z.string().min(1),
  region: z.string().optional(),
  country: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const person = z.strictObject({
  id: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  nickname: z.string().optional(),
  birth: lifeEvent.optional(),
  death: lifeEvent.optional(),
  bio: z
    .string()
    .max(BIO_MAX_LENGTH, { message: `La biografía supera los ${BIO_MAX_LENGTH} caracteres` })
    .optional(),
  photos: z.array(photo).optional(),
  audio: audio.optional(),
});

const union = z.strictObject({
  id: z.string(),
  partners: z.array(z.string()).min(1).max(2),
  children: z.array(z.string()),
  since: partialDate.optional(),
});

export const familySchema = z.strictObject({
  meta: z.strictObject({
    title: z.string().min(1),
    rootUnionId: z.string(),
    updatedAt: fullDate,
  }),
  places: z.record(z.string(), place),
  people: z.array(person),
  unions: z.array(union),
});

/** The shape of family.json as written by hand, before building the domain model. */
export type FamilyData = z.infer<typeof familySchema>;
export type PersonData = FamilyData['people'][number];
export type UnionData = FamilyData['unions'][number];
