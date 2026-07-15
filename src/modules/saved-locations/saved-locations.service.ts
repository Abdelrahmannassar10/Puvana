import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SavedLocation, SavedLocationDocument } from '../../models/saved-locations/saved-location.schema';
import { CreateSavedLocationDto } from './dto/create-saved-location.dto';

@Injectable()
export class SavedLocationsService {
  constructor(
    @InjectModel(SavedLocation.name) private readonly savedLocationModel: Model<SavedLocationDocument>,
  ) {}

  async create(driverId: string, dto: CreateSavedLocationDto): Promise<SavedLocation> {
    return this.savedLocationModel.create({
      driverId: new Types.ObjectId(driverId),
      name: dto.name,
      lat: dto.lat,
      lng: dto.lng,
    });
  }

  async findByDriver(driverId: string): Promise<SavedLocationDocument[]> {
    return this.savedLocationModel.find({ driverId: new Types.ObjectId(driverId) }).sort({ createdAt: -1 }).exec();
  }

  async findManyByDriverAndIds(driverId: string, locationIds: string[]): Promise<SavedLocationDocument[]> {
    const ids = locationIds.map((item) => new Types.ObjectId(item));
    return this.savedLocationModel
      .find({ driverId: new Types.ObjectId(driverId), _id: { $in: ids } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async remove(driverId: string, locationId: string): Promise<void> {
    const result = await this.savedLocationModel.findOneAndDelete({
      driverId: new Types.ObjectId(driverId),
      _id: new Types.ObjectId(locationId),
    });

    if (!result) {
      throw new NotFoundException('Saved location not found');
    }
  }
}
