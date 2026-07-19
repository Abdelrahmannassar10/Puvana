import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DriverLocation, DriverLocationDocument } from '../../models/driver-location/driver-location.schema';

@Injectable()
export class DriverLocationsService {
  constructor(
    @InjectModel(DriverLocation.name) private readonly locationModel: Model<DriverLocationDocument>,
  ) {}

  async updateLocation(driverId: string, lat: number, lng: number): Promise<DriverLocationDocument> {
    return this.locationModel.create({
      driverId: new Types.ObjectId(driverId),
      lat,
      lng,
      timestamp: new Date(),
    });
  }

  async getLatestLocation(driverId: string): Promise<DriverLocationDocument | null> {
    return this.locationModel
      .findOne({ driverId: new Types.ObjectId(driverId) })
      .sort({ timestamp: -1 })
      .exec();
  }
}