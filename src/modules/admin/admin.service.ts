import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Admin, AdminDocument } from '../../models/admin/admin.schema';
import { Driver, DriverDocument } from '../../models/driver/driver.schema';
import { DailyRoute, DailyRouteDocument } from '../../models/daily-routes/daily-route.schema';
import { CreateDriverAdminDto } from './dto/create-driver-admin.dto';
import { CreateAdminDto } from './dto/create-admin.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
    @InjectModel(DailyRoute.name) private readonly dailyRouteModel: Model<DailyRouteDocument>,
  ) {}

  async ensureSeedAdmin(dto: CreateAdminDto): Promise<Admin> {
    const existing = await this.adminModel.findOne({ email: dto.email.toLowerCase() });
    if (existing) {
      return existing;
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    return this.adminModel.create({ email: dto.email.toLowerCase(), passwordHash });
  }

  async createDriverAccount(dto: CreateDriverAdminDto): Promise<Driver> {
    const existing = await this.driverModel.findOne({ workerCode: dto.workerCode });
    if (existing) {
      throw new ConflictException('A driver with this worker code already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    return this.driverModel.create({
      workerCode: dto.workerCode,
      passwordHash,
      name: dto.name,
      isActive: true,
    });
  }

  async listDrivers(): Promise<Driver[]> {
    return this.driverModel.find().select('-passwordHash').sort({ createdAt: -1 }).exec();
  }

  async listRoutes(driverId?: string): Promise<DailyRouteDocument[]> {
    const filter = driverId ? { driverId: new Types.ObjectId(driverId) } : {};
    return this.dailyRouteModel.find(filter).sort({ date: -1, createdAt: -1 }).exec();
  }

  async getRouteById(routeId: string): Promise<DailyRouteDocument> {
    const route = await this.dailyRouteModel.findById(routeId).exec();
    if (!route) throw new NotFoundException('Delivery route not found');
    return route;
  }

  async suspendDriver(driverId: string, isActive: boolean): Promise<Driver> {
    const driver = await this.driverModel.findById(driverId);
    if (!driver) throw new NotFoundException('Driver not found');

    driver.isActive = isActive;
    await driver.save();
    return driver;
  }

  async deleteDriver(driverId: string): Promise<void> {
    const result = await this.driverModel.findByIdAndDelete(driverId);
    if (!result) throw new NotFoundException('Driver not found');
  }
}
