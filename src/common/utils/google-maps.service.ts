import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Coord, RankedStop } from '../interface/geo.interface';
import { log } from 'util';

@Injectable()
export class OrsService {
  private readonly logger = new Logger(OrsService.name);
  private readonly apiKey: string = '';
  private readonly baseUrl = 'https://api.openrouteservice.org/v2/matrix/driving-car';

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('ORS_API_KEY') || '';
  }
 
  private async getDurations(
    origin: Coord,
    destinations: Coord[],
  ): Promise<{ distanceMeters: number; durationSeconds: number }[]> {
    if (!destinations.length) return [];

    if (!this.apiKey) {
      this.logger.error('ORS API key is not configured');
      throw new ServiceUnavailableException('ORS API key is not configured');
    }

    const payload = {
      locations: [[origin.lng, origin.lat], ...destinations.map((d) => [d.lng, d.lat])],
      metrics: ['distance', 'duration'],
      resolve_locations: true,
    };

    let response;
    try {
      response = await axios.post(this.baseUrl, payload, {
        headers: {
          Authorization: this.apiKey,
          'Content-Type': 'application/json',
        },
      });
    } catch (err: any) {
      this.logger.error(`ORS matrix request failed: ${err.message}`);
      throw new ServiceUnavailableException('Unable to reach ORS service');
    }

    const { data } = response;
    if (data?.error) {
      this.logger.error(`ORS API error: ${data.error.message ?? JSON.stringify(data.error)}`);
      throw new ServiceUnavailableException('ORS service returned an error');
    }

    const durations = data.durations?.[0]?.slice(1) ?? [];
    const distances = data.distances?.[0]?.slice(1) ?? [];

    return durations.map((durationSeconds: number, index: number) => ({
      distanceMeters: distances[index] ?? Number.POSITIVE_INFINITY,
      durationSeconds: durationSeconds ?? Number.POSITIVE_INFINITY,
    }));
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
