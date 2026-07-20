import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrsService } from '../../common/utils/ors.service';
import { Coord } from '../../common/interface/geo.interface';
import { DailyRoute, DailyRouteDocument } from '../../models/daily-routes/daily-route.schema';
import { SavedLocationsService } from '../saved-locations/saved-locations.service';
import { PlanDailyRouteDto } from './dto/plan-daily-route.dto';
import { UpdateStopStatusDto } from './dto/update-stop-status.dto';
import { ModifyRouteDto } from './dto/modify-route.dto';

@Injectable()
export class DailyRoutesService implements OnModuleInit {
  constructor(
    @InjectModel(DailyRoute.name) private readonly dailyRouteModel: Model<DailyRouteDocument>,
    private readonly orsService: OrsService,
    private readonly savedLocationsService: SavedLocationsService,
  ) {}

  async onModuleInit() {
    try {
      await this.dailyRouteModel.collection.dropIndex('driverId_1_date_1');
    } catch {
      // Index may have already been dropped or may not exist
    }
  }

  private getTodayDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private getStopId(stop: any): string | undefined {
    return stop?._id?.toString() ?? stop?.savedLocationId?.toString();
  }

  async planRoute(driverId: string, dto: PlanDailyRouteDto): Promise<DailyRouteDocument> {
    const today = this.getTodayDate();
    const inProgress = await this.dailyRouteModel.findOne({
      driverId: new Types.ObjectId(driverId),
      date: today,
      status: 'in_progress',
    });

    if (inProgress) {
      return inProgress;
    }

    const origin: Coord = { lat: dto.currentLat, lng: dto.currentLng };
    let locations = await this.savedLocationsService.findByDriver(driverId);

    if (dto.locationIds?.length) {
      locations = await this.savedLocationsService.findManyByDriverAndIds(driverId, dto.locationIds);
    }

    const orderedStops = locations.length
      ? await this.orsService.optimizeSequence(origin, locations)
      : [];

    const stops = orderedStops.map((item, index) => ({
      savedLocationId: item.stop._id,
      name: item.stop.name,
      lat: item.stop.lat,
      lng: item.stop.lng,
      order: index + 1,
      status: 'pending' as const,
      etaMinutes: item.etaMinutes,
      distanceMeters: item.distanceMeters,
    }));

    const route = await this.dailyRouteModel.create({
      driverId: new Types.ObjectId(driverId),
      date: today,
      status: 'planned',
      stops,
      currentStopIndex: stops.length ? 0 : -1,
    });

    return route;
  }

  async getActiveRoute(driverId: string): Promise<DailyRouteDocument | null> {
    const today = this.getTodayDate();
    return this.dailyRouteModel.findOne({
      driverId: new Types.ObjectId(driverId),
      date: today,
      status: { $in: ['in_progress', 'planned'] },
    }).sort({ createdAt: -1 }).exec();
  }

  async getTodayRoute(driverId: string): Promise<DailyRouteDocument | null> {
    const active = await this.getActiveRoute(driverId);
    if (active) return active;
    return this.dailyRouteModel.findOne({
      driverId: new Types.ObjectId(driverId),
      date: this.getTodayDate(),
    }).sort({ createdAt: -1 }).exec();
  }

  async startRoute(driverId: string): Promise<DailyRouteDocument> {
    const route = await this.getActiveRoute(driverId);
    if (!route) {
      throw new NotFoundException('No pending route found for today. Create a new route first.');
    }
    if (route.status !== 'planned') {
      throw new NotFoundException('Route is already in progress');
    }

    route.status = 'in_progress';
    if (route.stops.length) {
      const firstStop = route.stops[0];
      firstStop.status = 'in_progress';
      firstStop.startedAt = new Date();
      route.currentStopIndex = 0;
    } else {
      route.currentStopIndex = -1;
    }

    await route.save();
    return route;
  }

  async updateStopStatus(driverId: string, stopId: string, dto: UpdateStopStatusDto): Promise<DailyRouteDocument> {
    const route = await this.getActiveRoute(driverId);
    if (!route) {
      throw new NotFoundException('No active route found for today');
    }

    const stop = route.stops.find((item) => this.getStopId(item) === stopId);
    if (!stop) {
      throw new NotFoundException('Stop not found');
    }

    stop.status = dto.status;
    stop.completedAt = new Date();

    const currentIndex = route.stops.findIndex((item) => this.getStopId(item) === stopId);
    const nextPending = route.stops.slice(currentIndex + 1).find((item) => item.status === 'pending');

    if (nextPending) {
      nextPending.status = 'in_progress';
      nextPending.startedAt = new Date();
      route.currentStopIndex = route.stops.findIndex((item) => this.getStopId(item) === this.getStopId(nextPending));
    } else {
      route.status = 'completed';
      route.currentStopIndex = route.stops.length > 0 ? route.stops.length - 1 : -1;
    }

    await route.save();
    return route;
  }

  async modifyActiveRoute(driverId: string, dto: ModifyRouteDto): Promise<DailyRouteDocument> {
    const route = await this.getActiveRoute(driverId);
    if (!route) {
      throw new NotFoundException('No active route found for today');
    }

    if (route.status === 'completed') {
      throw new Error('Cannot modify a completed route');
    }

    // 1. Separate stops into processed (history) and pending
    const processedStops = route.stops.filter((s) => s.status !== 'pending');
    let pendingStops = route.stops.filter((s) => s.status === 'pending');

    // 2. Remove requested stops from pending list
    if (dto.removeStopIds?.length) {
      pendingStops = pendingStops.filter(
        (s) => !dto.removeStopIds!.includes(this.getStopId(s) as string)
      );
    }

    // 3. Add new locations to the pool of stops to optimize
    let locationsToOptimize: any[] = pendingStops.map(s => ({
      _id: s.savedLocationId,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
    }));

    if (dto.addLocationIds?.length) {
      const newLocations = await this.savedLocationsService.findManyByDriverAndIds(
        driverId,
        dto.addLocationIds
      );
      locationsToOptimize = [...locationsToOptimize, ...newLocations];
    }

    // 4. Re-optimize the remaining pool from the driver's current coordinates
    const origin: Coord = { lat: dto.currentLat, lng: dto.currentLng };
    const orderedStops = locationsToOptimize.length
      ? await this.orsService.optimizeSequence(origin, locationsToOptimize)
      : [];

    // 5. Reconstruct the new pending stops with updated order/ETA
    const startingOrder = processedStops.length + 1;
    const newPendingStops = orderedStops.map((item, index) => ({
      savedLocationId: item.stop._id,
      name: item.stop.name,
      lat: item.stop.lat,
      lng: item.stop.lng,
      order: startingOrder + index,
      status: 'pending' as const,
      etaMinutes: item.etaMinutes,
      distanceMeters: item.distanceMeters,
    }));

    // 6. Combine and save
    route.stops = [...processedStops, ...newPendingStops];
    
    // If route was planned and we added stops, make sure index is at least 0
    if (route.status === 'planned' && route.stops.length > 0 && route.currentStopIndex === -1) {
       route.currentStopIndex = 0;
    }
    
    await route.save();
    return route;
  }
}
