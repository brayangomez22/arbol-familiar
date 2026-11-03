export type PersonId = string;
export type UnionId = string;
export type PlaceId = string;

/** A date where only the year, or year and month, may be known. Months are 1-12. */
export interface PartialDate {
  readonly year: number;
  readonly month?: number;
  readonly day?: number;
}

export interface LifeEvent {
  readonly date?: PartialDate;
  readonly placeId?: PlaceId;
}

export interface Photo {
  readonly src: string;
  readonly caption?: string;
  readonly year?: number;
}

export interface AudioClip {
  readonly src: string;
  readonly caption?: string;
}

export interface Person {
  readonly id: PersonId;
  readonly firstName: string;
  readonly lastName: string;
  readonly nickname?: string;
  readonly birth?: LifeEvent;
  /** Present when the person has died, even if the date is unknown. */
  readonly death?: LifeEvent;
  readonly bio?: string;
  /** The first photo is the portrait. */
  readonly photos: readonly Photo[];
  readonly audio?: AudioClip;
}

export interface Union {
  readonly id: UnionId;
  readonly partners: readonly PersonId[];
  /** In birth order. */
  readonly children: readonly PersonId[];
  readonly since?: PartialDate;
}

export interface Place {
  readonly id: PlaceId;
  readonly name: string;
  readonly region?: string;
  readonly country: string;
  readonly lat: number;
  readonly lng: number;
}

export interface FamilyMeta {
  readonly title: string;
  readonly rootUnionId: UnionId;
  readonly updatedAt: PartialDate;
}

export interface Family {
  readonly meta: FamilyMeta;
  readonly places: ReadonlyMap<PlaceId, Place>;
  readonly people: ReadonlyMap<PersonId, Person>;
  readonly unions: ReadonlyMap<UnionId, Union>;
}
