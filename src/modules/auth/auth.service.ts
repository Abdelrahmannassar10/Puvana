import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Driver, DriverDocument } from '../../models/driver/driver.schema';
import { Admin, AdminDocument } from '../../models/admin/admin.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async driverLogin(workerCode: string, password: string) {
    const driver = await this.driverModel.findOne({ workerCode });
    if (!driver) throw new UnauthorizedException('Invalid worker code or password');

    if (!driver.isActive) {
      throw new UnauthorizedException('Your account has been suspended. Contact IT-Admin.');
    }

    const passwordMatches = await bcrypt.compare(password, driver.passwordHash);
    if (!passwordMatches) throw new UnauthorizedException('Invalid worker code or password');

    const accessToken = this.jwtService.sign({
      sub: driver.id,
      role: 'driver',
      workerCode: driver.workerCode,
    });

    return {
      accessToken,
      driver: { id: driver.id, name: driver.name, workerCode: driver.workerCode, isActive: driver.isActive, isOnline: driver.isOnline },
    };
  }

  async adminLogin(email: string, password: string) {
    const admin = await this.adminModel.findOne({ email: email.toLowerCase() });
    if (!admin) throw new UnauthorizedException('Invalid email or password');

    const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordMatches) throw new UnauthorizedException('Invalid email or password');

    const accessToken = this.jwtService.sign({
      sub: admin.id,
      role: 'admin',
      email: admin.email,
    });

    return { accessToken, admin: { id: admin.id, email: admin.email } };
  }
}
