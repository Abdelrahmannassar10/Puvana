import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Driver, DriverDocument } from '../../models/driver/driver.schema';
import { Admin, AdminDocument } from '../../models/admin/admin.schema';

export interface JwtPayload {
  sub: string;
  role: 'driver' | 'admin';
  workerCode?: string;
  email?: string;
}

export interface AuthUser {
  userId: string;
  role: 'driver' | 'admin';
  workerCode?: string;
  email?: string;
  name?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (payload.role === 'driver') {
      const driver = await this.driverModel.findById(payload.sub);
      if (!driver) throw new UnauthorizedException('Driver account not found');
      if (!driver.isActive) throw new UnauthorizedException('Driver account is suspended');
      return {
        userId: driver.id,
        role: 'driver',
        workerCode: driver.workerCode,
        name: driver.name,
      };
    }

    if (payload.role === 'admin') {
      const admin = await this.adminModel.findById(payload.sub);
      if (!admin) throw new UnauthorizedException('Admin account not found');
      return { userId: admin.id, role: 'admin', email: admin.email };
    }

    throw new UnauthorizedException('Unknown token role');
  }
}
