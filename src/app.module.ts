import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminsModule } from './modules/admin/admins.module';
import { DriversModule } from './modules/driver/drivers.module';
import { SavedLocationsModule } from './modules/saved-locations/saved-locations.module';
import { DailyRoutesModule } from './modules/daily-routes/daily-routes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/driver-delivery'),
    CommonModule,
    AuthModule,
    AdminsModule,
    DriversModule,
    SavedLocationsModule,
    DailyRoutesModule,
  ],
})
export class AppModule {}
