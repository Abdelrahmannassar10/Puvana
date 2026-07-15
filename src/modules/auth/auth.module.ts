import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { Driver, DriverSchema } from '../../models/driver/driver.schema';
import { Admin, AdminSchema } from '../../models/admin/admin.schema';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([
      { name: Driver.name, schema: DriverSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') || '12h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
