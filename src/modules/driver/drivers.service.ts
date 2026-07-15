import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Driver, DriverDocument } from '../../models/driver/driver.schema';
import { CreateDriverDto } from './dto/create-driver.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class DriversService {
  constructor(@InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>) {}

  async create(dto: CreateDriverDto): Promise<Driver> {
    const existing = await this.driverModel.findOne({ workerCode: dto.workerCode });
    if (existing) throw new ConflictException('A driver with this worker code already exists');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const driver = await this.driverModel.create({
      workerCode: dto.workerCode,
      passwordHash,
      name: dto.name,
    });
    return driver;
  }

  async findAll(): Promise<Driver[]> {
    return this.driverModel.find().select('-passwordHash').sort({ createdAt: -1 });
  }

  async findById(id: string): Promise<DriverDocument> {
    const driver = await this.driverModel.findById(id).select('-passwordHash');
    if (!driver) throw new NotFoundException('Driver not found');
    return driver;
  }

  async setActiveStatus(id: string, isActive: boolean): Promise<Driver> {
    const driver = await this.findById(id);
    driver.isActive = isActive;
    await driver.save();
    return driver;
  }

  async remove(id: string): Promise<void> {
    const result = await this.driverModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Driver not found');
  }
}
