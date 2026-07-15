import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Coord, RankedStop } from '../interface/geo.interface';

@Injectable()
export class OrsService {
  private readonly logger = new Logger(OrsService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openrouteservice.org/v2/matrix/driving-car';

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('ORS_API_KEY')?.trim() || '';
    this.logger.debug(`ORS_API_KEY loaded: ${this.apiKey || '<missing>'}`);
  }

  private getFallbackDurations(origin: Coord, destinations: Coord[]) {
    return destinations.map((destination) => {
      const distanceMeters = this.calculateDistanceMeters(origin, destination);
      const durationSeconds = Math.max(60, Math.round(distanceMeters / 1000 / 30 * 3600));

      return {
        distanceMeters,
        durationSeconds,
      };
    });
  }

  private calculateDistanceMeters(origin: Coord, destination: Coord): number {
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const earthRadiusMeters = 6371000;
    const lat1 = toRadians(origin.lat);
    const lat2 = toRadians(destination.lat);
    const deltaLat = toRadians(destination.lat - origin.lat);
    const deltaLng = toRadians(destination.lng - origin.lng);

    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusMeters * c;
  }

  private getHeaders(): Record<string, string> {
    if (!this.apiKey) {
      return {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
    }

    return {
      Authorization: this.apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private async getDurations(
    origin: Coord,
    destinations: Coord[],
  ): Promise<{ distanceMeters: number; durationSeconds: number }[]> {
    if (!destinations.length) return [];

    if (!this.apiKey) {
      this.logger.warn('ORS API key is not configured; using local fallback routing');
      return this.getFallbackDurations(origin, destinations);
    }

    const payload = {
      locations: [[origin.lng, origin.lat], ...destinations.map((d) => [d.lng, d.lat])],
      metrics: ['distance', 'duration'],
      resolve_locations: true,
    };

    try {
      const response = await axios.post(this.baseUrl, payload, {
        headers: this.getHeaders(),
        timeout: 10000,
      });

      const { data } = response;
      if (data?.error) {
        this.logger.warn(`ORS API error: ${data.error.message ?? JSON.stringify(data.error)}. Falling back to local routing.`);
        return this.getFallbackDurations(origin, destinations);
      }

      const durations = data.durations?.[0]?.slice(1) ?? [];
      const distances = data.distances?.[0]?.slice(1) ?? [];

      return durations.map((durationSeconds: number, index: number) => ({
        distanceMeters: distances[index] ?? Number.POSITIVE_INFINITY,
        durationSeconds: durationSeconds ?? Number.POSITIVE_INFINITY,
      }));
    } catch (err: any) {
      const status = err.response?.status;
      this.logger.warn(`ORS matrix request failed${status ? ` (${status})` : ''}: ${err.message}. Falling back to local routing.`);
      return this.getFallbackDurations(origin, destinations);
    }
  }

  async findNearest<T extends Coord>(origin: Coord, candidates: T[]): Promise<RankedStop<T>> {
    const durations = await this.getDurations(
      origin,
      candidates.map((c) => ({ lat: c.lat, lng: c.lng })),
    );

    let bestIndex = 0;
    for (let i = 1; i < durations.length; i++) {
      if (durations[i].durationSeconds < durations[bestIndex].durationSeconds) {
        bestIndex = i;
      }
    }

    return {
      stop: candidates[bestIndex],
      distanceMeters: durations[bestIndex].distanceMeters,
      etaMinutes: Math.round(durations[bestIndex].durationSeconds / 60),
    };
  }

  async optimizeSequence<T extends Coord>(origin: Coord, stops: T[]): Promise<RankedStop<T>[]> {
    const remaining = [...stops];
    const ordered: RankedStop<T>[] = [];
    let current = origin;

    while (remaining.length) {
      const durations = await this.getDurations(
        current,
        remaining.map((s) => ({ lat: s.lat, lng: s.lng })),
      );

      let bestIndex = 0;
      for (let i = 1; i < durations.length; i++) {
        if (durations[i].durationSeconds < durations[bestIndex].durationSeconds) {
          bestIndex = i;
        }
      }

      const [next] = remaining.splice(bestIndex, 1);
      ordered.push({
        stop: next,
        distanceMeters: durations[bestIndex].distanceMeters,
        etaMinutes: Math.round(durations[bestIndex].durationSeconds / 60),
      });
      current = { lat: next.lat, lng: next.lng };
    }

    return ordered;
  }
}
