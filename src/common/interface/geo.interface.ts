export interface Coord {
  lat: number;
  lng: number;
}

export interface StopCandidate extends Coord {
  [key: string]: any;
}

export interface RankedStop<T = Record<string, any>> {
  stop: T & Coord;
  distanceMeters: number;
  etaMinutes: number;
}
